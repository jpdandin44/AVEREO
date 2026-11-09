<?php
declare(strict_types=1);
namespace Drupal\avereo_identity_bridge\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Site\Settings;
use Drupal\avereo_identity_bridge\Security\DevelopmentRoleAssertion;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class DevelopmentAuthorizationController extends ControllerBase
{
    public function __construct(private readonly object $entities,private readonly object $configs,private readonly object $cache,private readonly object $lock){}
    public static function create(ContainerInterface $c):self{return new self($c->get('entity_type.manager'),$c->get('config.factory'),$c->get('cache.data'),$c->get('lock')) ;}
    public function authorize(Request $request):JsonResponse
    {
        $headers=['Cache-Control'=>'no-store, private','X-Content-Type-Options'=>'nosniff'];
        $c=Settings::get('avereo_developments_authority',[]);
        if(!is_array($c)||($c['enabled']??false)!==true)return new JsonResponse(['error'=>'AUTHORITY_NOT_CONFIGURED'],503,$headers);
        try {
            if(strlen($request->getContent())>16384 || $request->getContentTypeFormat()!=='json')throw new \RuntimeException();
            $lookup=function(string $subject):array {
                $users=$this->entities->getStorage('user');$users->resetCache([$subject]);$u=$users->load($subject);
                $roleIds=$u!==null?$u->getRoles():[];
                $roles=$this->entities->getStorage('user_role');$roles->resetCache($roleIds);
                $roleId='';
                foreach($roles->loadMultiple($roleIds) as $role) {
                    if(in_array($role->id(),$roleIds,true)&&$role->isAdmin()&&$u->hasRole($role->id())){$roleId=$role->id();break;}
                }
                return ['active'=>$u!==null && $u->isActive(),'adminRole'=>$roleId,'adminRoleIsGlobal'=>$roleId!=='',
                    'hasAdminRole'=>$roleId!==''];
            };
            $claim=function(string $nonce,int $expires):bool {
                $id='avereo_developments:'.hash('sha256',$nonce);
                if(!$this->lock->acquire($id,5))return false;
                try{if($this->cache->get($id)!==false)return false;$this->cache->set($id,true,$expires);return true;}
                finally{$this->lock->release($id);}
            };
            $authority=new DevelopmentRoleAssertion((string)($c['secret']??''),(string)($c['issuer']??''),(string)($c['owner_subject']??''),$lookup,$claim);
            return new JsonResponse($authority->decide(json_decode($request->getContent(),true,12,JSON_THROW_ON_ERROR)),200,$headers);
        }catch(\Throwable){return new JsonResponse(['error'=>'AUTHORIZATION_REFUSED'],403,$headers);}
    }
}
