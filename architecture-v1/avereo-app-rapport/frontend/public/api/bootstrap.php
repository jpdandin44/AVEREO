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

set_exception_handler(static function (Throwable $exception): void {
    error_log('Rapport API unhandled exception: ' . get_class($exception) . ' code=' . $exception->getCode());
    api_json(500, [
        'ok' => false,
        'error' => 'internal_error',
        'message' => 'Erreur interne de l API.',
    ]);
});

function api_home_dir_from_path(string $path): string
{
    $path = str_replace('\\', '/', trim($path));
    if ($path === '') {
        return '';
    }

    if (preg_match('#^(/home/[^/]+)(?:/|$)#', $path, $matches)) {
        return $matches[1];
    }

    return '';
}

function api_config_candidates(): array
{
    $roots = [];

    foreach ([
        getenv('HOME') ?: '',
        $_SERVER['HOME'] ?? '',
        $_SERVER['DOCUMENT_ROOT'] ?? '',
        $_SERVER['CONTEXT_DOCUMENT_ROOT'] ?? '',
        __DIR__,
    ] as $path) {
        $homeDir = api_home_dir_from_path((string)$path);
        if ($homeDir !== '') {
            $roots[] = $homeDir;
        }
    }

    // On O2Switch subdomains, API files live in /home/USER/domain.tld/api.
    $roots[] = dirname(__DIR__, 2);
    // Keep the previous app-root lookup as a fallback for local/dev layouts.
    $roots[] = dirname(__DIR__, 3);

    $candidates = [];
    foreach (array_unique($roots) as $root) {
        $root = rtrim((string)$root, '/\\');
        if ($root !== '') {
            $candidates[] = $root . '/.avereo/rapport/config.php';
        }
    }

    return array_values(array_unique($candidates));
}

function api_config_file(): string
{
    $configured = trim((string)(getenv('AVEREO_CONFIG_FILE') ?: ($_SERVER['AVEREO_CONFIG_FILE'] ?? '')));
    if ($configured !== '') {
        return $configured;
    }

    $candidates = api_config_candidates();
    foreach ($candidates as $candidate) {
        if (is_file($candidate)) {
            return $candidate;
        }
    }

    return $candidates[0] ?? '';
}

function api_config(): array
{
    $configFile = api_config_file();
    $fileConfig = [];

    if ($configFile !== '' && is_file($configFile)) {
        $loaded = require $configFile;
        if (is_array($loaded)) {
            $fileConfig = $loaded;
        }
    }

    return array_merge([
        'environment' => getenv('AVEREO_ENVIRONMENT') ?: ($_SERVER['AVEREO_ENVIRONMENT'] ?? 'production'),
        'db_host' => getenv('AVEREO_DB_HOST') ?: ($_SERVER['AVEREO_DB_HOST'] ?? ''),
        'db_port' => getenv('AVEREO_DB_PORT') ?: ($_SERVER['AVEREO_DB_PORT'] ?? '3306'),
        'db_name' => getenv('AVEREO_DB_NAME') ?: ($_SERVER['AVEREO_DB_NAME'] ?? ''),
        'db_user' => getenv('AVEREO_DB_USER') ?: ($_SERVER['AVEREO_DB_USER'] ?? ''),
        'db_password' => getenv('AVEREO_DB_PASSWORD') ?: ($_SERVER['AVEREO_DB_PASSWORD'] ?? ''),
        'auth_mode' => getenv('AVEREO_AUTH_MODE') ?: ($_SERVER['AVEREO_AUTH_MODE'] ?? 'drupal_oauth'),
        'api_token' => getenv('AVEREO_API_TOKEN') ?: ($_SERVER['AVEREO_API_TOKEN'] ?? ''),
        'drupal_issuer' => getenv('AVEREO_DRUPAL_ISSUER') ?: ($_SERVER['AVEREO_DRUPAL_ISSUER'] ?? ''),
        'drupal_authorize_url' => getenv('AVEREO_DRUPAL_AUTHORIZE_URL') ?: ($_SERVER['AVEREO_DRUPAL_AUTHORIZE_URL'] ?? ''),
        'drupal_token_url' => getenv('AVEREO_DRUPAL_TOKEN_URL') ?: ($_SERVER['AVEREO_DRUPAL_TOKEN_URL'] ?? ''),
        'drupal_userinfo_url' => getenv('AVEREO_DRUPAL_USERINFO_URL') ?: ($_SERVER['AVEREO_DRUPAL_USERINFO_URL'] ?? ''),
        'drupal_allowed_hosts' => getenv('AVEREO_DRUPAL_ALLOWED_HOSTS') ?: ($_SERVER['AVEREO_DRUPAL_ALLOWED_HOSTS'] ?? 'avereo.fr'),
        'drupal_client_id' => getenv('AVEREO_DRUPAL_CLIENT_ID') ?: ($_SERVER['AVEREO_DRUPAL_CLIENT_ID'] ?? ''),
        'drupal_client_secret' => getenv('AVEREO_DRUPAL_CLIENT_SECRET') ?: ($_SERVER['AVEREO_DRUPAL_CLIENT_SECRET'] ?? ''),
        'drupal_scope' => getenv('AVEREO_DRUPAL_SCOPE') ?: ($_SERVER['AVEREO_DRUPAL_SCOPE'] ?? 'openid profile email'),
        'drupal_redirect_uri' => getenv('AVEREO_DRUPAL_REDIRECT_URI') ?: ($_SERVER['AVEREO_DRUPAL_REDIRECT_URI'] ?? ''),
        'drupal_required_roles' => ['utilisateur_rapport', 'administrateur_rapport'],
        'drupal_admin_roles' => ['administrateur_rapport'],
        'max_payload_bytes' => 50 * 1024 * 1024,
    ], $fileConfig);
}

