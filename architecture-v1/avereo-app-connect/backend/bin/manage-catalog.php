<?php

declare(strict_types=1);

use Avereo\Connect\Config;
use Avereo\Connect\Database;

require dirname(__DIR__) . '/src/autoload.php';

$options = getopt('', [
    'list',
    'code:',
    'name:',
    'description:',
    'launch-url:',
    'scope:',
    'display-order:',
    'status:',
    'organization-slug:',
    'actor-subject:',
    'confirm',
    'config:',
]);

try {
    loadCatalogConfiguration($options['config'] ?? null);
    $pdo = Database::connect(Config::fromEnvironment());
    if (!$pdo instanceof PDO) {
        throw new RuntimeException('DB_DSN doit etre configure.');
    }

    if (array_key_exists('list', $options)) {
        $rows = $pdo->query(
            'SELECT code, name, description, launch_url AS launchUrl, required_scope AS requiredScope, '
            . 'display_order AS displayOrder, status, updated_at AS updatedAt '
            . 'FROM applications ORDER BY display_order, name, code',
        )->fetchAll();
        fwrite(STDOUT, json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL);
        exit;
    }

    $code = strtolower(trim((string) ($options['code'] ?? '')));
    $name = trim((string) ($options['name'] ?? ''));
    $description = trim((string) ($options['description'] ?? ''));
    $launchUrl = trim((string) ($options['launch-url'] ?? ''));
    $scope = trim((string) ($options['scope'] ?? ''));
    $displayOrder = filter_var(
        $options['display-order'] ?? 100,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 0, 'max_range' => 65535]],
    );
    $status = strtolower(trim((string) ($options['status'] ?? 'draft')));
    $organizationSlug = strtolower(trim((string) ($options['organization-slug'] ?? '')));
    $actorSubject = trim((string) ($options['actor-subject'] ?? ''));
    $confirm = array_key_exists('confirm', $options);

    if (!preg_match('/^[a-z0-9][a-z0-9_-]{1,63}$/', $code)) {
        throw new InvalidArgumentException('--code est invalide.');
    }
    if ($name === '' || strlen($name) > 191) {
        throw new InvalidArgumentException('--name est invalide.');
    }
    if (strlen($description) > 500) {
        throw new InvalidArgumentException('--description est trop longue.');
    }
    if ($scope !== '' && strlen($scope) > 191) {
        throw new InvalidArgumentException('--scope est invalide.');
    }
    if ($displayOrder === false) {
        throw new InvalidArgumentException('--display-order est invalide.');
    }
    if (!in_array($status, ['draft', 'active', 'suspended', 'retired'], true)) {
        throw new InvalidArgumentException('--status est invalide.');
    }
    assertCatalogLaunchUrl($launchUrl);
    if ($actorSubject === '') {
        throw new InvalidArgumentException('--actor-subject est requis pour la tracabilite.');
    }
    if ($organizationSlug !== '' && !preg_match('/^[a-z0-9][a-z0-9-]{1,118}[a-z0-9]$/', $organizationSlug)) {
        throw new InvalidArgumentException('--organization-slug est invalide.');
    }

    $actor = $pdo->prepare(
        'SELECT id FROM users WHERE drupal_subject = :subject AND status = \'active\'',
    );
    $actor->execute(['subject' => $actorSubject]);
    $actorUserId = $actor->fetchColumn();
    if ($actorUserId === false) {
        throw new RuntimeException('Le compte operateur est introuvable.');
    }
    $operator = $pdo->prepare(
        'SELECT 1 FROM memberships WHERE user_id = :actor_id '
        . 'AND status = \'active\' AND role IN (\'owner\', \'admin\') LIMIT 1',
    );
    $operator->execute(['actor_id' => (int) $actorUserId]);
    if ($operator->fetchColumn() === false) {
        throw new RuntimeException('Le compte operateur doit etre owner/admin.');
    }
    $organizationId = null;
    if ($organizationSlug !== '') {
        $organization = $pdo->prepare(
            'SELECT o.id FROM organizations o '
            . 'INNER JOIN memberships m ON m.organization_id = o.id '
            . 'WHERE o.slug = :slug AND o.status = \'active\' '
            . 'AND m.user_id = :actor_id AND m.status = \'active\' '
            . 'AND m.role IN (\'owner\', \'admin\')',
        );
        $organization->execute([
            'slug' => $organizationSlug,
            'actor_id' => (int) $actorUserId,
        ]);
        $organizationId = $organization->fetchColumn();
        if ($organizationId === false) {
            throw new RuntimeException('Organisation introuvable ou droits operateur insuffisants.');
        }
        $organizationId = (int) $organizationId;
    }

    $preview = [
        'write' => $confirm,
        'code' => $code,
        'name' => $name,
        'description' => $description,
        'launchUrl' => $launchUrl,
        'requiredScope' => $scope === '' ? null : $scope,
        'displayOrder' => (int) $displayOrder,
        'status' => $status,
        'grantOrganization' => $organizationSlug === '' ? null : $organizationSlug,
    ];
    if (!$confirm) {
        $preview['nextStep'] = 'Relancer avec --confirm apres verification.';
        fwrite(STDOUT, json_encode($preview, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL);
        exit;
    }

    $pdo->beginTransaction();
    try {
        $upsert = $pdo->prepare(
            'INSERT INTO applications '
            . '(code, name, description, launch_url, required_scope, display_order, status) '
            . 'VALUES (:code, :name, :description, :launch_url, :scope, :display_order, :status) '
            . 'ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), '
            . 'launch_url = VALUES(launch_url), required_scope = VALUES(required_scope), '
            . 'display_order = VALUES(display_order), status = VALUES(status), updated_at = UTC_TIMESTAMP(6)',
        );
        $upsert->execute([
            'code' => $code,
            'name' => $name,
            'description' => $description,
            'launch_url' => $launchUrl,
            'scope' => $scope === '' ? null : $scope,
            'display_order' => (int) $displayOrder,
            'status' => $status,
        ]);
        $lookup = $pdo->prepare('SELECT id FROM applications WHERE code = :code');
        $lookup->execute(['code' => $code]);
        $applicationId = (int) $lookup->fetchColumn();

        if ($organizationId !== null) {
            if ($status !== 'active') {
                throw new RuntimeException('Une application doit etre active avant attribution.');
            }
            $grant = $pdo->prepare(
                'INSERT INTO entitlements '
                . '(organization_id, application_id, status, granted_by_user_id) '
                . 'VALUES (:organization_id, :application_id, \'active\', :actor_id) '
                . 'ON DUPLICATE KEY UPDATE status = \'active\', valid_from = NULL, valid_to = NULL, '
                . 'granted_by_user_id = VALUES(granted_by_user_id), updated_at = UTC_TIMESTAMP(6)',
            );
            $grant->execute([
                'organization_id' => $organizationId,
                'application_id' => $applicationId,
                'actor_id' => (int) $actorUserId,
            ]);
        }

        $audit = $pdo->prepare(
            'INSERT INTO audit_events '
            . '(actor_user_id, organization_id, action, target_type, target_id, outcome, request_id, metadata_json) '
            . 'VALUES (:actor_id, :organization_id, \'catalog.upsert\', \'application\', :application_id, '
            . '\'success\', :request_id, :metadata)',
        );
        $audit->execute([
            'actor_id' => (int) $actorUserId,
            'organization_id' => $organizationId,
            'application_id' => (string) $applicationId,
            'request_id' => bin2hex(random_bytes(16)),
            'metadata' => json_encode([
                'code' => $code,
                'status' => $status,
                'granted' => $organizationId !== null,
            ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
        ]);
        $pdo->commit();
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $exception;
    }

    fwrite(STDOUT, json_encode($preview, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL);
} catch (Throwable $exception) {
    fwrite(STDERR, 'Catalogue non modifie : ' . $exception->getMessage() . PHP_EOL);
    exit(1);
}

function loadCatalogConfiguration(mixed $option): void
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
    foreach (['APP_ENV', 'DB_DSN', 'DB_USER', 'DB_PASSWORD'] as $key) {
        if (isset($values[$key]) && is_string($values[$key])) {
            putenv($key . '=' . $values[$key]);
        }
    }
}

function assertCatalogLaunchUrl(string $url): void
{
    $parts = parse_url($url);
    $host = strtolower((string) ($parts['host'] ?? ''));
    if (
        !is_array($parts)
        || strtolower((string) ($parts['scheme'] ?? '')) !== 'https'
        || ($host !== 'avereo.fr' && !str_ends_with($host, '.avereo.fr'))
        || isset($parts['user'])
        || isset($parts['pass'])
        || isset($parts['fragment'])
    ) {
        throw new InvalidArgumentException('--launch-url doit etre une URL HTTPS AVEREO.');
    }
}
