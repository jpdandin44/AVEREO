<?php
declare(strict_types=1);
namespace Avereo\Connect\Developments;

/** Dedicated, short-lived service messages. Never a browser-provided role. */
final class SignedMessage
{
    public static function issue(array $claims, string $key): array
    {
        if (strlen($key) < 32) throw new \RuntimeException('Development channel is not configured.');
        $payload = rtrim(strtr(base64_encode(json_encode($claims, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES)), '+/', '-_'), '=');
        return ['payload' => $payload, 'signature' => hash_hmac('sha256', $payload, $key)];
    }

    public static function verify(array $envelope, string $key, string $issuer, string $audience, string $type, int $now, array $fields): array
    {
        if (strlen($key) < 32 || array_keys($envelope) !== ['payload', 'signature']
            || !is_string($envelope['payload']) || strlen($envelope['payload']) > 8192
            || !preg_match('/^[A-Za-z0-9_-]+$/D', $envelope['payload'])
            || !is_string($envelope['signature']) || !preg_match('/^[a-f0-9]{64}$/D', $envelope['signature'])
            || !hash_equals(hash_hmac('sha256', $envelope['payload'], $key), $envelope['signature'])) {
            throw new \RuntimeException('Development authorization refused.');
        }
        $bytes = base64_decode(strtr($envelope['payload'], '-_', '+/'), true);
        $p = $bytes === false ? null : json_decode($bytes, true, 12, JSON_THROW_ON_ERROR);
        if (!is_array($p) || array_diff(array_keys($p), array_merge(['v','iss','aud','type','iat','exp','nonce'], $fields)) !== []
            || ($p['v'] ?? null) !== 1 || ($p['iss'] ?? null) !== $issuer || ($p['aud'] ?? null) !== $audience || ($p['type'] ?? null) !== $type
            || !is_int($p['iat'] ?? null) || !is_int($p['exp'] ?? null) || $p['iat'] > $now + 5 || $p['exp'] <= $now
            || $p['exp'] <= $p['iat'] || $p['exp'] - $p['iat'] > 30 || !is_string($p['nonce'] ?? null)
            || !preg_match('/^[a-f0-9]{48}$/D', $p['nonce'])) throw new \RuntimeException('Development authorization refused.');
        return $p;
    }
}
