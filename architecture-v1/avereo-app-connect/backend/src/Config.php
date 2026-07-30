<?php

declare(strict_types=1);

namespace Avereo\Connect;

final class Config
{
    public function __construct(
        public readonly string $environment,
        public readonly bool $debug,
        public readonly ?string $databaseDsn,
        public readonly string $databaseUser,
        public readonly string $databasePassword,
        public readonly string $sessionCookieName,
        public readonly int $sessionIdleSeconds,
        public readonly int $sessionAbsoluteSeconds,
        public readonly string $oauthIssuer = '',
        public readonly string $oauthAuthorizeUrl = '',
        public readonly string $oauthTokenUrl = '',
        public readonly string $oauthUserinfoUrl = '',
        public readonly string $oauthClientId = '',
        public readonly string $oauthClientSecret = '',
        public readonly string $oauthRedirectUri = '',
        public readonly string $oauthSuccessUrl = '/',
        public readonly string $oauthScopes = 'openid profile email',
        public readonly string $oauthPublicKeyPath = '',
        /** @var array<string, string> */
        public readonly array $appLaunchEntryUrls = [],
        /** @var array<string, string> */
        public readonly array $appLaunchSecrets = [],
        public readonly int $appLaunchTtlSeconds = 90,
    ) {
        if ($sessionIdleSeconds < 60 || $sessionAbsoluteSeconds < $sessionIdleSeconds) {
            throw new \InvalidArgumentException('Durées de session invalides.');
        }
        if ($appLaunchTtlSeconds < 30 || $appLaunchTtlSeconds > 300) {
            throw new \InvalidArgumentException('Duree de ticket applicatif invalide.');
        }
    }

    public static function fromEnvironment(): self
    {
        $dsn = self::env('DB_DSN');

        return new self(
            self::env('APP_ENV', 'production'),
            self::envBool('APP_DEBUG', false),
            $dsn === '' ? null : $dsn,
            self::env('DB_USER'),
            self::env('DB_PASSWORD'),
            self::env('SESSION_COOKIE_NAME', 'AVEREO_CONNECT_SESSION'),
            self::envInt('SESSION_IDLE_SECONDS', 1800),
            self::envInt('SESSION_ABSOLUTE_SECONDS', 43200),
            self::env('OAUTH_ISSUER'),
            self::env('OAUTH_AUTHORIZE_URL'),
            self::env('OAUTH_TOKEN_URL'),
            self::env('OAUTH_USERINFO_URL'),
            self::env('OAUTH_CLIENT_ID'),
            self::env('OAUTH_CLIENT_SECRET'),
            self::env('OAUTH_REDIRECT_URI'),
            self::env('OAUTH_SUCCESS_URL', '/'),
            self::env('OAUTH_SCOPES', 'openid profile email'),
            self::env('OAUTH_PUBLIC_KEY_PATH'),
            [
                'rapport' => self::env('APP_LAUNCH_RAPPORT_URL'),
                'coupe' => self::env('APP_LAUNCH_COUPE_URL'),
            ],
            [
                'rapport' => self::env('APP_LAUNCH_RAPPORT_SECRET'),
                'coupe' => self::env('APP_LAUNCH_COUPE_SECRET'),
            ],
            self::envInt('APP_LAUNCH_TTL_SECONDS', 90),
        );
    }

    public function appLaunchEntryUrl(string $applicationCode): string
    {
        return trim((string) ($this->appLaunchEntryUrls[$applicationCode] ?? ''));
    }

    public function appLaunchSecret(string $applicationCode): string
    {
        return trim((string) ($this->appLaunchSecrets[$applicationCode] ?? ''));
    }

    public function isIdentityProviderConfigured(): bool
    {
        foreach ([
            $this->oauthIssuer,
            $this->oauthAuthorizeUrl,
            $this->oauthTokenUrl,
            $this->oauthUserinfoUrl,
            $this->oauthClientId,
            $this->oauthClientSecret,
            $this->oauthRedirectUri,
            $this->oauthPublicKeyPath,
        ] as $value) {
            if ($value === '') {
                return false;
            }
        }

        foreach ([
            $this->oauthIssuer,
            $this->oauthAuthorizeUrl,
            $this->oauthTokenUrl,
            $this->oauthUserinfoUrl,
            $this->oauthRedirectUri,
        ] as $url) {
            if (!str_starts_with($url, 'https://')) {
                return false;
            }
        }

        return is_readable($this->oauthPublicKeyPath);
    }

    public function isSecureCookieRequired(): bool
    {
        return !in_array($this->environment, ['local', 'test'], true);
    }

    private static function env(string $name, string $default = ''): string
    {
        $value = getenv($name);
        return $value === false ? $default : trim((string) $value);
    }

    private static function envBool(string $name, bool $default): bool
    {
        $value = getenv($name);
        if ($value === false || $value === '') {
            return $default;
        }

        return filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? $default;
    }

    private static function envInt(string $name, int $default): int
    {
        $value = getenv($name);
        if ($value === false || !preg_match('/^\d+$/', $value)) {
            return $default;
        }

        return (int) $value;
    }
}
