<?php
declare(strict_types=1);
namespace Drupal\Core\Controller { abstract class ControllerBase {} }
namespace Drupal\Core\Site { final class Settings {public static array $values=[];public static function get($key,$default=[]){return self::$values[$key]??$default;}} }
namespace Symfony\Component\HttpFoundation {
    class Request {public object $headers;public function __construct(private string $body,array $headers){$this->headers=new class($headers){public function __construct(private array $h){}public function get($key,$default=''){return $this->h[$key]??$default;}};}public function getContent():string{return $this->body;}}
    class JsonResponse {public function __construct(public array $data,public int $status,public array $headers=[]){} }
}
namespace {
require dirname(__DIR__).'/src/Controller/AccountProvisioningController.php';
require dirname(__DIR__,4).'/backend/src/autoload.php';
use Drupal\avereo_identity_bridge\Controller\AccountProvisioningController;
use Drupal\Core\Site\Settings;
use Symfony\Component\HttpFoundation\Request;
use Avereo\Connect\Identity\IdentityAccountProvisioningClient;
$checks=[];function checkProvision(bool $ok,string $name):void{global $checks;if(!$ok)throw new RuntimeException($name);$checks[]=$name;}
$cache=new class {public array $data=[];public function get($key){return $this->data[$key]??false;}public function set($key,$data,$expiry){$this->data[$key]=(object)['data'=>$data];}};
$userData=new class {public array $data=[];public function get($module,$id,$key){return $this->data[$id][$key]??null;}public function set($module,$id,$key,$value){$this->data[$id][$key]=$value;}};
$storage=new class {
    public array $accounts=[];public array $lastFields=[];
    public function loadByProperties($props){return array_filter($this->accounts,fn($a)=>$a->fields['mail']===$props['mail']);}
    public function create($fields){$this->lastFields=$fields;$id=count($this->accounts)+1;return $this->accounts[$id]=new class($fields,$id){public function __construct(public array $fields,private int $uid){}public function save(){}public function id(){return $this->uid;}public function uuid(){return '12345678-1234-1234-1234-'.str_pad((string)$this->uid,12,'0',STR_PAD_LEFT);}public function isBlocked(){return $this->fields['status']===0;}public function getPassword(){return $this->fields['pass'];}public function getRoles(){return $this->fields['roles']??['authenticated'];}};}
};
$entities=new class($storage){public function __construct(private object $s){}public function getStorage($type){return $this->s;}};
$controller=new AccountProvisioningController($entities,$cache,$userData);$secret=str_repeat('test-only-provision-',3);
Settings::$values=['avereo_identity_bridge'=>['account_provisioning_secret'=>$secret]];
$last=null;
$transport=function($url,$headers,$body) use($controller,&$last){$last=new Request($body,$headers);$r=$controller->provision($last);return ['status'=>$r->status,'body'=>json_encode($r->data)];};
$client=new IdentityAccountProvisioningClient('https://identity.example.invalid/avereo/account/provision',$secret,$transport);
$subject=$client->provision('client@example.invalid','Client test','request-1');
checkProvision(count($storage->accounts)===1,'one blocked identity created');
checkProvision($storage->lastFields['status']===0 && $storage->lastFields['pass']===null && !isset($storage->lastFields['roles']),'no password and no privileged role');
checkProvision($controller->provision($last)->status===403,'same signed request cannot be replayed');
checkProvision($client->provision('client@example.invalid','Client test','retry')===$subject && count($storage->accounts)===1,'retry reuses only own blocked password-free identity');
$storage->accounts[1]->fields['roles']=['authenticated','administrator'];
try{$client->provision('client@example.invalid','Client test','role-collision');throw new RuntimeException('privileged identity accepted');}catch(\Avereo\Connect\Http\ApiException $e){checkProvision($e->status===409,'blocked identity with privileged role is never reused');}
$storage->accounts[1]->fields['roles']=['authenticated'];
$storage->accounts[1]->fields['pass']='existing-test-hash';
try{$client->provision('client@example.invalid','Client test','password-collision');throw new RuntimeException('existing password accepted');}catch(\Avereo\Connect\Http\ApiException $e){checkProvision($e->status===409,'blocked identity with an existing password is never reused');}
$storage->accounts[1]->fields['pass']=null;
$storage->accounts[1]->fields['status']=1;
try{$client->provision('client@example.invalid','Client test','collision');throw new RuntimeException('collision accepted');}catch(\Avereo\Connect\Http\ApiException $e){checkProvision($e->status===409,'existing active identity never linked silently');}
$bad=new Request('{}',['X-AVEREO-Issued-At'=>(string)time(),'X-AVEREO-Nonce'=>str_repeat('x',32),'X-AVEREO-Signature'=>str_repeat('0',64)]);
checkProvision($controller->provision($bad)->status===403,'invalid signature rejected');
$raw=json_encode(['version'=>1,'email'=>'other@example.invalid','displayName'=>'Other','roles'=>['administrator']]);$at=(string)time();$nonce=str_repeat('y',32);
$r=$controller->provision(new Request($raw,['X-AVEREO-Issued-At'=>$at,'X-AVEREO-Nonce'=>$nonce,'X-AVEREO-Signature'=>hash_hmac('sha256',$at."\n".$nonce."\n".hash('sha256',$raw),$secret)]));
checkProvision($r->status===422 && count($storage->accounts)===1,'unknown privilege field causes no creation');
Settings::$values=[];checkProvision($controller->provision($bad)->status===503,'service disabled without private secret');
echo json_encode(['passed'=>count($checks),'checks'=>$checks,'scope'=>'controller and signed client with in-memory Drupal test doubles; no mail'],JSON_UNESCAPED_UNICODE).PHP_EOL;
}
