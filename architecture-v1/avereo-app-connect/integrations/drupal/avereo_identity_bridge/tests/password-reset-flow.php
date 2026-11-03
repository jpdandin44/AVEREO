<?php
declare(strict_types=1);
namespace Drupal\Core\Controller {abstract class ControllerBase {public function config($name){return new class {public function get($key){return 3600;}};}}}
namespace Drupal\Core\Cache {interface CacheBackendInterface {}}
namespace Drupal\Core\Entity {interface EntityTypeManagerInterface {}}
namespace Drupal\Core\Mail {interface MailManagerInterface {}}
namespace Drupal\Core\Site {class Settings {public static function get($key,$default=null){return $key==='avereo_identity_bridge'?['account_activation_secret'=>str_repeat('fixture-',6),'support_email'=>'support@example.invalid']:'/nonexistent-fixture-config';}}}
namespace Drupal\user {interface UserInterface {}}
namespace Symfony\Component\HttpFoundation {
    class JsonResponse {public function __construct(public array $data,public int $status=200,public array $headers=[]) {}}
    class Request {public object $headers;public function __construct(private string $body,array $headers){$this->headers=new class($headers){public function __construct(private array $h){}public function get($key,$default=''){return $this->h[$key]??$default;}};}public function getContent(){return $this->body;}}
}
namespace {
    define('DRUPAL_ROOT',__DIR__);
    require dirname(__DIR__).'/src/Controller/AccountActivationController.php';
    $checks=[];function resetFlow(bool $v,string $name):void {global $checks;if(!$v)throw new \RuntimeException($name);$checks[]=$name;}
    $cache=new class implements \Drupal\Core\Cache\CacheBackendInterface {
        public array $entries=[];public function get($key){return isset($this->entries[$key])?(object)['data'=>$this->entries[$key]]:false;}
        public function set($key,$value,$expiry){$this->entries[$key]=$value;}
    };
    $account=new class implements \Drupal\user\UserInterface {
        public bool $active=true;public string $password='unchanged-hash';
        public function id(){return 44;}public function uuid(){return 'subject-44';}public function isAnonymous(){return false;}public function isActive(){return $this->active;}
        public function getPassword(){return $this->password;}public function getPreferredLangcode(){return 'fr';}
    };
    $entities=new class($account) implements \Drupal\Core\Entity\EntityTypeManagerInterface {
        public function __construct(public object $account){}public function getStorage($type){return new class($this->account){public function __construct(private object $account){}public function loadByProperties($props){return ($props['mail']??'')==='member@example.invalid'?[$this->account]:[];}};}
    };
    $mail=new class implements \Drupal\Core\Mail\MailManagerInterface {
        public array $calls=[];public bool $success=true;
        public function mail(...$args){$this->calls[]=$args;return ['result'=>$this->success];}
    };
    $data=new class {public bool $initial=false;public function get($module,$id,$key){return $key==='created_by_connect'?$this->initial:false;}};
    $controller=new \Drupal\avereo_identity_bridge\Controller\AccountActivationController($cache,$entities,$mail,$data);
    $payload=['version'=>1,'connectUserId'=>2,'subject'=>'subject-44','email'=>'member@example.invalid','expiresInSeconds'=>86400,'purpose'=>'password_reset'];
    $request=static function(array $p,bool $signed=true){$body=json_encode($p);$at=(string)time();$nonce=rtrim(strtr(base64_encode(random_bytes(24)),'+/','-_'),'=');$sig=hash_hmac('sha256',$at."\n".$nonce."\n".hash('sha256',$body),str_repeat('fixture-',6));return new \Symfony\Component\HttpFoundation\Request($body,['X-AVEREO-Issued-At'=>$at,'X-AVEREO-Nonce'=>$nonce,'X-AVEREO-Signature'=>$signed?$sig:str_repeat('0',64)]);};
    resetFlow($controller->issue($request($payload,false))->status===403,'unsigned reset refused before mail');
    resetFlow($controller->issue($request(array_replace($payload,['purpose'=>'other'])))->status===422,'unknown purpose refused');
    resetFlow($controller->issue($request(array_replace($payload,['subject'=>'another-user'])))->status===403,'subject/email mismatch refused');
    $account->active=false;resetFlow($controller->issue($request($payload))->status===409,'blocked identity cannot be reactivated by reset');$account->active=true;
    $data->initial=true;resetFlow($controller->issue($request($payload))->status===409,'initialization stays in invitation flow');$data->initial=false;
    resetFlow(count($mail->calls)===0,'all refusals avoid mail');
    $req=$request($payload);$response=$controller->issue($req);
    resetFlow($response->status===200 && $response->data===['status'=>'sent','expiresInSeconds'=>3600],'mail success reports Drupal timeout');
    resetFlow($mail->calls[0][0]==='user' && $mail->calls[0][1]==='password_reset' && $mail->calls[0][2]==='member@example.invalid','core password_reset mail selected');
    resetFlow($mail->calls[0][4]['account']===$account && $mail->calls[0][6]===true,'native account token context and delivery requested');
    resetFlow($account->active && $account->password==='unchanged-hash','mail does not mutate activation or password');
    resetFlow($controller->issue($req)->status===403,'signed reset request cannot be replayed');
    resetFlow($controller->issue($request($payload))->status===429 && count($mail->calls)===1,'per-account cooldown blocks repeated delivery');
    resetFlow(count(array_filter(array_keys($cache->entries),static fn($k)=>str_contains($k,'activation_token:') || str_contains($k,'activation_account:')))===0,'reset does not create or invalidate activation tokens');
    unset($cache->entries['avereo_identity_bridge:activation_rate:44']);$mail->success=false;
    resetFlow($controller->issue($request($payload))->status===502,'native mail failure propagated');
    resetFlow($account->password==='unchanged-hash','failed mail preserves password');
    echo json_encode(['passed'=>count($checks),'checks'=>$checks,'realMailSent'=>false,'scope'=>'controller with fake cache/entity/mail; native token redemption remains hosted qualification'],JSON_UNESCAPED_UNICODE),PHP_EOL;
}
