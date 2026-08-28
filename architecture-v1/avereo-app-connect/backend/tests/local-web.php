<?php

declare(strict_types=1);

$baseUrl = rtrim((string) (getenv('CONNECT_LOCAL_BASE_URL') ?: 'http://web:8080'), '/');

/**
 * @param list<string> $requestHeaders
 * @return array{status: int, body: string, headers: list<string>}
 */
function localGet(string $url, array $requestHeaders = []): array
{
    $headers = array_merge(['Accept: application/json'], $requestHeaders);
    $context = stream_context_create([
        'http' => [
            'ignore_errors' => true,
            'timeout' => 5,
            'follow_location' => 0,
            'max_redirects' => 0,
            'header' => implode("\r\n", $headers) . "\r\n",
        ],
    ]);
    $body = file_get_contents($url, false, $context);
    $responseHeaders = $http_response_header ?? [];
    $status = 0;
    foreach ($responseHeaders as $header) {
        if (preg_match('/^HTTP\/\S+\s+(\d{3})\b/', $header, $matches)) {
            $status = (int) $matches[1];
        }
    }

    return [
        'status' => $status,
        'body' => $body === false ? '' : $body,
        'headers' => array_values($responseHeaders),
    ];
}

/**
 * @param callable(array{status: int, body: string, headers: list<string>}): bool $assertion
 * @param list<string> $requestHeaders
 * @return array{status: int, body: string, headers: list<string>}
 */
function assertLocal(string $name, string $url, callable $assertion, array $requestHeaders = []): array
{
    $response = localGet($url, $requestHeaders);
    if (!$assertion($response)) {
        fwrite(STDERR, sprintf("FAIL %s (HTTP %d)\n", $name, $response['status']));
        exit(1);
    }
    fwrite(STDOUT, sprintf("PASS %s (HTTP %d)\n", $name, $response['status']));

    return $response;
}

/** @param array{status: int, body: string, headers: list<string>} $response */
function localCookie(array $response): string
{
    foreach ($response['headers'] as $header) {
        if (preg_match('/^Set-Cookie:\s*([^;]+)/i', $header, $matches)) {
            return $matches[1];
        }
    }

    fwrite(STDERR, "FAIL local session cookie\n");
    exit(1);
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

if (filter_var(getenv('CONNECT_LOCAL_DEMO_EXPECTED') ?: 'false', FILTER_VALIDATE_BOOL)) {
    assertLocal(
        'local demo banner',
        $baseUrl . '/',
        static fn (array $response): bool => $response['status'] === 200
            && str_contains($response['body'], 'Mode local Docker'),
    );
    $login = assertLocal(
        'local owner login',
        $baseUrl . '/api/v1/local/login?account=owner',
        static fn (array $response): bool => $response['status'] === 303,
    );
    $cookie = localCookie($login);
    assertLocal(
        'local owner session',
        $baseUrl . '/api/v1/session',
        static function (array $response): bool {
            $payload = json_decode($response['body'], true);
            return $response['status'] === 200
                && is_array($payload)
                && ($payload['data']['authenticated'] ?? null) === true
                && ($payload['data']['approved'] ?? null) === true;
        },
        ['Cookie: ' . $cookie],
    );
    assertLocal(
        'local owner profile',
        $baseUrl . '/api/v1/me',
        static function (array $response): bool {
            $payload = json_decode($response['body'], true);
            return $response['status'] === 200
                && is_array($payload)
                && ($payload['data']['displayName'] ?? null) === 'Administrateur local';
        },
        ['Cookie: ' . $cookie],
    );
    assertLocal(
        'local owner catalog',
        $baseUrl . '/api/v1/catalog',
        static function (array $response): bool {
            $payload = json_decode($response['body'], true);
            return $response['status'] === 200
                && is_array($payload)
                && count($payload['data'] ?? []) === 5;
        },
        ['Cookie: ' . $cookie],
    );
    $clientLogin = assertLocal(
        'local client login',
        $baseUrl . '/api/v1/local/login?account=client',
        static fn (array $response): bool => $response['status'] === 303,
    );
    $clientCookie = localCookie($clientLogin);
    $organizations = assertLocal(
        'local client organization',
        $baseUrl . '/api/v1/organizations',
        static function (array $response): bool {
            $payload = json_decode($response['body'], true);
            return $response['status'] === 200
                && is_array($payload)
                && count($payload['data'] ?? []) === 1
                && ($payload['data'][0]['role'] ?? null) === 'member';
        },
        ['Cookie: ' . $clientCookie],
    );
    $organizationsPayload = json_decode($organizations['body'], true);
    $organizationId = (int) ($organizationsPayload['data'][0]['id'] ?? 0);
    assertLocal(
        'local client administration denied',
        $baseUrl . "/api/v1/admin/organizations/{$organizationId}/accounts",
        static fn (array $response): bool => $response['status'] === 403,
        ['Cookie: ' . $clientCookie],
    );
}
