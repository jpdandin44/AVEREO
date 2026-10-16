<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__.'/backup-storage.php';

function passeport_backup_json(string $path, array $value): void
{
    $bytes=json_encode($value,JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)."\n";
    $temp=$path.'.tmp-'.bin2hex(random_bytes(6));
    if (file_put_contents($temp,$bytes)!==strlen($bytes)) throw new RuntimeException('Status write failed');
    chmod($temp,0600);
    if (!rename($temp,$path)) throw new RuntimeException('Status replace failed');
}

/** Remove only this job's own staging/expired copies, never a source or manual backup. */
function passeport_remove_backup(string $root, string $directory): void
{
    if (!preg_match('/^(?:\.pending-)?[0-9]{8}T[0-9]{6}Z-[a-f0-9]{12}$/D',basename($directory))
        || dirname($directory)!==$root.'/runs' || realpath($directory)!==$directory || is_link($directory)) {
        throw new RuntimeException('Backup cleanup guard');
    }
    $entries=[];
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST) as $entry) {
        if ($entry->isLink() || (!$entry->isFile() && !$entry->isDir())) throw new RuntimeException('Unexpected backup entry');
        $entries[]=[$entry->getPathname(),$entry->isDir()];
    }
    foreach ($entries as [$path,$isDirectory]) {
        if (!($isDirectory ? rmdir($path) : unlink($path))) throw new RuntimeException('Backup cleanup failed');
    }
    if (!rmdir($directory)) throw new RuntimeException('Backup directory cleanup failed');
}

