<?php

declare(strict_types=1);

$baseUrl = rtrim((string) (getenv('CONNECT_LOCAL_BASE_URL') ?: 'http://web:8080'), '/');

/** @return array{status: int, body: string} */
function localGet(string $url): array
{
    $context = stream_context_create([
        'http' => [
            'ignore_errors' => true,
            'timeout' => 5,
            'header' => "Accept: application/json\r\n",
        ],
    ]);
    $body = file_get_contents($url, false, $context);
    $headers = $http_response_header ?? [];
    $status = 0;
    foreach ($headers as $header) {
        if (preg_match('/^HTTP\/\S+\s+(\d{3})\b/', $header, $matches)) {
            $status = (int) $matches[1];
        }
    }

    return ['status' => $status, 'body' => $body === false ? '' : $body];
}

/** @param callable(array{status: int, body: string}): bool $assertion */
function assertLocal(string $name, string $url, callable $assertion): void
{
    $response = localGet($url);
    if (!$assertion($response)) {
        fwrite(STDERR, sprintf("FAIL %s (HTTP %d)\n", $name, $response['status']));
        exit(1);
    }
    fwrite(STDOUT, sprintf("PASS %s (HTTP %d)\n", $name, $response['status']));
}

assertLocal(
    'local portal',
    $baseUrl . '/',
    static fn (array $response): bool => $response['status'] === 200
        && str_contains($response['body'], '<title>AVEREO CONNECT</title>'),
);
assertLocal(
    'local health',
    $baseUrl . '/api/v1/health',
    static function (array $response): bool {
        $payload = json_decode($response['body'], true);
        return $response['status'] === 200
            && is_array($payload)
            && ($payload['data']['status'] ?? null) === 'ok'
            && ($payload['data']['database'] ?? null) === 'ok';
    },
);
assertLocal(
    'local anonymous session',
    $baseUrl . '/api/v1/session',
    static function (array $response): bool {
        $payload = json_decode($response['body'], true);
        return $response['status'] === 200
            && is_array($payload)
            && ($payload['data']['authenticated'] ?? null) === false;
    },
);
assertLocal(
    'local sensitive file denied',
    $baseUrl . '/.htaccess',
    static fn (array $response): bool => $response['status'] !== 200
        && !str_contains($response['body'], 'RewriteEngine'),
);
