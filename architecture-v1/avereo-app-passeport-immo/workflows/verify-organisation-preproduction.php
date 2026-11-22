<?php
declare(strict_types=1);
// Private CLI recipe: real CONNECT issuer, HTTPS, existing records only; streaming downloads and additive-schema readback.
if (PHP_SAPI!=='cli' || $argc!==2) exit(2);
$work=$argv[1]; $home='/home/daje3540'; $origin='https://passeport-immo-preprod.avereo.fr';
if(realpath($work)!==$work || dirname($work)!==$home.'/private' || !str_starts_with(basename($work),'preprod-rapport-passeport-archives-'))exit(2);
$checks=[];
function check(bool $condition,string $label):void { global $checks; if(!$condition)throw new RuntimeException($label);$checks[]=$label; }
function request(string $url,array $cookies=[],string $method='GET',bool $download=false):array {
    global $origin;
    check(str_starts_with($url,$origin.'/'),'request restricted to preproduction');
    $headers=[];$ch=curl_init($url);
    curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>30,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_HTTPHEADER=>$cookies?['Cookie: '.implode('; ',$cookies)]:[],CURLOPT_HEADERFUNCTION=>static function($curl,$line)use(&$headers){$pair=explode(':',$line,2);if(count($pair)===2)$headers[strtolower(trim($pair[0]))][]=trim($pair[1]);return strlen($line);}]);
    $downloadBytes=0;$downloadHash=hash_init('sha256');
    if($download)curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>false,CURLOPT_TIMEOUT=>180,CURLOPT_WRITEFUNCTION=>static function($curl,$bytes)use(&$downloadBytes,$downloadHash){$downloadBytes+=strlen($bytes);hash_update($downloadHash,$bytes);return strlen($bytes);}]);
    $body=curl_exec($ch);$status=curl_getinfo($ch,CURLINFO_RESPONSE_CODE);$error=curl_errno($ch);curl_close($ch);
    check($body!==false && $error===0,'HTTPS transport verified');
    if($download)$body=['size'=>$downloadBytes,'sha256'=>hash_final($downloadHash)];
    return [$status,$headers,$body];
}
function session($issuer,int $account):array {
    [$status,$headers]=request($issuer->issueLocation('passeport-immo',$account));
    check($status===303,'authorized CONNECT ticket accepted');
    $cookies=[];foreach($headers['set-cookie']??[]as$cookie)$cookies[]=explode(';',$cookie,2)[0];
    check(count($cookies)>=1,'private session established');return $cookies;
}
function normalize(array $rows):array {$result=array_map(static fn($r)=>json_encode($r,JSON_THROW_ON_ERROR),$rows);sort($result);return $result;}
try {
    $values=require $home.'/private/connect-preprod/config.php';
    foreach($values as$key=>$value)if(is_string($key)&&is_scalar($value))putenv($key.'='.(string)$value);
    require $home.'/connect-preprod.avereo.fr/src/autoload.php';
    $config=Avereo\Connect\Config::fromEnvironment();
    $repository=new Avereo\Connect\Repository\PdoConnectRepository(Avereo\Connect\Database::connect($config));
    check($repository->canLaunchApplication(1,'passeport-immo'),'usual account has existing entitlement');
    $issuer=new Avereo\Connect\Security\AppLaunchTicketIssuer($config);
    [$status,$headers]=request($origin.'/');check($status===303 && !isset($headers['www-authenticate']),'anonymous root redirects without duplicate Basic');
    [$status]=request($origin.'/api/workspace');check($status===401,'anonymous workspace denied');
    [$status]=request($origin.'/connect/entry.php?ticket=invalid');check($status===403,'invalid ticket denied');
    $cookies=session($issuer,1);$second=session($issuer,1);
    [$status,,$body]=request($origin.'/api/session',$cookies);$auth=json_decode($body,true,64,JSON_THROW_ON_ERROR);
    check($status===200 && ($auth['storage']??null)==='server','server storage active');
    [$status,,$body]=request($origin.'/api/workspace',$cookies);$workspace=json_decode($body,true,64,JSON_THROW_ON_ERROR);
    check($status===200 && count($workspace['biens']??[])>0,'existing property workspace loaded');
    $documents=0;$active=0;$archived=0;$firstProperty=null;
    foreach($workspace['biens'] as$bien){
        $id=rawurlencode((string)$bien['id']);$firstProperty??=$id;
        [$status,,$body]=request($origin.'/api/biens/'.$id.'/documents',$cookies);$data=json_decode($body,true,64,JSON_THROW_ON_ERROR);
        check($status===200,'existing document list loaded');
        check(isset($data['settings']) && array_key_exists('categories',$data['settings']) && array_key_exists('order',$data['settings']),'organisation contract available');
        foreach($data['documents']as$doc){
            check(array_key_exists('trashedAt',$doc),'trash contract available');
            [$status,$headers,$bytes]=request($origin.'/api/biens/'.$id.'/documents/'.$doc['id'].'/file',$second,'GET',true);
            check($status===200 && $bytes['size']===$doc['size'] && $bytes['sha256']===$doc['sha256'],'existing document exact in independent session');
            check(isset($headers['content-disposition']) && str_starts_with($headers['content-disposition'][0],'attachment;'),'download remains inert attachment');
            ++$documents;if($doc['archivedAt'])++$archived;else ++$active;
        }
    }
    [$status]=request($origin.'/api/biens/'.$firstProperty.'/documents',$cookies,'POST');check($status===403,'write without CSRF denied');
    [$status]=request($origin.'/api/biens/'.$firstProperty.'/documents/'.str_repeat('0',32),$cookies,'DELETE');check($status===403,'purge without CSRF denied');
    [$status]=request($origin.'/api/biens/'.$firstProperty.'/document-settings',$cookies,'PUT');check($status===403,'organisation without CSRF denied');
    $familyAllowed=$repository->canLaunchApplication(2,'passeport-immo');
    if($familyAllowed){$foreign=session($issuer,2);[$status]=request($origin.'/api/biens/'.$firstProperty.'/documents',$foreign);check(in_array($status,[403,404],true),'other entitled account cannot read owner property');}
    $passeport=require $home.'/.avereo/passeport-immo-preprod/config.php';
    $pdo=new PDO($passeport['storage_dsn'],$passeport['storage_user'],$passeport['storage_password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $snapshot=json_decode(file_get_contents($work.'/recovery/passeport-immo/data/snapshot.json'),true,64,JSON_THROW_ON_ERROR);
    foreach($snapshot['tables']as$table=>$rows){check(in_array($table,['pi_workspaces','pi_clients','pi_biens','pi_documents'],true),'snapshot table allowed');$current=$pdo->query('SELECT * FROM '.$table)->fetchAll();$extra=$table==='pi_documents'?'trashed_at':($table==='pi_biens'?'document_settings':null);if($extra && $rows && !array_key_exists($extra,$rows[0]))foreach($current as&$row){check(($row[$extra]??null)===null,'new fields remain unused during read-only recipe');unset($row[$extra]);}unset($row);check(normalize($current)===normalize($rows),'original business values identical to fresh backup');}
    foreach($snapshot['files']as$file)check(hash_file('sha256',$passeport['storage_directory'].'/'.$file['name'])===$file['sha256'],'private document identical to fresh backup');
    $receipt=['observedAt'=>gmdate('c'),'status'=>'passed','target'=>$origin.'/','assertions'=>count($checks),'checks'=>$checks,'account'=>1,'independentSessions'=>2,'properties'=>count($workspace['biens']),'accountDocuments'=>$documents,'activeDocuments'=>$active,'archivedDocuments'=>$archived,'allPrivateDocumentsPreserved'=>count($snapshot['files']),'familyStillEntitled'=>$familyAllowed,'liveRowsChanged'=>false,'streamingDownloads'=>true,'schemaChanged'=>true,'positiveOrganisationMutationOnLiveDataTested'=>false,'successfulNewArchiveUploadTested'=>false,'freshDrupalLoginTested'=>false,'credentialsExported'=>false];
    file_put_contents($work.'/https-recipe-public.json',json_encode($receipt,JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT));chmod($work.'/https-recipe-public.json',0600);
    // One-use normal ticket for the already-authorized browser recipe, never printed.
    file_put_contents($work.'/browser-launch-private.json',json_encode(['url'=>$issuer->issueLocation('passeport-immo',1)],JSON_THROW_ON_ERROR));chmod($work.'/browser-launch-private.json',0600);
    echo json_encode(['status'=>'passed','assertions'=>count($checks),'documentsPreserved'=>count($snapshot['files']),'downloadedDocuments'=>$documents],JSON_THROW_ON_ERROR)."\n";
} catch(Throwable $error){fwrite(STDERR,'Recipe failed: '.get_class($error).' '.$error->getMessage()."\n");exit(1);}
