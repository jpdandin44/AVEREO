<?php

declare(strict_types=1);

const VISION_GATE_APP = 'vision';

function vision_gate_b64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function vision_gate_b64url_decode(string $value): string
{
    if (!preg_match('/^[A-Za-z0-9_-]*$/D', $value) || strlen($value) % 4 === 1) {
        throw new InvalidArgumentException('Encodage base64url invalide.');
    }
    $decoded = base64_decode(strtr($value, '-_', '+/'), true);
    if ($decoded === false || vision_gate_b64url_encode($decoded) !== $value) {
        throw new InvalidArgumentException('Encodage base64url non canonique.');
    }
    return $decoded;
}

function vision_gate_decode_signed(string $value, string $secret): array
{
    if (strlen($secret) < 32 || substr_count($value, '.') !== 1) {
        throw new InvalidArgumentException('Secret ou forme invalide.');
    }
    [$encoded, $signature] = explode('.', $value);
    if ($encoded === '' || $signature === '') {
        throw new InvalidArgumentException('Charge ou signature absente.');
    }
    if (!hash_equals(hash_hmac('sha256', $encoded, $secret, true), vision_gate_b64url_decode($signature))) {
        throw new InvalidArgumentException('Signature invalide.');
    }
    $json = vision_gate_b64url_decode($encoded);
    try {
        $payload = json_decode($json, false, 16, JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        throw new InvalidArgumentException('JSON invalide.', 0, $exception);
    }
    // Décoder d'abord en objet distingue {} de [] et des listes JSON.
    if (!$payload instanceof stdClass) {
        throw new InvalidArgumentException('Objet JSON attendu.');
    }
    return json_decode($json, true, 16, JSON_THROW_ON_ERROR);
}

function vision_gate_normalize_identity(mixed $identity): array
{
    if (!is_array($identity) || ($identity['provider'] ?? null) !== 'avereo_connect'
        || !is_string($identity['id'] ?? null) || !preg_match('/^[0-9]{1,20}$/D', $identity['id'])) {
        throw new InvalidArgumentException('Identité CONNECT invalide.');
    }
    return ['provider' => 'avereo_connect', 'id' => $identity['id']];
}

/** Contrôles communs stricts ; une durée nulle ou négative est incohérente. */
function vision_gate_assert_common_payload(array $payload, int $now, int $maxLifetimeSeconds): void
{
    if (($payload['v'] ?? null) !== 1 || ($payload['app'] ?? null) !== VISION_GATE_APP
        || !is_int($payload['iat'] ?? null) || !is_int($payload['exp'] ?? null)
        || $payload['iat'] < 0 || $payload['exp'] <= $payload['iat']
        || $payload['exp'] <= $now || $payload['exp'] - $payload['iat'] > $maxLifetimeSeconds
        || $payload['iat'] - $now > 60 || !is_bool($payload['remembered'] ?? null)
        || !is_string($payload['nonce'] ?? null) || !preg_match('/^[A-Za-z0-9_-]{24,128}$/D', $payload['nonce'])) {
        throw new InvalidArgumentException('Charge expirée ou non conforme.');
    }
    vision_gate_normalize_identity($payload['identity'] ?? null);
}

function vision_gate_assert_ticket_payload(array $payload, int $now, int $maxLifetimeSeconds = 600): void
{
    if (array_key_exists('kind', $payload)) {
        throw new InvalidArgumentException('Un cookie ne peut pas servir de ticket.');
    }
    vision_gate_assert_common_payload($payload, $now, $maxLifetimeSeconds);
}

function vision_gate_consume_nonce(string $directory, string $nonce, int $expiresAt, int $now): void
{
    if (trim($directory) === '' || str_contains($directory, '://') || str_contains($directory, "\0")) {
        throw new RuntimeException('Stockage anti-rejeu invalide.');
    }
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('Stockage anti-rejeu indisponible.');
    }
    $path = $directory . DIRECTORY_SEPARATOR . hash('sha256', $nonce) . '.used';
    $handle = @fopen($path, 'x');
    if ($handle === false) {
        clearstatcache(true, $path);
        if (file_exists($path) || is_link($path)) {
            throw new InvalidArgumentException('nonce déjà utilisé');
        }
        throw new RuntimeException('Impossible de consommer le nonce.');
    }
    try {
        $contents = (string) $expiresAt;
        if (fwrite($handle, $contents) !== strlen($contents) || !fflush($handle)) {
            throw new RuntimeException('Écriture du nonce impossible.');
        }
    } finally {
        fclose($handle);
    }
    @chmod($path, 0600);

    // Chaque marqueur conserve sa propre expiration ; garder une heure de marge.
    $removed = 0;
    foreach (new DirectoryIterator($directory) as $candidate) {
        if ($removed >= 50) {
            break;
        }
        if ($candidate->isLink() || !$candidate->isFile()
            || !preg_match('/^[a-f0-9]{64}\.used$/D', $candidate->getFilename())) {
            continue;
        }
        $expiry = @file_get_contents($candidate->getPathname(), false, null, 0, 32);
        if (is_string($expiry) && preg_match('/^[0-9]{1,19}$/D', $expiry)
            && (int) $expiry < $now - 3600 && @unlink($candidate->getPathname())) {
            $removed++;
        }
    }
}

