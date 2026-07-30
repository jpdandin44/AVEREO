<?php

declare(strict_types=1);

const AVEREO_GATE_APP = 'rapport';

function avereo_gate_base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function avereo_gate_base64url_decode(string $value): string
{
    if ($value === '' || !preg_match('/^[A-Za-z0-9_-]+$/', $value)) {
        throw new RuntimeException('Encodage de ticket invalide.');
    }
    $padding = (4 - strlen($value) % 4) % 4;
    $decoded = base64_decode(strtr($value . str_repeat('=', $padding), '-_', '+/'), true);
    if ($decoded === false) {
        throw new RuntimeException('Encodage de ticket invalide.');
    }
    return $decoded;
}

function avereo_gate_home_from_path(string $path): string
{
    $normalized = str_replace('\\', '/', trim($path));
    if (preg_match('#^(/home/[A-Za-z0-9._-]+)(?:/|$)#', $normalized, $matches)) {
        return $matches[1];
    }
    return '';
}

/** @return array<string, mixed> */
function avereo_gate_config(): array
{
    $configured = trim((string) (getenv('AVEREO_CONFIG_FILE') ?: ($_SERVER['AVEREO_CONFIG_FILE'] ?? '')));
    $candidates = $configured === '' ? [] : [$configured];
    $documentRoot = strtolower(str_replace('\\', '/', (string) ($_SERVER['DOCUMENT_ROOT'] ?? '')));
    $configNames = str_contains($documentRoot, 'preprod')
        ? ['rapport-preprod', AVEREO_GATE_APP]
        : [AVEREO_GATE_APP];
    foreach ([
        getenv('HOME') ?: '',
        $_SERVER['HOME'] ?? '',
        $_SERVER['DOCUMENT_ROOT'] ?? '',
        __DIR__,
    ] as $path) {
        $home = avereo_gate_home_from_path((string) $path);
        if ($home !== '') {
            foreach ($configNames as $configName) {
                $candidates[] = $home . '/.avereo/' . $configName . '/config.php';
            }
        }
    }

    $fileConfig = [];
    foreach (array_unique($candidates) as $candidate) {
        if (is_file($candidate)) {
            $loaded = require $candidate;
            if (is_array($loaded)) {
                $fileConfig = $loaded;
                break;
            }
        }
    }

    return array_merge([
        'environment' => 'production',
        'connect_portal_url' => '',
        'connect_launch_secret' => '',
        'connect_launch_nonce_directory' => '',
        'connect_launch_max_seconds' => 300,
        'connect_gate_cookie' => 'AVEREO_RAPPORT_GATE',
        'connect_gate_session_seconds' => 1800,
    ], $fileConfig);
}

/** @return array<string, mixed> */
function avereo_gate_decode_signed(string $value, string $secret): array
{
    if (strlen($value) > 4096 || substr_count($value, '.') !== 1 || strlen($secret) < 32) {
        throw new RuntimeException('Ticket invalide.');
    }
    [$encodedPayload, $encodedSignature] = explode('.', $value, 2);
    $providedSignature = avereo_gate_base64url_decode($encodedSignature);
    $expectedSignature = hash_hmac('sha256', $encodedPayload, $secret, true);
    if (!hash_equals($expectedSignature, $providedSignature)) {
        throw new RuntimeException('Signature de ticket invalide.');
    }
    $payload = json_decode(
        avereo_gate_base64url_decode($encodedPayload),
        true,
        16,
        JSON_THROW_ON_ERROR,
    );
    if (!is_array($payload)) {
        throw new RuntimeException('Contenu de ticket invalide.');
    }
    return $payload;
}

/** @param array<string, mixed> $payload */
function avereo_gate_assert_payload(array $payload, int $maxLifetimeSeconds): void
{
    $issuedAt = filter_var($payload['iat'] ?? null, FILTER_VALIDATE_INT);
    $expiresAt = filter_var($payload['exp'] ?? null, FILTER_VALIDATE_INT);
    $nonce = (string) ($payload['nonce'] ?? '');
    $now = time();
    if (
        ($payload['v'] ?? null) !== 1
        || ($payload['app'] ?? null) !== AVEREO_GATE_APP
        || $issuedAt === false
        || $expiresAt === false
        || $issuedAt > $now + 30
        || $issuedAt < $now - $maxLifetimeSeconds
        || $expiresAt <= $now
        || $expiresAt - $issuedAt > $maxLifetimeSeconds
        || !preg_match('/^[A-Za-z0-9_-]{24,128}$/', $nonce)
    ) {
        throw new RuntimeException('Ticket expire ou non conforme.');
    }
}

