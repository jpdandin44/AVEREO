<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function api_json(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function api_config(): array
{
    $homeConfig = dirname(__DIR__, 3) . '/.avereo/coupe/config.php';
    $configFile = getenv('AVEREO_CONFIG_FILE') ?: ($_SERVER['AVEREO_CONFIG_FILE'] ?? $homeConfig);
    $fileConfig = [];

    if (is_file($configFile)) {
        $loaded = require $configFile;
        if (is_array($loaded)) {
            $fileConfig = $loaded;
        }
    }

    return array_merge([
        'db_host' => getenv('AVEREO_DB_HOST') ?: ($_SERVER['AVEREO_DB_HOST'] ?? ''),
        'db_port' => getenv('AVEREO_DB_PORT') ?: ($_SERVER['AVEREO_DB_PORT'] ?? '3306'),
        'db_name' => getenv('AVEREO_DB_NAME') ?: ($_SERVER['AVEREO_DB_NAME'] ?? ''),
        'db_user' => getenv('AVEREO_DB_USER') ?: ($_SERVER['AVEREO_DB_USER'] ?? ''),
        'db_password' => getenv('AVEREO_DB_PASSWORD') ?: ($_SERVER['AVEREO_DB_PASSWORD'] ?? ''),
        'api_token' => getenv('AVEREO_API_TOKEN') ?: ($_SERVER['AVEREO_API_TOKEN'] ?? ''),
        'max_payload_bytes' => 50 * 1024 * 1024,
    ], $fileConfig);
}

function api_require_token(array $config): void
{
    $expected = trim((string)($config['api_token'] ?? ''));
    if ($expected === '') {
        api_json(503, [
            'ok' => false,
            'error' => 'api_token_missing',
            'message' => 'Configurez AVEREO_API_TOKEN cote serveur avant d utiliser la base en ligne.',
        ]);
    }

    $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $provided = '';
    if (preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
        $provided = trim($matches[1]);
    } elseif (!empty($_SERVER['HTTP_X_AVEREO_API_TOKEN'])) {
        $provided = trim((string)$_SERVER['HTTP_X_AVEREO_API_TOKEN']);
    }

    if ($provided === '' || !hash_equals($expected, $provided)) {
        api_json(401, [
            'ok' => false,
            'error' => 'unauthorized',
            'message' => 'Jeton API invalide ou manquant.',
        ]);
    }
}

function api_pdo(array $config): PDO
{
    foreach (['db_host', 'db_name', 'db_user', 'db_password'] as $key) {
        if (trim((string)($config[$key] ?? '')) === '') {
            api_json(503, [
                'ok' => false,
                'error' => 'database_not_configured',
                'message' => "Configuration base manquante: {$key}.",
            ]);
        }
    }

    $host = (string)$config['db_host'];
    $port = (string)($config['db_port'] ?? '3306');
    $dsn = "mysql:host={$host};port={$port};dbname={$config['db_name']};charset=utf8mb4";

    try {
        return new PDO($dsn, (string)$config['db_user'], (string)$config['db_password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (Throwable $exception) {
        api_json(503, [
            'ok' => false,
            'error' => 'database_connection_failed',
            'message' => 'Connexion a la base impossible.',
        ]);
    }
}

function api_ensure_schema(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS coupe_projects (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            public_id CHAR(32) NOT NULL,
            name VARCHAR(190) NOT NULL DEFAULT '',
            address VARCHAR(255) NOT NULL DEFAULT '',
            sources VARCHAR(255) NOT NULL DEFAULT '',
            payload_json LONGTEXT NOT NULL,
            payload_bytes INT UNSIGNED NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_coupe_projects_public_id (public_id),
            KEY idx_coupe_projects_updated_at (updated_at),
            KEY idx_coupe_projects_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function api_read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        api_json(400, [
            'ok' => false,
            'error' => 'invalid_json',
            'message' => 'Corps JSON invalide.',
        ]);
    }

    return $decoded;
}

function api_project_summary(array $row): array
{
    return [
        'id' => $row['public_id'],
        'name' => $row['name'],
        'address' => $row['address'],
        'sources' => $row['sources'],
        'payloadBytes' => (int)$row['payload_bytes'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

function api_trim_text($value, int $maxLength): string
{
    $text = trim((string)$value);
    if (function_exists('mb_substr')) {
        return mb_substr($text, 0, $maxLength);
    }
    return substr($text, 0, $maxLength);
}

function api_no_options_response(): void
{
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
