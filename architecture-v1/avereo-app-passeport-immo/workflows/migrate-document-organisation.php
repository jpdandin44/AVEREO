<?php
declare(strict_types=1);
// Additive migration only; default dry run, dedicated database explicitly named.
function passeport_migrate_document_organisation(array $config,string $expectedDatabase,bool $apply=false): array
{
    $db=new PDO($config['storage_dsn'],$config['storage_user'],$config['storage_password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    if ($expectedDatabase==='' || $db->query('SELECT DATABASE()')->fetchColumn()!==$expectedDatabase) throw new RuntimeException('Base attendue différente ; aucune migration.');
    $tables=$db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);sort($tables);
    if ($tables!==['pi_biens','pi_clients','pi_documents','pi_workspaces']) throw new RuntimeException('Base dédiée Passeport Immo requise.');
    $lock='pi-organisation-'.hash('sha256',$expectedDatabase);
    $statement=$db->prepare('SELECT GET_LOCK(?,0)');$statement->execute([$lock]);
    if ((int)$statement->fetchColumn()!==1) throw new RuntimeException('Migration déjà en cours.');
    try {
        $missing=[];
        foreach (['pi_documents'=>['trashed_at','VARCHAR(32) NULL'],'pi_biens'=>['document_settings','LONGTEXT NULL']] as $table=>[$column,$definition]) {
            $current=$db->query("SHOW COLUMNS FROM $table LIKE '$column'")->fetch();
            if (!$current) $missing[]=compact('table','column','definition');
            elseif (strtolower($current['Type'])!==strtolower(explode(' ',$definition)[0]) || $current['Null']!=='YES') throw new RuntimeException('Colonne existante incompatible ; aucune modification automatique.');
        }
        if (!$apply) return ['status'=>'dry_run','requiredColumns'=>array_column($missing,'column'),'liveRowsChanged'=>false];
        $added=array_column($missing,'column','table');
        $snapshot=static function()use($db,$tables,$added):array {
            $result=[];
            foreach ($tables as $table) {
                $rows=$db->query('SELECT * FROM '.$table)->fetchAll();
                $encoded=[]; foreach ($rows as $row) {
                    if(isset($added[$table]))unset($row[$added[$table]]);
                    $encoded[]=json_encode($row,JSON_THROW_ON_ERROR);
                }
                sort($encoded);$result[$table]=hash('sha256',json_encode($encoded,JSON_THROW_ON_ERROR));
            }
            return $result;
        };
        $before=$snapshot();
        foreach ($missing as ['table'=>$table,'column'=>$column,'definition'=>$definition]) $db->exec("ALTER TABLE $table ADD COLUMN $column $definition");
        if ($snapshot()!==$before) throw new RuntimeException('Données modifiées pendant la migration ; suspendre la livraison et contrôler la sauvegarde.');
        return ['status'=>'verified','addedColumns'=>array_column($missing,'column'),'existingRowsPreserved'=>true,'liveRowsChanged'=>false];
    } finally {$statement=$db->prepare('SELECT RELEASE_LOCK(?)');$statement->execute([$lock]);}
}
if(realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__){
    if(PHP_SAPI!=='cli'||!in_array($argc,[3,4],true)||($argc===4&&$argv[3]!=='--apply'))exit(2);
    try {echo json_encode(passeport_migrate_document_organisation(require $argv[1],$argv[2],$argc===4),JSON_THROW_ON_ERROR)."\n";}
    catch(Throwable $error){fwrite(STDERR,'Migration refusée : '.$error->getMessage()."\n");exit(1);}
}
