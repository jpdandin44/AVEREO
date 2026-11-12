<?php
declare(strict_types=1);
require dirname(__DIR__).'/frontend/public/api/storage.php';
$fixtures=json_decode(file_get_contents(__DIR__.'/fixtures/archives.json'),true,512,JSON_THROW_ON_ERROR);
$path=tempnam(sys_get_temp_dir(),'pi-archive-');
$assertions=0;
function verify(bool $value,string $message):void {
    global $assertions;
    if (!$value) throw new RuntimeException($message);
    $assertions++;
}
function refused(callable $operation,string $message):void {
    try { $operation(); } catch (PasseportError $e) { verify($e->status===422,$message); return; }
    throw new RuntimeException('Expected rejection: '.$message);
}
try {
    foreach ($fixtures as $fixture) {
        $bytes=base64_decode($fixture['base64'],true);
        file_put_contents($path,$bytes);clearstatcache(true,$path);
        $meta=PasseportStorage::inspectFile($path,$fixture['name']);
        verify($meta['mime']===$fixture['mime'],'Canonical archive MIME: '.$fixture['name']);
        verify($meta['size']===strlen($bytes) && $meta['sha256']===hash('sha256',$bytes),'Exact bytes fingerprint');
        verify(file_get_contents($path)===$bytes,'Inspection did not extract or change the file');
        file_put_contents($path,'This is not an archive');clearstatcache(true,$path);
        refused(fn()=>PasseportStorage::inspectFile($path,$fixture['name']),'Wrong archive signature');
        file_put_contents($path,substr($bytes,0,4));clearstatcache(true,$path);
        refused(fn()=>PasseportStorage::inspectFile($path,$fixture['name']),'Truncated container');
    }
    file_put_contents($path,base64_decode($fixtures[0]['base64'],true));clearstatcache(true,$path);
    verify(PasseportStorage::inspectFile($path,'DOSSIER.ZIP')['mime']==='application/zip','Uppercase extension');
    refused(fn()=>PasseportStorage::inspectFile($path,'fichier.exe'),'Forbidden extension');
    refused(fn()=>PasseportStorage::inspectFile($path,'../dossier.zip'),'Path in filename');
    file_put_contents($path,'');clearstatcache(true,$path);
    refused(fn()=>PasseportStorage::inspectFile($path,'vide.zip'),'Empty file');
    file_put_contents($path,"PK\x03\x04");$handle=fopen($path,'r+b');ftruncate($handle,25*1024*1024+1);fclose($handle);clearstatcache(true,$path);
    refused(fn()=>PasseportStorage::inspectFile($path,'grand.zip'),'25 MiB limit');
    echo json_encode(['assertions'=>$assertions,'archiveFixtures'=>count($fixtures),'scope'=>'file-inspection-only','status'=>'passed'],JSON_THROW_ON_ERROR).PHP_EOL;
} finally { unlink($path); }
