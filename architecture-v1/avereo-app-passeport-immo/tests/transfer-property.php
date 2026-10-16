<?php
declare(strict_types=1);
require '/fixture/transfer-property.php';
$source=require '/fixture/source.php'; $target=require '/fixture/target.php';
$src=pi_transfer_database($source,'preprod'); $dst=pi_transfer_database($target,'production');
$schema=file_get_contents('/fixture/storage.sql'); $src->exec($schema); $dst->exec($schema);
$checks=[];
function check(bool $value,string $label): void { global $checks; if (!$value) throw new RuntimeException($label); $checks[]=$label; }
function refused(callable $action,string $label): void { try {$action();} catch (Throwable) {check(true,$label);return;} throw new RuntimeException('Not refused: '.$label); }
function rows(PDO $db): array { $result=[]; foreach (['pi_workspaces','pi_clients','pi_biens','pi_documents'] as $table) $result[$table]=$db->query('SELECT * FROM '.$table.' ORDER BY 1,2')->fetchAll(); return $result; }
function cli(array $arguments): array {
    $process=proc_open([PHP_BINARY,'/fixture/transfer-property.php',...$arguments],[1=>['pipe','w'],2=>['pipe','w']],$pipes);
    if (!$process) throw new RuntimeException('CLI unavailable');
    $output=stream_get_contents($pipes[1]); $error=stream_get_contents($pipes[2]); fclose($pipes[1]); fclose($pipes[2]);
    return [proc_close($process),$output ? json_decode($output,true,64,JSON_THROW_ON_ERROR) : null,$error];
}
$owner='avereo_connect:101'; $destinationOwner='avereo_connect:908'; $clientId=str_repeat('a',32); $otherId=str_repeat('b',32);
$plan=['source'=>['environment'=>'preprod','ownerId'=>$owner,'bienId'=>'fixture-selected'], 'target'=>['environment'=>'production','ownerId'=>$destinationOwner]];
pi_transfer_insert($src,'pi_workspaces',['owner_id'=>$owner,'revision'=>7,'settings'=>'{"privateTariff":1234}']);
pi_transfer_insert($src,'pi_workspaces',['owner_id'=>'foreign','revision'=>2,'settings'=>'{}']);
pi_transfer_insert($src,'pi_clients',['id'=>$clientId,'owner_id'=>$owner,'name'=>'Client fictif sélectionné','created_at'=>'2026-01-01T10:00:00Z']);
pi_transfer_insert($src,'pi_clients',['id'=>$otherId,'owner_id'=>'foreign','name'=>'Client fictif exclu','created_at'=>'2026-01-02T10:00:00Z']);
foreach ([[$owner,'fixture-selected',$clientId],[$owner,'fixture-other',$clientId],['foreign','foreign-property',$otherId]] as [$o,$b,$c]) {
    pi_transfer_insert($src,'pi_biens',['owner_id'=>$o,'bien_id'=>$b,'model'=>json_encode(['id'=>$b,'address'=>'Adresse fictive '.$b,'dossier'=>['notes'=>'Note conservée']],JSON_UNESCAPED_UNICODE),'client_id'=>$c,'deleted_at'=>null]);
}
$sourceDocuments=[];
for ($i=1;$i<=4;$i++) {
    $id=str_pad(dechex($i),32,'0',STR_PAD_LEFT); $selected=$i<=3; $bytes="%PDF-1.4\nFixture $i\n%%EOF\n";
    file_put_contents($source['storage_directory'].'/'.$id.'.blob',$bytes);
    $document=['id'=>$id,'owner_id'=>$selected?$owner:'foreign','bien_id'=>$selected?'fixture-selected':'foreign-property','client_id'=>$selected?$clientId:$otherId,
        'name'=>'piece-'.$i.'.pdf','title'=>'Titre fictif '.$i,'category'=>'plans','mime'=>'application/pdf','size'=>strlen($bytes),'sha256'=>hash('sha256',$bytes),
        'added_at'=>'2026-02-01T10:00:00Z','updated_at'=>'2026-02-02T11:00:00Z','archived_at'=>$i===3?'2026-02-03T12:00:00Z':null];
    pi_transfer_insert($src,'pi_documents',$document); if ($selected) $sourceDocuments[]=$document;
}
pi_transfer_insert($dst,'pi_workspaces',['owner_id'=>$destinationOwner,'revision'=>11,'settings'=>'{"existingTariff":77}']);
// The source's client ID already belongs to a different target tenant: deterministic remapping must preserve it.
pi_transfer_insert($dst,'pi_clients',['id'=>$clientId,'owner_id'=>'foreign-target','name'=>'Autre client cible','created_at'=>'2020-01-01']);
pi_transfer_insert($dst,'pi_biens',['owner_id'=>$destinationOwner,'bien_id'=>'existing-property','model'=>'{"id":"existing-property"}','client_id'=>null,'deleted_at'=>null]);
$sourceBefore=rows($src); $targetBefore=rows($dst);
$export=pi_transfer_export($source,$plan,'/tmp/export-selected'); $hash=$export['manifestSha256'];
$manifest=json_decode(file_get_contents('/tmp/export-selected/manifest.json'),true,64,JSON_THROW_ON_ERROR);
check($export['documents']===3 && $export['activeDocuments']===2 && $export['archivedDocuments']===1,'export selects active and archived documents');
check(count($manifest['documents'])===3 && $manifest['property']['bien_id']==='fixture-selected' && $manifest['client']['id']===$clientId,'export contains only selected property and linked client');
check(!str_contains(file_get_contents('/tmp/export-selected/manifest.json'),'privateTariff') && !str_contains(file_get_contents('/tmp/export-selected/manifest.json'),'foreign-property')
    && !str_contains(file_get_contents('/tmp/export-selected/manifest.json'),$source['storage_password']),'export excludes settings, other property, accounts and secrets');