function api_auth_mode(array $config): string
{
    $mode = strtolower(trim((string)($config['auth_mode'] ?? 'drupal_oauth')));
    if (!in_array($mode, ['drupal_oauth', 'api_token'], true)) {
        api_json(503, [
            'ok' => false,
            'error' => 'auth_mode_invalid',
            'message' => 'Mode d authentification serveur invalide.',
        ]);
    }

    if ($mode === 'api_token') {
        $environment = strtolower(trim((string)($config['environment'] ?? 'production')));
        $host = api_current_host();
        $localHost = $host === 'localhost'
            || $host === '127.0.0.1'
            || str_ends_with($host, '.localhost');
        if ($environment !== 'local' || !$localHost) {
            api_json(503, [
                'ok' => false,
                'error' => 'api_token_local_only',
                'message' => 'Le mode api_token est interdit hors environnement local.',
            ]);
        }
    }

    return $mode;
}

function api_bearer_token(): string
{
    $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
        return trim($matches[1]);
    }
    return '';
}

function api_current_host(): string
{
    $host = strtolower(trim((string)($_SERVER['HTTP_HOST'] ?? '')));
    return preg_replace('/:\d+$/', '', $host) ?? $host;
}

function api_current_origin(): string
{
    $host = trim((string)($_SERVER['HTTP_HOST'] ?? ''));
    if ($host === '') {
        $host = 'localhost';
    }

    $forwardedProto = strtolower(trim((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')));
    $isHttps = (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off')
        || $forwardedProto === 'https';

    return ($isHttps ? 'https' : 'http') . '://' . $host;
}

function api_environment_is_local(array $config): bool
{
    return strtolower(trim((string)($config['environment'] ?? 'production'))) === 'local';
}

function api_oauth_issuer_allowed(string $issuer, array $config): bool
{
    $parts = parse_url($issuer);
    if (!is_array($parts)) {
        return false;
    }

    $host = strtolower((string)($parts['host'] ?? ''));
    $scheme = strtolower((string)($parts['scheme'] ?? ''));
    $path = (string)($parts['path'] ?? '');
    if ($host === '' || isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])) {
        return false;
    }
    if ($path !== '' && $path !== '/') {
        return false;
    }

    if (api_environment_is_local($config)) {
        return in_array($scheme, ['http', 'https'], true);
    }

    $allowedHosts = api_config_array($config['drupal_allowed_hosts'] ?? ['avereo.fr']);
    return $scheme === 'https'
        && (!isset($parts['port']) || (int)$parts['port'] === 443)
        && in_array($host, $allowedHosts, true);
}

function api_oauth_endpoint_allowed(string $url, string $issuer, array $config): bool
{
    $parts = parse_url($url);
    $issuerParts = parse_url($issuer);
    if (!is_array($parts) || !is_array($issuerParts) || !api_oauth_issuer_allowed($issuer, $config)) {
        return false;
    }

    $host = strtolower((string)($parts['host'] ?? ''));
    $scheme = strtolower((string)($parts['scheme'] ?? ''));
    $path = (string)($parts['path'] ?? '');
    if ($host === '' || $path === '' || isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])) {
        return false;
    }

    if (api_environment_is_local($config)) {
        return in_array($scheme, ['http', 'https'], true);
    }

    $issuerHost = strtolower((string)($issuerParts['host'] ?? ''));
    return $scheme === 'https'
        && (!isset($parts['port']) || (int)$parts['port'] === 443)
        && $host === $issuerHost;
}

