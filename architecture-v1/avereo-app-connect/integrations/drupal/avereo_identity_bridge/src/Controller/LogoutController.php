<?php

declare(strict_types=1);

namespace Drupal\avereo_identity_bridge\Controller;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Site\Settings;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class LogoutController extends ControllerBase
{
    public function __construct(private readonly CacheBackendInterface $cache)
    {
    }

    public static function create(ContainerInterface $container): self
    {
        return new self($container->get('cache.data'));
    }

    public function logout(Request $request): Response
    {
        $configuration = $this->configuration();
        $secret = is_array($configuration) ? trim((string) ($configuration['logout_secret'] ?? '')) : '';
        $allowedReturns = is_array($configuration) ? ($configuration['allowed_return_urls'] ?? []) : [];
        $ttl = is_array($configuration) ? (int) ($configuration['logout_ttl_seconds'] ?? 120) : 120;
        $issuedAt = (string) $request->query->get('iat', '');
        $nonce = (string) $request->query->get('nonce', '');
        $returnUrl = (string) $request->query->get('return', '');
        $signature = (string) $request->query->get('signature', '');

        $valid = strlen($secret) >= 32
            && is_array($allowedReturns)
            && in_array($returnUrl, $allowedReturns, true)
            && preg_match('/^\d{10}$/', $issuedAt) === 1
            && preg_match('/^[A-Za-z0-9_-]{32,128}$/', $nonce) === 1
            && preg_match('/^[a-f0-9]{64}$/', $signature) === 1
            && $ttl >= 30
            && $ttl <= 300
            && abs(time() - (int) $issuedAt) <= $ttl;
        if (!$valid) {
            return $this->invalidRequest();
        }

        $expected = hash_hmac('sha256', $issuedAt . "\n" . $nonce . "\n" . $returnUrl, $secret);
        if (!hash_equals($expected, $signature)) {
            return $this->invalidRequest();
        }

        $cacheId = 'avereo_identity_bridge:logout:' . hash('sha256', $nonce);
        if ($this->cache->get($cacheId) !== false) {
            return $this->invalidRequest();
        }
        $this->cache->set($cacheId, true, time() + $ttl);

        user_logout();
        return new RedirectResponse($returnUrl, 303, [
            'Cache-Control' => 'no-store, private',
            'Pragma' => 'no-cache',
        ]);
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

    private function invalidRequest(): Response
    {
        return new Response(
            '<!doctype html><html lang="fr"><meta charset="utf-8">'
            . '<title>AVEREO</title><body><h1>AVEREO</h1>'
            . '<p>Cette demande de déconnexion est invalide ou expirée.</p></body></html>',
            403,
            ['Content-Type' => 'text/html; charset=UTF-8', 'Cache-Control' => 'no-store'],
        );
    }
}
