<?php
declare(strict_types=1);
// Hosting CLI recipe: existing entitlement, normal one-use launch ticket, HTTPS.
// Private values, existing business contents, cookies and tickets are never printed.
if (PHP_SAPI !== 'cli' || $argc !== 2) exit(2);
umask(0077);
$work=$argv[1]; $checks=[];
function verify(bool $ok,string $label): void {
    global $checks;
    if (!$ok) throw new RuntimeException($label);
    $checks[]=$label;
}
function http(string $app,string $path,?string $jar=null,string $method='GET',?array $body=null): array {
    verify(in_array($app,['rapport','passeport-immo'],true) && str_starts_with($path,'/') && !str_starts_with($path,'//'),'HTTPS target allowlist');
    $origin='https://'.$app.'-preprod.avereo.fr'; $curl=curl_init($origin.$path); $headers=[];
    $options=[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>30,
        CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_CUSTOMREQUEST=>$method,
        CURLOPT_HEADERFUNCTION=>static function($handle,$line)use(&$headers){$parts=explode(':',$line,2);if(count($parts)===2)$headers[strtolower(trim($parts[0]))]=trim($parts[1]);return strlen($line);}];
    if($jar!==null){$options[CURLOPT_COOKIEJAR]=$jar;$options[CURLOPT_COOKIEFILE]=$jar;}
    if($body!==null){$options[CURLOPT_POSTFIELDS]=json_encode($body,JSON_THROW_ON_ERROR);$options[CURLOPT_HTTPHEADER]=['Content-Type: application/json','Origin: '.$origin];}
    curl_setopt_array($curl,$options);$content=curl_exec($curl);$status=curl_getinfo($curl,CURLINFO_RESPONSE_CODE);$error=curl_errno($curl);curl_close($curl);
    verify($error===0 && is_string($content),'TLS HTTP request completed');
    return ['status'=>$status,'headers'=>$headers,'body'=>$content];
}
function payload(array $response): array { return json_decode($response['body'],true,512,JSON_THROW_ON_ERROR); }
function launch(string $app,string $jar): void {
    global $repository,$issuer;
    verify($repository->canLaunchApplication(1,$app),'Existing selected account entitled: '.$app);
    $url=$issuer->issueLocation($app,1,false);
    verify(parse_url($url,PHP_URL_SCHEME)==='https' && parse_url($url,PHP_URL_HOST)===$app.'-preprod.avereo.fr'
        && parse_url($url,PHP_URL_PATH)==='/connect/entry.php','Normal preproduction launch destination: '.$app);
    $path=parse_url($url,PHP_URL_PATH).'?'.parse_url($url,PHP_URL_QUERY);
    $entry=http($app,$path,$jar);
    verify($entry['status']===303,'Normal one-use launch accepted: '.$app);
    verify(http($app,$path)['status']===403,'Launch replay rejected: '.$app);
}
try {
    verify(str_starts_with($work,'/home/daje3540/private/preprod-rapport-passeport-') && realpath($work)===$work && is_file($work.'/delivery.json'),'Verified private delivery required');
    verify(!file_exists($work.'/http-verification.json'),'Fresh recipe required');
    $cfg=require '/home/daje3540/private/connect-preprod/config.php';
    foreach($cfg as $key=>$value)if(is_scalar($value))putenv($key.'='.(is_bool($value)?($value?'true':'false'):(string)$value));
    require '/home/daje3540/connect-preprod.avereo.fr/src/autoload.php';
    $config=Avereo\Connect\Config::fromEnvironment();
    $repository=new Avereo\Connect\Repository\PdoConnectRepository(Avereo\Connect\Database::connect($config));
    $issuer=new Avereo\Connect\Security\AppLaunchTicketIssuer($config);
    $fixtureIds=[];
    foreach(['rapport','passeport-immo'] as $app){
        $anonymous=http($app,'/');
        verify($anonymous['status']===303 && str_starts_with($anonymous['headers']['location']??'','https://connect-preprod.avereo.fr/'),'Anonymous page returns to CONNECT preproduction: '.$app);
        $api=$app==='rapport'?'/api/reports.php':'/api/workspace';
        verify(in_array(http($app,$api)['status'],[401,403],true),'Anonymous business API denied: '.$app);
        $jar=$work.'/'.$app.'-recipe-cookie.txt';
        launch($app,$jar);$page=http($app,'/',$jar);
        verify($page['status']===200,'Authenticated page served: '.$app);
        if($app==='rapport'){
            verify(str_contains($page['body'],'index-CKpXCVG6.js'),'New Rapport index served');
            $bundle=http($app,'/assets/index-CKpXCVG6.js',$jar);
            verify($bundle['status']===200 && hash('sha256',$bundle['body'])==='e94e82712a581c566253c2dcc7f7eb80ef9531344973c7b4fa24ec5215697d9a','Exact Rapport bundle served over HTTPS');
            verify(str_contains($bundle['body'],'Expertise & Visite technique') && str_contains($bundle['body'],'Visite Globale'),'Both report types in hosted bundle');
            verify(http($app,$api,$jar)['status']===200,'Existing report list readable');
            foreach(['Expertise & Visite technique','Visite Globale'] as $index=>$category){
                $id=substr(hash('sha256','preprod-rapport-20261016-'.$category),0,32);
                verify(http($app,$api.'?id='.$id,$jar)['status']===404,'Synthetic report id unused: '.$index);
                $report=['titre'=>'RECETTE 2026-10-16 — '.$category,'reference_dossier'=>'RECETTE-FICTIVE-20261016-'.$index,
                    'categorie'=>$category,'sous_categorie'=>$index===0?'Visite technique':'Maison','adresse_logement'=>'Dossier fictif de contrôle',
                    'observations'=>[['id'=>'recette-'.$index,'titre'=>'Observation fictive','piece'=>'Salon','surface'=>'Murs','gravite'=>'Mineure','observations'=>'Contrôle technique sans donnée client.','actions'=>'Aucune intervention réelle.','photos'=>[]]],'signature'=>''];
                $saved=http($app,$api,$jar,'POST',['id'=>$id,'report'=>$report]);
                verify($saved['status']===200 && (payload($saved)['report']['id']??'')===$id,'Synthetic report saved: '.$category);
                $reopened=http($app,$api.'?id='.$id,$jar);
                verify($reopened['status']===200 && (payload($reopened)['report']['payload']??null)===$report,'Exact report reopened: '.$category);
                $fixtureIds[]=$id;
            }
        }else{
            verify(str_contains($page['body'],'<meta name="passeport-storage" content="server">'),'Passeport server storage mode active');
            $session=http($app,'/api/session',$jar);
            verify($session['status']===200 && (payload($session)['storage']??'')==='server','Passeport session and server storage available');
            $workspace=http($app,'/api/workspace',$jar);verify($workspace['status']===200,'Passeport workspace readable');
            $before=payload($workspace);$count=0;
            foreach($before['biens'] as $bien){
                $path='/api/biens/'.rawurlencode((string)$bien['id']).'/documents';$list=http($app,$path,$jar);
                verify($list['status']===200,'Passeport document list readable');
                foreach(payload($list)['documents'] as $doc){
                    $file=http($app,$path.'/'.$doc['id'].'/file',$jar);
                    verify($file['status']===200 && hash('sha256',$file['body'])===$doc['sha256'],'Passeport document bytes match stored checksum');
                    verify(str_starts_with($file['headers']['content-disposition']??'','attachment;') && str_contains($file['headers']['content-security-policy']??'','sandbox'),'Passeport inert attachment protection');$count++;
                }
            }
            verify(http($app,'/api/workspace',$jar,'PUT',[])['status']===403,'Passeport write without CSRF rejected');
            $second=$work.'/passeport-second-cookie.txt';launch($app,$second);
            verify(payload(http($app,'/api/workspace',$second))===$before,'Passeport unchanged workspace in independent session');
            verify(!$repository->canLaunchApplication(2,$app) && !$repository->canLaunchApplication(3,$app),'Other existing accounts remain without Passeport access');
        }
        verify(http($app,'/connect/logout.php',$jar)['status']===303,'Application logout responds: '.$app);
        verify(in_array(http($app,$api,$jar)['status'],[401,403],true),'Business API denied after logout: '.$app);
    }
    $reportConfig=require '/home/daje3540/.avereo/rapport-preprod/config.php';
    $pdo=new PDO('mysql:host='.$reportConfig['db_host'].';port='.($reportConfig['db_port']??3306).';dbname='.$reportConfig['db_name'].';charset=utf8mb4',$reportConfig['db_user'],$reportConfig['db_password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $snapshot=json_decode(file_get_contents($work.'/recovery/rapport-data.json'),true,512,JSON_THROW_ON_ERROR);
    $query=$pdo->prepare('SELECT * FROM rapport_reports WHERE public_id=?');
    foreach($snapshot['rows'] as $row){$query->execute([$row['public_id']]);verify($query->fetch()===$row,'Existing Rapport row unchanged');}
    $receipt=['observedAt'=>gmdate('c'),'status'=>'passed','checks'=>$checks,'assertions'=>count($checks),'authMethod'=>'existing_account_normal_one_use_CONNECT_ticket','oauthBrowserLoginVerified'=>false,
        'rapport'=>['syntheticReportsRetained'=>$fixtureIds,'existingRowsUnchanged'=>true,'typesVerified'=>['Expertise & Visite technique','Visite Globale']],
        'passeportImmo'=>['properties'=>count($before['biens']),'documentsVerified'=>$count,'workspaceUnchanged'=>true],
        'credentialsExported'=>false,'entitlementsChanged'=>false,'productionChanged'=>false];
    file_put_contents($work.'/http-verification.json',json_encode($receipt,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
    echo json_encode(['status'=>'passed','assertions'=>count($checks),'receipt'=>'http-verification.json']).PHP_EOL;
}catch(Throwable $error){
    file_put_contents($work.'/http-failure.json',json_encode(['observedAt'=>gmdate('c'),'status'=>'failed','checks'=>$checks,'check'=>$error instanceof RuntimeException && !$error instanceof PDOException?$error->getMessage():get_class($error),'syntheticReportsRetained'=>$fixtureIds??[]],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
    fwrite(STDERR,json_encode(['status'=>'failed','receipt'=>'http-failure.json','check'=>$error instanceof RuntimeException && !$error instanceof PDOException?$error->getMessage():get_class($error)]).PHP_EOL);exit(1);
}
