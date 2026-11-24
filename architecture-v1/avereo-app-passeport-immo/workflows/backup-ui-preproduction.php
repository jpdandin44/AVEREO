<?php
declare(strict_types=1);
// Private CLI staging. Reuse the tested snapshot/temporary-table restoration.
if (PHP_SAPI !== 'cli' || $argc !== 2) exit(2);
require __DIR__.'/backup-storage.php';
$home='/home/daje3540'; $destination=$argv[1];
if (realpath($destination)!==$destination || !str_starts_with($destination,$home.'/private/preprod-rapport-passeport-archives-ux-ui-') || basename($destination)!=='recovery') exit(2);
try {
    $config=require $home.'/.avereo/passeport-immo-preprod/config.php';
    $production=require $home.'/.avereo/passeport-immo/config.php';
    if (($config['storage_dsn']??null)===($production['storage_dsn']??null)
        || rtrim($config['storage_origin']??'','/')!=='https://passeport-immo-preprod.avereo.fr') throw new RuntimeException('Target isolation');
    $result=passeport_backup($config,$destination.'/passeport-immo/data');
    $result['productionDatabaseDistinct']=true;
    $path=$destination.'/data-recovery.json';
    if (file_put_contents($path,json_encode($result,JSON_THROW_ON_ERROR))===false || !chmod($path,0600)) throw new RuntimeException('Receipt unavailable');
    echo json_encode(['status'=>'verified','tables'=>$result['tables'],'documents'=>$result['documents'],'temporaryRowRestore'=>$result['temporaryRowRestore']],JSON_THROW_ON_ERROR).PHP_EOL;
} catch (Throwable $error) {
    fwrite(STDERR,'Private UI recovery failed: '.get_class($error).PHP_EOL); exit(1);
}
