<?php

declare(strict_types=1);

use Avereo\Connect\Config;
use Avereo\Connect\Database;
use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Repository\PdoConnectRepository;

require dirname(__DIR__) . '/src/autoload.php';

$config = Config::fromEnvironment();
$pdo = Database::connect($config);
if (!$pdo instanceof PDO) {
    throw new RuntimeException('Base de test non configurée.');
}

$pdo->exec(
    "INSERT INTO users (drupal_subject, email_normalized, display_name, status) VALUES "
    . "('drupal-owner', 'owner@example.invalid', 'Owner Test', 'active'), "
    . "('drupal-member', 'member@example.invalid', 'Member Test', 'active')",
);
$ownerId = (int) $pdo->query("SELECT id FROM users WHERE drupal_subject = 'drupal-owner'")->fetchColumn();
$memberId = (int) $pdo->query("SELECT id FROM users WHERE drupal_subject = 'drupal-member'")->fetchColumn();
$pdo->exec("INSERT INTO organizations (name, slug, status) VALUES ('Espace Test', 'espace-test', 'active')");
$organizationId = (int) $pdo->lastInsertId();

$membership = $pdo->prepare(
    'INSERT INTO memberships (organization_id, user_id, role, status) VALUES (:organization_id, :user_id, :role, \'active\')',
);
$membership->execute(['organization_id' => $organizationId, 'user_id' => $ownerId, 'role' => 'owner']);
$ownerMembershipId = (int) $pdo->lastInsertId();
$membership->execute(['organization_id' => $organizationId, 'user_id' => $memberId, 'role' => 'member']);
$updateOwner = $pdo->prepare('UPDATE organizations SET owner_membership_id = :membership_id WHERE id = :organization_id');
$updateOwner->execute(['membership_id' => $ownerMembershipId, 'organization_id' => $organizationId]);

$application = $pdo->prepare(
    'INSERT INTO applications '
    . '(code, name, description, launch_url, required_scope, display_order, status) '
    . 'VALUES (\'rapport\', \'Rapport\', \'Rapport de test\', '
    . '\'https://rapport.invalid/\', \'rapport:use\', 10, \'active\')',
);
$application->execute();

$repository = new PdoConnectRepository($pdo);
if ($repository->databaseStatus() !== 'ok') {
    throw new RuntimeException('Santé base invalide.');
}
$repository->registerPendingIdentity('drupal-pending', 'pending@example.invalid', 'Pending Test');
$pendingIdentityCount = (int) $pdo->query(
    "SELECT COUNT(*) FROM pending_identities WHERE drupal_subject = 'drupal-pending' AND status = 'pending'",
)->fetchColumn();
if ($pendingIdentityCount !== 1) {
    throw new RuntimeException('Identité Drupal en attente introuvable.');
}
if (count($repository->listOrganizations($ownerId)) !== 1) {
    throw new RuntimeException('Organisation du propriétaire introuvable.');
}

$result = $repository->upsertEntitlement(
    $ownerId,
    $organizationId,
    'rapport',
    'active',
    null,
    null,
    'integration-request-0001',
);
if (($result['status'] ?? null) !== 'active') {
    throw new RuntimeException('Habilitation non créée.');
}
if (count($repository->listApplications($ownerId, $organizationId)) !== 1) {
    throw new RuntimeException('Catalogue habilité introuvable.');
}
$catalog = $repository->listCatalog($ownerId);
if (
    count($catalog) !== 1
    || ($catalog[0]['code'] ?? null) !== 'rapport'
    || ($catalog[0]['description'] ?? null) !== 'Rapport de test'
) {
    throw new RuntimeException('Catalogue CONNECT publié introuvable.');
}
if (!$repository->canLaunchApplication($ownerId, 'rapport')) {
    throw new RuntimeException('Le lancement Rapport devrait etre autorise.');
}
if ($repository->canLaunchApplication($ownerId, 'coupe')) {
    throw new RuntimeException('Le lancement Coupe ne devrait pas etre autorise.');
}
$auditCount = (int) $pdo->query("SELECT COUNT(*) FROM audit_events WHERE request_id = 'integration-request-0001'")->fetchColumn();
if ($auditCount !== 1) {
    throw new RuntimeException("Nombre d’événements d’audit inattendu : {$auditCount}");
}