function api_oauth_redirect_uri(array $config): string
{
    $configured = trim((string)($config['drupal_redirect_uri'] ?? ''));
    if ($configured !== '') {
        return $configured;
    }

    return api_environment_is_local($config) ? api_current_origin() . '/auth/callback/' : '';
}

function api_redirect_uri_allowed(string $redirectUri, array $config): bool
{
    $expectedRedirectUri = api_oauth_redirect_uri($config);
    if ($expectedRedirectUri === '' || !hash_equals($expectedRedirectUri, $redirectUri)) {
        return false;
    }

    $parts = parse_url($redirectUri);
    $host = strtolower((string)($parts['host'] ?? ''));
    $scheme = strtolower((string)($parts['scheme'] ?? ''));
    $currentHost = api_current_host();

    if ($host === '' || !in_array($scheme, ['https', 'http'], true) || isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])) {
        return false;
    }

    if (!api_environment_is_local($config) && $scheme !== 'https') {
        return false;
    }

    if ($currentHost !== '' && $host !== $currentHost) {
        return false;
    }

    // Drupal may identify users from avereo.fr, but app callbacks must stay on app subdomains.
    if ($host === 'avereo.fr' || $host === 'www.avereo.fr') {
        return false;
    }

    if (str_ends_with($host, '.avereo.fr')) {
        return true;
    }

    return str_ends_with($host, '.avereo.localhost')
        || in_array($host, ['localhost', '127.0.0.1'], true);
}

function api_public_auth_config(array $config): array
{
    $mode = api_auth_mode($config);
    $issuer = rtrim((string)($config['drupal_issuer'] ?? ''), '/');

    if ($mode !== 'drupal_oauth') {
        return [
            'mode' => 'api_token',
            'configured' => trim((string)($config['api_token'] ?? '')) !== '',
        ];
    }

    $authorizeUrl = trim((string)($config['drupal_authorize_url'] ?? ''));
    $tokenUrl = trim((string)($config['drupal_token_url'] ?? ''));
    $userinfoUrl = trim((string)($config['drupal_userinfo_url'] ?? ''));
    $clientId = trim((string)($config['drupal_client_id'] ?? ''));
    $redirectUri = api_oauth_redirect_uri($config);
    $scope = trim((string)($config['drupal_scope'] ?? 'openid profile email'));

    if ($authorizeUrl === '' && $issuer !== '') {
        $authorizeUrl = $issuer . '/oauth/authorize';
    }
    if ($tokenUrl === '' && $issuer !== '') {
        $tokenUrl = $issuer . '/oauth/token';
    }
    if ($userinfoUrl === '' && $issuer !== '') {
        $userinfoUrl = $issuer . '/oauth/userinfo';
    }

    $redirectUriAllowed = api_redirect_uri_allowed($redirectUri, $config);
    $endpointsAllowed = api_oauth_endpoint_allowed($authorizeUrl, $issuer, $config)
        && api_oauth_endpoint_allowed($tokenUrl, $issuer, $config)
        && api_oauth_endpoint_allowed($userinfoUrl, $issuer, $config);
    $scopes = api_config_array($scope);

    return [
        'mode' => 'drupal_oauth',
        'configured' => api_oauth_issuer_allowed($issuer, $config)
            && $endpointsAllowed
            && preg_match('/^[A-Za-z0-9._~-]{3,128}$/', $clientId) === 1
            && $redirectUriAllowed
            && in_array('openid', $scopes, true),
        'issuer' => $issuer,
        'authorizeUrl' => $authorizeUrl,
        'clientId' => $clientId,
        'scope' => $scope,
        'redirectUri' => $redirectUri,
    ];
}

function api_auth_configured(array $config): bool
{
    return (bool)(api_public_auth_config($config)['configured'] ?? false);
}

