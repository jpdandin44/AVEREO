<?php
declare(strict_types=1);
namespace Drupal\Core\Controller { class ControllerBase {} }
namespace Drupal\Core\Site { final class Settings { public static array $value=[];public static function get($key,$default=[]){return self::$value;} } }
namespace Symfony\Component\DependencyInjection { interface ContainerInterface {} }
namespace Symfony\Component\HttpFoundation {
    class Request {public function __construct(private string $body){}public function getContent(){return $this->body;}public function getContentTypeFormat(){return 'json';}}
    class JsonResponse {public function __construct(public array $data,public int $status,public array $headers){}}
}
namespace {
require dirname(__DIR__).'/src/Security/DevelopmentRoleAssertion.php';
require dirname(__DIR__).'/src/Controller/DevelopmentAuthorizationController.php';
require dirname(__DIR__,4).'/backend/src/autoload.php';
use Drupal\Core\Site\Settings;
use Symfony\Component\HttpFoundation\Request;
use Drupal\avereo_identity_bridge\Controller\DevelopmentAuthorizationController;
use Avereo\Connect\Developments\SignedMessage;
$checks=0;function verify($condition,$message){global $checks;if(!$condition)throw new RuntimeException($message);$checks++;}
final class UserFixture {public bool $active=true,$assigned=true;public function isActive(){return $this->active;}public function getRoles(){return $this->assigned?['authenticated','administrator']:['authenticated'];}public function hasRole($id){return $this->assigned&&$id==='administrator';}}
final class RoleFixture {public bool $global=true;public function id(){return 'administrator';}public function isAdmin(){return $this->global;}}
final class StoreFixture {public int $resets=0;public function __construct(public object $entity){}public function resetCache($ids){$this->resets++;}public function load($id){return $this->entity;}public function loadMultiple($ids){return in_array('administrator',$ids,true)?['administrator'=>$this->entity]:[];}}
final class EntitiesFixture {public function __construct(public object $users,public object $roles){}public function getStorage($type){return $type==='user'?$this->users:$this->roles;}}
final class ConfigFixture {public string $role='administrator';public int $resets=0;public function reset($name){$this->resets++;}public function get($key){return $key==='user.settings'?$this:$this->role;}}
final class CacheFixture {public array $data=[];public function get($id){return $this->data[$id]??false;}public function set($id,$value,$expires){$this->data[$id]=$value;}}
final class LockFixture {public bool $available=true;public function acquire($id,$timeout){return $this->available;}public function release($id){}}
$user=new UserFixture();$role=new RoleFixture();$users=new StoreFixture($user);$roles=new StoreFixture($role);$config=new ConfigFixture();$cache=new CacheFixture();$lock=new LockFixture();
$controller=new DevelopmentAuthorizationController(new EntitiesFixture($users,$roles),$config,$cache,$lock);
$key=str_repeat('D',48);$issuer='https://identity.fixture.invalid';
$request=static function(array $changes=[])use($key,$issuer):Request{$now=time();$p=array_replace(['v'=>1,'iss'=>'avereo-connect-developments','aud'=>$issuer,'type'=>'request','iat'=>$now,'exp'=>$now+30,'nonce'=>bin2hex(random_bytes(24)),'subject'=>'701'],$changes);return new Request(json_encode(SignedMessage::issue($p,$key)));};
verify($controller->authorize($request())->status===503,'closed default');
Settings::$value=['enabled'=>true,'secret'=>$key,'issuer'=>$issuer,'owner_subject'=>'701'];
$r=$controller->authorize($request());verify($r->status===200,'controller valid');
$decode=static fn($r)=>json_decode(base64_decode(strtr($r->data['payload'],'-_','+/')),true);
verify($decode($r)['globalAdmin']===true,'real role sources consulted');verify($users->resets>0&&$roles->resets>0&&$config->resets===0,'entity caches invalidated without obsolete configuration');
$user->assigned=false;verify($decode($controller->authorize($request()))['globalAdmin']===false,'role removal immediate');$user->assigned=true;
$role->global=false;verify($decode($controller->authorize($request()))['globalAdmin']===false,'role definition changed');$role->global=true;
$user->active=false;verify($decode($controller->authorize($request()))['active']===false,'blocked account');$user->active=true;
$config->role='';verify($decode($controller->authorize($request()))['globalAdmin']===true,'Drupal 11 works without obsolete admin_role setting');
$user->assigned=false;verify($decode($controller->authorize($request()))['globalAdmin']===false,'unassigned global role does not grant access');$user->assigned=true;
verify($controller->authorize($request(['subject'=>'702']))->status===403,'other global administrator');
$replay=$request();verify($controller->authorize($replay)->status===200,'first nonce');verify($controller->authorize($replay)->status===403,'replayed nonce');
$lock->available=false;verify($controller->authorize($request())->status===403,'lock unavailable');
verify($controller->authorize(new Request('{bad'))->status===403,'invalid json');
verify(($r->headers['Cache-Control']??null)==='no-store, private','private responses');
echo json_encode(['status'=>'passed','assertions'=>$checks,'type'=>'Drupal controller with service doubles, not a Drupal kernel or hosted recipe'],JSON_PRETTY_PRINT).PHP_EOL;
}