$administration = $repository->getAccountAdministration($ownerId, $organizationId);
if (
    ($administration['actorRole'] ?? null) !== 'owner'
    || count($administration['pendingIdentities'] ?? []) !== 1
) {
    throw new RuntimeException('Tableau d administration des comptes invalide.');
}
$pendingId = (int) ($administration['pendingIdentities'][0]['id'] ?? 0);
$memberAdministrationDenied = false;
try {
    $repository->getAccountAdministration($memberId, $organizationId);
} catch (ApiException $exception) {
    $memberAdministrationDenied = $exception->status === 403;
}
if (!$memberAdministrationDenied) {
    throw new RuntimeException('Un membre ne doit pas pouvoir consulter l administration des comptes.');
}
$memberApprovalDenied = false;
try {
    $repository->approvePendingIdentity(
        $memberId,
        $organizationId,
        $pendingId,
        'member',
        'integration-request-account-member-denied',
    );
} catch (ApiException $exception) {
    $memberApprovalDenied = $exception->status === 403;
}
if (!$memberApprovalDenied) {
    throw new RuntimeException('Un membre ne doit pas pouvoir approuver un compte.');
}
$approved = $repository->approvePendingIdentity(
    $ownerId,
    $organizationId,
    $pendingId,
    'member',
    'integration-request-account-approve',
);
if (($approved['status'] ?? null) !== 'active' || ($approved['role'] ?? null) !== 'member') {
    throw new RuntimeException('Approbation du compte invalide.');
}
$approvedUserId = (int) ($approved['id'] ?? 0);
if (!$repository->canLaunchApplication($approvedUserId, 'rapport')) {
    throw new RuntimeException('Le compte approuve devrait heriter de Rapport.');
}

$suspended = $repository->updateUserStatus(
    $ownerId,
    $organizationId,
    $approvedUserId,
    'suspended',
    'integration-request-account-suspend',
);
if (($suspended['status'] ?? null) !== 'suspended' || $repository->canLaunchApplication($approvedUserId, 'rapport')) {
    throw new RuntimeException('La suspension du compte est inoperante.');
}
$repository->updateUserStatus(
    $ownerId,
    $organizationId,
    $approvedUserId,
    'active',
    'integration-request-account-reactivate',
);
if (!$repository->canLaunchApplication($approvedUserId, 'rapport')) {
    throw new RuntimeException('La reactivation du compte est inoperante.');
}

$repository->registerPendingIdentity('drupal-rejected', 'rejected@example.invalid', 'Rejected Test');
$rejectionSnapshot = $repository->getAccountAdministration($ownerId, $organizationId);
$rejectedPending = array_values(array_filter(
    $rejectionSnapshot['pendingIdentities'] ?? [],
    static fn (array $identity): bool => ($identity['email'] ?? null) === 'rejected@example.invalid',
));
if (count($rejectedPending) !== 1) {
    throw new RuntimeException('Demande a refuser introuvable.');
}
$rejected = $repository->rejectPendingIdentity(
    $ownerId,
    $organizationId,
    (int) $rejectedPending[0]['id'],
    'integration-request-account-reject',
);
if (($rejected['status'] ?? null) !== 'rejected') {
    throw new RuntimeException('Refus du compte invalide.');
}

$denied = false;
try {
    $repository->upsertEntitlement(
        $memberId,
        $organizationId,
        'rapport',
        'revoked',
        null,
        null,
        'integration-request-0002',
    );
} catch (ApiException $exception) {
    $denied = $exception->status === 403;
}
if (!$denied) {
    throw new RuntimeException('La mutation membre aurait dû être refusée.');
}
$deniedAuditCount = (int) $pdo->query(
    "SELECT COUNT(*) FROM audit_events WHERE request_id = 'integration-request-0002' AND outcome = 'denied'",
)->fetchColumn();
if ($deniedAuditCount !== 1) {
    throw new RuntimeException('La mutation refusée doit produire exactement un audit de refus.');
}

fwrite(STDOUT, "PASS intégration PDO/MariaDB, autorisation et audit atomique\n");