/** @param array<string, mixed> $config */
function avereo_gate_consume_nonce(array $config, string $nonce, int $expiresAt): void
{
    $directory = rtrim((string) ($config['connect_launch_nonce_directory'] ?? ''), '/\\');
    $environment = strtolower((string) ($config['environment'] ?? 'production'));
    if ($directory === '') {
        throw new RuntimeException('Stockage anti-rejeu non configure.');
    }
    if ($environment !== 'local' && !preg_match('#^/home/[A-Za-z0-9._-]+/#', $directory . '/')) {
        throw new RuntimeException('Stockage anti-rejeu invalide.');
    }
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('Stockage anti-rejeu indisponible.');
    }

    $path = $directory . DIRECTORY_SEPARATOR . hash('sha256', $nonce) . '.used';
    $handle = @fopen($path, 'x');
    if ($handle === false) {
        throw new RuntimeException('Ticket deja utilise.');
    }
    fwrite($handle, (string) $expiresAt);
    fclose($handle);
    @chmod($path, 0600);

    if (random_int(1, 20) === 1) {
        foreach (glob($directory . DIRECTORY_SEPARATOR . '*.used') ?: [] as $candidate) {
            if (is_file($candidate) && filemtime($candidate) < time() - 600) {
                @unlink($candidate);
            }
        }
    }
}

/** @param array<string, mixed> $config */
function avereo_gate_issue_cookie(array $config): void
{
    $secret = trim((string) ($config['connect_launch_secret'] ?? ''));
    $lifetime = max(300, min(43200, (int) ($config['connect_gate_session_seconds'] ?? 1800)));
    $issuedAt = time();
    $payload = avereo_gate_base64url_encode(json_encode([
        'v' => 1,
        'app' => AVEREO_GATE_APP,
        'iat' => $issuedAt,
        'exp' => $issuedAt + $lifetime,
        'nonce' => avereo_gate_base64url_encode(random_bytes(24)),
    ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    $value = $payload . '.' . avereo_gate_base64url_encode(hash_hmac('sha256', $payload, $secret, true));
    setcookie((string) $config['connect_gate_cookie'], $value, [
        'expires' => $issuedAt + $lifetime,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

/** @param array<string, mixed> $config */
function avereo_gate_cookie_is_valid(array $config): bool
{
    try {
        $cookieName = (string) ($config['connect_gate_cookie'] ?? '');
        $value = (string) ($_COOKIE[$cookieName] ?? '');
        $payload = avereo_gate_decode_signed($value, trim((string) ($config['connect_launch_secret'] ?? '')));
        avereo_gate_assert_payload(
            $payload,
            max(300, min(43200, (int) ($config['connect_gate_session_seconds'] ?? 1800))),
        );
        return true;
    } catch (Throwable) {
        return false;
    }
}

/** @param array<string, mixed> $config */
function avereo_gate_redirect_to_connect(array $config): never
{
    $url = trim((string) ($config['connect_portal_url'] ?? ''));
    $parts = parse_url($url);
    if (!is_array($parts)) {
        $parts = [];
    }
    $host = strtolower((string) ($parts['host'] ?? ''));
    if (
        strtolower((string) ($parts['scheme'] ?? '')) !== 'https'
        || ($host !== 'avereo.fr' && !str_ends_with($host, '.avereo.fr'))
        || isset($parts['user'])
        || isset($parts['pass'])
    ) {
        http_response_code(503);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Le portail AVEREO CONNECT n est pas configure.';
        exit;
    }
    $separator = str_contains($url, '?') ? '&' : '?';
    header('Cache-Control: no-store');
    header('Location: ' . $url . $separator . 'app=' . rawurlencode(AVEREO_GATE_APP), true, 303);
    exit;
}

/** @param array<string, mixed> $config */
function avereo_gate_exchange_ticket(array $config, string $ticket): void
{
    $secret = trim((string) ($config['connect_launch_secret'] ?? ''));
    $maxLifetime = max(30, min(300, (int) ($config['connect_launch_max_seconds'] ?? 300)));
    $payload = avereo_gate_decode_signed($ticket, $secret);
    avereo_gate_assert_payload($payload, $maxLifetime);
    avereo_gate_consume_nonce($config, (string) $payload['nonce'], (int) $payload['exp']);
    avereo_gate_issue_cookie($config);
}
