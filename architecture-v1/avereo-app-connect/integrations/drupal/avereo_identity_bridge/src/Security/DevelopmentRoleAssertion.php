<?php
declare(strict_types=1);
namespace Drupal\avereo_identity_bridge\Security;

/** Read-only role decision. Callback must read current user AND current admin-role definition. */
final class DevelopmentRoleAssertion
{
    public function __construct(private readonly string $key, private readonly string $issuer, private readonly string $ownerSubject,
        private readonly \Closure $lookup, private readonly \Closure $claimNonce, private readonly ?\Closure $clock = null)
    {
        if(strlen($key)<32 || $issuer==='' || !preg_match('/^[1-9][0-9]{0,18}$/D',$ownerSubject))throw new \InvalidArgumentException('Private role authority unavailable.');
    }

    public function decide(array $envelope): array
    {
        $now=$this->clock===null?time():($this->clock)();
        if(array_keys($envelope)!==['payload','signature'] || !is_string($envelope['payload']) || strlen($envelope['payload'])>8192
            || !preg_match('/^[A-Za-z0-9_-]+$/D',$envelope['payload']) || !is_string($envelope['signature'])
            || !hash_equals(hash_hmac('sha256',$envelope['payload'],$this->key),$envelope['signature']))throw new \RuntimeException('Role decision refused.');
        $p=json_decode(base64_decode(strtr($envelope['payload'],'-_','+/'),true),true,12,JSON_THROW_ON_ERROR);
        if(!is_array($p) || array_diff(array_keys($p),['v','iss','aud','type','iat','exp','nonce','subject'])!==[]
            || ($p['v']??null)!==1 || ($p['iss']??null)!=='avereo-connect-developments' || ($p['aud']??null)!==$this->issuer || ($p['type']??null)!=='request'
            || !is_int($p['iat']??null) || !is_int($p['exp']??null) || $p['iat']>$now+5 || $p['exp']<=$now || $p['exp']<=$p['iat'] || $p['exp']-$p['iat']>30
            || !is_string($p['nonce']??null) || !preg_match('/^[a-f0-9]{48}$/D',$p['nonce']) || ($p['subject']??null)!==$this->ownerSubject
            || !($this->claimNonce)($p['nonce'],$p['exp']))throw new \RuntimeException('Role decision refused.');
        $current=($this->lookup)($this->ownerSubject);
        $active=($current['active']??null)===true;
        $role=is_string($current['adminRole']??null)?$current['adminRole']:'';
        $global=$active && $role!=='' && ($current['adminRoleIsGlobal']??null)===true && ($current['hasAdminRole']??null)===true;
        $reply=['v'=>1,'iss'=>$this->issuer,'aud'=>'avereo-connect-developments','type'=>'response','iat'=>$now,'exp'=>$now+30,
            'nonce'=>bin2hex(random_bytes(24)),'requestNonce'=>$p['nonce'],'subject'=>$this->ownerSubject,'active'=>$active,'globalAdmin'=>$global,'role'=>$role];
        $payload=rtrim(strtr(base64_encode(json_encode($reply,JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES)),'+/','-_'),'=');
        return ['payload'=>$payload,'signature'=>hash_hmac('sha256',$payload,$this->key)];
    }
}
