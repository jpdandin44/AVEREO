<?php
declare(strict_types=1);
// CLI only; this file is never part of the public candidate.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

/** Private consistent data/file snapshot, tested by restoring into temporary tables. */
function passeport_backup(array $config, string $destination): array
{
    if (file_exists($destination) || is_link(dirname($destination)) || !is_dir(dirname($destination))) throw new RuntimeException('Destination neuve requise.');
    if (!mkdir($destination,0700) || !mkdir($destination.'/documents',0700)) throw new RuntimeException('Sauvegarde indisponible.');
    $pdo=new PDO($config['storage_dsn'],$config['storage_user'],$config['storage_password'],[
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
    ]);
    $tables=['pi_workspaces','pi_clients','pi_biens','pi_documents']; $snapshot=['tables'=>[],'files'=>[]];
    $pdo->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    $pdo->beginTransaction();
    try {
        foreach ($tables as $table) {
            $snapshot['tables'][$table]=$pdo->query('SELECT * FROM '.$table)->fetchAll();
        }
        foreach ($snapshot['tables']['pi_documents'] as $doc) {
            if (!preg_match('/^[a-f0-9]{32}$/D',$doc['id'])) throw new RuntimeException('Identifiant non conforme.');
            $name=$doc['id'].'.blob'; $source=$config['storage_directory'].'/'.$name; $target=$destination.'/documents/'.$name;
            if (is_link($source) || !is_file($source) || !copy($source,$target)) throw new RuntimeException('Copie privée échouée.');
            chmod($target,0600);
            if (filesize($target)!==(int)$doc['size'] || hash_file('sha256',$target)!==$doc['sha256']) throw new RuntimeException('Empreinte privée non conforme.');
            $snapshot['files'][]=['name'=>$name,'size'=>(int)$doc['size'],'sha256'=>$doc['sha256']];
        }
        $pdo->commit();
    } catch (Throwable $error) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $error; }
    $path=$destination.'/snapshot.json';
    file_put_contents($path,json_encode($snapshot,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE)); chmod($path,0600);
    $readback=json_decode(file_get_contents($path),true,64,JSON_THROW_ON_ERROR);
    if ($readback!==$snapshot) throw new RuntimeException('Relecture sauvegarde échouée.');
    // No live table is changed: all row restoration occurs in connection-local TEMPORARY tables.
    foreach ($tables as $table) {
        $clone='pi_restore_'.$table;
        $pdo->exec('CREATE TEMPORARY TABLE '.$clone.' LIKE '.$table);
        foreach ($readback['tables'][$table] as $row) {
            $fields=array_keys($row);
            $sql='INSERT INTO '.$clone.' (`'.implode('`,`',$fields).'`) VALUES ('.implode(',',array_fill(0,count($fields),'?')).')';
            $pdo->prepare($sql)->execute(array_values($row));
        }
        $restored=$pdo->query('SELECT * FROM '.$clone)->fetchAll();
        $normalize=static function(array $rows): array { $items=array_map(static fn($row)=>json_encode($row,JSON_THROW_ON_ERROR),$rows); sort($items); return $items; };
        if ($normalize($restored)!==$normalize($readback['tables'][$table])) throw new RuntimeException('Restauration temporaire différente.');
        $pdo->exec('DROP TEMPORARY TABLE '.$clone);
    }
    return ['snapshotSha256'=>hash_file('sha256',$path),'tables'=>count($tables),'documents'=>count($snapshot['files']),
        'fileReadback'=>'passed','temporaryRowRestore'=>'passed','liveRowsChanged'=>false];
}
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '')===__FILE__) {
    if ($argc!==3) { fwrite(STDERR,"Usage: php backup-storage.php /private/config.php /private/new-backup-directory\n"); exit(2); }
    try { echo json_encode(passeport_backup(require $argv[1],$argv[2]),JSON_THROW_ON_ERROR)."\n"; }
    catch (Throwable $error) { fwrite(STDERR,"Échec de sauvegarde privée : ".get_class($error)."\n"); exit(1); }
}
