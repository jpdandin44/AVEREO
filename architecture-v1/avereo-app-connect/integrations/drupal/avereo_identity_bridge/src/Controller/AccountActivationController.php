<?php

declare(strict_types=1);

namespace Drupal\avereo_identity_bridge\Controller;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Mail\MailManagerInterface;
use Drupal\Core\Routing\TrustedRedirectResponse;
use Drupal\Core\Site\Settings;
use Drupal\Core\Url;
use Drupal\user\UserInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class AccountActivationController extends ControllerBase
{
    public function __construct(
        private readonly CacheBackendInterface $cache,
        private readonly EntityTypeManagerInterface $entityTypeManagerService,
        private readonly MailManagerInterface $mailManager,
    ) {
    }

    public static function create(ContainerInterface $container): self
    {
        return new self(
            $container->get('cache.data'),
            $container->get('entity_type.manager'),
            $container->get('plugin.manager.mail'),
        );
    }

    public function issue(Request $request): JsonResponse
    {
        $configuration = $this->configuration();
        $rawBody = $request->getContent();
        $secret = trim((string) ($configuration['account_activation_secret'] ?? ''));
        $issuedAt = (string) $request->headers->get('X-AVEREO-Issued-At', '');
        $nonce = (string) $request->headers->get('X-AVEREO-Nonce', '');
        $signature = (string) $request->headers->get('X-AVEREO-Signature', '');
        $signatureTtl = (int) ($configuration['request_ttl_seconds'] ?? 120);
        if (!$this->validSignature(
            $secret,
            $issuedAt,
            $nonce,
            $signature,
            $signatureTtl,
            $rawBody,
        )) {
            return $this->jsonError(403, 'ACTIVATION_REQUEST_INVALID');
        }

        $replayKey = 'avereo_identity_bridge:activation_request:' . hash('sha256', $nonce);
        if ($this->cache->get($replayKey) !== false) {
            return $this->jsonError(403, 'ACTIVATION_REQUEST_REPLAYED');
        }
        $this->cache->set($replayKey, true, time() + $signatureTtl);

        try {
            $payload = json_decode($rawBody, true, 16, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return $this->jsonError(400, 'ACTIVATION_PAYLOAD_INVALID');
        }
        $email = is_array($payload) ? strtolower(trim((string) ($payload['email'] ?? ''))) : '';
        $connectUserId = is_array($payload)
            ? filter_var(
                $payload['connectUserId'] ?? null,
                FILTER_VALIDATE_INT,
                ['options' => ['min_range' => 1]],
            )
            : false;
        $supportEmail = strtolower(trim((string) ($configuration['support_email'] ?? 'contact@avereo.fr')));
        if (
            !is_array($payload)
            || ($payload['version'] ?? null) !== 1
            || $connectUserId === false
            || $connectUserId === null
            || filter_var($email, FILTER_VALIDATE_EMAIL) === false
            || strlen($email) > 254
            || ($payload['expiresInSeconds'] ?? null) !== 86400
            || filter_var($supportEmail, FILTER_VALIDATE_EMAIL) === false
        ) {
            return $this->jsonError(422, 'ACTIVATION_PAYLOAD_INVALID');
        }

        $accounts = $this->entityTypeManagerService
            ->getStorage('user')
            ->loadByProperties(['mail' => $email]);
        $account = $accounts === [] ? null : reset($accounts);
        if (!$account instanceof UserInterface || $account->isAnonymous()) {
            return $this->jsonError(404, 'ACCOUNT_NOT_FOUND');
        }

        $rateLimitSeconds = max(30, min(300, (int) ($configuration['mail_rate_limit_seconds'] ?? 60)));
        $rateLimitKey = 'avereo_identity_bridge:activation_rate:' . $account->id();
        if ($this->cache->get($rateLimitKey) !== false) {
            return new JsonResponse(
                ['status' => 'rate_limited'],
                429,
                ['Retry-After' => (string) $rateLimitSeconds, 'Cache-Control' => 'no-store'],
            );
        }

        $token = $this->base64Url(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $tokenKey = 'avereo_identity_bridge:activation_token:' . $tokenHash;
        $accountKey = 'avereo_identity_bridge:activation_account:' . $account->id();
        $requiresPasswordInitialization = $this->requiresPasswordInitialization($account);
        $previous = $this->cache->get($accountKey);
        if ($previous !== false && is_string($previous->data)) {
            $this->cache->delete('avereo_identity_bridge:activation_token:' . $previous->data);
        }
        $expiresAt = time() + 86400;
        $this->cache->set(
            $tokenKey,
            [
                'uid' => (int) $account->id(),
                'connectUserId' => (int) $connectUserId,
                'expiresAt' => $expiresAt,
                'requiresPasswordInitialization' => $requiresPasswordInitialization,
            ],
            $expiresAt,
        );
        $this->cache->set($accountKey, $tokenHash, $expiresAt);

        $this->prepareAccountForActivation($account, $requiresPasswordInitialization);

        $activationLink = Url::fromRoute(
            'avereo_identity_bridge.account_activate',
            ['token' => $token],
            ['absolute' => true],
        )->toString();
        $mail = $this->mailManager->mail(
            'avereo_identity_bridge',
            'account_activation',
            $email,
            $account->getPreferredLangcode(),
            [
                'display_name' => trim((string) ($payload['displayName'] ?? $account->getDisplayName())),
                'activation_link' => $activationLink,
                'requires_password_initialization' => $requiresPasswordInitialization,
                'support_email' => $supportEmail,
            ],
            null,
            true,
        );
        if (($mail['result'] ?? false) !== true) {
            $this->cache->delete($tokenKey);
            $this->cache->delete($accountKey);
            return $this->jsonError(502, 'ACTIVATION_EMAIL_FAILED');
        }

        $this->cache->set($rateLimitKey, true, time() + $rateLimitSeconds);
        return new JsonResponse(
            ['status' => 'sent', 'expiresInSeconds' => 86400],
            200,
            ['Cache-Control' => 'no-store'],
        );
    }

    public function activate(Request $request, string $token): Response
    {
        if (preg_match('/^[A-Za-z0-9_-]{43}$/', $token) !== 1) {
            return $this->invalidLink();
        }
        $tokenHash = hash('sha256', $token);
        $tokenKey = 'avereo_identity_bridge:activation_token:' . $tokenHash;
        $record = $this->cache->get($tokenKey);
        $recordData = $record === false ? null : $record->data;
        $uid = is_array($recordData) ? (int) ($recordData['uid'] ?? 0) : 0;
        $connectUserId = is_array($recordData) ? (int) ($recordData['connectUserId'] ?? 0) : 0;
        $expiresAt = is_array($recordData) ? (int) ($recordData['expiresAt'] ?? 0) : 0;
        $requiresPasswordInitialization = $this->recordRequiresPasswordInitialization(
            is_array($recordData) ? $recordData : null,
        );
        $accountKey = 'avereo_identity_bridge:activation_account:' . $uid;
        $current = $this->cache->get($accountKey);
        $currentHash = $current === false ? null : $current->data;
        if (
            $uid < 1
            || $connectUserId < 1
            || $expiresAt < time()
            || !is_string($currentHash)
            || !hash_equals($currentHash, $tokenHash)
        ) {
            return $this->invalidLink();
        }
        $this->cache->delete($tokenKey);
        $this->cache->delete($accountKey);

        $account = $this->entityTypeManagerService->getStorage('user')->load($uid);
        if (!$account instanceof UserInterface || $account->isBlocked()) {
            return $this->invalidLink();
        }
        if ($requiresPasswordInitialization) {
            $request->getSession()->set('avereo_identity_bridge_activation', [
                'uid' => $uid,
                'connectUserId' => $connectUserId,
                'expiresAt' => $expiresAt,
            ]);
        } else {
            $request->getSession()->set('avereo_identity_bridge_activation_complete', [
                'connectUserId' => $connectUserId,
            ]);
        }
        $url = Url::fromRoute(
            $this->activationDestinationRoute($requiresPasswordInitialization),
        )->toString();
        return new TrustedRedirectResponse($url, 303, [
            'Cache-Control' => 'no-store, private',
            'Pragma' => 'no-cache',
        ]);
    }

    public function ready(Request $request): Response
    {
        $configuration = $this->configuration();
        $completionUrl = trim((string) ($configuration['connect_activation_complete_url'] ?? ''));
        $secret = trim((string) ($configuration['account_activation_secret'] ?? ''));
        $supportEmail = trim((string) ($configuration['support_email'] ?? 'contact@avereo.fr'));
        $activation = $request->getSession()->get('avereo_identity_bridge_activation_complete');
        $request->getSession()->remove('avereo_identity_bridge_activation_complete');
        $connectUserId = is_array($activation) ? (int) ($activation['connectUserId'] ?? 0) : 0;
        if (
            $connectUserId < 1
            || !str_starts_with($completionUrl, 'https://')
            || strlen($secret) < 32
        ) {
            return $this->completionFailed($supportEmail);
        }
        $issuedAt = time();
        $nonce = $this->base64Url(random_bytes(24));
        $signature = hash_hmac(
            'sha256',
            $issuedAt . "\n" . $nonce . "\n" . $connectUserId,
            $secret,
        );
        $separator = str_contains($completionUrl, '?') ? '&' : '?';
        $url = $completionUrl . $separator . http_build_query([
            'iat' => $issuedAt,
            'nonce' => $nonce,
            'user_id' => $connectUserId,
            'signature' => $signature,
        ], '', '&', PHP_QUERY_RFC3986);
        return new TrustedRedirectResponse($url, 303, [
            'Cache-Control' => 'no-store, private',
            'Pragma' => 'no-cache',
        ]);
    }

    private function validSignature(
        string $secret,
        string $issuedAt,
        string $nonce,
        string $signature,
        int $ttl,
        string $rawBody,
    ): bool {
        $valid = strlen($secret) >= 32
            && preg_match('/^\d{10}$/', $issuedAt) === 1
            && preg_match('/^[A-Za-z0-9_-]{32,128}$/', $nonce) === 1
            && preg_match('/^[a-f0-9]{64}$/', $signature) === 1
            && $ttl >= 30
            && $ttl <= 300
            && abs(time() - (int) $issuedAt) <= $ttl;
        if (!$valid) {
            return false;
        }
        $expected = hash_hmac(
            'sha256',
            $issuedAt . "\n" . $nonce . "\n" . hash('sha256', $rawBody),
            $secret,
        );
        return hash_equals($expected, $signature);
    }

    /** @return array<string, mixed> */
    private function configuration(): array
    {
        $configuration = Settings::get('avereo_identity_bridge', []);
        $path = Settings::get(
            'avereo_identity_bridge_config_path',
            dirname(DRUPAL_ROOT) . '/private/avereo-identity-bridge.php',
        );
        if (is_string($path) && is_readable($path)) {
            $fileConfiguration = require $path;
            if (is_array($fileConfiguration)) {
                return $fileConfiguration;
            }
        }
        return is_array($configuration) ? $configuration : [];
    }

    private function jsonError(int $status, string $code): JsonResponse
    {
        return new JsonResponse(
            ['status' => 'failed', 'code' => $code],
            $status,
            ['Cache-Control' => 'no-store'],
        );
    }

    private function invalidLink(): Response
    {
        $supportEmail = trim((string) ($this->configuration()['support_email'] ?? 'contact@avereo.fr'));
        $safeSupportEmail = htmlspecialchars($supportEmail, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        return new Response(
            '<!doctype html><html lang="fr"><meta charset="utf-8"><title>AVEREO Connect</title>'
            . '<body><main><h1>Lien invalide ou expiré</h1>'
            . '<p>Demandez un nouveau lien depuis l’administration AVEREO Connect.</p>'
            . '<p>Besoin d’aide ? <a href="mailto:' . $safeSupportEmail . '">'
            . $safeSupportEmail . '</a></p></main></body></html>',
            410,
            ['Content-Type' => 'text/html; charset=UTF-8', 'Cache-Control' => 'no-store'],
        );
    }

    private function completionFailed(string $supportEmail): Response
    {
        $safeSupportEmail = htmlspecialchars($supportEmail, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        return new Response(
            '<!doctype html><html lang="fr"><meta charset="utf-8"><title>AVEREO Connect</title>'
            . '<body><main><h1>Activation à finaliser</h1>'
            . '<p>Le mot de passe a été défini, mais CONNECT n’a pas reçu la confirmation.</p>'
            . '<p>Contactez <a href="mailto:' . $safeSupportEmail . '">'
            . $safeSupportEmail . '</a>.</p></main></body></html>',
            503,
            ['Content-Type' => 'text/html; charset=UTF-8', 'Cache-Control' => 'no-store'],
        );
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function requiresPasswordInitialization(UserInterface $account): bool
    {
        return trim((string) $account->getPassword()) === '';
    }

    private function prepareAccountForActivation(
        UserInterface $account,
        bool $requiresPasswordInitialization,
    ): void {
        // Un compte créé sans mot de passe doit rester inutilisable jusqu'à ce
        // que son lien à usage unique initialise son premier secret. Le mot de
        // passe choisi lors d'une inscription autonome n'est jamais remplacé.
        if ($requiresPasswordInitialization) {
            $account->setPassword($this->base64Url(random_bytes(48)));
        }
        $account->activate();
        $account->save();
    }

    /** @param null|array<string, mixed> $recordData */
    private function recordRequiresPasswordInitialization(?array $recordData): bool
    {
        // Les jetons émis avant cette correction ont invalidé l'ancien mot de
        // passe. Ils doivent donc conserver le parcours d'initialisation.
        return !array_key_exists('requiresPasswordInitialization', $recordData ?? [])
            || ($recordData['requiresPasswordInitialization'] ?? null) === true;
    }

    private function activationDestinationRoute(bool $requiresPasswordInitialization): string
    {
        return $requiresPasswordInitialization
            ? 'avereo_identity_bridge.account_password'
            : 'avereo_identity_bridge.account_ready';
    }
}
