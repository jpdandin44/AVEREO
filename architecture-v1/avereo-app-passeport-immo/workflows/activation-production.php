<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
umask(0077);$base=__DIR__;$home='/home/daje3540';$step='preflight';$liveStarted=false;
function activationJson(string$p,array$v):void{if(file_exists($p))throw new RuntimeException('New receipt required');file_put_contents($p,json_encode($v,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR)."\n");chmod($p,0600);}
function activationWrite(string$p,string$bytes,int$mode):void{
 $next=$p.'.pim-next';if(is_link($p)||file_exists($next)||is_link($next))throw new RuntimeException('Atomic target guard');
 $f=fopen($next,'x');if(!$f)throw new RuntimeException('New staging file required');try{chmod($next,$mode);if(fwrite($f,$bytes)!==strlen($bytes))throw new RuntimeException('Atomic write incomplete');}finally{fclose($f);}
 if(hash_file('sha256',$next)!==hash('sha256',$bytes)||!rename($next,$p))throw new RuntimeException('Atomic publication failed');
 if(hash_file('sha256',$p)!==hash('sha256',$bytes)||(fileperms($p)&0777)!==$mode)throw new RuntimeException('Published readback mismatch');
 if(function_exists('opcache_invalidate')&&str_ends_with($p,'.php'))opcache_invalidate($p,true);
}
function activationLiteral(string$p):array{
 foreach(token_get_all(file_get_contents($p))as$t){if(!is_array($t))continue;
  if(!in_array($t[0],[T_OPEN_TAG,T_WHITESPACE,T_COMMENT,T_DOC_COMMENT,T_DECLARE,T_STRING,T_LNUMBER,T_DNUMBER,T_RETURN,T_ARRAY,T_DOUBLE_ARROW,T_CONSTANT_ENCAPSED_STRING],true)
   ||($t[0]===T_STRING&&!in_array(strtolower($t[1]),['strict_types','true','false','null','array'],true)))throw new RuntimeException('Literal private configuration required');}
 $c=require$p;if(!is_array($c))throw new RuntimeException('Array configuration required');return$c;
}
function activationPdo(array$c):PDO{$d=new PDO($c['DB_DSN'],$c['DB_USER'],$c['DB_PASSWORD'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false,PDO::ATTR_STRINGIFY_FETCHES=>true]);if($d->query('SELECT DATABASE()')->fetchColumn()!=='daje3540_connectprod')throw new RuntimeException('Selected CONNECT database required');return$d;}
function activationRows(PDO$d):array{$r=[];foreach(['applications','entitlements','user_application_access']as$t)$r[$t]=$d->query('SELECT * FROM '.$t.' ORDER BY id')->fetchAll();return$r;}
function activationAccess(PDO$d):array{
 $q=$d->prepare("INSERT INTO applications(code,name,description,launch_url,required_scope,display_order,status) VALUES('passeport-immo','Passeport Immo','Documents et suivi des biens immobiliers','https://passeport-immo.avereo.fr/','passeport-immo:use',60,'active')");$q->execute();$id=(int)$d->lastInsertId();
 $q=$d->prepare("INSERT INTO entitlements(organization_id,application_id,status,granted_by_user_id)VALUES(1,?,'active',1)");$q->execute([$id]);
 $members=$d->query('SELECT user_id FROM memberships WHERE organization_id=1 ORDER BY user_id')->fetchAll(PDO::FETCH_COLUMN);
 $q=$d->prepare('INSERT INTO user_application_access(organization_id,user_id,application_id,status,granted_by_user_id)VALUES(1,?,?,?,1)');foreach($members as$member)$q->execute([(int)$member,$id,(int)$member===1?'active':'revoked']);
 $repo=new Avereo\Connect\Repository\PdoConnectRepository($d);if(!$repo->canLaunchApplication(1,'passeport-immo'))throw new RuntimeException('Selected account not allowed');
 $denied=0;foreach($d->query('SELECT id FROM users')->fetchAll(PDO::FETCH_COLUMN)as$user)if((int)$user!==1){if($repo->canLaunchApplication((int)$user,'passeport-immo'))throw new RuntimeException('Other current account allowed');$denied++;}
 return['applicationId'=>$id,'allowedUserId'=>1,'otherCurrentAccountsDenied'=>$denied,'rolesChanged'=>false];
}
function activationPublish(array$sources,string$stage,string$prefix=''):void{
 foreach($sources as$name=>$meta){$dest=$prefix===''?$meta['path']:$prefix.'/'.$name;activationWrite($dest,file_get_contents($stage.'/'.$name),$meta['mode']);}
}
try{
 $mode=$argv[1]??'prepare';if(!in_array($mode,['prepare','apply'],true))throw new RuntimeException('Explicit mode required');
 $root=$home.'/passeport-immo.avereo.fr/public';$connect=$home.'/connect.avereo.fr';
 $configPath=$home.'/private/connect-production/config.php';$appPath=$home.'/.avereo/passeport-immo/config.php';
 foreach(['backup-storage.php'=>'734d7ca313632792a93efaa18bc95dbc6857f057493ba67ffc51414a6e65dffb','scheduled-backup.php'=>'b73c6c2209c3a81175169ff680be057af017d4ab5282055f356a805f323fba74','backup-cron.php'=>'3e2bf449abeed38647529d51630be06abc56aef146e26154edb058bfc817e4a8','storage.sql'=>'b2e283afcc8e20079b5f0e07c65ebb733ad3fb9ffc8897158d166dec9186af55','transfer-property.php'=>'7dcb922b88141725632d28f2c03b0964f6002a212018cfde0c9996e3dcc8360a']as$name=>$sha)if(hash_file('sha256',$base.'/operations/'.$name)!==$sha)throw new RuntimeException('Qualified private source changed');
 require_once$base.'/operations/backup-cron.php';$cronBefore=passeport_crontab_read();passeport_cron_append($cronBefore,'PIM_PRODUCTION_PREVIEW_ONLY',true,'production');
 $c=activationLiteral($configPath);$a=activationLiteral($appPath);
 if(($c['APP_ENV']??'')!=='production'||($a['environment']??'')!=='production'||($a['storage_enabled']??null)!==false||!preg_match('/^[a-f0-9]{64}$/D',$a['connect_launch_secret']??'')||isset($c['APP_LAUNCH_PASSEPORT_IMMO_URL'])||isset($c['APP_LAUNCH_PASSEPORT_IMMO_SECRET']))throw new RuntimeException('Unchanged closed private configurations required');
 require_once$connect.'/src/autoload.php';$db=activationPdo($c);$observer=activationPdo($c);
 $owner=$db->query("SELECT u.id FROM users u JOIN memberships m ON m.user_id=u.id JOIN organizations o ON o.id=m.organization_id WHERE u.id=1 AND u.display_name='dandin' AND u.status='active' AND u.onboarding_status='completed' AND m.organization_id=1 AND m.role='owner' AND m.status='active' AND o.status='active'")->fetchAll();
 if(count($owner)!==1||(int)$db->query("SELECT COUNT(*) FROM applications WHERE code='passeport-immo'")->fetchColumn()!==0)throw new RuntimeException('Selected owner or absent application precondition changed');
 $baseline=activationRows($db);$baselineHash=hash('sha256',json_encode($baseline,JSON_THROW_ON_ERROR));
 $sources=['connect-index.php'=>['path'=>$connect.'/public/index.php','mode'=>0644,'sha256'=>'8d112303af417f778baf124eccbe8ac69c94aa0891cd1df11d8c9b7f593b004f'],
  'connect-config-class.php'=>['path'=>$connect.'/src/Config.php','mode'=>0640,'sha256'=>'4f18dbbc23142595eb9921af4152e184440f1b5bdceb413247d2867e3feb52b5'],
  'connect-config.php'=>['path'=>$configPath,'mode'=>0600,'sha256'=>hash_file('sha256',$configPath)],
  'passeport-config.php'=>['path'=>$appPath,'mode'=>0600,'sha256'=>hash_file('sha256',$appPath)],
  'policy.htaccess'=>['path'=>$root.'/.htaccess','mode'=>0644,'sha256'=>'5128268a58777bae14746abd31c6915f963807279f9f15596c0c0e66cda92c52']];
 foreach($sources as$meta)if(is_link($meta['path'])||hash_file('sha256',$meta['path'])!==$meta['sha256']||(fileperms($meta['path'])&0777)!==$meta['mode'])throw new RuntimeException('Affected file precondition mismatch');
 $installed=json_decode(file_get_contents($base.'/closed-installation-receipt.json'),true,64,JSON_THROW_ON_ERROR);
 if($installed['status']!=='candidate_installed_closed'||count($installed['fileHashes'])!==16)throw new RuntimeException('Closed candidate receipt required');
 foreach($installed['fileHashes']as$name=>$sha)if(hash_file('sha256',$root.'/'.$name)!==$sha)throw new RuntimeException('Installed candidate changed');
 require $base.'/operations/transfer-property.php';require $base.'/operations/backup-storage.php';
 $plan=['source'=>['environment'=>'preprod','ownerId'=>'avereo_connect:1','bienId'=>'sci-001'],'target'=>['environment'=>'production','ownerId'=>'avereo_connect:1']];
 $prepared=json_decode(file_get_contents($base.'/sci-transfer-preparation.json'),true,64,JSON_THROW_ON_ERROR);$offline=$a;$offline['storage_enabled']=true;
 if(pi_transfer_import($offline,$plan,$base.'/sci-export',$prepared['export']['manifestSha256'])['status']!=='already_imported')throw new RuntimeException('SCI exact replay precondition changed');
 $stage=$base.'/activation-staged';$proofPath=$base.'/activation-preparation.json';
 if($mode==='prepare'){
  $step='private-staging';if(file_exists($stage)||!mkdir($stage,0700))throw new RuntimeException('New private activation stage required');
  $zip=new ZipArchive();$delta=$base.'/operations/runtime-connect-compatible.zip';if(hash_file('sha256',$delta)!=='3b41fda26c0358a0a4eb3f49ebd2e132162fd737ce0078822d3e15a687884b63'||$zip->open($delta)!==true)throw new RuntimeException('Delta archive mismatch');
  foreach(['connect-index.php'=>'public/index.php','connect-config-class.php'=>'src/Config.php']as$name=>$entry){file_put_contents($stage.'/'.$name,$zip->getFromName($entry));chmod($stage.'/'.$name,0600);}$zip->close();
  $c['APP_LAUNCH_PASSEPORT_IMMO_URL']='https://passeport-immo.avereo.fr/connect/entry.php';$c['APP_LAUNCH_PASSEPORT_IMMO_SECRET']=$a['connect_launch_secret'];
  $a['storage_enabled']=true;$a['storage_profiles']['avereo_connect:1']=['name'=>'dandin','role'=>'user','plan'=>'pro'];
  foreach(['connect-config.php'=>$c,'passeport-config.php'=>$a]as$name=>$value){file_put_contents($stage.'/'.$name,"<?php\ndeclare(strict_types=1);\nreturn ".var_export($value,true).";\n");chmod($stage.'/'.$name,0600);if(activationLiteral($stage.'/'.$name)!==$value)throw new RuntimeException('Staged semantic readback mismatch');}
  $zip=new ZipArchive();$candidate=$base.'/operations/candidate.zip';if(hash_file('sha256',$candidate)!=='c44f397fd03daa433f19e6d4c72127f29e55dbf9fca679e8c7f41cc207a843cf'||$zip->open($candidate)!==true)throw new RuntimeException('Candidate mismatch');file_put_contents($stage.'/policy.htaccess',$zip->getFromName('.htaccess'));chmod($stage.'/policy.htaccess',0600);$zip->close();
  foreach(['connect-index.php'=>'6568e46bfb942ab00585b512293117da01e0622f88b8f9ab1aae8263591d7bfa','connect-config-class.php'=>'9195492276204d281eee26f71193c25b3ed2c1ca8d1d932179a5d680dcaecdc6','policy.htaccess'=>'ba1698052b99075c426ddb5abda88a239357ad1dcb6c9efd723472e600370bb8']as$name=>$sha)if(hash_file('sha256',$stage.'/'.$name)!==$sha)throw new RuntimeException('Staged runtime mismatch');
  $fixture=$base.'/activation-rehearsal';if(file_exists($fixture)||!mkdir($fixture,0700))throw new RuntimeException('New private rehearsal required');
  foreach($sources as$name=>$meta){copy($meta['path'],$fixture.'/'.$name);chmod($fixture.'/'.$name,$meta['mode']);}
  $step='temporary-catalogue-rehearsal';foreach(array_keys($baseline)as$table){$relay='pim_activation_'.$table;$db->exec('CREATE TEMPORARY TABLE '.$relay.' LIKE '.$table);$db->exec('CREATE TEMPORARY TABLE '.$table.' LIKE '.$relay);$db->exec('DROP TEMPORARY TABLE '.$relay);foreach($baseline[$table]as$row){$keys=array_keys($row);$q=$db->prepare('INSERT INTO '.$table.' (`'.implode('`,`',$keys).'`)VALUES('.implode(',',array_fill(0,count($keys),'?')).')');$q->execute(array_values($row));}}
  $db->beginTransaction();$access=activationAccess($db);activationPublish($sources,$stage,$fixture);
  $actualConnect=activationLiteral($fixture.'/connect-config.php');$actualApp=activationLiteral($fixture.'/passeport-config.php');if($actualConnect!==$c||$actualApp!==$a||!hash_equals($actualConnect['APP_LAUNCH_PASSEPORT_IMMO_SECRET'],$actualApp['connect_launch_secret']))throw new RuntimeException('Isolated configuration mismatch');
  $db->rollBack();foreach($sources as$name=>$meta)activationWrite($fixture.'/'.$name,file_get_contents($meta['path']),$meta['mode']);
  if(activationRows($db)!==$baseline||hash('sha256',json_encode(activationRows($observer),JSON_THROW_ON_ERROR))!==$baselineHash)throw new RuntimeException('Isolated or live rollback mismatch');
  foreach($sources as$name=>$meta)if(hash_file('sha256',$fixture.'/'.$name)!==$meta['sha256']||hash_file('sha256',$meta['path'])!==$meta['sha256'])throw new RuntimeException('Live or isolated file changed');
  foreach(array_reverse(array_keys($baseline))as$table)$db->exec('DROP TEMPORARY TABLE '.$table);
  $hashes=[];foreach($sources as$name=>$meta)$hashes[$name]=hash_file('sha256',$stage.'/'.$name);
  $out=['observedAt'=>gmdate('c'),'status'=>'private_activation_prepared_and_isolated_rehearsal_passed','sources'=>$sources,'stagedHashes'=>$hashes,'catalogueBaselineSha256'=>$baselineHash,'scriptSha256'=>hash_file('sha256',__FILE__),'cronBeforeSha256'=>hash('sha256',$cronBefore),'temporaryAccess'=>$access,'isolatedFileAndSqlRollback'=>'passed','liveFilesAndCatalogueChanged'=>false,'newSecretGenerated'=>false,'secretValuesReturned'=>false,'backupPolicy'=>'daily 03:20 Europe/Paris, hourly catch-up, 30 verified copies, same hosting only'];activationJson($proofPath,$out);
 }else{
  $step='prepared-baseline-revalidation';$proof=json_decode(file_get_contents($proofPath),true,64,JSON_THROW_ON_ERROR);
  if($proof['status']!=='private_activation_prepared_and_isolated_rehearsal_passed'||$proof['scriptSha256']!==hash_file('sha256',__FILE__)||$proof['sources']!==$sources||$proof['catalogueBaselineSha256']!==$baselineHash||$proof['cronBeforeSha256']!==hash('sha256',$cronBefore))throw new RuntimeException('Prepared activation changed');
  foreach($proof['stagedHashes']as$name=>$sha)if(hash_file('sha256',$stage.'/'.$name)!==$sha)throw new RuntimeException('Staged activation changed');
  $step='fresh-private-recovery';$before=$base.'/activation-before';if(file_exists($before)||!mkdir($before,0700))throw new RuntimeException('New activation baseline required');foreach($sources as$name=>$meta){copy($meta['path'],$before.'/'.$name);chmod($before.'/'.$name,0600);if(hash_file('sha256',$before.'/'.$name)!==$meta['sha256'])throw new RuntimeException('Fresh file backup mismatch');}activationJson($before.'/catalogue.json',$baseline);
  $backup=passeport_backup($offline,$before.'/application-data');if($backup['documents']!==9)throw new RuntimeException('Fresh populated backup changed');
  $step='limited-access-and-configuration';$db->beginTransaction();$liveStarted=true;$access=activationAccess($db);
  // Keep deny-all while installing runtime and private configuration; publish the signed gate last.
  $withoutPolicy=$sources;unset($withoutPolicy['policy.htaccess']);activationPublish($withoutPolicy,$stage);
  $cc=activationLiteral($configPath);$aa=activationLiteral($appPath);if(!hash_equals($cc['APP_LAUNCH_PASSEPORT_IMMO_SECRET'],$aa['connect_launch_secret'])||$aa['storage_enabled']!==true)throw new RuntimeException('Live private configuration readback mismatch');
  $db->commit();activationPublish(['policy.htaccess'=>$sources['policy.htaccess']],$stage);
  $step='production-backup-installation';$bin=$home.'/.avereo/passeport-immo/backups/bin';$backupRoot=$home.'/private/passeport-immo-backups/production';
  foreach([$home.'/.avereo/passeport-immo/backups',$bin,$home.'/private/passeport-immo-backups',$backupRoot]as$dir){if(is_link($dir))throw new RuntimeException('Backup path symlink refused');if(!is_dir($dir))mkdir($dir,0700);chmod($dir,0700);}
  foreach(['backup-storage.php','scheduled-backup.php','backup-cron.php','storage.sql']as$name){if(file_exists($bin.'/'.$name))throw new RuntimeException('New production backup tools required');copy($base.'/operations/'.$name,$bin.'/'.$name);chmod($bin.'/'.$name,0600);if(hash_file('sha256',$bin.'/'.$name)!==hash_file('sha256',$base.'/operations/'.$name))throw new RuntimeException('Backup source copy mismatch');}
  $cmd='/opt/alt/php83/usr/bin/php '.escapeshellarg($bin.'/backup-cron.php').' --environment=production';$lines=[];$code=0;exec($cmd.' 2>/dev/null',$lines,$code);if($code!==0)throw new RuntimeException('Production cron installation failed');
  $out=['observedAt'=>gmdate('c'),'status'=>'private_production_activated_browser_recipe_and_real_cron_qualification_pending','access'=>$access,'existingKeyCopiedServerSide'=>true,'newSecretGenerated'=>false,'webStorageEnabled'=>true,'candidateFiles'=>16,'publicOpeningPerformed'=>false,'productionBackupScheduleInstalled'=>true,'realCronSuccessVerified'=>false,'secretValuesReturned'=>false];activationJson($base.'/activation-receipt.json',$out);
 }
 echo json_encode(['observedAt'=>$out['observedAt'],'status'=>$out['status'],'allowedProductionAccount'=>'dandin','otherCurrentAccountsDenied'=>$out['temporaryAccess']['otherCurrentAccountsDenied']??$out['access']['otherCurrentAccountsDenied'],'secretValuesReturned'=>false,'publicOpeningPerformed'=>false,'backupPolicy'=>'03:20 Europe/Paris; 30 verified copies; hosting-private'],JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR)."\n";
}catch(Throwable$e){if(isset($db)&&$db->inTransaction())$db->rollBack();if($liveStarted&&isset($root)){try{activationWrite($root.'/.htaccess',file_get_contents($base.'/candidate-stage/.htaccess'),0644);}catch(Throwable){}}$reason=get_class($e)===RuntimeException::class?$e->getMessage():get_class($e);fwrite(STDERR,'Activation stopped at '.$step.': '.$reason."; inspect private backups; no automatic data deletion.\n");exit(1);}
