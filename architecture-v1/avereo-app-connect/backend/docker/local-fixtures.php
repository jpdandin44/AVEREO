<?php

declare(strict_types=1);

use Avereo\Connect\Config;
use Avereo\Connect\Database;

require dirname(__DIR__) . '/src/autoload.php';

$enabled = filter_var(getenv('LOCAL_DEMO_ENABLED') ?: 'false', FILTER_VALIDATE_BOOL);
$config = Config::fromEnvironment();
if ($config->environment !== 'local' || $enabled !== true) {
    fwrite(STDERR, "Les donnees de demonstration sont reservees a APP_ENV=local.\n");
    exit(1);
}

$pdo = Database::connect($config);
if (!$pdo instanceof PDO) {
    throw new RuntimeException('Base locale CONNECT indisponible.');
}

/** @return int<1, max> */
function localUser(PDO $pdo, string $subject, string $email, string $displayName): int
{
    $statement = $pdo->prepare(
        'INSERT INTO users '
        . '(drupal_subject, email_normalized, display_name, status, onboarding_status) '
        . 'VALUES (:subject, :email, :display_name, \'active\', \'completed\') '
        . 'ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), '
        . 'status = \'active\', onboarding_status = \'completed\'',
    );
    $statement->execute([
        'subject' => $subject,
        'email' => $email,
        'display_name' => $displayName,
    ]);

    $lookup = $pdo->prepare('SELECT id FROM users WHERE drupal_subject = :subject');
    $lookup->execute(['subject' => $subject]);
    $id = filter_var($lookup->fetchColumn(), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id === false) {
        throw new RuntimeException('Profil local CONNECT introuvable.');
    }

    return (int) $id;
}

$pdo->beginTransaction();
try {
    $ownerId = localUser(
        $pdo,
        'local-owner',
        'administrateur.local@example.invalid',
        'Administrateur local',
    );
    $clientId = localUser(
        $pdo,
        'local-client',
        'client.local@example.invalid',
        'Client local',
    );

    $organization = $pdo->prepare(
        'INSERT INTO organizations (name, slug, status) '
        . 'VALUES (\'AVEREO local\', \'avereo-local\', \'active\') '
        . 'ON DUPLICATE KEY UPDATE name = VALUES(name), status = \'active\'',
    );
    $organization->execute();
    $organizationId = (int) $pdo->query(
        "SELECT id FROM organizations WHERE slug = 'avereo-local'",
    )->fetchColumn();

    $membership = $pdo->prepare(
        'INSERT INTO memberships (organization_id, user_id, role, status) '
        . 'VALUES (:organization_id, :user_id, :role, \'active\') '
        . 'ON DUPLICATE KEY UPDATE role = VALUES(role), status = \'active\'',
    );
    $membership->execute([
        'organization_id' => $organizationId,
        'user_id' => $ownerId,
        'role' => 'owner',
    ]);
    $ownerMembershipId = (int) $pdo->query(
        "SELECT id FROM memberships WHERE organization_id = {$organizationId} AND user_id = {$ownerId}",
    )->fetchColumn();
    $membership->execute([
        'organization_id' => $organizationId,
        'user_id' => $clientId,
        'role' => 'member',
    ]);
    $owner = $pdo->prepare(
        'UPDATE organizations SET owner_membership_id = :membership_id WHERE id = :organization_id',
    );
    $owner->execute([
        'membership_id' => $ownerMembershipId,
        'organization_id' => $organizationId,
    ]);

    $applications = [
        ['rapport', 'Rapport AVEREO Pro', 'Rapports et analyses AVEREO', 10],
        ['coupe', 'Coupe AVEREO Reno Pro', 'Application de coupe et renovation AVEREO', 20],
        ['projet', 'Projet AVEREO', 'Pilotage des projets AVEREO', 30],
        ['thermo', 'Thermo AVEREO', 'Analyse thermique AVEREO', 40],
        ['drone', 'Drone AVEREO', 'Inspection et donnees drone AVEREO', 50],
    ];
    $application = $pdo->prepare(
        'INSERT INTO applications '
        . '(code, name, description, launch_url, required_scope, display_order, status) '
        . 'VALUES (:code, :name, :description, :launch_url, NULL, :display_order, \'active\') '
        . 'ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), '
        . 'display_order = VALUES(display_order), status = \'active\'',
    );
    $entitlement = $pdo->prepare(
        'INSERT INTO entitlements '
        . '(organization_id, application_id, status, granted_by_user_id) '
        . 'VALUES (:organization_id, :application_id, \'active\', :owner_id) '
        . 'ON DUPLICATE KEY UPDATE status = \'active\', granted_by_user_id = VALUES(granted_by_user_id)',
    );
    $applicationId = $pdo->prepare('SELECT id FROM applications WHERE code = :code');
    foreach ($applications as [$code, $name, $description, $displayOrder]) {
        $application->execute([
            'code' => $code,
            'name' => $name,
            'description' => $description,
            'launch_url' => "https://{$code}.invalid/",
            'display_order' => $displayOrder,
        ]);
        $applicationId->execute(['code' => $code]);
        $entitlement->execute([
            'organization_id' => $organizationId,
            'application_id' => (int) $applicationId->fetchColumn(),
            'owner_id' => $ownerId,
        ]);
    }

    $pdo->commit();
    fwrite(STDOUT, "Profils locaux CONNECT initialises.\n");
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    throw $exception;
}