function passeport_run_backup(string $configPath, string $root, string $schema, int $keep=30, bool $force=false): array
{
    umask(0077);
    if ($keep<2 || $keep>365 || realpath($root)!==$root || is_link($root)
        || is_link($configPath) || !is_file($schema) || is_link($schema)) throw new RuntimeException('Backup configuration guard');
    $config=require $configPath;
    if (!in_array($config['environment'] ?? '',['local','preprod','production'],true) || empty($config['storage_enabled'])) throw new RuntimeException('Known environment with storage enabled required');
    $source=realpath($config['storage_directory']);
    if (!$source || $root===$source || str_starts_with($root,$source.'/') || str_starts_with($source,$root.'/')) throw new RuntimeException('Source and backup separation required');
    if (($config['environment'] ?? '')!=='local' && (!str_starts_with($root,'/home/') || str_contains($root,'/public'))) throw new RuntimeException('Private root required');
    if (!is_dir($root.'/runs') && !mkdir($root.'/runs',0700)) throw new RuntimeException('Backup runs directory');
    if (is_link($root.'/runs') || realpath($root.'/runs')!==$root.'/runs') throw new RuntimeException('Runs path guard');
    chmod($root,0700); chmod($root.'/runs',0700);
    if (is_link($root.'/backup.lock')) throw new RuntimeException('Lock path guard');
    $lock=fopen($root.'/backup.lock','c');
    if (!$lock) throw new RuntimeException('Backup lock unavailable');
    chmod($root.'/backup.lock',0600);
    if (!flock($lock,LOCK_EX|LOCK_NB)) { fclose($lock); return ['status'=>'skipped_locked']; }
    $pending=null;
    try {
        $now=new DateTimeImmutable('now',new DateTimeZone('Europe/Paris'));
        $date=$now->format('Y-m-d');
        $latestPath=$root.'/latest.json'; $latest=is_file($latestPath) ? json_decode(file_get_contents($latestPath),true,64,JSON_THROW_ON_ERROR) : null;
        if (!$force && ($now<$now->setTime(3,20) || ($latest['backupDate'] ?? '')===$date)) return ['status'=>'skipped_not_due'];
        $clock=new DateTimeImmutable('now',new DateTimeZone('UTC'));
        $id=$clock->format('Ymd\THis\Z').'-'.sprintf('%06x',(int)$clock->format('u')).bin2hex(random_bytes(3));
        $pending=$root.'/runs/.pending-'.$id;
        $proof=passeport_backup($config,$pending);
        $schemaBytes=file_get_contents($schema);
        if (file_put_contents($pending.'/schema.sql',$schemaBytes)!==strlen($schemaBytes)) throw new RuntimeException('Backup schema copy');
        chmod($pending.'/schema.sql',0600);
        if (hash_file('sha256',$pending.'/schema.sql')!==hash('sha256',$schemaBytes)) throw new RuntimeException('Schema readback failed');
        $receipt=['format'=>'avereo-passeport-private-backup','version'=>1,'id'=>$id,'backupDate'=>$date,
            'completedAt'=>gmdate('c'),'timezone'=>'Europe/Paris','retentionSuccessfulCopies'=>$keep,
            'trigger'=>getenv('AVEREO_BACKUP_TRIGGER')==='cron' ? 'cron' : 'manual',
            'proof'=>$proof,'schemaSha256'=>hash('sha256',$schemaBytes)];
        passeport_backup_json($pending.'/complete.json',$receipt);
        $destination=$root.'/runs/'.$id;
        if (!rename($pending,$destination)) throw new RuntimeException('Backup publication failed');
        $pending=null;
        // Publish only verified copies. Failed attempts never replace the last successful pointer.
        passeport_backup_json($latestPath,$receipt);
        $completed=[];
        foreach (glob($root.'/runs/*') ?: [] as $directory) {
            $complete=$directory.'/complete.json';
            if (is_link($directory) || !is_dir($directory) || !is_file($complete)) continue;
            $item=json_decode(file_get_contents($complete),true,64,JSON_THROW_ON_ERROR);
            if (($item['format'] ?? '')!=='avereo-passeport-private-backup' || ($item['id'] ?? '')!==basename($directory)
                || !is_file($directory.'/snapshot.json') || hash_file('sha256',$directory.'/snapshot.json')!==($item['proof']['snapshotSha256'] ?? null)) continue;
            $completed[$item['id']]=$directory;
        }
        krsort($completed,SORT_STRING);
        $completed=[$id=>$destination]+$completed; // Always retain the just-verified copy, even after a clock correction.
        $removed=0;
        foreach (array_slice(array_values($completed),$keep) as $expired) { passeport_remove_backup($root,$expired); $removed++; }
        $result=['status'=>'success','completedAt'=>$receipt['completedAt'],'backupDate'=>$date,'id'=>$id,
            'trigger'=>$receipt['trigger'],'tables'=>$proof['tables'],'documents'=>$proof['documents'],'fileReadback'=>$proof['fileReadback'],
            'temporaryRowRestore'=>$proof['temporaryRowRestore'],'retainedCopies'=>min(count($completed),$keep),
            'expiredManagedCopiesRemoved'=>$removed,'snapshotSha256'=>$proof['snapshotSha256']];
        passeport_backup_json($root.'/status.json',$result);
        return $result;
    } catch (Throwable $error) {
        if ($pending && is_dir($pending)) passeport_remove_backup($root,$pending);
        passeport_backup_json($root.'/status.json',['status'=>'failed','failedAt'=>gmdate('c'),'errorClass'=>get_class($error),
            'lastSuccessfulBackupPreserved'=>is_file($root.'/latest.json')]);
        throw $error;
    } finally { flock($lock,LOCK_UN); fclose($lock); }
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '')===__FILE__) {
    // No secret in the command or cron entry; the existing private config supplies it.
    $options=getopt('',['config:','root:','schema:','keep:','force']);
    try {
        $result=passeport_run_backup((string)($options['config'] ?? ''),(string)($options['root'] ?? ''),
            (string)($options['schema'] ?? ''),(int)($options['keep'] ?? 30),array_key_exists('force',$options));
        if ($result['status']==='success') echo json_encode($result,JSON_THROW_ON_ERROR)."\n";
    } catch (Throwable $error) { fwrite(STDERR,'Passeport backup failed: '.get_class($error)."\n"); exit(1); }
}
