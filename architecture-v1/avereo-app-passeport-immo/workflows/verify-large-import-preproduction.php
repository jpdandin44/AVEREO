<?php
declare(strict_types=1);
// Private CLI qualification: stream a real ZIP through web PHP without writing live data.
if(PHP_SAPI!=='cli' || $argc!==3 || !in_array($argv[2],['before','after'],true))exit(2);
$work=$argv[1];$phase=$argv[2];$home='/home/daje3540';$origin='https://passeport-immo-preprod.avereo.fr';
if(realpath($work)!==$work || dirname($work)!==$home.'/private' || !str_starts_with(basename($work),'preprod-rapport-passeport-archives-'))exit(2);
$checks=[];
function verify(bool $ok,string $label):void{global $checks;if(!$ok)throw new RuntimeException($label);$checks[]=$label;}
function http(string $url,array $cookies=[],?array $post=null,?string $csrf=null):array{
    global $origin;
    verify(str_starts_with($url,$origin.'/'),'HTTPS restricted to private preproduction');
    $headers=[];$out=[];$curl=curl_init($url);
    if($cookies)$headers[]='Cookie: '.implode('; ',$cookies);
    if($csrf){$headers[]='X-Passeport-CSRF: '.$csrf;$headers[]='Origin: '.$origin;}
    curl_setopt_array($curl,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>15,CURLOPT_TIMEOUT=>600,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_HTTPHEADER=>$headers,CURLOPT_HEADERFUNCTION=>static function($c,$line)use(&$out){$pair=explode(':',$line,2);if(count($pair)===2)$out[strtolower(trim($pair[0]))][]=trim($pair[1]);return strlen($line);}]);
    if($post!==null)curl_setopt($curl,CURLOPT_POSTFIELDS,$post);
    $body=curl_exec($curl);$status=curl_getinfo($curl,CURLINFO_RESPONSE_CODE);$error=curl_errno($curl);curl_close($curl);
    verify($body!==false && $error===0,'real HTTPS transfer completed');return[$status,$out,$body];
}
try{
    $values=require $home.'/private/connect-preprod/config.php';
    foreach($values as$key=>$value)if(is_string($key)&&is_scalar($value))putenv($key.'='.(string)$value);
    require $home.'/connect-preprod.avereo.fr/src/autoload.php';
    $config=Avereo\Connect\Config::fromEnvironment();$repo=new Avereo\Connect\Repository\PdoConnectRepository(Avereo\Connect\Database::connect($config));
    verify($repo->canLaunchApplication(1,'passeport-immo'),'usual account remains entitled');
    $issuer=new Avereo\Connect\Security\AppLaunchTicketIssuer($config);
    [$status,$headers]=http($issuer->issueLocation('passeport-immo',1));verify($status===303,'normal CONNECT launch accepted');
    $cookies=[];foreach($headers['set-cookie']??[]as$value)$cookies[]=explode(';',$value,2)[0];
    [$status,,$body]=http($origin.'/api/session',$cookies);$session=json_decode($body,true,64,JSON_THROW_ON_ERROR);verify($status===200 && is_string($session['csrf']??null),'normal storage session established');
    $private=require $home.'/.avereo/passeport-immo-preprod/config.php';
    $pdo=new PDO($private['storage_dsn'],$private['storage_user'],$private['storage_password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $bien='qualification500_'.bin2hex(random_bytes(12));
    $statement=$pdo->prepare('SELECT COUNT(*) FROM pi_biens WHERE bien_id=?');$statement->execute([$bien]);verify((int)$statement->fetchColumn()===0,'random property is absent for every owner');
    $sizes=$phase==='before'?[26]:[173,500,501];$results=[];
    foreach($sizes as$mb){
        $path=$work.'/fixture-'.$mb.'.zip';verify(is_file($path)&&filesize($path)===$mb*1024*1024,'exact full-size ZIP fixture');
        [$status,,$body]=http($origin.'/api/biens/'.$bien.'/documents',$cookies,['expectedCount'=>'1','category'=>'autres','files[0]'=>new CURLFile($path,'application/zip','qualification.zip')],$session['csrf']);
        $data=json_decode($body,true,64,JSON_THROW_ON_ERROR);
        // File validation and hashing precede the property lookup. An exact 404 here proves
        // complete PHP receipt and acceptance, while guaranteeing no document can be written.
        if($phase==='after'&&$mb<=500)verify($status===404&&($data['error']??null)==='Bien introuvable.','whole '.$mb.' MiB parsed and validated before absent-property guard');
        else verify($status===422,'oversize file refused');
        $results[]=['sizeBytes'=>$mb*1024*1024,'httpStatus'=>$status,'result'=>$status===404?'complete_file_validated_no_write':'refused'];
    }
    $receipt=['observedAt'=>gmdate('c'),'target'=>$origin.'/','phase'=>$phase,'status'=>'passed','checks'=>$checks,'requests'=>$results,'liveRowsChanged'=>false,'documentsCreated'=>0,'phpIniValuesRead'=>false,'effective500MiBReceiptVerified'=>$phase==='after','scope'=>'Actual HTTPS multipart receipt and file validation; no positive document persistence on hosting. Persistence and backup of a whole 173 MiB ZIP are separately qualified in isolated CI.'];
    file_put_contents($work.'/large-http-'.$phase.'-public.json',json_encode($receipt,JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT));chmod($work.'/large-http-'.$phase.'-public.json',0600);
    echo json_encode(['status'=>'passed','phase'=>$phase,'requests'=>$results,'liveRowsChanged'=>false],JSON_THROW_ON_ERROR)."\n";
}catch(Throwable $error){fwrite(STDERR,'Large import recipe failed: '.get_class($error).' '.$error->getMessage()."\n");exit(1);}