function api_require_auth(array $config): array
{
    if (api_auth_mode($config) === 'drupal_oauth') {
        return api_require_drupal_user($config);
    }

    return api_require_token($config);
}

function api_require_token(array $config): array
{
    $expected = trim((string)($config['api_token'] ?? ''));
    if ($expected === '') {
        api_json(503, [
            'ok' => false,
            'error' => 'api_token_missing',
            'message' => 'Configurez AVEREO_API_TOKEN cote serveur avant d utiliser la base en ligne.',
        ]);
    }

    $provided = api_bearer_token();
    if ($provided === '' && !empty($_SERVER['HTTP_X_AVEREO_API_TOKEN'])) {
        $provided = trim((string)$_SERVER['HTTP_X_AVEREO_API_TOKEN']);
    }

    if ($provided === '' || !hash_equals($expected, $provided)) {
        api_json(401, [
            'ok' => false,
            'error' => 'unauthorized',
            'message' => 'Jeton API invalide ou manquant.',
        ]);
    }

    return [
        'provider' => 'api_token',
        'id' => 'api-token',
        'email' => '',
        'name' => 'Jeton API',
        'roles' => ['administrateur_rapport'],
    ];
}

function api_require_drupal_user(array $config): array
{
    if (!api_auth_configured($config)) {
        api_json(503, [
            'ok' => false,
            'error' => 'drupal_oauth_not_configured',
            'message' => 'Configuration OAuth Drupal invalide ou incomplete.',
        ]);
    }

    $token = api_bearer_token();
    if ($token === '') {
        api_json(401, [
            'ok' => false,
            'error' => 'drupal_token_missing',
            'message' => 'Connexion AVEREO requise.',
        ]);
    }

    $userinfoUrl = trim((string)($config['drupal_userinfo_url'] ?? ''));
    $issuer = rtrim((string)($config['drupal_issuer'] ?? ''), '/');
    if ($userinfoUrl === '' && $issuer !== '') {
        $userinfoUrl = $issuer . '/oauth/userinfo';
    }
    if ($userinfoUrl === '') {
        api_json(503, [
            'ok' => false,
            'error' => 'drupal_userinfo_missing',
            'message' => 'Endpoint Drupal userinfo non configure.',
        ]);
    }
    if (!api_oauth_endpoint_allowed($userinfoUrl, $issuer, $config)) {
        api_json(503, [
            'ok' => false,
            'error' => 'drupal_userinfo_forbidden',
            'message' => 'Endpoint Drupal userinfo non autorise.',
        ]);
    }

    $result = api_remote_json($userinfoUrl, [
        'Authorization: Bearer ' . $token,
    ]);

    if (!$result['ok']) {
        api_json(401, [
            'ok' => false,
            'error' => 'drupal_token_invalid',
            'message' => 'Session AVEREO invalide ou expiree.',
            'status' => $result['status'],
        ]);
    }

    $user = is_array($result['data']) ? $result['data'] : [];
    $expectedClientId = trim((string)($config['drupal_client_id'] ?? ''));
    $tokenClientId = api_first_string($user, ['client_id']);
    if ($tokenClientId === '' || !hash_equals($expectedClientId, $tokenClientId)) {
        api_json(401, [
            'ok' => false,
            'error' => 'drupal_token_wrong_client',
            'message' => 'Le jeton AVEREO n appartient pas a l application Rapport.',
        ]);
    }

    $roles = api_normalize_roles($user);
    $requiredRoles = api_config_array($config['drupal_required_roles'] ?? []);
    if ($requiredRoles && !array_intersect($requiredRoles, $roles)) {
        api_json(403, [
            'ok' => false,
            'error' => 'drupal_role_forbidden',
            'message' => 'Votre compte AVEREO n a pas acces a Rapport.',
        ]);
    }

    $id = api_first_string($user, ['sub']);
    $email = api_first_string($user, ['email', 'mail']);
    if ($id === '') {
        api_json(401, [
            'ok' => false,
            'error' => 'drupal_user_missing',
            'message' => 'Identite Drupal incomplete.',
        ]);
    }

    return [
        'provider' => 'drupal',
        'id' => api_trim_text($id, 64),
        'email' => api_trim_text($email, 190),
        'name' => api_trim_text(api_first_string($user, ['name', 'preferred_username', 'display_name']), 190),
        'roles' => $roles,
    ];
}