check(count(glob('/tmp/export-selected/documents/*.blob'))===3 && (fileperms('/tmp/export-selected')&0777)===0700
    && (fileperms('/tmp/export-selected/manifest.json')&0777)===0600,'export inventory and private permissions');
check(pi_transfer_import($target,$plan,'/tmp/export-selected',$hash)['status']==='ready_dry_run' && rows($dst)===$targetBefore && glob($target['storage_directory'].'/*')===[],'default simulation changes no row or file');
refused(fn()=>pi_transfer_import($target,$plan,'/tmp/export-selected',str_repeat('0',64),true),'wrong manifest hash refused');
$wrong=$plan; $wrong['target']['ownerId']='wrong-owner'; refused(fn()=>pi_transfer_import($target,$wrong,'/tmp/export-selected',$hash,true),'wrong target account refused');
$wrong=$plan; $wrong['source']['ownerId']='wrong-source'; refused(fn()=>pi_transfer_import($target,$wrong,'/tmp/export-selected',$hash,true),'wrong source account refused');
$wrong=$target; $wrong['environment']='preprod'; refused(fn()=>pi_transfer_import($wrong,$plan,'/tmp/export-selected',$hash,true),'target configuration environment mismatch refused');
$wrong=$source; $wrong['environment']='production'; refused(fn()=>pi_transfer_import($wrong,$plan,'/tmp/export-selected',$hash,true),'same source database refused');
$badSource=$plan; $badSource['source']['ownerId']='foreign'; refused(fn()=>pi_transfer_export($source,$badSource,'/tmp/absent-export'),'export cannot select another account property');
$blob='/tmp/export-selected/documents/'.$sourceDocuments[0]['id'].'.blob'; $bytes=file_get_contents($blob); file_put_contents($blob,'altered');
refused(fn()=>pi_transfer_import($target,$plan,'/tmp/export-selected',$hash,true),'corrupted source blob refused before import'); file_put_contents($blob,$bytes);
file_put_contents('/tmp/export-selected/unexpected.txt','excluded'); refused(fn()=>pi_transfer_import($target,$plan,'/tmp/export-selected',$hash,true),'unexpected package file refused'); unlink('/tmp/export-selected/unexpected.txt');
$wrongManifest=$manifest; $wrongManifest['client']['owner_id']='foreign'; file_put_contents('/tmp/export-selected/manifest.json',json_encode($wrongManifest));
refused(fn()=>pi_transfer_import($target,$plan,'/tmp/export-selected',hash_file('sha256','/tmp/export-selected/manifest.json'),true),'cross-owner client metadata refused');
unlink('/tmp/export-selected/manifest.json'); pi_transfer_json('/tmp/export-selected/manifest.json',$manifest); check(hash_file('sha256','/tmp/export-selected/manifest.json')===$hash,'original reviewed manifest restored exactly');
pi_transfer_insert($dst,'pi_biens',['owner_id'=>$destinationOwner,'bien_id'=>'fixture-selected','model'=>'{"id":"fixture-selected","conflict":true}','client_id'=>null,'deleted_at'=>null]);
$conflictBefore=rows($dst); refused(fn()=>pi_transfer_import($target,$plan,'/tmp/export-selected',$hash,true),'nonempty conflicting target property refused'); check(rows($dst)===$conflictBefore,'conflict changes no rows');
pi_transfer_query($dst,'DELETE FROM pi_biens WHERE owner_id=? AND bien_id=?',[$destinationOwner,'fixture-selected']);
$dst->exec("CREATE TRIGGER fixture_fail_transfer BEFORE INSERT ON pi_documents FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Fixture refused'");
refused(fn()=>pi_transfer_import($target,$plan,'/tmp/export-selected',$hash,true),'database failure rolls back import');
check(rows($dst)===$targetBefore && glob($target['storage_directory'].'/*')===[],'failed transaction leaves no new rows or blobs'); $dst->exec('DROP TRIGGER fixture_fail_transfer');
$result=pi_transfer_import($target,$plan,'/tmp/export-selected',$hash,true);
check($result['status']==='imported' && $result['documents']===3,'selected property import applied');
$property=pi_transfer_query($dst,'SELECT * FROM pi_biens WHERE owner_id=? AND bien_id=?',[$destinationOwner,'fixture-selected'])->fetch();
check($property['model']===$manifest['property']['model'] && $property['client_id']!==$clientId,'property model retained and client remapped');
$client=pi_transfer_query($dst,'SELECT * FROM pi_clients WHERE id=?',[$property['client_id']])->fetch();
check($client['owner_id']===$destinationOwner && $client['name']===$manifest['client']['name'] && $client['created_at']===$manifest['client']['created_at'],'client metadata and target ownership retained');
$documents=pi_transfer_query($dst,'SELECT * FROM pi_documents WHERE owner_id=? AND bien_id=? ORDER BY title',[$destinationOwner,'fixture-selected'])->fetchAll();
$exact=true;
foreach ($documents as $i=>$document) {
    $expected=$sourceDocuments[$i]; $oldId=$expected['id']; $expected['id']=$document['id']; $expected['owner_id']=$destinationOwner; $expected['client_id']=$client['id'];
    $exact=$exact && pi_transfer_same($expected,$document) && $document['id']!==$oldId
        && file_get_contents($source['storage_directory'].'/'.$oldId.'.blob')===file_get_contents($target['storage_directory'].'/'.$document['id'].'.blob');
}
check($exact,'all active/archive metadata, dates, bytes and links retained');
check(count(pi_transfer_query($dst,'SELECT * FROM pi_documents WHERE owner_id=?',['foreign-target'])->fetchAll())===0
    && pi_transfer_query($dst,'SELECT name FROM pi_clients WHERE id=?',[$clientId])->fetchColumn()==='Autre client cible','foreign target account and colliding source client ID isolated');
