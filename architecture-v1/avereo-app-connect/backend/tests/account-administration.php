<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/autoload.php';
require dirname(__DIR__,3).'/avereo-app-rapport/frontend/public/connect/gate.php';
use Avereo\Connect\Administration\AccountAdministration;
use Avereo\Connect\Administration\TrialPolicyStore;
use Avereo\Connect\Identity\AccountIdentityProvisioner;
use Avereo\Connect\Repository\PdoConnectRepository;
use Avereo\Connect\Http\ApiException;

require_once __DIR__.'/account-administration-fixture.php';
$pdo=accountTestDatabase();
$identity=new class implements AccountIdentityProvisioner {public int $calls=0;public function provision(string $email,string $name,string $request):string{$this->calls++;return $this->calls===1?'12345678-1234-1234-1234-123456789abc':'12345678-1234-1234-1234-'.str_pad((string)$this->calls,12,'0',STR_PAD_LEFT);}};
$path=sys_get_temp_dir().'/avereo-account-policy-'.bin2hex(random_bytes(8)).'.json';file_put_contents($path,'{"version":1,"accounts":{}}');$store=new TrialPolicyStore($path);$service=new AccountAdministration($pdo,$identity,$store);$repo=new PdoConnectRepository($pdo);$checks=[];
function ok(bool $v,string $name):void{global $checks;if(!$v)throw new RuntimeException($name);$checks[]=$name;}
function rejects(callable $fn,int $code,string $name):void{try{$fn();throw new RuntimeException('Expected rejection: '.$name);}catch(ApiException $e){ok($e->status===$code,$name);}}
$body=['email'=>'New@example.invalid','displayName'=>'Client test','applications'=>['rapport','rga'],'startsAt'=>gmdate('Y-m-d\TH:i:s',time()+600).'.000Z','endsAt'=>gmdate('Y-m-d\TH:i:s\Z',time()+3600)];
try {
    rejects(fn()=>$service->create(2,7,$body,'r1'),403,'member cannot provision');
    rejects(fn()=>$service->create(1,99,$body,'r1'),403,'another organization denied');
    ok($identity->calls===0,'authorization checked before identity call');
    foreach([['email'=>'bad'],['displayName'=>[]],['applications'=>['rapport','rapport']],['applications'=>['unknown']],['role'=>'owner'],['startsAt'=>'2030-02-30T12:00:00Z'],['endsAt'=>$body['startsAt']]] as $invalid)
        rejects(fn()=>$service->create(1,7,array_replace($body,$invalid),'invalid'),422,'invalid fields '.count($checks));
    $created=$service->create(1,7,$body,'create');$id=$created['id'];
    ok($created['invitationSent']===false && $created['onboardingStatus']==='required','creation sends no invitation');
    ok($identity->calls===1 && $repo->isExplicitAccount($id),'one identity and explicit whitelist');
    rejects(fn()=>$service->create(1,7,$body,'duplicate'),409,'duplicate rejected without identity duplication');
    ok($identity->calls===1,'duplicate avoids remote side effect');
    ok(!$repo->canLaunchApplication($id,'rapport'),'activation required');
    $service->synchronize($id,fn()=>$pdo->exec("UPDATE users SET onboarding_status='completed' WHERE id=".$id));
    ok(!$repo->canLaunchApplication($id,'rapport'),'trial not available before start');
    $service->updatePeriod(1,7,$id,['startsAt'=>gmdate('Y-m-d\TH:i:s\Z',time()-100),'endsAt'=>$body['endsAt']],'period');
    ok($repo->canLaunchApplication($id,'rapport') && $repo->canLaunchApplication($id,'rga') && !$repo->canLaunchApplication($id,'coupe'),'only selected applications launch');
    ok(array_column($repo->listCatalog($id),'code')===['rapport','rga'],'catalog respects explicit whitelist');
    $orgApps=array_column($repo->listApplications($id,7),'code');sort($orgApps);ok($orgApps===['rapport','rga'],'organization applications respect whitelist');
    ok($repo->canLaunchApplication(1,'coupe'),'legacy inheritance preserved');
    $pdo->exec("INSERT INTO applications(id,code,name,description,display_order,status,launch_url) VALUES(4,'future','Future','',4,'active','https://example.invalid/future'); INSERT INTO entitlements(organization_id,application_id,status,granted_by_user_id) VALUES(7,4,'active',1)");
    ok(!$repo->canLaunchApplication($id,'future') && $repo->canLaunchApplication(1,'future'),'future application denied to explicit account only');
    $before=file_get_contents($path);
    rejects(fn()=>$service->updatePeriod(2,7,$id,['startsAt'=>null,'endsAt'=>null],'intrusion'),403,'unauthorized change denied');
    ok(file_get_contents($path)===$before,'unauthorized request cannot revoke projection');
    rejects(fn()=>$service->updatePeriod(1,7,$id,[],'missing-period'),422,'missing period fields cannot silently remove the trial deadline');
    ok(file_get_contents($path)===$before,'invalid period leaves the current projection intact');
    rejects(fn()=>$service->authorizeApplication(1,7,$id,'coupe','active'),422,'trial cannot expand to unqualified application');
    $key=str_repeat('local-only-',5);$payload=avereo_gate_base64url_encode(json_encode(['v'=>2,'app'=>'rapport','iat'=>time(),'exp'=>time()+600,'nonce'=>str_repeat('a',32),'identity'=>['provider'=>'avereo_connect','id'=>(string)$id]]));
    $_COOKIE['TEST']=$payload.'.'.avereo_gate_base64url_encode(hash_hmac('sha256',$payload,$key,true));
    $config=['connect_gate_cookie'=>'TEST','connect_launch_secret'=>$key,'connect_trial_access_file'=>$path];
    ok(avereo_gate_cookie_is_valid($config),'published policy accepts signed active session');
    $unchanged=$_COOKIE['TEST'];
    $service->synchronize($id,fn()=>$pdo->exec("UPDATE users SET access_starts_at='2020-01-01 00:00:00',access_ends_at='2020-01-02 00:00:00' WHERE id=".$id));
    ok(!$repo->canLaunchApplication($id,'rapport') && $repo->findIdentityStatusByDrupalSubject('12345678-1234-1234-1234-123456789abc')==='expired','expired account refused by CONNECT');
    ok(!avereo_gate_cookie_is_valid($config) && $_COOKIE['TEST']===$unchanged,'expiry denies unchanged existing application cookie');
    ok($repo->canLaunchApplication(1,'rapport'),'other account unaffected by expiry');
    $service->updatePeriod(1,7,$id,['startsAt'=>null,'endsAt'=>null],'permanent');
    ok(avereo_gate_cookie_is_valid($config),'permanent conversion republishes access');
    try{$service->synchronize($id,static function(){throw new RuntimeException('simulated mutation failure');});}catch(RuntimeException){}
    ok(!avereo_gate_cookie_is_valid($config),'failed mutation stays fail-closed');
    $service->updatePeriod(1,7,$id,['startsAt'=>null,'endsAt'=>null],'recover');
    $service->synchronize($id,fn()=>$pdo->exec("UPDATE user_application_access SET status='revoked' WHERE user_id=$id AND application_id=1"));
    ok(!avereo_gate_cookie_is_valid($config) && $repo->canLaunchApplication($id,'rga'),'app revocation preserves other application');
    $savedPolicy=file_get_contents($path);unlink($path);
    $called=false;
    try{$service->synchronize($id,function()use(&$called){$called=true;});}catch(RuntimeException){}
    ok(!$called && !is_file($path),'missing projection is never reset to an incomplete account list');
    file_put_contents($path,$savedPolicy);
    $notify=new class implements \Avereo\Connect\Identity\AccountActivationNotifier {
        public int $calls=0;public function send(int $id,string $subject,string $email,string $name,string $request):array{$this->calls++;return ['status'=>'sent','expiresInSeconds'=>86400];}
    };
    $configObject=new \Avereo\Connect\Config('test',true,null,'','','ACCOUNT_TEST',1800,43200);
    $app=new \Avereo\Connect\Application($configObject,$repo,null,null,$notify,null,$service);
    $owner=new \Avereo\Connect\Security\AuthContext(1,time(),'owner');
    $member=new \Avereo\Connect\Security\AuthContext(2,time(),'member');
    $route=static fn($method,$path,$body,$csrf=true)=>new \Avereo\Connect\Http\Request($method,$path,$csrf?['x-csrf-token'=>'local-csrf']:[],[],$body,'api-test');
    $url='/api/v1/admin/organizations/7/accounts';$fresh=array_replace($body,['email'=>'second@example.invalid']);
    ok($app->handle($route('POST',$url,$fresh,false),$owner,'local-csrf',static fn()=>null)->status===403,'creation API requires CSRF');
    ok($app->handle($route('POST',$url,$fresh),$member,'local-csrf',static fn()=>null)->status===403,'creation API refuses a member');
    $response=$app->handle($route('POST',$url,$fresh),$owner,'local-csrf',static fn()=>null);
    ok($response->status===201 && $notify->calls===0,'creation API returns prepared account without notification');
    $apiId=$response->payload['data']['id'];
    $response=$app->handle($route('POST',"/api/v1/admin/organizations/7/users/$apiId/activation-email",[]),$owner,'local-csrf',static fn()=>null);
    ok($response->status===200 && $response->payload['data']['status']==='sent' && $notify->calls===1,'separate invitation API invokes transport only on request');
    echo json_encode(['passed'=>count($checks),'checks'=>$checks,'database'=>getenv('ACCOUNT_ADMIN_MYSQL_TEMPORARY')==='true'?'MySQL isolated temporary tables':'SQLite local only; MySQL migration qualification separate'],JSON_UNESCAPED_UNICODE).PHP_EOL;
} finally {foreach([$path,$path.'.lock'] as $f)if(is_file($f))unlink($f);}
