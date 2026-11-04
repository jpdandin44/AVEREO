<?php
declare(strict_types=1);
namespace Avereo\Connect\Identity;

final class IdentityAccountProvisioningClient implements AccountIdentityProvisioner
{
    private readonly ?\Closure $transport;

    public function __construct(private readonly string $endpoint, private readonly string $secret, ?callable $transport = null)
    {
        $parts = parse_url($endpoint);
        if (!is_array($parts) || ($parts['scheme'] ?? '') !== 'https' || empty($parts['host'])
            || isset($parts['user']) || isset($parts['pass']) || strlen($secret) < 32) {
            throw new \InvalidArgumentException('Configuration de création d’identité invalide.');
        }
        $this->transport = $transport === null ? null : \Closure::fromCallable($transport);
    }

    public function provision(string $email, string $displayName, string $requestId, bool $linkExisting = false): string
    {
        $input = ['version'=>1, 'email'=>$email, 'displayName'=>$displayName, 'requestId'=>$requestId];
        if ($linkExisting) $input['linkExisting'] = true;
        $body = json_encode($input, JSON_THROW_ON_ERROR);
        $at = (string) time();
        $nonce = rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
        $headers = ['Content-Type'=>'application/json', 'Accept'=>'application/json', 'X-AVEREO-Issued-At'=>$at,
            'X-AVEREO-Nonce'=>$nonce, 'X-AVEREO-Signature'=>hash_hmac('sha256', $at."\n".$nonce."\n".hash('sha256', $body), $this->secret)];
        if ($this->transport !== null) {
            $response = ($this->transport)($this->endpoint, $headers, $body);
        } else {
            if (!function_exists('curl_init')) throw new \RuntimeException('Transport d’identité indisponible.');
            $curl = curl_init($this->endpoint);
            curl_setopt_array($curl, [CURLOPT_POST=>true, CURLOPT_RETURNTRANSFER=>true, CURLOPT_CONNECTTIMEOUT=>5,
                CURLOPT_TIMEOUT=>15, CURLOPT_FOLLOWLOCATION=>false,
                CURLOPT_HTTPHEADER=>array_map(static fn($k,$v)=>$k.': '.$v, array_keys($headers), $headers), CURLOPT_POSTFIELDS=>$body]);
            $raw = curl_exec($curl);
            $response = ['status'=>(int)curl_getinfo($curl,CURLINFO_RESPONSE_CODE), 'body'=>$raw === false ? '' : $raw];
            curl_close($curl);
        }
        if (($response['status'] ?? 0) === 409) {
            throw new \Avereo\Connect\Http\ApiException(409, $linkExisting ? 'IDENTITY_LINK_UNAVAILABLE' : 'IDENTITY_EXISTS',
                $linkExisting ? 'Cette identité AVEREO ne peut pas être rattachée. Vérifiez son état et ses rôles.'
                    : 'Une identité AVEREO existe déjà. Le propriétaire peut confirmer son rattachement.');
        }
        $data = json_decode((string)($response['body'] ?? ''), true);
        if (($response['status'] ?? 0) !== 200 || !is_array($data)
            || !is_string($data['subject'] ?? null)
            || !preg_match('/^[1-9][0-9]{0,18}$/D', $data['subject']) || ($data['status'] ?? '') !== ($linkExisting ? 'linked' : 'prepared')) {
            throw new \Avereo\Connect\Http\ApiException(502, 'IDENTITY_PROVISIONING_FAILED', 'La création de l’identité n’a pas été confirmée. Réessayez sans envoyer d’invitation.');
        }
        return $data['subject'];
    }
}
