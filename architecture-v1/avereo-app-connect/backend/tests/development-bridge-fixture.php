<?php
declare(strict_types=1);
// CLI fixture only, never deployed; no accounts, database, real configuration or network.
if(PHP_SAPI!=='cli'||getenv('DEVELOPMENTS_FIXTURE')!=='1')exit(2);
require dirname(__DIR__).'/src/autoload.php';
require dirname(__DIR__,2).'/integrations/drupal/avereo_identity_bridge/src/Security/DevelopmentRoleAssertion.php';
use Avereo\Connect\Developments\AuthorizationBroker;
use Drupal\avereo_identity_bridge\Security\DevelopmentRoleAssertion;
$key=(string)getenv('DEVELOPMENTS_FIXTURE_KEY');$identityKey=str_repeat('I',48);$seen=[];$roleSeen=[];
$claim=static function(string $n,int $e)use(&$seen):bool{if(isset($seen[$n]))return false;$seen[$n]=true;return true;};
$roleClaim=static function(string $n,int $e)use(&$roleSeen):bool{if(isset($roleSeen[$n]))return false;$roleSeen[$n]=true;return true;};
$authority=new DevelopmentRoleAssertion($identityKey,'https://identity.fixture.invalid','701',
    static fn(string $s)=>['active'=>true,'adminRole'=>'administrator','adminRoleIsGlobal'=>true,'hasAdminRole'=>true],$roleClaim);
$broker=new AuthorizationBroker('101',$key,$identityKey,'https://identity.fixture.invalid',
    static fn(string $id,int $at)=>['active'=>true,'projectAccess'=>true,'subject'=>'701'],static fn(array $e)=>$authority->decide($e),$claim);
try{$input=json_decode(stream_get_contents(STDIN,16385),true,16,JSON_THROW_ON_ERROR);echo json_encode(['data'=>$broker->authorize($input)],JSON_THROW_ON_ERROR);}
catch(Throwable){echo '{"error":"refused"}';exit(3);}
