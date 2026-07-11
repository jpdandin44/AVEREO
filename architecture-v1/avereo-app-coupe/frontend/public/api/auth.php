<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

api_no_options_response();

$config = api_config();
$action = api_trim_text($_GET['action'] ?? 'config', 32);

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'config') {
    api_json(200, [
        'ok' => true,
        'auth' => api_public_auth_config($config),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'me') {
    $identity = api_require_auth($config);
    api_json(200, [
        'ok' => true,
        'user' => [
            'provider' => $identity['provider'],
            'id' => $identity['id'],
            'email' => $identity['email'],
            'name' => $identity['name'],
            'roles' => $identity['roles'],
            'canManageAll' => api_identity_can_manage_all($identity, $config),
        ],
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'token') {
    if (api_auth_mode($config) !== 'drupal_oauth') {
        api_json(400, [
            'ok' => false,
            'error' => 'auth_mode_not_drupal',
            'message' => 'OAuth Drupal n est pas actif sur cette API.',
        ]);
    }

    $body = api_read_json_body();
    $code = api_trim_text($body['code'] ?? '', 2048);
    $codeVerifier = api_trim_text($body['codeVerifier'] ?? '', 256);
    $redirectUri = api_trim_text($body['redirectUri'] ?? '', 2048);
    $clientId = trim((string)($config['drupal_client_id'] ?? ''));
    $clientSecret = trim((string)($config['drupal_client_secret'] ?? ''));
    $tokenUrl = trim((string)($config['drupal_token_url'] ?? ''));
    $issuer = rtrim((string)($config['drupal_issuer'] ?? ''), '/');

    if ($tokenUrl === '' && $issuer !== '') {
        $tokenUrl = $issuer . '/oauth/token';
    }

    if ($code === '' || $codeVerifier === '' || $redirectUri === '' || $clientId === '' || $tokenUrl === '') {
        api_json(400, [
            'ok' => false,
            'error' => 'oauth_exchange_missing_fields',
            'message' => 'Configuration OAuth incomplete ou callback invalide.',
        ]);
    }

    $fields = [
        'grant_type' => 'authorization_code',
        'client_id' => $clientId,
        'code' => $code,
        'redirect_uri' => $redirectUri,
        'code_verifier' => $codeVerifier,
    ];
    if ($clientSecret !== '') {
        $fields['client_secret'] = $clientSecret;
    }

    $result = api_remote_json($tokenUrl, [], $fields);
    $token = is_array($result['data']) ? $result['data'] : [];
    if (!$result['ok'] || empty($token['access_token'])) {
        api_json(502, [
            'ok' => false,
            'error' => 'oauth_exchange_failed',
            'message' => 'Echange OAuth avec Drupal impossible.',
            'status' => $result['status'],
        ]);
    }

    api_json(200, [
        'ok' => true,
        'token' => [
            'accessToken' => $token['access_token'],
            'tokenType' => $token['token_type'] ?? 'Bearer',
            'expiresIn' => isset($token['expires_in']) ? (int)$token['expires_in'] : null,
            'scope' => $token['scope'] ?? '',
            'idToken' => $token['id_token'] ?? null,
        ],
    ]);
}

api_json(405, [
    'ok' => false,
    'error' => 'method_not_allowed',
    'message' => 'Methode HTTP non autorisee.',
]);
