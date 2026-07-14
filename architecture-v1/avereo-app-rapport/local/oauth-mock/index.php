<?php
declare(strict_types=1);

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

function oauth_mock_json(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function oauth_mock_origin(): string
{
    $host = $_SERVER['HTTP_HOST'] ?? 'oauth-rapport.avereo.localhost:8102';
    return 'http://' . $host;
}

function oauth_mock_authorization(): string
{
    foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $key) {
        if (!empty($_SERVER[$key])) {
            return (string)$_SERVER[$key];
        }
    }

    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $name => $value) {
            if (strtolower((string)$name) === 'authorization') {
                return (string)$value;
            }
        }
    }

    return '';
}

if ($path === '/' || $path === '/health') {
    oauth_mock_json(200, [
        'ok' => true,
        'service' => 'rapport-oauth-mock',
    ]);
}

if ($path === '/.well-known/openid-configuration') {
    $origin = oauth_mock_origin();
    oauth_mock_json(200, [
        'issuer' => $origin,
        'authorization_endpoint' => $origin . '/oauth/authorize',
        'token_endpoint' => $origin . '/oauth/token',
        'userinfo_endpoint' => $origin . '/oauth/userinfo',
        'response_types_supported' => ['code'],
        'grant_types_supported' => ['authorization_code'],
        'code_challenge_methods_supported' => ['S256'],
        'scopes_supported' => ['openid', 'profile', 'email'],
    ]);
}

if ($path === '/oauth/authorize') {
    $redirectUri = trim((string)($_GET['redirect_uri'] ?? ''));
    $redirect = parse_url($redirectUri);
    $redirectHost = strtolower((string)($redirect['host'] ?? ''));
    $redirectPath = rtrim((string)($redirect['path'] ?? ''), '/') . '/';
    $redirectPort = isset($redirect['port']) ? (int)$redirect['port'] : null;
    $redirectValid = ($redirect['scheme'] ?? '') === 'http'
        && in_array($redirectHost, ['rapport.avereo.localhost', 'localhost', '127.0.0.1'], true)
        && ($redirectPort === null || $redirectPort === 8100)
        && $redirectPath === '/auth/callback/';
    if (!$redirectValid) {
        oauth_mock_json(400, [
            'error' => 'invalid_redirect_uri',
            'error_description' => 'Local OAuth mock only redirects to the local Rapport callback.',
        ]);
    }

    $state = trim((string)($_GET['state'] ?? ''));
    $clientId = trim((string)($_GET['client_id'] ?? ''));
    $responseType = trim((string)($_GET['response_type'] ?? ''));
    $challenge = trim((string)($_GET['code_challenge'] ?? ''));
    $challengeMethod = trim((string)($_GET['code_challenge_method'] ?? ''));
    if ($state === '' || $clientId !== 'avereo_rapport_local' || $responseType !== 'code'
        || $challengeMethod !== 'S256' || !preg_match('/^[A-Za-z0-9_-]{43,128}$/', $challenge)) {
        oauth_mock_json(400, [
            'error' => 'invalid_request',
            'error_description' => 'Authorization Code with PKCE S256 is required.',
        ]);
    }

    $mockUser = trim((string)($_GET['mock_user'] ?? 'user-1'));
    if (!in_array($mockUser, ['user-1', 'user-2', 'admin', 'other-client'], true)) {
        $mockUser = 'user-1';
    }
    $code = bin2hex(random_bytes(24));
    $record = json_encode([
        'profile' => $mockUser,
        'challenge' => $challenge,
        'redirect_uri' => $redirectUri,
        'expires_at' => time() + 300,
    ]);
    if (!is_string($record) || file_put_contents('/tmp/avereo-rapport-oauth-' . $code . '.json', $record, LOCK_EX) === false) {
        oauth_mock_json(500, [
            'error' => 'server_error',
        ]);
    }

    $separator = str_contains($redirectUri, '?') ? '&' : '?';
    $location = $redirectUri . $separator . http_build_query([
        'code' => $code,
        'state' => $state,
    ]);

    header('Location: ' . $location, true, 302);
    exit;
}

if ($path === '/oauth/token') {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        oauth_mock_json(405, [
            'error' => 'method_not_allowed',
        ]);
    }

    $clientId = trim((string)($_POST['client_id'] ?? ''));
    $grantType = trim((string)($_POST['grant_type'] ?? ''));
    $code = trim((string)($_POST['code'] ?? ''));
    $codeVerifier = trim((string)($_POST['code_verifier'] ?? ''));
    $redirectUri = trim((string)($_POST['redirect_uri'] ?? ''));
    if ($clientId !== 'avereo_rapport_local' || $grantType !== 'authorization_code'
        || !preg_match('/^[a-f0-9]{48}$/', $code)
        || !preg_match('/^[A-Za-z0-9._~-]{43,128}$/', $codeVerifier)) {
        oauth_mock_json(400, [
            'error' => 'invalid_request',
        ]);
    }

    $recordPath = '/tmp/avereo-rapport-oauth-' . $code . '.json';
    $record = is_file($recordPath) ? json_decode((string)file_get_contents($recordPath), true) : null;
    @unlink($recordPath);
    $computedChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
    if (!is_array($record)
        || (int)($record['expires_at'] ?? 0) < time()
        || !hash_equals((string)($record['redirect_uri'] ?? ''), $redirectUri)
        || !hash_equals((string)($record['challenge'] ?? ''), $computedChallenge)) {
        oauth_mock_json(400, [
            'error' => 'invalid_grant',
        ]);
    }

    $profiles = [
        'user-1' => 'u1',
        'user-2' => 'u2',
        'admin' => 'admin',
        'other-client' => 'other',
    ];
    $profile = $profiles[(string)($record['profile'] ?? '')] ?? null;
    if ($profile === null) {
        oauth_mock_json(400, [
            'error' => 'invalid_grant',
        ]);
    }

    oauth_mock_json(200, [
        'access_token' => $profile . '_' . bin2hex(random_bytes(24)),
        'token_type' => 'Bearer',
        'expires_in' => 3600,
        'scope' => 'openid profile email',
    ]);
}

if ($path === '/oauth/userinfo') {
    $authorization = oauth_mock_authorization();
    if (!preg_match('/^Bearer\s+(u1|u2|admin|other)_[a-f0-9]{48}$/', $authorization, $matches)) {
        oauth_mock_json(401, [
            'error' => 'invalid_token',
        ]);
    }

    $profiles = [
        'u1' => ['sub' => 'local-drupal-user-1', 'client_id' => 'avereo_rapport_local', 'email' => 'user-1@avereo.test', 'name' => 'Utilisateur Rapport 1', 'roles' => ['utilisateur_rapport']],
        'u2' => ['sub' => 'local-drupal-user-2', 'client_id' => 'avereo_rapport_local', 'email' => 'user-2@avereo.test', 'name' => 'Utilisateur Rapport 2', 'roles' => ['utilisateur_rapport']],
        'admin' => ['sub' => 'local-drupal-admin', 'client_id' => 'avereo_rapport_local', 'email' => 'admin@avereo.test', 'name' => 'Administrateur Rapport', 'roles' => ['utilisateur_rapport', 'administrateur_rapport']],
        'other' => ['sub' => 'local-other-client-user', 'client_id' => 'avereo_other_local', 'email' => 'other@avereo.test', 'name' => 'Autre application', 'roles' => ['utilisateur_rapport']],
    ];
    oauth_mock_json(200, $profiles[$matches[1]]);
}

oauth_mock_json(404, [
    'error' => 'not_found',
    'path' => $path,
]);
