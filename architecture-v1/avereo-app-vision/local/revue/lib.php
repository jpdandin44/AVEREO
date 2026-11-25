<?php

declare(strict_types=1);

/** Comptes fictifs : clé => ['id' => chaîne de chiffres, 'libelle' => texte]. */
function vision_revue_comptes(): array
{
    return [
        'A' => ['id' => '900001', 'libelle' => 'Conseiller A'],
        'B' => ['id' => '900002', 'libelle' => 'Conseiller B'],
        'F' => ['id' => '900009', 'libelle' => 'Fondateur F'],
    ];
}

/** Ticket au format CONNECT, signé sur la partie encodée et valable cinq minutes. */
function vision_revue_ticket(string $secret, string $userId, int $maintenant, ?string $nonce = null): string
{
    $base64url = static fn (string $value): string => rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    $payload = [
        'v' => 1,
        'app' => 'vision',
        'iat' => $maintenant,
        'exp' => $maintenant + 300,
        'nonce' => $nonce ?? $base64url(random_bytes(24)),
        'remembered' => false,
        'identity' => ['provider' => 'avereo_connect', 'id' => $userId],
    ];
    $encoded = $base64url(json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    return $encoded . '.' . $base64url(hash_hmac('sha256', $encoded, $secret, true));
}

/** La page est réservée au mode CONNECT local avec un secret suffisant. */
function vision_revue_autorise(array $config): bool
{
    return ($config['environment'] ?? null) === 'local'
        && ($config['auth_mode'] ?? null) === 'connect'
        && is_string($config['connect_launch_secret'] ?? null)
        && strlen($config['connect_launch_secret']) >= 32;
}
