<?php
declare(strict_types=1);
// Isolated local fixture only. This file is NEVER packaged or installed.
if(PHP_SAPI!=='cli-server'||!in_array($_SERVER['REMOTE_ADDR']??'',['127.0.0.1','::1'],true)){http_response_code(403);exit;}
const AVEREO_GATE_APP='projet';
require dirname(__DIR__).'/frontend/public/connect/gate.php';
require dirname(__DIR__,2).'/avereo-app-connect/backend/src/autoload.php';
foreach(['Failure','SessionAuthorization','SnapshotReader','Runtime'] as $n)require dirname(__DIR__).'/backend/developments/'.$n.'.php';
use Avereo\Projet\Developments\{Failure,SessionAuthorization,SnapshotReader,Runtime};
use Avereo\Connect\Developments\SignedMessage;
$c=json_decode((string)file_get_contents((string)getenv('PROJET_SESSION_FIXTURE_CONFIG')),true,16,JSON_THROW_ON_ERROR);
$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);$origin='http://127.0.0.1:'.$c['port'];$gate=['connect_launch_secret'=>str_repeat('G',48),'connect_gate_cookie'=>'AVEREO_PROJET_FIXTURE','connect_gate_session_seconds'=>1800,'connect_trial_access_file'=>''];
header('Cache-Control: no-store, private');header('X-Content-Type-Options: nosniff');header('Referrer-Policy: no-referrer');
if($path==='/fixture-login'){
 $p=avereo_gate_base64url_encode(json_encode(['v'=>1,'app'=>'projet','iat'=>time(),'exp'=>time()+1800,'nonce'=>str_repeat('n',32),'identity'=>['provider'=>'avereo_connect','id'=>'101']],JSON_THROW_ON_ERROR));
 setcookie($gate['connect_gate_cookie'],$p.'.'.avereo_gate_base64url_encode(hash_hmac('sha256',$p,$gate['connect_launch_secret'],true)),['httponly'=>true,'samesite'=>'Strict','path'=>'/']);
 header('Location: /developpements/',true,303);exit;
}
if($path==='/'){
 header('Content-Type: text/html; charset=utf-8');echo '<!doctype html><html lang="fr"><meta charset="utf-8"><title>Recette fictive Projet</title><h1>Recette locale du module privé</h1><p>Identité et suivis fictifs uniquement. Aucune session réelle raccordée.</p><a href="/fixture-login">Ouvrir la recette fictive</a></html>';exit;
}
if($path==='/developpements/module-link.js'){header('Content-Type: text/javascript');readfile(dirname(__DIR__).'/backend/developments/public/module-link.js');exit;}
try{
 $key=str_repeat('P',48);
 $transport=static function(array $e)use($key,$c):array{
  $p=SignedMessage::verify($e,$key,'avereo-projet-developments','avereo-connect-developments','request',time(),['connectId','sessionIssuedAt']);
  if(!empty($c['roleFile'])){$role=json_decode((string)file_get_contents($c['roleFile']),true);if(($role['allowed']??null)!==true)throw new Failure(403);}
  return SignedMessage::issue(['v'=>1,'iss'=>'avereo-connect-developments','aud'=>'avereo-projet-developments','type'=>'response','iat'=>time(),'exp'=>time()+30,'nonce'=>bin2hex(random_bytes(24)),'requestNonce'=>$p['nonce'],'connectId'=>'101','active'=>true,'globalAdmin'=>true,'scope'=>'developments:read'],$key);
 };
 $runtime=new Runtime(new SessionAuthorization('101',$origin,$key,$transport,true),$gate,static fn()=>new SnapshotReader($c['storage'],$c['publicationKey']),$c['assets']);
 $route=$path==='/developpements/'?'index':($_GET['route']??'unknown');
 $r=$runtime->dispatch(is_string($route)?$route:'unknown',$_SERVER,$_COOKIE,$_GET);
 header('Content-Type: '.$r['type']);if(isset($r['name']))header('Content-Disposition: '.(!empty($r['attachment'])?'attachment':'inline').'; filename="'.$r['name'].'"');
 echo $r['body'];
}catch(Throwable $e){http_response_code($e instanceof Failure?$e->status:503);header('Content-Type: application/json');echo '{"error":"Espace privé indisponible."}';}
