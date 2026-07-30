<?php

declare(strict_types=1);

namespace Avereo\Connect\Security;

use Avereo\Connect\Config;
use Avereo\Connect\Http\ApiException;

final class AppLaunchTicketIssuer
{
    public function __construct(private readonly Config $config)
    {
    }

    public function isConfigured(string $applicationCode): bool
    {
        return strlen($this->config->appLaunchSecret($applicationCode)) >= 32
            && $this->isAllowedEntryUrl($this->config->appLaunchEntryUrl($applicationCode));
    }

    public function issueLocation(string $applicationCode): string
    {
        if (!$this->isConfigured($applicationCode)) {
            throw new ApiException(
                503,
                'APPLICATION_GATE_NOT_CONFIGURED',
                'Le sas de lancement de l application n est pas configure.',
            );
        }

        $issuedAt = time();
        $payload = json_encode([
            'v' => 1,
            'app' => $applicationCode,
            'iat' => $issuedAt,
            'exp' => $issuedAt + $this->config->appLaunchTtlSeconds,
            'nonce' => self::base64UrlEncode(random_bytes(24)),
        ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $encodedPayload = self::base64UrlEncode($payload);
        $signature = hash_hmac(
            'sha256',
            $encodedPayload,
            $this->config->appLaunchSecret($applicationCode),
            true,
        );
        $ticket = $encodedPayload . '.' . self::base64UrlEncode($signature);
        $entryUrl = $this->config->appLaunchEntryUrl($applicationCode);
        $separator = str_contains($entryUrl, '?') ? '&' : '?';

        return $entryUrl . $separator . 'ticket=' . rawurlencode($ticket);
    }

    private function isAllowedEntryUrl(string $url): bool
    {
        $parts = parse_url($url);
        if (!is_array($parts)) {
            return false;
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = strtolower((string) ($parts['host'] ?? ''));
        $path = (string) ($parts['path'] ?? '');
        if (
            $host === ''
            || $path === ''
            || isset($parts['user'])
            || isset($parts['pass'])
            || isset($parts['fragment'])
        ) {
            return false;
        }

        if ($this->config->environment === 'local') {
            return in_array($scheme, ['http', 'https'], true)
                && in_array($host, ['localhost', '127.0.0.1'], true);
        }

        return $scheme === 'https'
            && (!isset($parts['port']) || (int) $parts['port'] === 443)
            && ($host === 'avereo.fr' || str_ends_with($host, '.avereo.fr'));
    }

    private static function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