$workspace=pi_transfer_query($dst,'SELECT * FROM pi_workspaces WHERE owner_id=?',[$destinationOwner])->fetch();
check($workspace['settings']==='{"existingTariff":77}' && (int)$workspace['revision']===12
    && pi_transfer_query($dst,'SELECT model FROM pi_biens WHERE owner_id=? AND bien_id=?',[$destinationOwner,'existing-property'])->fetchColumn()==='{"id":"existing-property"}','target settings and unrelated property unchanged; revision advanced once');
$after=rows($dst); $files=glob($target['storage_directory'].'/*');
check(pi_transfer_import($target,$plan,'/tmp/export-selected',$hash,true)['status']==='already_imported' && rows($dst)===$after && glob($target['storage_directory'].'/*')===$files,'exact replay creates no duplicate or revision change');
pi_transfer_query($dst,'UPDATE pi_documents SET title=? WHERE id=?',['Changed after import',$documents[0]['id']]); $changed=rows($dst);
refused(fn()=>pi_transfer_import($target,$plan,'/tmp/export-selected',$hash,true),'target write after import prevents silent replay overwrite'); check(rows($dst)===$changed,'post-import target changes preserved');
$newPlan=$plan; $newPlan['target']['ownerId']='new-target-owner'; pi_transfer_json('/tmp/cli-plan.json',$newPlan);
[$code,$result]=$cliExport=cli(['export','/fixture/source.php','/tmp/cli-plan.json','/tmp/cli-export']);
check($code===0 && $result['status']==='exported' && $result['documents']===3,'CLI exports selected property');
$cliHash=$result['manifestSha256']; $arguments=['import','/fixture/target.php','/tmp/cli-plan.json','/tmp/cli-export',$cliHash];
[$code,$result]=cli($arguments); check($code===0 && $result['status']==='ready_dry_run' && rows($dst)===$changed,'CLI default simulation preserves absent target workspace');
[$code,$result]=cli([...$arguments,'--apply']); $newWorkspace=pi_transfer_query($dst,'SELECT * FROM pi_workspaces WHERE owner_id=?',['new-target-owner'])->fetch();
check($code===0 && $result['status']==='imported' && (int)$newWorkspace['revision']===1 && $newWorkspace['settings']==='{}','CLI imports into a new workspace without source tariffs');
$newState=rows($dst); [$code,$result]=cli([...$arguments,'--apply']); check($code===0 && $result['status']==='already_imported' && rows($dst)===$newState,'CLI exact replay does not change new target workspace');
$arguments[4]=str_repeat('0',64); [$code,$result,$error]=cli([...$arguments,'--apply']); check($code!==0 && $result===null && str_contains($error,'refused') && rows($dst)===$newState,'CLI wrong manifest hash returns failure without mutation');
check(rows($src)===$sourceBefore,'source rows unchanged after all tests');
foreach ($sourceDocuments as $document) pi_transfer_file($source['storage_directory'].'/'.$document['id'].'.blob',$document);
check(true,'source document bytes unchanged');
echo json_encode(['assertions'=>count($checks),'checks'=>$checks,'database'=>'MariaDB 11.4','data'=>'fictitious only','remoteMutation'=>false],JSON_THROW_ON_ERROR)."\n";
