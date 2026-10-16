<?php
declare(strict_types=1);
// Completes independent checks after a rights discrepancy; never clears it.
if(PHP_SAPI!=='cli'||$argc!==2)exit(2);
umask(0077);$work=$argv[1];$checks=[];
function check(bool $ok,string $label):void{global $checks;if(!$ok)throw new RuntimeException($label);$checks[]=$label;}
function request(string $path,string $jar):int{
    $curl=curl_init('https://passeport-immo-preprod.avereo.fr'.$path);
    curl_setopt_array($curl,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_COOKIEJAR=>$jar,CURLOPT_COOKIEFILE=>$jar,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_TIMEOUT=>30]);
    $body=curl_exec($curl);$status=curl_getinfo($curl,CURLINFO_RESPONSE_CODE);$error=curl_errno($curl);curl_close($curl);
    check($error===0&&is_string($body),'TLS request completed');return $status;
}
try{
    check(str_starts_with($work,'/home/daje3540/private/preprod-rapport-passeport-')&&realpath($work)===$work,'Private work directory');
    $failed=json_decode(file_get_contents($work.'/http-failure.json'),true,512,JSON_THROW_ON_ERROR);
    check($failed['check']==='Other existing accounts remain without Passeport access','Expected unresolved rights observation retained');
    check(!file_exists($work.'/http-completion.json'),'Fresh completion receipt');
    $cfg=require '/home/daje3540/private/connect-preprod/config.php';
    foreach($cfg as $key=>$value)if(is_scalar($value))putenv($key.'='.(is_bool($value)?($value?'true':'false'):(string)$value));
    require '/home/daje3540/connect-preprod.avereo.fr/src/autoload.php';
    $config=Avereo\Connect\Config::fromEnvironment();$repository=new Avereo\Connect\Repository\PdoConnectRepository(Avereo\Connect\Database::connect($config));
    $access=[];foreach([1,2,3] as $id)$access[]=['internalAccountId'=>$id,'passeportLaunchAllowed'=>$repository->canLaunchApplication($id,'passeport-immo')];
    foreach(['passeport-immo-recipe-cookie.txt','passeport-second-cookie.txt'] as $file){
        $jar=$work.'/'.$file;check(request('/api/workspace',$jar)===200,'Existing technical session valid before logout');
        check(request('/connect/logout.php',$jar)===303,'Passeport logout accepted');
        check(request('/api/workspace',$jar)===401,'Passeport API denied after logout');
    }
    $cfg=require '/home/daje3540/.avereo/rapport-preprod/config.php';
    $pdo=new PDO('mysql:host='.$cfg['db_host'].';port='.($cfg['db_port']??3306).';dbname='.$cfg['db_name'].';charset=utf8mb4',$cfg['db_user'],$cfg['db_password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $snapshot=json_decode(file_get_contents($work.'/recovery/rapport-data.json'),true,512,JSON_THROW_ON_ERROR);
    $query=$pdo->prepare('SELECT * FROM rapport_reports WHERE public_id=?');
    foreach($snapshot['rows'] as $row){$query->execute([$row['public_id']]);check($query->fetch()===$row,'Existing Rapport row unchanged');}
    $result=['observedAt'=>gmdate('c'),'status'=>'completed_with_access_review_required','checks'=>$checks,
        'accessObservation'=>$access,'accessChangedByThisLot'=>false,'rightsFindingResolved'=>false,
        'rightsFinding'=>'Historical targeted access expectation differs from current CONNECT result. No entitlement changed. Review effective grants before production qualification.',
        'existingRapportRowsUnchanged'=>count($snapshot['rows']),'syntheticReportsRetained'=>$failed['syntheticReportsRetained'],
        'passeportLogoutVerified'=>true,'productionChanged'=>false,'privateValuesExported'=>false];
    file_put_contents($work.'/http-completion.json',json_encode($result,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES));
    echo json_encode(['status'=>$result['status'],'checks'=>count($checks),'receipt'=>'http-completion.json']).PHP_EOL;
}catch(Throwable $error){fwrite(STDERR,json_encode(['status'=>'failed','check'=>$error instanceof RuntimeException&&!$error instanceof PDOException?$error->getMessage():get_class($error)]).PHP_EOL);exit(1);}
