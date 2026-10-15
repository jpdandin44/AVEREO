<?php
declare(strict_types=1);
// Fictitious MariaDB data, run only inside the isolated test container.
require '/fixture/scheduled-backup.php';
require '/fixture/backup-cron.php';
$root='/tmp/passeport-scheduled-test'; mkdir($root,0700);
$config='/fixture/config.php'; $schema='/fixture/storage.sql'; $checks=[];
$check=static function(bool $condition,string $label)use(&$checks){if(!$condition)throw new RuntimeException($label); $checks[]=$label;};
$a=passeport_run_backup($config,$root,$schema,2,true);
$b=passeport_run_backup($config,$root,$schema,2,true);
$c=passeport_run_backup($config,$root,$schema,2,true);
$check($a['status']==='success' && $c['documents']===1 && $c['temporaryRowRestore']==='passed','scheduled copy contains verified database and file');
$check(!is_dir($root.'/runs/'.$a['id']) && is_dir($root.'/runs/'.$b['id']) && is_dir($root.'/runs/'.$c['id']) && $c['retainedCopies']===2,'rotation keeps the newest successful copies');
$latest=file_get_contents($root.'/latest.json');
$check(json_decode($latest,true)['id']===$c['id'],'latest pointer targets the verified copy');
$check(passeport_run_backup($config,$root,$schema,2)['status']==='skipped_not_due','repeated scheduled invocation does not duplicate the day');
$lock=fopen($root.'/backup.lock','c'); flock($lock,LOCK_EX);
$check(passeport_run_backup($config,$root,$schema,2,true)['status']==='skipped_locked','concurrent invocation skipped');
flock($lock,LOCK_UN); fclose($lock);
mkdir($root.'/runs/unmanaged',0700); file_put_contents($root.'/runs/unmanaged/keep.txt','keep');
$cfg=require $config; $file=glob($cfg['storage_directory'].'/*.blob')[0]; $bytes=file_get_contents($file); file_put_contents($file,'corrupted');
$failed=false;
try { passeport_run_backup($config,$root,$schema,2,true); } catch(Throwable) { $failed=true; }
file_put_contents($file,$bytes);
$check($failed && file_get_contents($root.'/latest.json')===$latest,'failed copy preserves the last good backup');
$check(json_decode(file_get_contents($root.'/status.json'),true)['status']==='failed' && !glob($root.'/runs/.pending-*'),'failure reported and incomplete staging cleaned');
$d=passeport_run_backup($config,$root,$schema,2,true);
$check($d['status']==='success' && is_file($root.'/runs/unmanaged/keep.txt'),'recovery succeeds and unmanaged directories are untouched');
$symlink=$root.'/runs/20000101T000000Z-000000000000'; symlink($cfg['storage_directory'],$symlink);
$blocked=false; try{passeport_remove_backup($root,$symlink);}catch(Throwable){$blocked=true;}
$check($blocked && file_get_contents($file)===$bytes,'symlink cleanup cannot reach original files');
$outside=false; try{passeport_run_backup($config,$cfg['storage_directory'],$schema,2,true);}catch(Throwable){$outside=true;}
$check($outside,'backup root cannot equal the live source');
$productionRoot='/home/passeport-production-test'; mkdir($productionRoot,0700);
$productionConfig='/tmp/passeport-production-config.php';
file_put_contents($productionConfig,'<?php return '.var_export(array_replace($cfg,['environment'=>'production']),true).';');
$preproductionPointer=file_get_contents($root.'/latest.json');
$production=passeport_run_backup($productionConfig,$productionRoot,$schema,2,true);
$check($production['status']==='success' && $production['documents']===1 && $production['temporaryRowRestore']==='passed','production configuration creates a verified private backup');
$check(file_get_contents($root.'/latest.json')===$preproductionPointer,'production backup preserves the other environment pointer');
$publicRoot='/home/public-production-test'; mkdir($publicRoot,0700);
$publicBlocked=false;try{passeport_run_backup($productionConfig,$publicRoot,$schema,2,true);}catch(Throwable){$publicBlocked=true;}
$check($publicBlocked && !is_dir($publicRoot.'/runs'),'production cannot create backups under a public path');
$original="MAILTO=\"\"\n17 * * * * /usr/bin/true\n";
$cronCommand='/usr/bin/php /private/passeport/scheduled-backup.php --keep=30';
$withJob=passeport_cron_append($original,$cronCommand);
$final=passeport_cron_finalize($withJob,$cronCommand);
$check(str_starts_with($withJob,$original) && str_starts_with($final,$original) && !str_contains($final,'initial-qualification'),'cron installation and qualification removal preserve other tasks');
$duplicate=false;try{passeport_cron_append($withJob,$cronCommand);}catch(Throwable){$duplicate=true;}
$check($duplicate,'duplicate cron task rejected');
$changed=false;try{passeport_cron_finalize(str_replace('20 *','21 *',$withJob),$cronCommand);}catch(Throwable){$changed=true;}
$check($changed,'unexpected cron edits cannot be overwritten');
$productionCommand='/usr/bin/php /private/passeport-production/scheduled-backup.php --keep=30';
$both=passeport_cron_append($final,$productionCommand,true,'production');
$bothFinal=passeport_cron_finalize($both,$productionCommand,'production');
$check(str_starts_with($both,$final) && str_starts_with($bothFinal,$final),'adding production and finalizing it preserve the complete preproduction block');
$check(substr_count($bothFinal,'20 * * * * ')==2 && !str_contains($bothFinal,'initial-qualification'),'both environments keep one independent scheduled task');
$productionDuplicate=false;try{passeport_cron_append($bothFinal,$productionCommand,true,'production');}catch(Throwable){$productionDuplicate=true;}
$check($productionDuplicate,'duplicate production task rejected');
$unknown=false;try{passeport_cron_append($original,$productionCommand,true,'unknown');}catch(Throwable){$unknown=true;}
$check($unknown,'unknown cron environment rejected');
$unmanaged=false;try{passeport_cron_append($original.'20 * * * * '.$productionCommand."\n",$productionCommand,true,'production');}catch(Throwable){$unmanaged=true;}
$check($unmanaged,'unmanaged backup task cannot be silently duplicated');
$incomplete=false;try{passeport_cron_append(str_replace('# END AVEREO PASSEPORT IMMO PREPROD BACKUP','',$final),$productionCommand,true,'production');}catch(Throwable){$incomplete=true;}
$check($incomplete,'incomplete block of the other environment requires inspection');
echo json_encode(['assertions'=>count($checks),'checks'=>$checks],JSON_THROW_ON_ERROR)."\n";
