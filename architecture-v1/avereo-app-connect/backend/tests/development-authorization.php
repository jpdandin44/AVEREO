<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/autoload.php';
require dirname(__DIR__,2).'/integrations/drupal/avereo_identity_bridge/src/Security/DevelopmentRoleAssertion.php';
use Avereo\Connect\Developments\SignedMessage;
use Avereo\Connect\Developments\AuthorizationBroker;
use Avereo\Connect\Developments\PrivateFactory;
use Avereo\Connect\Repository\PdoConnectRepository;
use Drupal\avereo_identity_bridge\Security\DevelopmentRoleAssertion;
use Avereo\Connect\Application;
use Avereo\Connect\Config;
use Avereo\Connect\Http\Request;
use Avereo\Connect\Repository\UnavailableRepository;
use Avereo\Connect\Security\AuthContext;
$count=0;
function ok(bool $value,string $label):void{global $count;if(!$value)throw new RuntimeException($label);$count++;}
function denied(callable $run,string $label):void{try{$run();}catch(Throwable){ok(true,$label);return;}throw new RuntimeException('Expected refusal: '.$label);}
$time=2000000000;$projectKey=str_repeat('P',48);$identityKey=str_repeat('D',48);$seen=[];$roleSeen=[];
$account=['active'=>true,'projectAccess'=>true,'subject'=>'701'];$roles=['active'=>true,'adminRole'=>'administrator','adminRoleIsGlobal'=>true,'hasAdminRole'=>true];
$claim=static function(string $n,int $e)use(&$seen):bool{if(isset($seen[$n]))return false;$seen[$n]=true;return true;};
$roleClaim=static function(string $n,int $e)use(&$roleSeen):bool{if(isset($roleSeen[$n]))return false;$roleSeen[$n]=true;return true;};
$clock=static function()use(&$time):int{return $time;};
$authority=new DevelopmentRoleAssertion($identityKey,'https://identity.fixture.invalid','701',static function($s)use(&$roles){return $roles;},$roleClaim,$clock);
$outage=false;
$broker=new AuthorizationBroker('101',$projectKey,$identityKey,'https://identity.fixture.invalid',static function($id,$at)use(&$account){return $account;},
    static function($e)use($authority,&$outage){if($outage)throw new RuntimeException('offline');return $authority->decide($e);},$claim,$clock);
$request=static function(array $extra=[])use($projectKey,&$time):array{return SignedMessage::issue(array_replace(['v'=>1,'iss'=>'avereo-projet-developments','aud'=>'avereo-connect-developments','type'=>'request','iat'=>$time,'exp'=>$time+30,'nonce'=>bin2hex(random_bytes(24)),'connectId'=>'101','sessionIssuedAt'=>$time-10],$extra),$projectKey);};
$envelope=$request();$reply=$broker->authorize($envelope);
$claims=SignedMessage::verify($reply,$projectKey,'avereo-connect-developments','avereo-projet-developments','response',$time,['requestNonce','connectId','active','globalAdmin','scope']);
ok($claims['globalAdmin']===true&&$claims['connectId']==='101'&&$claims['scope']==='developments:read','owner allowed');
denied(fn()=>$broker->authorize($envelope),'request replay');
foreach([['connectId'=>'102'],['connectId'=>101],['iss'=>'wrong'],['aud'=>'wrong'],['type'=>'response'],['v'=>2],['iat'=>$time+6,'exp'=>$time+36],['iat'=>$time-40,'exp'=>$time-10],['exp'=>$time+31],['sessionIssuedAt'=>null],['sessionIssuedAt'=>$time+6],['globalAdmin'=>true]] as $change)denied(fn()=>$broker->authorize($request($change)),'bad request');
$bad=$request();$bad['signature']=str_repeat('0',64);denied(fn()=>$broker->authorize($bad),'wrong key');
foreach(['active','projectAccess'] as $flag){$account[$flag]=false;denied(fn()=>$broker->authorize($request()),'account or entitlement revoked');$account[$flag]=true;}
$account['subject']='702';denied(fn()=>$broker->authorize($request()),'subject mismatch');$account['subject']='701';
foreach(['active','adminRoleIsGlobal','hasAdminRole'] as $flag){$roles[$flag]=false;denied(fn()=>$broker->authorize($request()),'global role withdrawn');$roles[$flag]=true;}
$roles['adminRole']='';denied(fn()=>$broker->authorize($request()),'admin role missing');$roles['adminRole']='administrator';
$outage=true;denied(fn()=>$broker->authorize($request()),'authority unavailable');$outage=false;
ok($broker->authorize($request())!==[],'fresh decision after restoration, no stale cache');
denied(fn()=>new AuthorizationBroker('101',$projectKey,$projectKey,'issuer',fn()=>[],fn()=>[],$claim),'key separation');

