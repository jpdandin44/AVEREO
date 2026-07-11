<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

api_no_options_response();

$config = api_config();
$hasConfig = trim((string)($config['db_host'] ?? '')) !== ''
    && trim((string)($config['db_name'] ?? '')) !== ''
    && trim((string)($config['db_user'] ?? '')) !== ''
    && trim((string)($config['db_password'] ?? '')) !== ''
    && trim((string)($config['api_token'] ?? '')) !== '';

if (!$hasConfig) {
    api_json(200, [
        'ok' => true,
        'databaseConfigured' => false,
        'message' => 'API disponible, base non configuree.',
    ]);
}

$pdo = api_pdo($config);
api_ensure_schema($pdo);
$pdo->query('SELECT 1');

api_json(200, [
    'ok' => true,
    'databaseConfigured' => true,
    'message' => 'API et base disponibles.',
]);
