<?php

declare(strict_types=1);

namespace Avereo\Connect\Security;

use Avereo\Connect\Http\ApiException;

final class OAuthTransactionStore
{
    public function __construct(
        private readonly string $directory,
        private readonly string $integrityKey,
    ) {
        if ($directory === '' || $integrityKey === '') {
            throw new \InvalidArgumentException('Stockage OAuth invalide.');
        }

        if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
            throw new \RuntimeException('Le stockage OAuth ne peut pas être créé.');
        }
        @chmod($directory, 0700);
        if (!is_writable($directory)) {
            throw new \RuntimeException('Le stockage OAuth n’est pas accessible en écriture.');
        }
    }

    public function save(
        string $state,
        string $nonce,
        string $verifier,
        string $binding,
        ?int $startedAt = null,
    ): void {
        $this->assertToken($state, 256);
        $this->assertToken($nonce, 256);
        $this->assertToken($verifier, 256);
        $this->assertBinding($binding);

        $payload = [
            'state' => $state,
            'nonce' => $nonce,
            'verifier' => $verifier,
            'binding' => hash_hmac('sha256', $binding, $this->integrityKey),
            'started_at' => $startedAt ?? time(),
        ];
        $encodedPayload = json_encode(
            $payload,
            JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR,
        );
        $envelope = json_encode([
            'payload' => base64_encode($encodedPayload),
            'mac' => hash_hmac('sha256', $encodedPayload, $this->integrityKey),
        ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);

        $path = $this->path($state);
        $temporaryPath = $path . '.' . bin2hex(random_bytes(8)) . '.tmp';
        if (file_put_contents($temporaryPath, $envelope, LOCK_EX) === false) {
            throw new \RuntimeException('La transaction OAuth ne peut pas être enregistrée.');
        }
        @chmod($temporaryPath, 0600);
        if (!rename($temporaryPath, $path)) {
            @unlink($temporaryPath);
            throw new \RuntimeException('La transaction OAuth ne peut pas être publiée.');
        }
        @chmod($path, 0600);
        $this->cleanupExpired();
    }

    /** @return array{nonce: string, verifier: string} */
    public function consume(string $state, string $binding, int $maximumAgeSeconds = 300): array
    {
        $this->assertToken($state, 256);
        $this->assertBinding($binding);

        $path = $this->path($state);
        $claimedPath = $path . '.' . bin2hex(random_bytes(8)) . '.consume';
        if (!is_file($path) || !rename($path, $claimedPath)) {
            throw $this->missing();
        }

        try {
            $encodedEnvelope = file_get_contents($claimedPath);
            if ($encodedEnvelope === false) {
                throw $this->invalid();
            }
            $envelope = json_decode($encodedEnvelope, true, 8, JSON_THROW_ON_ERROR);
            if (!is_array($envelope)) {
                throw $this->invalid();
            }

            $encodedPayload = $envelope['payload'] ?? null;
            $mac = $envelope['mac'] ?? null;
            if (!is_string($encodedPayload) || !is_string($mac)) {
                throw $this->invalid();
            }
            $payloadJson = base64_decode($encodedPayload, true);
            if (
                $payloadJson === false
                || !hash_equals(hash_hmac('sha256', $payloadJson, $this->integrityKey), $mac)
            ) {
                throw $this->invalid();
            }

            $payload = json_decode($payloadJson, true, 8, JSON_THROW_ON_ERROR);
            if (!is_array($payload)) {
                throw $this->invalid();
            }
            $storedState = $payload['state'] ?? null;
            $storedBinding = $payload['binding'] ?? null;
            $nonce = $payload['nonce'] ?? null;
            $verifier = $payload['verifier'] ?? null;
            $startedAt = $payload['started_at'] ?? null;
            if (
                !is_string($storedState)
                || !is_string($storedBinding)
                || !is_string($nonce)
                || !is_string($verifier)
                || !is_int($startedAt)
                || !hash_equals($storedState, $state)
                || !hash_equals(
                    $storedBinding,
                    hash_hmac('sha256', $binding, $this->integrityKey),
                )
                || time() - $startedAt > $maximumAgeSeconds
                || $startedAt > time() + 30
            ) {
                throw $this->invalid();
            }

            return ['nonce' => $nonce, 'verifier' => $verifier];
        } catch (\JsonException) {
            throw $this->invalid();
        } finally {
            @unlink($claimedPath);
        }
    }

    public function discard(string $state): void
    {
        if ($state !== '' && strlen($state) <= 256) {
            @unlink($this->path($state));
        }
    }

    private function cleanupExpired(): void
    {
        $cutoff = time() - 900;
        $paths = glob($this->directory . DIRECTORY_SEPARATOR . '*.json*') ?: [];
        foreach ($paths as $path) {
            $modifiedAt = filemtime($path);
            if ($modifiedAt !== false && $modifiedAt < $cutoff) {
                @unlink($path);
            }
        }
    }

    private function path(string $state): string
    {
        $name = hash_hmac('sha256', $state, $this->integrityKey) . '.json';
        return rtrim($this->directory, '/\\') . DIRECTORY_SEPARATOR . $name;
    }

    private function assertToken(string $value, int $maximumLength): void
    {
        if ($value === '' || strlen($value) > $maximumLength) {
            throw $this->invalid();
        }
    }

    private function assertBinding(string $binding): void
    {
        if (!preg_match('/^[a-f0-9]{64}$/', $binding)) {
            throw $this->invalid();
        }
    }

    private function missing(): ApiException
    {
        return new ApiException(
            401,
            'OAUTH_TRANSACTION_MISSING',
            'La transaction OAuth est absente ou expirée.',
        );
    }

    private function invalid(): ApiException
    {
        return new ApiException(
            401,
            'OAUTH_TRANSACTION_INVALID',
            'La transaction OAuth est invalide ou expirée.',
        );
    }
}
