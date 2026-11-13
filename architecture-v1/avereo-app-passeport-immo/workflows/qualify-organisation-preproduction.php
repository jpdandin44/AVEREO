<?php
declare(strict_types=1);
// Private CLI: temporary copies only for rehearsal; live schema readback thereafter.
if(PHP_SAPI!=='cli'||$argc!==3||!in_array($argv[2],['rehearse','verify','rollback-check'],true))exit(2);
$work=$argv[1];$action=$argv[2];$home='/home/daje3540';
if(realpath($work)!==$work||dirname($work)!==$home.'/private'||!str_starts_with(basename($work),'preprod-rapport-passeport-archives-organisation-'))exit(2);
umask(0077);
function org_check(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
function org_normalize(array $rows):array{$rows=array_map(static fn($row)=>json_encode($row,JSON_THROW_ON_ERROR),$rows);sort($rows);return $rows;}
function org_original_rows(PDO $db,array $snapshot):void{
    foreach($snapshot['tables']as$table=>$expected){
        org_check(in_array($table,['pi_workspaces','pi_clients','pi_biens','pi_documents'],true),'Unknown snapshot table');
        $rows=$db->query('SELECT * FROM '.$table)->fetchAll(PDO::FETCH_ASSOC);
        $column=$table==='pi_documents'?'trashed_at':($table==='pi_biens'?'document_settings':null);
        if($column && $expected && !array_key_exists($column,$expected[0]))foreach($rows as&$row){org_check(($row[$column]??null)===null,'New organisation already in use; inspect concurrent write');unset($row[$column]);}unset($row);
        org_check(org_normalize($rows)===org_normalize($expected),'Business data drift since fresh backup');
    }
}
try{
    $config=require $home.'/.avereo/passeport-immo-preprod/config.php';
    $production=require $home.'/.avereo/passeport-immo/config.php';
    org_check($config['storage_dsn']!==$production['storage_dsn'] && $config['storage_directory']!==$production['storage_directory'],'Environment separation required');
    $db=new PDO($config['storage_dsn'],$config['storage_user'],$config['storage_password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $database=$db->query('SELECT DATABASE()')->fetchColumn();org_check(is_string($database)&&preg_match('/^[a-zA-Z0-9_]+$/D',$database)===1,'Database identifier invalid');
    $columns=['pi_documents'=>['trashed_at','VARCHAR(32) NULL'],'pi_biens'=>['document_settings','LONGTEXT NULL']];
    if($action==='rollback-check'){
        $allowed=true;foreach($columns as$table=>[$column])if($db->query("SHOW COLUMNS FROM $table LIKE '$column'")->fetch())$allowed=$allowed&&(int)$db->query("SELECT COUNT(*) FROM $table WHERE $column IS NOT NULL")->fetchColumn()===0;
        echo json_encode(['allowed'=>$allowed,'liveRowsChanged'=>false],JSON_THROW_ON_ERROR)."\n";exit;
    }
    $snapshot=json_decode(file_get_contents($work.'/recovery/passeport-immo/data/snapshot.json'),true,64,JSON_THROW_ON_ERROR);
    org_original_rows($db,$snapshot);
    foreach($snapshot['files']as$file)org_check(is_file($config['storage_directory'].'/'.$file['name']) && hash_file('sha256',$config['storage_directory'].'/'.$file['name'])===$file['sha256'],'Private file differs from backup');
    require $work.'/migrate-document-organisation.php';
    $dry=passeport_migrate_document_organisation($config,$database);
    if($action==='verify'){
        org_check($dry['requiredColumns']===[],'Additive migration is not installed');
        $verified=passeport_migrate_document_organisation($config,$database,true);
        org_original_rows($db,$snapshot);
        $receipt=['status'=>'verified','observedAt'=>gmdate('c'),'existingRowsPreserved'=>true,'documentsPreserved'=>count($snapshot['files']),'columnsVerified'=>array_map(fn($item)=>$item[0],$columns),'liveBusinessRowsChanged'=>false,'schemaVerifiedByOriginalMigration'=>$verified];
        file_put_contents($work.'/organisation-migration-public.json',json_encode($receipt,JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT));
        echo json_encode($receipt,JSON_THROW_ON_ERROR)."\n";exit;
    }
    $sql="USE `$database`;\n";
    foreach($columns as$table=>[$column,$definition])if(in_array($column,$dry['requiredColumns'],true))$sql.="ALTER TABLE `$database`.`$table` ADD COLUMN `$column` $definition;\n";
    file_put_contents($work.'/organisation-migration-private.sql',$sql);chmod($work.'/organisation-migration-private.sql',0600);
    $rehearsal=$work.'/rehearsal-documents-'.bin2hex(random_bytes(6));mkdir($rehearsal,0700);
    require $work.'/candidate-public/api/storage.php';
    $copyConfig=$config;$copyConfig['storage_directory']=$rehearsal;
    $store=new PasseportStorage($copyConfig,'organisation-rehearsal-'.bin2hex(random_bytes(8)));
    // All four names are shadowed by connection-local TEMPORARY tables before any DML.
    foreach($snapshot['tables']as$table=>$rows){
        // LIKE strips foreign keys; its temporary definition can then shadow the live name.
        $temporary='pi_organisation_copy_'.bin2hex(random_bytes(6));
        $store->db->exec("CREATE TEMPORARY TABLE `$temporary` LIKE `$table`");
        $copyDefinition=$store->db->query("SHOW CREATE TABLE `$temporary`")->fetch(PDO::FETCH_NUM)[1];
        $shadowDefinition=preg_replace('/^CREATE TEMPORARY TABLE `'.$temporary.'`/', 'CREATE TEMPORARY TABLE `'.$table.'`', $copyDefinition, 1, $replaced);
        org_check($replaced===1,'Temporary source definition required');
        $store->db->exec($shadowDefinition);
        $definition=$store->db->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_NUM)[1];
        org_check(str_contains($definition,'CREATE TEMPORARY TABLE'),'Temporary shadow required');
        foreach($rows as$row){$keys=array_keys($row);$statement=$store->db->prepare('INSERT INTO `'.$table.'` (`'.implode('`,`',$keys).'`) VALUES ('.implode(',',array_fill(0,count($keys),'?')).')');$statement->execute(array_values($row));}
    }
    foreach($columns as$table=>[$column,$definition])if(!$store->db->query("SHOW COLUMNS FROM $table LIKE '$column'")->fetch())$store->db->exec("ALTER TABLE `$table` ADD COLUMN `$column` $definition");
    org_original_rows($store->db,$snapshot);
    $store->saveWorkspace(['revision'=>0,'biens'=>[['id'=>'rehearsal','dossier'=>[]]],'tarifs'=>[]]);
    $store->linkClient('rehearsal',['name'=>'Client fictif de qualification']);
    $fixture=$work.'/fixture-organisation.txt';file_put_contents($fixture,'Fichier fictif de qualification.');
    $added=$store->addFiles('rehearsal',[['path'=>$fixture,'name'=>'qualification.txt']],'plans',true)['added'][0];
    $settings=$store->saveDocumentSettings('rehearsal',['revision'=>0,'categories'=>['plans'=>['icon'=>'leaf','color'=>'#74539d']],'order'=>['plans'=>[$added['id']]]]);
    org_check($settings['revision']===1,'Organisation on temporary copy');
    $store->updateDocument('rehearsal',$added['id'],['archived'=>true]);
    $trashed=$store->updateDocument('rehearsal',$added['id'],['trashed'=>true]);
    $restored=$store->updateDocument('rehearsal',$added['id'],['trashed'=>false]);
    org_check($trashed['trashedAt']!==null&&$restored['trashedAt']===null&&$restored['archivedAt']===$trashed['archivedAt'],'Archived trash restoration on copy');
    $store->updateDocument('rehearsal',$added['id'],['trashed'=>true]);$store->deleteDocument('rehearsal',$added['id']);
    org_check(!is_file($copyConfig['storage_directory'].'/'.$added['id'].'.blob'),'Fixture purge removes copied blob');
    org_original_rows($db,$snapshot);
    $receipt=['status'=>'passed','observedAt'=>gmdate('c'),'copiedTables'=>count($snapshot['tables']),'liveDocumentsVerified'=>count($snapshot['files']),'migrationDdlOnTemporaryCopy'=>'passed','organisationOnTemporaryCopy'=>'passed','trashRestorePurgeOnTemporaryCopy'=>'passed','liveRowsChanged'=>false,'liveDocumentFilesChanged'=>false,'originalMigrationDryRun'=>$dry,'requiresExistingAdminForLiveDdl'=>true];
    file_put_contents($work.'/organisation-rehearsal-public.json',json_encode($receipt,JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT));
    echo json_encode($receipt,JSON_THROW_ON_ERROR)."\n";
}catch(Throwable $error){fwrite(STDERR,'Private organisation qualification failed: '.get_class($error).' '.$error->getMessage()."\n");exit(1);}
