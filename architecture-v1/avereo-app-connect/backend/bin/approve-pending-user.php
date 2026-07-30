<?php

declare(strict_types=1);

use Avereo\Connect\Config;
use Avereo\Connect\Database;

require dirname(__DIR__) . '/src/autoload.php';

$options = getopt('', [
    'email:',
    'organization-slug:',
    'organization-name:',
    'role:',
    'applications:',
    'actor-subject:',
    'bootstrap',
    'confirm',
    'config:',
]);

try {
    $email = strtolower(trim((string) ($options['email'] ?? '')));
    $organizationSlug = strtolower(trim((string) ($options['organization-slug'] ?? '')));
    $organizationName = trim((string) ($options['organization-name'] ?? ''));
    $role = strtolower(trim((string) ($options['role'] ?? 'member')));
    $applicationCodes = array_values(array_unique(array_filter(array_map(
        static fn (string $value): string => strtolower(trim($value)),
        explode(',', (string) ($options['applications'] ?? '')),
    ))));
    $actorSubject = trim((string) ($options['actor-subject'] ?? ''));
    $bootstrap = array_key_exists('bootstrap', $options);
    $confirm = array_key_exists('confirm', $options);

    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false || strlen($email) > 254) {
        throw new InvalidArgumentException('--email doit contenir une adresse valide.');
    }
    if (!preg_match('/^[a-z0-9][a-z0-9-]{1,118}[a-z0-9]$/', $organizationSlug)) {
        throw new InvalidArgumentException('--organization-slug est invalide.');
    }
    if ($organizationName === '' || strlen($organizationName) > 191) {
        throw new InvalidArgumentException('--organization-name est invalide.');
    }
    if (!in_array($role, ['owner', 'admin', 'member', 'viewer'], true)) {
        throw new InvalidArgumentException('--role est invalide.');
    }
    if ($applicationCodes === [] || array_diff(
        $applicationCodes,
        ['rapport', 'coupe', 'projet', 'thermo', 'drone'],
    ) !== []) {
        throw new InvalidArgumentException('--applications contient un code inconnu.');
    }
    if ($bootstrap && $role !== 'owner') {
        throw new InvalidArgumentException('Le premier compte doit avoir le role owner.');
    }

    loadPrivateConfiguration($options['config'] ?? null);
    $config = Config::fromEnvironment();
    $pdo = Database::connect($config);
    if (!$pdo instanceof PDO) {
        throw new RuntimeException('DB_DSN doit etre configure.');
    }

    $pending = findPendingIdentity($pdo, $email, false);
    if (!$confirm) {
        fwrite(STDOUT, json_encode([
            'write' => false,
            'pendingIdentityFound' => $pending !== null,
            'email' => $email,
            'organization' => $organizationSlug,
            'role' => $role,
            'applications' => $applicationCodes,
            'bootstrap' => $bootstrap,
            'nextStep' => 'Relancer avec --confirm apres verification.',
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL);
        exit($pending === null ? 1 : 0);
    }
    if ($pending === null) {
        throw new RuntimeException('Aucune identite Drupal en attente ne correspond a cette adresse.');
    }

    $pdo->beginTransaction();
    try {
        $pending = findPendingIdentity($pdo, $email, true);
        if ($pending === null || ($pending['status'] ?? null) !== 'pending') {
            throw new RuntimeException('L identite n est plus en attente.');
        }

        $activeUserCount = (int) $pdo->query(
            "SELECT COUNT(*) FROM users WHERE status = 'active'",
        )->fetchColumn();
        $organizationId = findOrganizationId($pdo, $organizationSlug);
        $actorUserId = null;
        if ($activeUserCount === 0) {
            if (!$bootstrap) {
                throw new RuntimeException('Le premier compte exige --bootstrap.');
            }
        } else {
            if ($bootstrap || $actorSubject === '') {
                throw new RuntimeException('Un --actor-subject owner/admin est requis.');
            }
            $actorUserId = activeUserIdBySubject($pdo, $actorSubject);
            if ($actorUserId === null) {
                throw new RuntimeException('Le compte approbateur actif est introuvable.');
            }
            if ($organizationId === null || !actorCanApprove($pdo, $actorUserId, $organizationId)) {
                throw new RuntimeException('Le compte approbateur n est pas owner/admin de l organisation.');
            }
        }

        $user = upsertApprovedUser($pdo, $pending);
        $userId = (int) $user['id'];
        if ($actorUserId === null) {
            $actorUserId = $userId;
        }

        if ($organizationId === null) {
            $statement = $pdo->prepare(
                'INSERT INTO organizations (name, slug, status) VALUES (:name, :slug, \'active\')',
            );
            $statement->execute(['name' => $organizationName, 'slug' => $organizationSlug]);
            $organizationId = (int) $pdo->lastInsertId();
        }

        $membership = $pdo->prepare(
            'INSERT INTO memberships (organization_id, user_id, role, status) '
            . 'VALUES (:organization_id, :user_id, :role, \'active\') '
            . 'ON DUPLICATE KEY UPDATE role = VALUES(role), status = \'active\', updated_at = UTC_TIMESTAMP(6)',
        );
        $membership->execute([
            'organization_id' => $organizationId,
            'user_id' => $userId,
            'role' => $role,
        ]);
        $membershipId = (int) $pdo->query(
            'SELECT id FROM memberships WHERE organization_id = ' . $organizationId . ' AND user_id = ' . $userId,
        )->fetchColumn();
        if ($role === 'owner') {
            $owner = $pdo->prepare(
                'UPDATE organizations SET owner_membership_id = :membership_id '
                . 'WHERE id = :organization_id AND owner_membership_id IS NULL',
            );
            $owner->execute(['membership_id' => $membershipId, 'organization_id' => $organizationId]);
        }

        foreach ($applicationCodes as $applicationCode) {
            $applicationId = findPublishedApplication($pdo, $applicationCode);
            $entitlement = $pdo->prepare(
                'INSERT INTO entitlements '
                . '(organization_id, application_id, status, granted_by_user_id) '
                . 'VALUES (:organization_id, :application_id, \'active\', :actor_id) '
                . 'ON DUPLICATE KEY UPDATE status = \'active\', valid_from = NULL, valid_to = NULL, '
                . 'granted_by_user_id = VALUES(granted_by_user_id), updated_at = UTC_TIMESTAMP(6)',
            );
            $entitlement->execute([
                'organization_id' => $organizationId,
                'application_id' => $applicationId,
                'actor_id' => $actorUserId,
            ]);
        }

        $approval = $pdo->prepare(
            'UPDATE pending_identities SET status = \'approved\', approved_user_id = :user_id, '
            . 'approved_by_user_id = :actor_id, approved_at = UTC_TIMESTAMP(6), last_seen_at = UTC_TIMESTAMP(6) '
            . 'WHERE id = :pending_id AND status = \'pending\'',
        );
        $approval->execute([
            'user_id' => $userId,
            'actor_id' => $actorUserId,
            'pending_id' => (int) $pending['id'],
        ]);
        if ($approval->rowCount() !== 1) {
            throw new RuntimeException('Approbation concurrente detectee.');
        }

        $requestId = bin2hex(random_bytes(16));
        $audit = $pdo->prepare(
            'INSERT INTO audit_events '
            . '(actor_user_id, organization_id, action, target_type, target_id, outcome, request_id, metadata_json) '
            . 'VALUES (:actor_id, :organization_id, \'identity.approve\', \'user\', :user_id, '
            . '\'success\', :request_id, :metadata)',
        );
        $audit->execute([
            'actor_id' => $actorUserId,
            'organization_id' => $organizationId,
            'user_id' => (string) $userId,
            'request_id' => $requestId,
            'metadata' => json_encode([
                'role' => $role,
                'applications' => $applicationCodes,
                'bootstrap' => $bootstrap,
            ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
        ]);

        $pdo->commit();
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $exception;
    }

    fwrite(STDOUT, json_encode([
        'approved' => true,
        'email' => $email,
        'organization' => $organizationSlug,
        'role' => $role,
        'applications' => $applicationCodes,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL);
} catch (Throwable $exception) {
    fwrite(STDERR, 'Approbation echouee : ' . $exception->getMessage() . PHP_EOL);
    exit(1);
}

function loadPrivateConfiguration(mixed $option): void
{
    $path = is_string($option) ? trim($option) : '';
    if ($path === '') {
        $path = trim((string) (getenv('AVEREO_PRIVATE_CONFIG') ?: ''));
    }
    if ($path === '' || !is_readable($path)) {
        throw new RuntimeException('Fichier prive absent; utiliser --config ou AVEREO_PRIVATE_CONFIG.');
    }
    $values = require $path;
    if (!is_array($values)) {
        throw new RuntimeException('Configuration privee invalide.');
    }
    foreach ([
        'APP_ENV', 'DB_DSN', 'DB_USER', 'DB_PASSWORD',
    ] as $key) {
        if (isset($values[$key]) && is_string($values[$key])) {
            putenv($key . '=' . $values[$key]);
        }
    }
}

/** @return array<string, mixed>|null */
function findPendingIdentity(PDO $pdo, string $email, bool $forUpdate): ?array
{
    $sql = 'SELECT id, drupal_subject, email_normalized, display_name, status '
        . 'FROM pending_identities WHERE email_normalized = :email '
        . 'ORDER BY last_seen_at DESC LIMIT 1';
    if ($forUpdate) {
        $sql .= ' FOR UPDATE';
    }
    $statement = $pdo->prepare($sql);
    $statement->execute(['email' => $email]);
    $pending = $statement->fetch();
    return is_array($pending) ? $pending : null;
}

function findOrganizationId(PDO $pdo, string $slug): ?int
{
    $statement = $pdo->prepare(
        'SELECT id FROM organizations WHERE slug = :slug AND status = \'active\'',
    );
    $statement->execute(['slug' => $slug]);
    $id = $statement->fetchColumn();
    return $id === false ? null : (int) $id;
}

function activeUserIdBySubject(PDO $pdo, string $subject): ?int
{
    $statement = $pdo->prepare(
        'SELECT id FROM users WHERE drupal_subject = :subject AND status = \'active\'',
    );
    $statement->execute(['subject' => $subject]);
    $id = $statement->fetchColumn();
    return $id === false ? null : (int) $id;
}

function actorCanApprove(PDO $pdo, int $actorUserId, int $organizationId): bool
{
    $statement = $pdo->prepare(
        'SELECT 1 FROM memberships WHERE user_id = :user_id AND organization_id = :organization_id '
        . 'AND status = \'active\' AND role IN (\'owner\', \'admin\')',
    );
    $statement->execute(['user_id' => $actorUserId, 'organization_id' => $organizationId]);
    return $statement->fetchColumn() !== false;
}

/** @param array<string, mixed> $pending
 *  @return array{id: int}
 */
function upsertApprovedUser(PDO $pdo, array $pending): array
{
    $email = strtolower(trim((string) ($pending['email_normalized'] ?? '')));
    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        throw new RuntimeException('L identite en attente ne contient pas d adresse valide.');
    }
    $displayName = trim((string) ($pending['display_name'] ?? ''));
    if ($displayName === '') {
        $displayName = $email;
    }
    $statement = $pdo->prepare(
        'INSERT INTO users (drupal_subject, email_normalized, display_name, status) '
        . 'VALUES (:subject, :email, :display_name, \'active\') '
        . 'ON DUPLICATE KEY UPDATE email_normalized = VALUES(email_normalized), '
        . 'display_name = VALUES(display_name), status = \'active\', updated_at = UTC_TIMESTAMP(6)',
    );
    $statement->execute([
        'subject' => (string) $pending['drupal_subject'],
        'email' => $email,
        'display_name' => substr($displayName, 0, 191),
    ]);
    $userId = activeUserIdBySubject($pdo, (string) $pending['drupal_subject']);
    if ($userId === null) {
        throw new RuntimeException('Le compte approuve est introuvable.');
    }
    return ['id' => $userId];
}

function findPublishedApplication(PDO $pdo, string $applicationCode): int
{
    $lookup = $pdo->prepare(
        'SELECT id FROM applications WHERE code = :code AND status = \'active\'',
    );
    $lookup->execute(['code' => $applicationCode]);
    $applicationId = $lookup->fetchColumn();
    if ($applicationId === false) {
        throw new RuntimeException(
            "Application {$applicationCode} absente du catalogue actif; la publier avant attribution.",
        );
    }
    return (int) $applicationId;
}
