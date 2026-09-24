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

/** @param array{status: int, body: string, headers: list<string>} $response */
function localLocation(array $response): string
{
    foreach ($response['headers'] as $header) {
        if (preg_match('/^Location:\s*(\S+)/i', $header, $matches)) {
            return $matches[1];
        }
    }

    fwrite(STDERR, "FAIL local redirect location\n");
    exit(1);
}

function localContainerUrl(string $publicUrl, string $baseUrl): string
{
    $parts = parse_url($publicUrl);
    if (!is_array($parts) || !isset($parts['path'])) {
        fwrite(STDERR, "FAIL local redirect URL\n");
        exit(1);
    }
    $query = isset($parts['query']) ? '?' . $parts['query'] : '';

    return $baseUrl . $parts['path'] . $query;
}

function localAlterTicketUrl(string $url): string
{
    $marker = 'ticket=';
    $position = strpos($url, $marker);
    if ($position === false || !isset($url[$position + strlen($marker)])) {
        fwrite(STDERR, "FAIL local ticket alteration\n");
        exit(1);
    }
    $index = $position + strlen($marker);
    $url[$index] = $url[$index] === 'A' ? 'B' : 'A';

    return $url;
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
    $catalog = assertLocal(
        'local owner catalog',
        $baseUrl . '/api/v1/catalog',
        static function (array $response): bool {
            $payload = json_decode($response['body'], true);
            return $response['status'] === 200
                && is_array($payload)
                && count($payload['data'] ?? []) === 6
                && count(array_filter(
                    $payload['data'] ?? [],
                    static fn (array $application): bool => ($application['available'] ?? null) === true,
                )) === 6;
        },
        ['Cookie: ' . $cookie],
    );
    $catalogPayload = json_decode($catalog['body'], true);
    $rapport = array_values(array_filter(
        $catalogPayload['data'] ?? [],
        static fn (array $application): bool => ($application['code'] ?? null) === 'rapport',
    ))[0] ?? [];
    assertLocal(
        'local application direct access denied',
        $baseUrl . '/local-app/rapport',
        static fn (array $response): bool => $response['status'] === 403,
    );
    $launch = assertLocal(
        'local application launch ticket',
        $baseUrl . (string) ($rapport['launchUrl'] ?? ''),
        static fn (array $response): bool => $response['status'] === 303,
        ['Cookie: ' . $cookie],
    );
    $entryUrl = localContainerUrl(localLocation($launch), $baseUrl);
    $entry = assertLocal(
        'local application ticket exchange',
        $entryUrl,
        static fn (array $response): bool => $response['status'] === 303,
    );
    $applicationCookie = localCookie($entry);
    assertLocal(
        'local application signed session',
        $baseUrl . localLocation($entry),
        static fn (array $response): bool => $response['status'] === 200
            && str_contains($response['body'], 'Rapport AVEREO Pro')
            && str_contains($response['body'], 'Sas AVEREO CONNECT validé'),
        ['Cookie: ' . $applicationCookie],
    );
    assertLocal(
        'local application ticket replay denied',
        $entryUrl,
        static fn (array $response): bool => $response['status'] === 403,
    );
    $secondLaunch = assertLocal(
        'local application second ticket',
        $baseUrl . (string) ($rapport['launchUrl'] ?? ''),
        static fn (array $response): bool => $response['status'] === 303,
        ['Cookie: ' . $cookie],
    );
    $secondEntryUrl = localContainerUrl(localLocation($secondLaunch), $baseUrl);
    assertLocal(
        'local application altered ticket denied',
        localAlterTicketUrl($secondEntryUrl),
        static fn (array $response): bool => $response['status'] === 403,
    );
    assertLocal(
        'local application wrong target denied',
        str_replace('/local-app/rapport', '/local-app/coupe', $secondEntryUrl),
        static fn (array $response): bool => $response['status'] === 403,
    );
    foreach (['coupe', 'projet', 'thermo', 'drone', 'recherche'] as $applicationCode) {
        $application = array_values(array_filter(
            $catalogPayload['data'] ?? [],
            static fn (array $candidate): bool => ($candidate['code'] ?? null) === $applicationCode,
        ))[0] ?? [];
        $applicationLaunch = assertLocal(
            "local {$applicationCode} launch ticket",
            $baseUrl . (string) ($application['launchUrl'] ?? ''),
            static fn (array $response): bool => $response['status'] === 303,
            ['Cookie: ' . $cookie],
        );
        $applicationEntry = assertLocal(
            "local {$applicationCode} ticket exchange",
            localContainerUrl(localLocation($applicationLaunch), $baseUrl),
            static fn (array $response): bool => $response['status'] === 303,
        );
        assertLocal(
            "local {$applicationCode} signed session",
            $baseUrl . localLocation($applicationEntry),
            static fn (array $response): bool => $response['status'] === 200
                && str_contains($response['body'], 'Sas AVEREO CONNECT validé')
                && ($applicationCode !== 'recherche'
                    || str_contains($response['body'], 'href="http://127.0.0.1:5174/"')),
            ['Cookie: ' . localCookie($applicationEntry)],
        );
    }
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