// Role denial remains signed but is not converted into an organization-owner grant.
$roles['hasAdminRole']=false;
$roleRequest=SignedMessage::issue(['v'=>1,'iss'=>'avereo-connect-developments','aud'=>'https://identity.fixture.invalid','type'=>'request','iat'=>$time,'exp'=>$time+30,'nonce'=>bin2hex(random_bytes(24)),'subject'=>'701'],$identityKey);
$negative=SignedMessage::verify($authority->decide($roleRequest),$identityKey,'https://identity.fixture.invalid','avereo-connect-developments','response',$time,['requestNonce','subject','active','globalAdmin','role']);
ok($negative['globalAdmin']===false,'explicit role denial');$roles['hasAdminRole']=true;
denied(fn()=>$authority->decide($roleRequest),'authority request replay');

$config=new Config('local',false,null,'','','test',300,600);
$app=new Application($config,new UnavailableRepository());
$call=static fn($app,$method,$body)=>$app->handle(new Request($method,'/api/v1/developments/authorize',[],[],$body,'fixture-request'),AuthContext::anonymous(),'csrf',static function(){});
ok($call($app,'POST',[])->status===503,'default closed');ok($call($app,'GET',[])->status===405,'read verb is not introspection');
$app=new Application($config,new UnavailableRepository(),developmentAuthorization:$broker);
ok($call($app,'POST',$request())->status===200,'Application dedicated route');
ok($call($app,'POST',['role'=>'global_admin','id'=>'101'])->status===403,'browser role injection');

// Configuration factory only: no database method or network call is executed.
$fixtureRoot=sys_get_temp_dir().'/avereo-development-factory-'.bin2hex(random_bytes(12));
mkdir($fixtureRoot,0700);mkdir($fixtureRoot.'/public',0700);mkdir($fixtureRoot.'/nonces',0700);mkdir($fixtureRoot.'/public/nonces',0700);
$pdoRepository=(new ReflectionClass(PdoConnectRepository::class))->newInstanceWithoutConstructor();
$privateConfig=$fixtureRoot.'/config.php';
$base=['enabled'=>true,'owner_connect_id'=>'101','project_key'=>$projectKey,'identity_key'=>$identityKey,
    'identity_issuer'=>'https://identity.fixture.invalid','identity_url'=>'https://identity.fixture.invalid/avereo/developments/authorization','nonce_directory'=>$fixtureRoot.'/nonces'];
try{
    foreach([
        ['enabled'=>false],['nonce_directory'=>$fixtureRoot.'/public'],['nonce_directory'=>$fixtureRoot.'/public/nonces'],
        ['identity_url'=>'http://identity.fixture.invalid/avereo/developments/authorization'],['identity_url'=>'https://identity.fixture.invalid/wrong'],
        ['identity_key'=>$projectKey],
    ] as $change){file_put_contents($privateConfig,'<?php return '.var_export(array_replace($base,$change),true).';');
        denied(fn()=>PrivateFactory::create($privateConfig,$fixtureRoot.'/public',$pdoRepository),'invalid factory configuration');}
    file_put_contents($privateConfig,'<?php return '.var_export($base,true).';');
    denied(fn()=>PrivateFactory::create($privateConfig,$fixtureRoot.'/public',$pdoRepository,[$projectKey]),'existing secret reuse');
    denied(fn()=>PrivateFactory::create($privateConfig,$fixtureRoot.'/public',new stdClass()),'non PDO repository');
    file_put_contents($fixtureRoot.'/public/config.php','<?php return '.var_export($base,true).';');
    denied(fn()=>PrivateFactory::create($fixtureRoot.'/public/config.php',$fixtureRoot.'/public',$pdoRepository),'public private configuration');
    ok(PrivateFactory::create($privateConfig,$fixtureRoot.'/public',$pdoRepository) instanceof AuthorizationBroker,'private factory prepared, no external call');
}finally{
    unlink($privateConfig);if(is_file($fixtureRoot.'/public/config.php'))unlink($fixtureRoot.'/public/config.php');
    rmdir($fixtureRoot.'/public/nonces');rmdir($fixtureRoot.'/public');rmdir($fixtureRoot.'/nonces');rmdir($fixtureRoot);
}
echo json_encode(['status'=>'passed','assertions'=>$count,'realAccountsUsed'=>false,'remoteCalls'=>false],JSON_PRETTY_PRINT).PHP_EOL;