function vision_gate_exchange_ticket(array $config, string $ticket, ?int $now = null): array
{
    $secret = $config['connect_launch_secret'] ?? null;
    $directory = $config['connect_launch_nonce_directory'] ?? null;
    if (!is_string($secret) || strlen($secret) < 32 || !is_string($directory) || trim($directory) === '') {
        throw new InvalidArgumentException('Configuration de passerelle incomplète.');
    }
    $now ??= time();
    $payload = vision_gate_decode_signed($ticket, $secret);
    vision_gate_assert_ticket_payload($payload, $now);
    vision_gate_consume_nonce($directory, $payload['nonce'], $payload['exp'], $now);
    return vision_gate_normalize_identity($payload['identity']) + ['remembered' => $payload['remembered']];
}

function vision_gate_build_cookie_value(array $identity, bool $remembered, string $secret, int $now, int $lifetimeSeconds): string
{
    if (strlen($secret) < 32) {
        throw new InvalidArgumentException('Secret trop court.');
    }
    $lifetimeSeconds = max(300, min(43200, $lifetimeSeconds));
    $payload = [
        'v' => 1, 'app' => VISION_GATE_APP, 'kind' => 'gate',
        'iat' => $now, 'exp' => $now + $lifetimeSeconds,
        'nonce' => vision_gate_b64url_encode(random_bytes(24)),
        'remembered' => $remembered, 'identity' => vision_gate_normalize_identity($identity),
    ];
    $encoded = vision_gate_b64url_encode(json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    return $encoded . '.' . vision_gate_b64url_encode(hash_hmac('sha256', $encoded, $secret, true));
}

function vision_gate_read_cookie_value(string $value, string $secret, int $now, int $maxLifetimeSeconds = 43200): array
{
    $payload = vision_gate_decode_signed($value, $secret);
    if (($payload['kind'] ?? null) !== 'gate') {
        throw new InvalidArgumentException('Cookie de passerelle attendu.');
    }
    vision_gate_assert_common_payload($payload, $now, $maxLifetimeSeconds);
    return vision_gate_normalize_identity($payload['identity'])
        + ['remembered' => $payload['remembered'], 'exp' => $payload['exp']];
}

function vision_gate_cookie_options(array $config, int $expires): array
{
    return [
        'path' => '/', 'httponly' => true, 'samesite' => 'Lax',
        'secure' => ($config['environment'] ?? null) !== 'local', 'expires' => $expires,
    ];
}

/**
 * Clé de signature du cookie : dérivée du secret ET de l'environnement, distincte de la clé des tickets.
 * Un cookie de préproduction n'est donc pas valable en production, même si le secret est partagé par erreur.
 */
function vision_gate_cookie_key(string $secret, string $environment): string
{
    return hash_hmac('sha256', 'vision-gate-cookie|' . $environment, $secret);
}

/** Nom du cookie : hors local, préfixe __Host- (Secure, path=/, sans Domain : non écrasable depuis un sous-domaine). */
function vision_gate_cookie_name(array $config): string
{
    $base = (string) ($config['connect_gate_cookie'] ?? 'AVEREO_VISION_GATE');
    if (($config['environment'] ?? null) === 'local') {
        return $base;
    }
    return str_starts_with($base, '__Host-') ? $base : '__Host-' . $base;
}

/** Durée de vie du cookie selon la configuration, bornée de 300 s à 12 h. */
function vision_gate_cookie_lifetime(array $config): int
{
    return max(300, min(43200, (int) ($config['connect_gate_session_seconds'] ?? 1800)));
}
