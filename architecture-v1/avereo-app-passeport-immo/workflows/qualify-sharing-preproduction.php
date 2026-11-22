<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'||$argc!==3||!in_array($argv[2],['rehearse','verify'],true))exit(2);
$work=$argv[1];$action=$argv[2];$home='/home/daje3540';umask(0077);
if(realpath($work)!==$work||dirname($work)!==$home.'/private'||!str_starts_with(basename($work),'preprod-rapport-passeport-archives-partage-'))exit(2);
function sharing_check(bool $value,string $label):void{if(!$value)throw new RuntimeException($label);}
function sharing_normal(array $rows):array{$a=array_map(static fn($r)=>json_encode($r,JSON_THROW_ON_ERROR),$rows);sort($a);return $a;}
function sharing_preserved(PDO $db,array $snapshot):void{
    foreach($snapshot['tables']as$table=>$expected){
        sharing_check(in_array($table,['pi_workspaces','pi_clients','pi_biens','pi_documents'],true),'Snapshot table');
        $rows=$db->query('SELECT * FROM '.$table)->fetchAll(PDO::FETCH_ASSOC);
        if($table==='pi_biens' && $expected && !array_key_exists('document_shares',$expected[0])){foreach($rows as&$r){sharing_check(($r['document_shares']??null)===null,'Real share changed since backup');unset($r['document_shares']);}unset($r);}
        sharing_check(sharing_normal($rows)===sharing_normal($expected),'Business rows differ from backup');
    }
}
try{
    $config=require $home.'/.avereo/passeport-immo-preprod/config.php';$prod=require $home.'/.avereo/passeport-immo/config.php';
    sharing_check($config['storage_dsn']!==$prod['storage_dsn'] && $config['storage_directory']!==$prod['storage_directory'],'Separated environments');
    $db=new PDO($config['storage_dsn'],$config['storage_user'],$config['storage_password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $snapshot=json_decode(file_get_contents($work.'/recovery/passeport-immo/data/snapshot.json'),true,64,JSON_THROW_ON_ERROR);
    sharing_preserved($db,$snapshot);
    foreach($snapshot['files']as$f)sharing_check(hash_file('sha256',$config['storage_directory'].'/'.$f['name'])===$f['sha256'],'Original private document differs');
    if($action==='verify'){
        $column=$db->query("SHOW COLUMNS FROM pi_biens LIKE 'document_shares'")->fetch();
        sharing_check($column && strtolower($column['Type'])==='longtext' && $column['Null']==='YES','Additive sharing column required');
        $out=['status'=>'verified','documentsPreserved'=>count($snapshot['files']),'existingBusinessRowsPreserved'=>true,'schemaVerified'=>true];
    }else{
        require $work.'/candidate-public/api/storage.php';require $work.'/candidate-public/api/sharing.php';
        $dir=$work.'/sharing-copy-'.bin2hex(random_bytes(6));mkdir($dir,0700);$copy=$config;$copy['storage_directory']=$dir;$copy['document_share_directory']=$dir.'/accounts.json';
        $accounts=[];foreach([900001,900002,900003,900004]as$i)$accounts['avereo_connect:'.$i]=['label'=>'Compte fictif '.$i,'aliases'=>[PasseportSharing::alias('fixture-'.$i)],'eligible'=>$i!==900004,'invitable'=>true];
        $directory=static function(int $age=0)use(&$accounts,$copy){file_put_contents($copy['document_share_directory'],json_encode(['version'=>1,'environment'=>$copy['environment'],'generatedAt'=>time()-$age,'accounts'=>$accounts],JSON_THROW_ON_ERROR));chmod($copy['document_share_directory'],0600);};$directory();
        $store=new PasseportStorage($copy,'avereo_connect:900001');
        foreach($snapshot['tables']as$table=>$rows){
            $temporary='pi_sharing_copy_'.bin2hex(random_bytes(6));$store->db->exec("CREATE TEMPORARY TABLE `$temporary` LIKE `$table`");
            $ddl=$store->db->query("SHOW CREATE TABLE `$temporary`")->fetch(PDO::FETCH_NUM)[1];$ddl=preg_replace('/^CREATE TEMPORARY TABLE `'.$temporary.'`/','CREATE TEMPORARY TABLE `'.$table.'`',$ddl,1,$count);sharing_check($count===1,'Temporary definition');$store->db->exec($ddl);
            sharing_check(str_contains($store->db->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_NUM)[1],'CREATE TEMPORARY TABLE'),'Temporary shadow required before any write');
            foreach($rows as$r){$keys=array_keys($r);$q=$store->db->prepare('INSERT INTO `'.$table.'` (`'.implode('`,`',$keys).'`) VALUES ('.implode(',',array_fill(0,count($keys),'?')).')');$q->execute(array_values($r));}
        }
        if(!$store->db->query("SHOW COLUMNS FROM pi_biens LIKE 'document_shares'")->fetch())$store->db->exec('ALTER TABLE pi_biens ADD COLUMN document_shares LONGTEXT NULL');
        $store->saveWorkspace(['revision'=>0,'biens'=>[['id'=>'sharing-fixture','address'=>'Bien fictif','dossier'=>[]]],'tarifs'=>[]]);$store->linkClient('sharing-fixture',['name'=>'Client fictif']);
        $f=$dir.'/fixture.txt';file_put_contents($f,'Document fictif de partage.');$doc=$store->addFiles('sharing-fixture',[['path'=>$f,'name'=>'fixture.txt']],'plans',true)['added'][0];
        $owner=new PasseportSharing($store,$copy);$target=new PasseportStorage($copy,'avereo_connect:900002');$target->db=$store->db;$receiver=new PasseportSharing($target,$copy);
        $third=new PasseportStorage($copy,'avereo_connect:900003');$third->db=$store->db;$stranger=new PasseportSharing($third,$copy);
        $checks=[];$check=static function($v,$label)use(&$checks){sharing_check($v,$label);$checks[]=$label;};
        $refused=static function(callable $operation,int $status,string $label)use($check){try{$operation();}catch(PasseportError $e){$check($e->status===$status,$label);return;}throw new RuntimeException('Expected refusal: '.$label);};
        $verified=$owner->resolve('fixture-900002');$check($verified['ready'],'Eligible fixture resolved');
        $state=$owner->change('sharing-fixture',['revision'=>0,'recipient'=>'fixture-900002','expectedRecipient'=>$verified['recipient'],'confirm'=>true]);$id=$state['grants'][0]['id'];
        $check(count($receiver->incoming())===1,'Shared property discovered');$data=$receiver->load($id);$check(count($data['documents'])===1&&$data['readOnly'],'Read-only active document list');
        $check(file_get_contents($target->filePath($receiver->document($id,$doc['id'])))==='Document fictif de partage.','Original attachment bytes');
        $refused(fn()=>$stranger->load($id),404,'Copied reference denied to third account');$refused(fn()=>$target->bien('sharing-fixture'),404,'Original owner routes remain isolated');
        $store->updateDocument('sharing-fixture',$doc['id'],['archived'=>true]);$refused(fn()=>$receiver->document($id,$doc['id']),404,'Archive excluded');
        $store->updateDocument('sharing-fixture',$doc['id'],['trashed'=>true]);$refused(fn()=>$receiver->document($id,$doc['id']),404,'Trash excluded');
        $store->updateDocument('sharing-fixture',$doc['id'],['trashed'=>false]);$store->updateDocument('sharing-fixture',$doc['id'],['archived'=>false]);
        $accounts['avereo_connect:900002']['eligible']=false;$directory();$refused(fn()=>$receiver->load($id),404,'CONNECT eligibility withdrawal closes access');$accounts['avereo_connect:900002']['eligible']=true;$directory(181);$refused(fn()=>$receiver->load($id),503,'Stale directory fails closed');$directory();
        $refused(fn()=>$owner->change('sharing-fixture',['revision'=>0],$id),409,'Concurrent revision refused');$owner->change('sharing-fixture',['revision'=>1],$id);$refused(fn()=>$receiver->load($id),404,'Revocation closes list');$refused(fn()=>$receiver->document($id,$doc['id']),404,'Revocation closes download');
        sharing_preserved($db,$snapshot);$out=['status'=>'passed','assertions'=>count($checks),'checks'=>$checks,'temporaryTables'=>4,'liveRowsChanged'=>false,'liveDocumentFilesChanged'=>false,'documentsPreserved'=>count($snapshot['files'])];
    }
    $out['observedAt']=gmdate('c');file_put_contents($work.'/sharing-'.$action.'-public.json',json_encode($out,JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT));echo json_encode($out,JSON_THROW_ON_ERROR).PHP_EOL;
}catch(Throwable $e){fwrite(STDERR,'Sharing qualification refused: '.get_class($e).' '.$e->getMessage().PHP_EOL);exit(1);}
