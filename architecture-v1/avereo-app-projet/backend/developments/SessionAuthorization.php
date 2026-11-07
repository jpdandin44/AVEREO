<?php
declare(strict_types=1);
namespace Avereo\Projet\Developments;
use Avereo\Connect\Developments\SignedMessage;

/** Identity is taken exclusively from the existing signed Projet gate cookie. */
final class SessionAuthorization
{
    public function __construct(private readonly string $ownerId,private readonly string $origin,
        private readonly string $key,private readonly \Closure $transport,private readonly bool $localFixture=false)
    {
        if(!preg_match('/^[1-9][0-9]{0,18}$/D',$ownerId)||strlen($key)<32)throw new Failure(503);
        $u=parse_url($origin);
        if(!is_array($u)||!isset($u['host'])||isset($u['user'])||isset($u['pass'])||isset($u['query'])||isset($u['fragment'])
            ||!in_array($u['path']??'',['','/'],true)||($u['scheme']??'')!=='https'&&!($localFixture&&($u['scheme']??'')==='http'&&$u['host']==='127.0.0.1'))throw new Failure(503);
    }
    public function authorize(array $server,array $cookies,array $gate):array
    {
        $u=parse_url($this->origin);$host=$u['host'].(isset($u['port'])?':'.$u['port']:'');
        $local=$this->localFixture&&in_array($server['REMOTE_ADDR']??'',['127.0.0.1','::1'],true)&&$u['host']==='127.0.0.1';
        if(strtolower($server['HTTP_HOST']??'')!==strtolower($host)
            ||isset($server['HTTP_ORIGIN'])&&$server['HTTP_ORIGIN']!==rtrim($this->origin,'/')
            ||in_array($server['HTTP_SEC_FETCH_SITE']??'',['same-site','cross-site'],true)
            ||!$local&&strtolower((string)($server['HTTPS']??''))!=='on'&&(string)($server['SERVER_PORT']??'')!=='443')throw new Failure(403);
        if(!is_string($gate['connect_launch_secret']??null)||hash_equals($this->key,$gate['connect_launch_secret']))throw new Failure(503);
        try{
            $cookie=$cookies[$gate['connect_gate_cookie']??'']??'';
            if(!is_string($cookie))throw new \RuntimeException();
            $payload=\avereo_gate_decode_signed($cookie,$gate['connect_launch_secret']);
            $this->assertSession($payload,$gate);
        }catch(\Throwable){throw new Failure(401);}
        $identity=$payload['identity']??null;
        if(!is_array($identity)||($identity['provider']??null)!=='avereo_connect'||($identity['id']??null)!==$this->ownerId)throw new Failure(403);
        $nonce=bin2hex(random_bytes(24));$now=time();
        $request=SignedMessage::issue(['v'=>1,'iss'=>'avereo-projet-developments','aud'=>'avereo-connect-developments','type'=>'request',
            'iat'=>$now,'exp'=>$now+30,'nonce'=>$nonce,'connectId'=>$identity['id'],'sessionIssuedAt'=>$payload['iat']],$this->key);
        try{
            $envelope=($this->transport)($request);
            $p=SignedMessage::verify($envelope,$this->key,'avereo-connect-developments','avereo-projet-developments','response',time(),
                ['requestNonce','connectId','active','globalAdmin','scope']);
            if(($p['requestNonce']??null)!==$nonce||($p['connectId']??null)!==$this->ownerId||($p['active']??null)!==true
                ||($p['globalAdmin']??null)!==true||($p['scope']??null)!=='developments:read')throw new \RuntimeException();
            $this->assertSession($payload,$gate);
        }catch(\Throwable){throw new Failure(403);}
        return ['mode'=>$this->localFixture?'project_session_fixture':'project_signed_session_global_role','scope'=>'single_global_administrator',
            'connectRoleVerified'=>!$this->localFixture,'connectSsoVerified'=>!$this->localFixture,'fixture'=>$this->localFixture];
    }
    private function assertSession(array $p,array $gate):void
    {
        if(!is_int($p['iat']??null)||!is_int($p['exp']??null)||$p['exp']<=$p['iat'])throw new \RuntimeException();
        \avereo_gate_assert_payload($p,max(300,min(43200,(int)($gate['connect_gate_session_seconds']??1800))));
        \avereo_gate_assert_account_access($gate,$p);
    }
}
