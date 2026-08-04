<?php

declare(strict_types=1);

namespace Avereo\Connect\Identity;

final class IdentityAccountActivationClient implements AccountActivationNotifier
{
    /** @var null|\Closure(string, array<string, string>, string): array{status: int, body: string} */
    private readonly ?\Closure $transport;

    /**
     * @param null|callable(string, array<string, string>, string): array{status: int, body: string} $transport
     */
    public function __construct(
        private readonly string $endpoint,
        private readonly string $secret,
        private readonly string $supportEmail,
        ?callable $transport = null,
    ) {
        if (
            !str_starts_with($endpoint, 'https://')
            || strlen($secret) < 32
            || filter_var($supportEmail, FILTER_VALIDATE_EMAIL) === false
        ) {
            throw new \InvalidArgumentException('Configuration d’activation AVEREO invalide.');
        }
        $this->transport = $transport === null ? null : \Closure::fromCallable($transport);
    }

    public function send(
        int $connectUserId,
        string $drupalSubject,
        string $email,
        string $displayName,
        string $requestId,
    ): array {
        $email = strtolower(trim($email));
        if (
            $connectUserId < 1
            || trim($drupalSubject) === ''
            || filter_var($email, FILTER_VALIDATE_EMAIL) === false
            || strlen($email) > 254
        ) {
            throw new \InvalidArgumentException('Identité à activer invalide.');
        }

        $body = json_encode([
            'version' => 1,
            'connectUserId' => $connectUserId,
            'subject' => trim($drupalSubject),
            'email' => $email,
            'displayName' => substr(trim($displayName), 0, 191),
            'supportEmail' => $this->supportEmail,
            'expiresInSeconds' => 86400,
            'requestId' => $requestId,
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $issuedAt = (string) time();
        $nonce = self::base64Url(random_bytes(24));
        $signature = hash_hmac(
            'sha256',
            $issuedAt . "\n" . $nonce . "\n" . hash('sha256', $body),
            $this->secret,
        );
        $headers = [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
            'X-AVEREO-Issued-At' => $issuedAt,
            'X-AVEREO-Nonce' => $nonce,
            'X-AVEREO-Signature' => $signature,
        ];

        $response = $this->transport === null
            ? $this->post($headers, $body)
            : ($this->transport)($this->endpoint, $headers, $body);
        if (($response['status'] ?? 0) !== 200) {
            throw new \RuntimeException('Le service d’activation AVEREO a refusé la demande.');
        }
        $payload = json_decode((string) ($response['body'] ?? ''), true);
        if (
            !is_array($payload)
            || ($payload['status'] ?? null) !== 'sent'
            || (int) ($payload['expiresInSeconds'] ?? 0) !== 86400
        ) {
            throw new \RuntimeException('La réponse du service d’activation AVEREO est invalide.');
        }

        return ['status' => 'sent', 'expiresInSeconds' => 86400];
    }

    /** @param array<string, string> $headers
     *  @return array{status: int, body: string}
     */
    private function post(array $headers, string $body): array
    {
        if (!function_exists('curl_init')) {
            throw new \RuntimeException('Le transport HTTPS d’activation AVEREO est indisponible.');
        }
        $curl = curl_init($this->endpoint);
        if ($curl === false) {
            throw new \RuntimeException('Le transport HTTPS d’activation AVEREO est indisponible.');
        }
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => array_map(
                static fn (string $name, string $value): string => $name . ': ' . $value,
                array_keys($headers),
                array_values($headers),
            ),
            CURLOPT_POSTFIELDS => $body,
        ]);
        $responseBody = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        if (!is_string($responseBody)) {
            throw new \RuntimeException(
                'Le service d’activation AVEREO est injoignable.'
                . ($error === '' ? '' : ' Transport en échec.'),
            );
        }
        return ['status' => $status, 'body' => $responseBody];
    }

    private static function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
