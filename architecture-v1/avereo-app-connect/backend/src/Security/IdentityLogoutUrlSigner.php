<?php

declare(strict_types=1);

namespace Avereo\Connect\Security;

final class IdentityLogoutUrlSigner
{
    private string $returnUrl;

    public function __construct(
        private readonly string $endpoint,
        private readonly string $secret,
        string $oauthRedirectUri,
        private readonly int $ttlSeconds = 120,
    ) {
        if (
            !str_starts_with($endpoint, 'https://')
            || strlen($secret) < 32
            || $ttlSeconds < 30
            || $ttlSeconds > 300
        ) {
            throw new \InvalidArgumentException('Configuration de déconnexion AVEREO invalide.');
        }

        $redirect = parse_url($oauthRedirectUri);
        $scheme = is_array($redirect) ? ($redirect['scheme'] ?? null) : null;
        $host = is_array($redirect) ? ($redirect['host'] ?? null) : null;
        $port = is_array($redirect) ? ($redirect['port'] ?? null) : null;
        if ($scheme !== 'https' || !is_string($host) || $host === '') {
            throw new \InvalidArgumentException('URI de retour AVEREO invalide.');
        }
        $authority = $host . (is_int($port) ? ':' . $port : '');
        $this->returnUrl = 'https://' . $authority . '/?logout=1';
    }

    public function issue(?int $issuedAt = null, ?string $nonce = null): string
    {
        $issuedAt ??= time();
        $nonce ??= self::base64Url(random_bytes(24));
        if (!preg_match('/^[A-Za-z0-9_-]{32,128}$/', $nonce)) {
            throw new \InvalidArgumentException('Nonce de déconnexion AVEREO invalide.');
        }

        $payload = $issuedAt . "\n" . $nonce . "\n" . $this->returnUrl;
        $signature = hash_hmac('sha256', $payload, $this->secret);
        $separator = str_contains($this->endpoint, '?') ? '&' : '?';

        return $this->endpoint . $separator . http_build_query([
            'iat' => $issuedAt,
            'nonce' => $nonce,
            'return' => $this->returnUrl,
            'signature' => $signature,
        ], '', '&', PHP_QUERY_RFC3986);
    }

    public function ttlSeconds(): int
    {
        return $this->ttlSeconds;
    }

    private static function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
