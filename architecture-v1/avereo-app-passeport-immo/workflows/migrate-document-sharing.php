<?php
declare(strict_types=1);
// CLI only; one nullable field on the explicitly selected dedicated database.
if(PHP_SAPI!=='cli'||!in_array($argc,[3,4],true)||($argc===4&&$argv[3]!=='--apply'))exit(2);
try{
    $c=require $argv[1];$db=new PDO($c['storage_dsn'],$c['storage_user'],$c['storage_password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    if($argv[2]===''||$db->query('SELECT DATABASE()')->fetchColumn()!==$argv[2])throw new RuntimeException('Base attendue différente');
    $tables=$db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);sort($tables);if($tables!==['pi_biens','pi_clients','pi_documents','pi_workspaces'])throw new RuntimeException('Base dédiée requise');
    $column=$db->query("SHOW COLUMNS FROM pi_biens LIKE 'document_shares'")->fetch();
    if($column&&(strtolower($column['Type'])!=='longtext'||$column['Null']!=='YES'))throw new RuntimeException('Colonne incompatible');
    if($argc===3){echo json_encode(['status'=>'dry_run','requiredColumns'=>$column?[]:['document_shares'],'liveRowsChanged'=>false]).PHP_EOL;exit;}
    $lock=$db->prepare('SELECT GET_LOCK(?,0)');$name='pi-sharing-'.hash('sha256',$argv[2]);$lock->execute([$name]);if((int)$lock->fetchColumn()!==1)throw new RuntimeException('Migration occupée');
    try{
        $snapshot=static function()use($db,$tables):array{$out=[];foreach($tables as$t){$rows=$db->query('SELECT * FROM '.$t)->fetchAll();$items=[];foreach($rows as$r){if($t==='pi_biens')unset($r['document_shares']);$items[]=json_encode($r,JSON_THROW_ON_ERROR);}sort($items);$out[$t]=hash('sha256',json_encode($items,JSON_THROW_ON_ERROR));}return $out;};
        $before=$snapshot();if(!$column)$db->exec('ALTER TABLE pi_biens ADD COLUMN document_shares LONGTEXT NULL');if($before!==$snapshot())throw new RuntimeException('Données modifiées pendant migration');
        echo json_encode(['status'=>'verified','addedColumns'=>$column?[]:['document_shares'],'existingRowsPreserved'=>true]).PHP_EOL;
    }finally{$db->prepare('SELECT RELEASE_LOCK(?)')->execute([$name]);}
}catch(Throwable $e){fwrite(STDERR,'Migration refusée : '.$e->getMessage().PHP_EOL);exit(1);}
