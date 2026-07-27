<?php

declare(strict_types=1);

namespace Avereo\Connect\Security;

use Avereo\Connect\Config;
use Avereo\Connect\Http\ApiException;

final class SessionManager
{
    public function __construct(private readonly Config $config)
    {
    }

    public function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_name($this->config->sessionCookieName);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => $this->config->isSecureCookieRequired(),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        session_start();

        $now = time();
        $createdAt = (int) ($_SESSION['created_at'] ?? $now);
        $lastSeenAt = (int) ($_SESSION['last_seen_at'] ?? $now);
        if (
            isset($_SESSION['user_id'])
            && ($now - $lastSeenAt > $this->config->sessionIdleSeconds
                || $now - $createdAt > $this->config->sessionAbsoluteSeconds)
        ) {
            $this->clearData();
            $createdAt = $now;
        }

        $_SESSION['created_at'] = $createdAt;
        $_SESSION['last_seen_at'] = $now;
        $_SESSION['csrf_token'] ??= bin2hex(random_bytes(32));
    }

    public function context(): AuthContext
    {
        $userId = filter_var($_SESSION['user_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $subject = $_SESSION['drupal_subject'] ?? null;
        if (!is_string($subject) || $subject === '' || strlen($subject) > 191) {
            return AuthContext::anonymous();
        }

        return new AuthContext(
            $userId === false || $userId === null ? null : (int) $userId,
            (int) ($_SESSION['authenticated_at'] ?? 0),
            $subject,
        );
    }

    public function csrfToken(): string
    {
        return (string) ($_SESSION['csrf_token'] ?? '');
    }

    public function establish(int $userId): void
    {
        $this->establishIdentity((string) $userId, $userId);
    }

    public function establishIdentity(string $drupalSubject, ?int $userId = null): void
    {
        if ($drupalSubject === '' || strlen($drupalSubject) > 191) {
            throw new \InvalidArgumentException('Subject Drupal invalide.');
        }

        session_regenerate_id(true);
        $now = time();
        $_SESSION = [
            'drupal_subject' => $drupalSubject,
            'authenticated_at' => $now,
            'created_at' => $now,
            'last_seen_at' => $now,
            'csrf_token' => bin2hex(random_bytes(32)),
        ];
        if ($userId !== null) {
            $_SESSION['user_id'] = $userId;
        }
    }

    public function beginOauth(string $state, string $nonce, string $verifier): void
    {
        $_SESSION['oauth_transaction'] = [
            'state' => $state,
            'nonce' => $nonce,
            'verifier' => $verifier,
            'started_at' => time(),
        ];
    }

    public function ensureOauthBinding(int $lifetimeSeconds = 600): string
    {
        $binding = $this->oauthBinding();
        if ($binding === null) {
            $binding = bin2hex(random_bytes(32));
        }

        $name = $this->oauthBindingCookieName();
        setcookie($name, $binding, [
            'expires' => time() + $lifetimeSeconds,
            'path' => '/',
            'secure' => $this->config->isSecureCookieRequired(),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        $_COOKIE[$name] = $binding;

        return $binding;
    }

    public function oauthBinding(): ?string
    {
        $binding = $_COOKIE[$this->oauthBindingCookieName()] ?? null;
        return is_string($binding) && preg_match('/^[a-f0-9]{64}$/', $binding)
            ? $binding
            : null;
    }

    public function clearOauthBinding(): void
    {
        $name = $this->oauthBindingCookieName();
        setcookie($name, '', [
            'expires' => time() - 42000,
            'path' => '/',
            'secure' => $this->config->isSecureCookieRequired(),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        unset($_COOKIE[$name]);
    }

    /** @return array{nonce: string, verifier: string} */
    public function consumeOauth(string $state, int $maximumAgeSeconds = 300): array
    {
        $transaction = $_SESSION['oauth_transaction'] ?? null;
        unset($_SESSION['oauth_transaction']);

        if (!is_array($transaction)) {
            throw new ApiException(401, 'OAUTH_TRANSACTION_MISSING', 'La transaction OAuth est absente ou expirée.');
        }

        $expectedState = $transaction['state'] ?? null;
        $nonce = $transaction['nonce'] ?? null;
        $verifier = $transaction['verifier'] ?? null;
        $startedAt = $transaction['started_at'] ?? null;
        if (
            !is_string($expectedState)
            || !is_string($nonce)
            || !is_string($verifier)
            || !is_int($startedAt)
            || !hash_equals($expectedState, $state)
            || time() - $startedAt > $maximumAgeSeconds
        ) {
            throw new ApiException(401, 'OAUTH_TRANSACTION_INVALID', 'La transaction OAuth est invalide ou expirée.');
        }

        return ['nonce' => $nonce, 'verifier' => $verifier];
    }

    public function destroy(): void
    {
        $this->clearData();
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
    }

    private function clearData(): void
    {
        $_SESSION = [];
    }

    private function oauthBindingCookieName(): string
    {
        return $this->config->sessionCookieName . '_OAUTH';
    }
}
