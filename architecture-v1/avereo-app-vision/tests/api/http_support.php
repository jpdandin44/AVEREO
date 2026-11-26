<?php

declare(strict_types=1);

// Assistants HTTP des tests d'intégration : appels vers le serveur local (dans le conteneur : http://127.0.0.1),
// jeton local et identités de test. Ignorés (test sauté) si le serveur ou la configuration locale sont absents.
require_once __DIR__ . '/../../frontend/public/api/lib/config.php';

/** @return array{status: int, headers: array<string, string>, json: ?array} */
function vision_http(string $method, string $path, array $headers = [], ?string $body = null, string $base = 'http://127.0.0.1'): array
{
    $lines = [];
    foreach ($headers as $name => $value) {
        $lines[] = "$name: $value";
    }
    $context = stream_context_create(['http' => [
        'method' => $method,
        'header' => implode("\r\n", $lines),
        'content' => $body ?? '',
        'ignore_errors' => true,
        'timeout' => 10,
    ]]);
    $raw = @file_get_contents($base . $path, false, $context);
    if ($raw === false || !isset($http_response_header)) {
        vision_skip('serveur local injoignable : lancer les tests dans le conteneur (vision-local.ps1 test)');
    }
    $status = (int) (preg_match('#HTTP/\S+\s+(\d{3})#', $http_response_header[0], $m) ? $m[1] : 0);
    $parsed = [];
    foreach (array_slice($http_response_header, 1) as $line) {
        if (str_contains($line, ':')) {
            [$k, $v] = explode(':', $line, 2);
            $parsed[strtolower(trim($k))] = trim($v);
        }
    }
    $json = json_decode($raw, true);
    return ['status' => $status, 'headers' => $parsed, 'json' => is_array($json) ? $json : null, 'raw' => $raw];
}

/** Appel authentifié avec le jeton local et l'identité de test choisie. */
function vision_api(string $method, string $path, string $user, ?array $body = null, array $extraHeaders = []): array
{
    $config = vision_api_test_config();
    $headers = ['Authorization' => 'Bearer ' . $config['api_token'], 'X-Vision-Local-User' => $user] + $extraHeaders;
    $payload = null;
    if ($body !== null) {
        $headers['Content-Type'] = 'application/json';
        $payload = json_encode($body, JSON_UNESCAPED_UNICODE);
    }
    return vision_http($method, $path, $headers, $payload);
}

function vision_api_test_config(): array
{
    static $config = null;
    if ($config === null) {
        try {
            $config = vision_config();
        } catch (Throwable) {
            vision_skip('configuration locale absente');
        }
        if ($config['auth_mode'] !== 'token') {
            vision_skip('le serveur local n\'est pas en mode « token »');
        }
    }
    return $config;
}

function vision_api_admin_id(): string
{
    return (string) (vision_api_test_config()['admin_user_ids'][0] ?? '1');
}

/** Identité de test unique à chaque exécution : évite toute interférence avec des données existantes. */
function vision_api_user(): string
{
    return (string) random_int(1_000_000, 9_999_999);
}
