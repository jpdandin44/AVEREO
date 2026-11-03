<?php
declare(strict_types=1);
namespace Drupal\avereo_identity_bridge\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Site\Settings;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/** Creates a blocked, password-free identity; never sends an email. */
final class AccountProvisioningController extends ControllerBase
{
    public function __construct(private readonly object $entities,private readonly object $cache,private readonly object $userData){}
    public static function create(ContainerInterface $container):self
    {
        return new self($container->get('entity_type.manager'),$container->get('cache.data'),$container->get('user.data'));
    }
    public function provision(Request $request):JsonResponse
    {
        $config=Settings::get('avereo_identity_bridge',[]);
        $secret=(string)($config['account_provisioning_secret']??'');
        $raw=$request->getContent();$at=(string)$request->headers->get('X-AVEREO-Issued-At','');
        $nonce=(string)$request->headers->get('X-AVEREO-Nonce','');$sig=(string)$request->headers->get('X-AVEREO-Signature','');
        if(strlen($secret)<32)return $this->answer(['error'=>'PROVISIONING_NOT_CONFIGURED'],503);
        if(strlen($raw)>4096 || !ctype_digit($at) || abs(time()-(int)$at)>120 || !preg_match('/^[A-Za-z0-9_-]{24,128}$/',$nonce)
            || !hash_equals(hash_hmac('sha256',$at."\n".$nonce."\n".hash('sha256',$raw),$secret),$sig))return $this->answer(['error'=>'PROVISIONING_REQUEST_INVALID'],403);
        $replay='avereo_identity_bridge:provision_request:'.hash('sha256',$nonce);
        if($this->cache->get($replay)!==false)return $this->answer(['error'=>'PROVISIONING_REQUEST_REPLAYED'],403);
        $this->cache->set($replay,true,time()+120);
        try {$p=json_decode($raw,true,8,JSON_THROW_ON_ERROR);}catch(\Throwable){return $this->answer(['error'=>'PROVISIONING_INPUT_INVALID'],422);}
        if(!is_array($p) || array_diff(array_keys($p),['version','email','displayName','requestId'])!==[] || ($p['version']??null)!==1
            || !is_string($p['email']??null) || !is_string($p['displayName']??null)
            || (isset($p['requestId']) && (!is_string($p['requestId']) || strlen($p['requestId'])>128)))return $this->answer(['error'=>'PROVISIONING_INPUT_INVALID'],422);
        $email=strtolower(trim($p['email']));$name=trim($p['displayName']);
        if(!filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($email)>254 || $name==='' || strlen($name)>191)return $this->answer(['error'=>'PROVISIONING_INPUT_INVALID'],422);
        $storage=$this->entities->getStorage('user');$accounts=$storage->loadByProperties(['mail'=>$email]);
        if($accounts!==[]) {
            $account=reset($accounts);
            if(count($accounts)!==1 || !$account->isBlocked() || trim((string)$account->getPassword())!==''
                || array_diff($account->getRoles(),['authenticated'])!==[]
                || !in_array($this->userData->get('avereo_identity_bridge',$account->id(),'created_by_connect'), [true, 1, '1'], true))return $this->answer(['error'=>'IDENTITY_EXISTS'],409);
        } else {
            $account=$storage->create(['name'=>'avereo-invite-'.substr(hash('sha256',$email),0,24),'mail'=>$email,
                'status'=>0,'pass'=>null,'langcode'=>'fr','preferred_langcode'=>'fr']);
            $account->save();
            $this->userData->set('avereo_identity_bridge',$account->id(),'created_by_connect',true);
        }
        return $this->answer(['status'=>'prepared','subject'=>$account->uuid()],200);
    }
    private function answer(array $data,int $status):JsonResponse
    {
        return new JsonResponse($data,$status,['Cache-Control'=>'no-store']);
    }
}
