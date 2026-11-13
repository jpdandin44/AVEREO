<?php
declare(strict_types=1);
// CLI maintenance only. CONNECT credentials never enter the application config or output file.
if(PHP_SAPI!=='cli'||$argc!==5)exit(2);
[$script,$connectRoot,$connectConfig,$appConfig,$destination]=$argv;
umask(0077);
try {
    $app=require $appConfig;
    if(realpath($connectRoot)!==$connectRoot || realpath(dirname($destination))!==dirname($destination)
        || is_link($destination) || str_contains($destination,'/public/') || $destination!==($app['document_share_directory']??null))throw new RuntimeException('Private directory mismatch');
    $values=require $connectConfig;foreach($values as$key=>$value)if(is_string($key)&&is_scalar($value))putenv($key.'='.(string)$value);
    require $connectRoot.'/src/autoload.php';
    $config=Avereo\Connect\Config::fromEnvironment();
    if($config->environment!==$app['environment'])throw new RuntimeException('Environment mismatch');
    $db=Avereo\Connect\Database::connect($config);$repository=new Avereo\Connect\Repository\PdoConnectRepository($db);
    $accounts=[];
    $rows=$db->query('SELECT id,display_name,email_normalized,status,onboarding_status FROM users')->fetchAll(PDO::FETCH_ASSOC);
    // Same application/membership/time constraints as CONNECT, excluding onboarding for pending invitations.
    $invitable=$db->prepare("SELECT 1 FROM users u INNER JOIN memberships m ON m.user_id=u.id AND m.status='active' INNER JOIN organizations o ON o.id=m.organization_id AND o.status='active' INNER JOIN entitlements e ON e.organization_id=o.id AND e.status='active' INNER JOIN applications a ON a.id=e.application_id AND a.status='active' LEFT JOIN user_application_access ua ON ua.organization_id=o.id AND ua.user_id=u.id AND ua.application_id=a.id WHERE u.id=? AND u.status='active' AND a.code='passeport-immo' AND ((ua.status IS NULL AND u.application_access_mode='inherit') OR ua.status='active') AND (u.access_starts_at IS NULL OR u.access_starts_at<=UTC_TIMESTAMP(6)) AND (u.access_ends_at IS NULL OR u.access_ends_at>UTC_TIMESTAMP(6)) AND (e.valid_from IS NULL OR e.valid_from<=UTC_TIMESTAMP(6)) AND (e.valid_to IS NULL OR e.valid_to>UTC_TIMESTAMP(6)) LIMIT 1");
    foreach($rows as$row){
        $id=(int)$row['id'];$invitable->execute([$id]);$allowed=$invitable->fetchColumn()!==false;
        $label=trim((string)$row['display_name']);if($label==='')$label='Compte CONNECT '.$id;
        $email=(string)($row['email_normalized']??'');
        $aliases=[$label,$email,explode('@',$email)[0],'avereo_connect:'.$id];
        $aliases=array_values(array_unique(array_map(static fn($value)=>hash('sha256',strtolower(trim($value))),array_filter($aliases,static fn($v)=>trim($v)!==''))));
        $accounts['avereo_connect:'.$id]=['label'=>$label,'aliases'=>$aliases,'eligible'=>$repository->canLaunchApplication($id,'passeport-immo'),'invitable'=>$allowed];
    }
    // Optional aliases are explicit operator-confirmed mappings, never inferred identities.
    foreach(($app['document_share_aliases']??[])as$alias=>$id){
        if(!is_string($alias)||trim($alias)===''||strlen($alias)>254||!is_string($id)||!isset($accounts[$id]))throw new RuntimeException('Confirmed alias mismatch');
        $accounts[$id]['aliases'][]=hash('sha256',strtolower(trim($alias)));
        $accounts[$id]['aliases']=array_values(array_unique($accounts[$id]['aliases']));
    }
    $output=['version'=>1,'environment'=>$app['environment'],'generatedAt'=>time(),'accounts'=>$accounts];
    $bytes=json_encode($output,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);$temporary=$destination.'.'.bin2hex(random_bytes(8)).'.tmp';
    $file=fopen($temporary,'x');if(!$file)throw new RuntimeException('Private write failed');
    try{chmod($temporary,0600);if(fwrite($file,$bytes)!==strlen($bytes))throw new RuntimeException('Private write incomplete');}finally{fclose($file);}
    if(!rename($temporary,$destination))throw new RuntimeException('Private publication failed');
    echo json_encode(['status'=>'exported','accounts'=>count($accounts),'containsCredentials'=>false,'containsEmailAddresses'=>false,'connectRowsChanged'=>false]).PHP_EOL;
}catch(Throwable $e){fwrite(STDERR,'Share directory unavailable: '.get_class($e).PHP_EOL);exit(1);}
