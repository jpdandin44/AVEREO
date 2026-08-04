<?php

declare(strict_types=1);

namespace Avereo\Connect\Security;

use Avereo\Connect\Http\ApiException;

final class IdentityAccountActivationCompletionVerifier
{
    public function __construct(
        private readonly string $secret,
        private readonly int $ttlSeconds = 120,
    ) {
        if (strlen($secret) < 32 || $ttlSeconds < 30 || $ttlSeconds > 300) {
            throw new \InvalidArgumentException('Configuration de confirmation d’activation invalide.');
        }
    }

    /** @param array<string, mixed> $query */
    public function verify(array $query): int
    {
        $issuedAt = (string) ($query['iat'] ?? '');
        $nonce = (string) ($query['nonce'] ?? '');
        $userId = filter_var(
            $query['user_id'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]],
        );
        $signature = (string) ($query['signature'] ?? '');
        $valid = preg_match('/^\d{10}$/', $issuedAt) === 1
            && preg_match('/^[A-Za-z0-9_-]{32,128}$/', $nonce) === 1
            && $userId !== false
            && $userId !== null
            && preg_match('/^[a-f0-9]{64}$/', $signature) === 1
            && abs(time() - (int) $issuedAt) <= $this->ttlSeconds;
        if (!$valid) {
            throw new ApiException(
                403,
                'ACCOUNT_ACTIVATION_CONFIRMATION_INVALID',
                'La confirmation d’activation est invalide ou expirée.',
            );
        }
        $payload = $issuedAt . "\n" . $nonce . "\n" . (int) $userId;
        $expected = hash_hmac('sha256', $payload, $this->secret);
        if (!hash_equals($expected, $signature)) {
            throw new ApiException(
                403,
                'ACCOUNT_ACTIVATION_CONFIRMATION_INVALID',
                'La confirmation d’activation est invalide ou expirée.',
            );
        }
        return (int) $userId;
    }
}
