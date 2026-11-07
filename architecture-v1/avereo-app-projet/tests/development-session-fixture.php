<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
const AVEREO_GATE_APP='projet';
require dirname(__DIR__).'/frontend/public/connect/gate.php';
require dirname(__DIR__,2).'/avereo-app-connect/backend/src/autoload.php';
require dirname(__DIR__,2).'/avereo-app-connect/integrations/drupal/avereo_identity_bridge/src/Security/DevelopmentRoleAssertion.php';
foreach(['Failure','SessionAuthorization','SnapshotReader','Runtime','Factory'] as $name)require dirname(__DIR__).'/backend/developments/'.$name.'.php';
use Avereo\Projet\Developments\{Failure,SessionAuthorization,SnapshotReader,Runtime};
use Avereo\Connect\Developments\{SignedMessage,AuthorizationBroker};
use Drupal\avereo_identity_bridge\Security\DevelopmentRoleAssertion;
$in=json_decode(stream_get_contents(STDIN),true,32,JSON_THROW_ON_ERROR);
$key=str_repeat('P',48);$identityKey=str_repeat('D',48);$gateSecret=str_repeat('G',48);
$gate=['connect_launch_secret'=>$gateSecret,'connect_gate_cookie'=>'AVEREO_PROJET_GATE','connect_gate_session_seconds'=>1800,'connect_trial_access_file'=>$in['policyFile']??''];
$origin=empty($in['strictMode'])?'http://127.0.0.1:5202':'https://projet-preprod.avereo.fr';$server=['HTTP_HOST'=>empty($in['strictMode'])?'127.0.0.1:5202':'projet-preprod.avereo.fr','REMOTE_ADDR'=>'127.0.0.1','REQUEST_METHOD'=>'GET',...($in['server']??[])];$_SERVER=$server;
$p=['v'=>1,'app'=>'projet','iat'=>time()-5,'exp'=>time()+1700,'nonce'=>str_repeat('n',32),'identity'=>['provider'=>'avereo_connect','id'=>'101'],...($in['payload']??[])];
$encoded=avereo_gate_base64url_encode(json_encode($p,JSON_THROW_ON_ERROR));$cookie=$encoded.'.'.avereo_gate_base64url_encode(hash_hmac('sha256',$encoded,$gateSecret,true));
if(!empty($in['tamper']))$cookie.='x';
$cookies=empty($in['anonymous'])?['AVEREO_PROJET_GATE'=>$cookie]:[];
$transportCalls=0;$readerCalls=0;$seen=[];$roleSeen=[];
$claim=static function($n,$e)use(&$seen){if(isset($seen[$n]))return false;return $seen[$n]=true;};
$roleClaim=static function($n,$e)use(&$roleSeen){if(isset($roleSeen[$n]))return false;return $roleSeen[$n]=true;};
$authority=new DevelopmentRoleAssertion($identityKey,'https://identity.fixture.invalid','701',
    static fn($subject)=>['active'=>($in['drupalActive']??true),'adminRole'=>'administrator','adminRoleIsGlobal'=>($in['roleIsGlobal']??true),'hasAdminRole'=>($in['hasGlobalRole']??true)],$roleClaim);
$broker=new AuthorizationBroker('101',$key,$identityKey,'https://identity.fixture.invalid',
    static fn($id,$at)=>['active'=>($in['accountActive']??true),'projectAccess'=>($in['projectAccess']??true),'subject'=>'701'],
    static fn($request)=>$authority->decide($request),$claim);
$transport=static function($request)use($broker,$in,&$transportCalls,$key):array{
    $transportCalls++;
    if(!empty($in['outage']))throw new RuntimeException();
    $reply=$broker->authorize($request);
    if(!empty($in['wrongReply'])){$payload=SignedMessage::verify($reply,$key,'avereo-connect-developments','avereo-projet-developments','response',time(),['requestNonce','connectId','active','globalAdmin','scope']);$payload['requestNonce']=str_repeat('0',48);$reply=SignedMessage::issue($payload,$key);}
    return $reply;
};
try{
    if(($in['action']??'')==='factory'){
        Avereo\Projet\Developments\Factory::create($in['config'],$gate,$in['public']);
        $result=['body'=>'configuration fixture accepted','type'=>'text/plain'];
    }elseif(($in['action']??'')==='reader'){
        $reader=new SnapshotReader($in['storage'],$in['publicationKey']);
        $result=($in['route']??'state')==='proof'?$reader->proof('demo-formulaire','demo-parcours'):['body'=>json_encode($reader->state(),JSON_THROW_ON_ERROR),'type'=>'application/json'];
    }else{
        $auth=new SessionAuthorization('101',$origin,$key,$transport,empty($in['strictMode']));
        $runtime=new Runtime($auth,$gate,static function()use($in,&$readerCalls){$readerCalls++;return new SnapshotReader($in['storage'],$in['publicationKey']);},$in['assets']);
        $result=$runtime->dispatch($in['route']??'state',$server,$cookies,$in['query']??[]);
    }
    echo json_encode(['status'=>200,'result'=>$result,'transportCalls'=>$transportCalls,'readerCalls'=>$readerCalls],JSON_THROW_ON_ERROR|JSON_INVALID_UTF8_SUBSTITUTE);
}catch(Throwable $e){echo json_encode(['status'=>$e instanceof Failure?$e->status:503,'error'=>'Espace privé indisponible.','transportCalls'=>$transportCalls,'readerCalls'=>$readerCalls],JSON_THROW_ON_ERROR);}
