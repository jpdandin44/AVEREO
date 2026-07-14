<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

api_no_options_response();

$config = api_config();
$hasDatabaseConfig = trim((string)($config['db_host'] ?? '')) !== ''
    && trim((string)($config['db_name'] ?? '')) !== ''
    && trim((string)($config['db_user'] ?? '')) !== ''
    && trim((string)($config['db_password'] ?? '')) !== '';
$hasAuthConfig = api_auth_configured($config);

if (!$hasDatabaseConfig || !$hasAuthConfig) {
    api_json(200, [
        'ok' => true,
        'app' => 'rapport',
        'databaseConfigured' => $hasDatabaseConfig,
        'authConfigured' => $hasAuthConfig,
        'authMode' => api_auth_mode($config),
        'message' => 'API disponible, configuration incomplete.',
    ]);
}

$pdo = api_pdo($config);
$pdo->query('SELECT 1');

api_json(200, [
    'ok' => true,
    'app' => 'rapport',
    'databaseConfigured' => true,
    'authConfigured' => true,
    'authMode' => api_auth_mode($config),
    'message' => 'API et base disponibles.',
]);
