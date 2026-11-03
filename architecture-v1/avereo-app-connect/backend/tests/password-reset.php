<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/autoload.php';
require __DIR__.'/account-administration-fixture.php';
use Avereo\Connect\Application;
use Avereo\Connect\Config;
use Avereo\Connect\Http\Request;
use Avereo\Connect\Identity\AccountPasswordResetNotifier;
use Avereo\Connect\Identity\IdentityAccountActivationClient;
use Avereo\Connect\Repository\PdoConnectRepository;
use Avereo\Connect\Security\AuthContext;

$checks=[];
function checkReset(bool $value,string $name):void {global $checks;if(!$value)throw new RuntimeException($name);$checks[]=$name;}
$pdo=accountTestDatabase();$repo=new PdoConnectRepository($pdo);
$notifier=new class implements AccountPasswordResetNotifier {
    public array $calls=[];public bool $fail=false;
    public function sendPasswordReset(int $id,string $subject,string $email,string $name,string $request):array {
        $this->calls[]=[$id,$subject,$email,$name];if($this->fail)throw new RuntimeException('Fixture transport failure');
        return ['status'=>'sent','expiresInSeconds'=>3600];
    }
};
$config=new Config('test',true,null,'','','RESET_TEST',1800,43200);
$app=new Application($config,$repo,passwordReset:$notifier);
$owner=new AuthContext(1,time(),'owner');$member=new AuthContext(2,time(),'member');
$route=static fn(int $target=2,array $body=[],bool $csrf=true,int $org=7)=>new Request('POST',"/api/v1/admin/organizations/$org/users/$target/password-reset-email",$csrf?['x-csrf-token'=>'reset-csrf']:[],[],$body,'reset-test');
$run=static fn($request,$actor=null)=>$app->handle($request,$actor??$owner,'reset-csrf',static fn()=>null);
$before=$pdo->query('SELECT * FROM users ORDER BY id')->fetchAll();
checkReset($run($route(),new AuthContext(null))->status===401,'anonymous refused');
checkReset($run($route(),$member)->status===403,'member cannot reset another account');
checkReset($run($route(csrf:false))->status===403,'CSRF required');
checkReset($run($route(body:['email'=>'other@example.invalid']))->status===422,'recipient override refused');
checkReset($run($route(org:8))->status===403,'other organization refused');
checkReset($run($route(999))->status===404,'unknown target refused');
checkReset(count($notifier->calls)===0,'refusals never invoke mail');
$snapshot=$repo->getAccountAdministration(1,7);
checkReset(count(array_filter($snapshot['users'],static fn($u)=>$u['canSendPasswordResetEmail']))===2,'completed active accounts expose reset button');
$result=$run($route());
checkReset($result->status===200 && $result->payload['data']['status']==='sent' && $result->payload['data']['expiresInSeconds']===3600,'success reports native expiry');
checkReset($notifier->calls===[[2,'member','member@example.invalid','Member']],'recipient comes only from repository');
checkReset($pdo->query('SELECT * FROM users ORDER BY id')->fetchAll()===$before,'success preserves account state, invitation date and trial dates');
checkReset((int)$pdo->query("SELECT COUNT(*) FROM audit_events WHERE action='identity.password_reset_email' AND outcome='success'")->fetchColumn()===1,'success audited once');
$notifier->fail=true;$result=$run($route());
checkReset($result->payload['data']['status']==='failed','transport failure never reported sent');
checkReset((int)$pdo->query("SELECT COUNT(*) FROM audit_events WHERE action='identity.password_reset_email' AND outcome='failure'")->fetchColumn()===1,'failure audited once');
checkReset($pdo->query('SELECT * FROM users ORDER BY id')->fetchAll()===$before,'failure preserves account state');
$pdo->exec("UPDATE users SET status='suspended' WHERE id=2");
checkReset($run($route())->status===404,'suspended account refused');
checkReset(!array_values(array_filter($repo->getAccountAdministration(1,7)['users'],static fn($u)=>$u['id']==2))[0]['canSendPasswordResetEmail'],'suspended account hides reset button');
$pdo->exec("UPDATE users SET status='active',onboarding_status='sent' WHERE id=2");
checkReset($run($route())->status===409,'initial activation remains separate');
$pdo->exec("UPDATE users SET onboarding_status='completed' WHERE id=2; UPDATE memberships SET status='suspended' WHERE user_id=2");
checkReset($run($route())->status===404,'inactive membership refused');
$pdo->exec("UPDATE memberships SET status='active',role='admin' WHERE user_id=2");
checkReset($run($route(1),$member)->status===403,'administrator cannot reset owner');
checkReset(!array_values(array_filter($repo->getAccountAdministration(2,7)['users'],static fn($u)=>$u['id']==1))[0]['canSendPasswordResetEmail'],'administrator UI protects owner');
$pdo->exec("UPDATE users SET onboarding_status='required' WHERE id=1");
$uninitialized=$run($route());
checkReset($uninitialized->status===503 && $uninitialized->payload['error']['code']==='CONNECT_ACCOUNT_NOT_PROVISIONED','uninitialized actor refused by existing CONNECT gate');
$pdo->exec("UPDATE users SET onboarding_status='completed' WHERE id=1");
$unconfigured=new Application($config,$repo);
checkReset($unconfigured->handle($route(),$owner,'reset-csrf',static fn()=>null)->payload['data']['status']==='not_configured','missing transport never claims delivery');

$captured=null;$secret=str_repeat('test-only-',5);
$client=new IdentityAccountActivationClient('https://identity.example.invalid/activation',$secret,'contact@example.invalid',static function($endpoint,$headers,$body)use(&$captured,$secret){
    $captured=json_decode($body,true);$expected=hash_hmac('sha256',$headers['X-AVEREO-Issued-At']."\n".$headers['X-AVEREO-Nonce']."\n".hash('sha256',$body),$secret);
    checkReset(hash_equals($expected,$headers['X-AVEREO-Signature']),'reset purpose covered by HMAC');
    return ['status'=>200,'body'=>'{"status":"sent","expiresInSeconds":3600}'];
});
checkReset($client->sendPasswordReset(2,'member','member@example.invalid','Member','reset-test')['expiresInSeconds']===3600,'signed client accepts native timeout');
checkReset($captured['purpose']==='password_reset' && !isset($captured['password']),'signed request selects reset without a password');
echo json_encode(['passed'=>count($checks),'checks'=>$checks,'mailSent'=>false,'database'=>getenv('ACCOUNT_ADMIN_MYSQL_TEMPORARY')==='true'?'temporary MySQL fixture':'isolated SQLite fixture'],JSON_UNESCAPED_UNICODE),PHP_EOL;
