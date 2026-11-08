<?php
declare(strict_types=1);
namespace Avereo\Connect\Developments;

/** Project -> CONNECT -> Drupal. Sources, accounts and permissions are never mutated. */
final class AuthorizationBroker
{
    public function __construct(
        private readonly string $ownerId,
        private readonly string $consumerKey,
        private readonly string $identityKey,
        private readonly string $identityIssuer,
        private readonly \Closure $account,
        private readonly \Closure $identityTransport,
        private readonly \Closure $claimNonce,
        private readonly ?\Closure $clock = null,
    ) {
        if (!preg_match('/^[1-9][0-9]{0,18}$/D', $ownerId) || strlen($consumerKey) < 32 || strlen($identityKey) < 32
            || hash_equals($consumerKey, $identityKey) || $identityIssuer === '') throw new \InvalidArgumentException('Dedicated development configuration required.');
    }

    public function authorize(array $envelope): array
    {
        $now = $this->clock === null ? time() : ($this->clock)();
        $request = SignedMessage::verify($envelope, $this->consumerKey, 'avereo-projet-developments', 'avereo-connect-developments', 'request', $now, ['connectId','sessionIssuedAt']);
        if (($request['connectId'] ?? null) !== $this->ownerId || !is_int($request['sessionIssuedAt'] ?? null)
            || $request['sessionIssuedAt'] < 1 || $request['sessionIssuedAt'] > $now + 5
            || !($this->claimNonce)($request['nonce'], $request['exp'])) throw new \RuntimeException('Development authorization refused.');
        // The subject comes from CONNECT's trusted repository, never from Project/browser input.
        $account = ($this->account)($this->ownerId, $request['sessionIssuedAt']);
        if (!is_array($account) || ($account['active'] ?? null) !== true || ($account['projectAccess'] ?? null) !== true
            || !is_string($account['subject'] ?? null) || !preg_match('/^[1-9][0-9]{0,18}$/D', $account['subject'])) {
            throw new \RuntimeException('Development authorization refused.');
        }
        $nonce = bin2hex(random_bytes(24));
        $identityRequest = SignedMessage::issue(['v'=>1,'iss'=>'avereo-connect-developments','aud'=>$this->identityIssuer,'type'=>'request',
            'iat'=>$now,'exp'=>$now+30,'nonce'=>$nonce,'subject'=>$account['subject']], $this->identityKey);
        $reply = ($this->identityTransport)($identityRequest);
        $checkedAt = $this->clock === null ? time() : ($this->clock)();
        $identity = SignedMessage::verify($reply, $this->identityKey, $this->identityIssuer, 'avereo-connect-developments', 'response', $checkedAt,
            ['requestNonce','subject','active','globalAdmin','role']);
        if (($identity['requestNonce'] ?? null) !== $nonce || ($identity['subject'] ?? null) !== $account['subject']
            || ($identity['active'] ?? null) !== true || ($identity['globalAdmin'] ?? null) !== true
            || !is_string($identity['role'] ?? null) || $identity['role'] === '') throw new \RuntimeException('Development authorization refused.');
        // Recheck the account after the upstream call; no cached grant survives a revocation.
        $current = ($this->account)($this->ownerId, $request['sessionIssuedAt']);
        if (!is_array($current) || ($current['active'] ?? null) !== true || ($current['projectAccess'] ?? null) !== true
            || ($current['subject'] ?? null) !== $account['subject']) throw new \RuntimeException('Development authorization refused.');
        return SignedMessage::issue(['v'=>1,'iss'=>'avereo-connect-developments','aud'=>'avereo-projet-developments','type'=>'response',
            'iat'=>$checkedAt,'exp'=>min($checkedAt+30,$identity['exp']),'nonce'=>bin2hex(random_bytes(24)),
            'requestNonce'=>$request['nonce'],'connectId'=>$this->ownerId,'active'=>true,'globalAdmin'=>true,'scope'=>'developments:read'], $this->consumerKey);
    }
}
