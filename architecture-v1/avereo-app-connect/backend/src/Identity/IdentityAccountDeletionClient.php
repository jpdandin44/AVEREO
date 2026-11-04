<?php

declare(strict_types=1);

namespace Avereo\Connect\Identity;

use Avereo\Connect\Http\ApiException;

final class IdentityAccountDeletionClient
{
    public function __construct(
        private readonly string $endpoint,
        private readonly string $secret,
        private readonly ?\Closure $transport = null,
    ) {
        $url = parse_url($endpoint);
        if (($url['scheme'] ?? null) !== 'https' || empty($url['host'])
            || isset($url['user']) || isset($url['pass']) || strlen($secret) < 32) {
            throw new \InvalidArgumentException('Configuration de suppression d’identité invalide.');
        }
    }

    public function check(string $subject, string $email): void
    {
        $this->request('check', $subject, $email);
    }

    public function delete(string $subject, string $email): string
    {
        return $this->request('delete', $subject, $email);
    }

    private function request(string $action, string $subject, string $email): string
    {
        if (preg_match('/^[1-9][0-9]{0,18}$/D', $subject) !== 1) {
            throw new ApiException(409, 'IDENTITY_DELETION_PROTECTED', 'Identité historique non éligible à cette suppression.');
        }
        $body = json_encode(['action' => $action, 'subject' => $subject, 'email' => $email], JSON_THROW_ON_ERROR);
        $at = (string) time();
        $signature = hash_hmac('sha256', "account-lifecycle\n" . $at . "\n" . hash('sha256', $body), $this->secret);
        $headers = ['Content-Type: application/json', 'X-AVEREO-Issued-At: ' . $at, 'X-AVEREO-Signature: ' . $signature];
        if ($this->transport !== null) {
            [$status, $response] = ($this->transport)($body, $headers);
        } else {
            $curl = curl_init($this->endpoint);
            curl_setopt_array($curl, [
                CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_HTTPHEADER => $headers,
                CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false,
                CURLOPT_CONNECTTIMEOUT => 4, CURLOPT_TIMEOUT => 12,
            ]);
            $response = curl_exec($curl);
            $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
            curl_close($curl);
        }
        if ($status === 409) {
            throw new ApiException(409, 'IDENTITY_DELETION_PROTECTED', 'Identité externe, privilégiée ou discordante.');
        }
        $outcome = json_decode((string) $response, true)['status'] ?? null;
        if ($status !== 200 || !in_array($outcome, ['retained', $action === 'check' ? 'eligible' : 'deleted'], true)) {
            throw new ApiException(503, 'IDENTITY_DELETION_UNAVAILABLE', 'La suppression n’a pas été confirmée par Identité.');
        }
        return $outcome;
    }
}
