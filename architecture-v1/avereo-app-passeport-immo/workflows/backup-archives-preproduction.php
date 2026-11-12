<?php
declare(strict_types=1);
// Existing backup engine; private CLI staging only. No credentials are exported.
if (PHP_SAPI !== 'cli' || $argc !== 2) { exit(2); }
require __DIR__.'/backup-storage.php';
$root='/home/daje3540';
$recovery=$argv[1];
if (realpath($recovery)!==$recovery || !str_starts_with($recovery,$root.'/private/preprod-rapport-passeport-archives-') || basename($recovery)!=='recovery') { exit(2); }
try {
    $result=passeport_backup(require $root.'/.avereo/passeport-immo-preprod/config.php',$recovery.'/passeport-immo/data');
    $path=$recovery.'/data-recovery.json';
    if (file_put_contents($path,json_encode($result,JSON_THROW_ON_ERROR))===false || !chmod($path,0600)) { throw new RuntimeException('Receipt unavailable'); }
    echo json_encode(['status'=>'verified','tables'=>$result['tables'],'documents'=>$result['documents']],JSON_THROW_ON_ERROR)."\n";
} catch (Throwable $error) {
    fwrite(STDERR,"Private preproduction backup failed: ".get_class($error)."\n"); exit(1);
}
