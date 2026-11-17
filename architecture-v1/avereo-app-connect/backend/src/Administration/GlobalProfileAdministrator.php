<?php
declare(strict_types=1);
namespace Avereo\Connect\Administration;

use Avereo\Connect\Developments\SignedMessage;
use Avereo\Connect\Http\ApiException;

/** Exact configured owner and a fresh native Drupal global-admin assertion. No role from the browser. */
final class GlobalProfileAdministrator
{
    public function __construct(private readonly int $owner,private readonly string $key,private readonly string $issuer,
        private readonly \Closure $account,private readonly \Closure $transport)
    {
        if ($owner<1 || strlen($key)<32 || $issuer==='') throw new \InvalidArgumentException('Autorité des profils indisponible.');
    }

    public function assert(int $actor):void
    {
        try {
            if ($actor!==$this->owner) throw new \RuntimeException();
            $account=($this->account)($actor);
            if (($account['active']??null)!==true || !preg_match('/^[1-9][0-9]{0,18}$/D',(string)($account['subject']??''))) throw new \RuntimeException();
            $nonce=bin2hex(random_bytes(24));$now=time();
            $reply=($this->transport)(SignedMessage::issue(['v'=>1,'iss'=>'avereo-connect-profiles','aud'=>$this->issuer,'type'=>'request',
                'iat'=>$now,'exp'=>$now+30,'nonce'=>$nonce,'subject'=>$account['subject']],$this->key));
            $result=SignedMessage::verify($reply,$this->key,$this->issuer,'avereo-connect-profiles','response',time(),['requestNonce','subject','active','globalAdmin','role']);
            if (($result['requestNonce']??null)!==$nonce || ($result['subject']??null)!==$account['subject']
                || ($result['active']??null)!==true || ($result['globalAdmin']??null)!==true || !is_string($result['role']??null) || $result['role']==='') throw new \RuntimeException();
            $current=($this->account)($actor);
            if (($current['active']??null)!==true || ($current['subject']??null)!==$account['subject']) throw new \RuntimeException();
        } catch (\Throwable) { throw new ApiException(403,'PROFILE_GLOBAL_ADMIN_REQUIRED','Ce catalogue est réservé au compte administrateur global AVEREO.'); }
    }
}