function api_identity_can_manage_all(array $identity, array $config): bool
{
    if (($identity['provider'] ?? '') === 'api_token') {
        return true;
    }

    $roles = api_config_array($identity['roles'] ?? []);
    $adminRoles = api_config_array($config['drupal_admin_roles'] ?? ['administrateur_rapport']);
    return (bool)array_intersect($roles, $adminRoles);
}

function api_normalize_roles(array $user): array
{
    $roles = [];
    foreach (['roles', 'role', 'drupal_roles'] as $key) {
        if (!array_key_exists($key, $user)) {
            continue;
        }
        $value = $user[$key];
        if (is_array($value)) {
            foreach ($value as $role) {
                if (is_array($role)) {
                    $role = $role['target_id'] ?? $role['id'] ?? $role['name'] ?? '';
                }
                $roles[] = strtolower(trim((string)$role));
            }
        } else {
            foreach (preg_split('/[\s,]+/', (string)$value) ?: [] as $role) {
                $roles[] = strtolower(trim($role));
            }
        }
    }

    return array_values(array_unique(array_filter($roles)));
}

function api_config_array($value): array
{
    if (is_array($value)) {
        return array_values(array_filter(array_map(static fn($item) => strtolower(trim((string)$item)), $value)));
    }
    if (is_string($value)) {
        return array_values(array_filter(array_map(static fn($item) => strtolower(trim($item)), preg_split('/[\s,]+/', $value) ?: [])));
    }
    return [];
}

function api_first_string(array $source, array $keys): string
{
    foreach ($keys as $key) {
        if (!empty($source[$key]) && !is_array($source[$key])) {
            return trim((string)$source[$key]);
        }
    }
    return '';
}

function api_remote_json(string $url, array $headers = [], ?array $postFields = null): array
{
    $headers = array_merge(['Accept: application/json'], $headers);
    $status = 0;
    $body = '';
    $error = '';

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_HTTPHEADER => $headers,
        ]);
        if ($postFields !== null) {
            curl_setopt($curl, CURLOPT_POST, true);
            curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($postFields));
            curl_setopt($curl, CURLOPT_HTTPHEADER, array_merge($headers, [
                'Content-Type: application/x-www-form-urlencoded',
            ]));
        }

        $body = (string)curl_exec($curl);
        $status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        if (curl_errno($curl)) {
            $error = curl_error($curl);
        }
        curl_close($curl);
    } else {
        $method = $postFields === null ? 'GET' : 'POST';
        $content = $postFields === null ? '' : http_build_query($postFields);
        $context = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $postFields === null ? $headers : array_merge($headers, ['Content-Type: application/x-www-form-urlencoded'])),
                'content' => $content,
                'timeout' => 15,
                'ignore_errors' => true,
            ],
        ]);
        $body = (string)@file_get_contents($url, false, $context);
        if (isset($http_response_header) && is_array($http_response_header)) {
            foreach ($http_response_header as $header) {
                if (preg_match('/^HTTP\/\S+\s+(\d+)/', $header, $matches)) {
                    $status = (int)$matches[1];
                    break;
                }
            }
        }
        if ($body === '') {
            $error = 'remote_request_failed';
        }
    }

    $data = json_decode($body, true);
    return [
        'ok' => $status >= 200 && $status < 300 && is_array($data),
        'status' => $status,
        'data' => is_array($data) ? $data : null,
        'error' => $error,
    ];
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

function api_read_json_body(?int $maxBytes = null): array
{
    $contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($maxBytes !== null && $contentLength > $maxBytes) {
        api_json(413, [
            'ok' => false,
            'error' => 'payload_too_large',
            'message' => 'Corps de requete trop volumineux.',
        ]);
    }

    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    if ($maxBytes !== null && strlen($raw) > $maxBytes) {
        api_json(413, [
            'ok' => false,
            'error' => 'payload_too_large',
            'message' => 'Corps de requete trop volumineux.',
        ]);
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

function api_report_summary(array $row): array
{
    return [
        'id' => $row['public_id'],
        'title' => $row['title'],
        'reference' => $row['reference_code'],
        'address' => $row['address'],
        'payloadBytes' => (int)$row['payload_bytes'],
        'ownerProvider' => $row['owner_provider'],
        'ownerId' => $row['owner_id'],
        'ownerEmail' => $row['owner_email'] ?? '',
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
