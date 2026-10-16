<?php
declare(strict_types=1);
// Private CLI tooling only: never include in the public candidate.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

function pi_transfer_query(PDO $db, string $sql, array $args=[]): PDOStatement
{
    $query=$db->prepare($sql); $query->execute($args); return $query;
}

function pi_transfer_plan(array $plan): void
{
    if (array_keys($plan)!==['source','target'] || array_keys($plan['source'] ?? [])!==['environment','ownerId','bienId']
        || array_keys($plan['target'] ?? [])!==['environment','ownerId']) throw new RuntimeException('Explicit transfer selection required.');
    foreach (['source','target'] as $side) {
        if (!in_array($plan[$side]['environment'],['local','preprod','production'],true)
            || !is_string($plan[$side]['ownerId']) || !preg_match('/^[A-Za-z0-9:_-]{1,64}$/D',$plan[$side]['ownerId'])) {
            throw new RuntimeException('Invalid environment or owner mapping.');
        }
    }
    if ($plan['source']['environment']===$plan['target']['environment']
        || !is_string($plan['source']['bienId']) || !preg_match('/^[A-Za-z0-9_-]{1,64}$/D',$plan['source']['bienId'])) {
        throw new RuntimeException('Different environments and explicit property required.');
    }
}

function pi_transfer_database(array $config, string $environment): PDO
{
    if (($config['environment'] ?? '')!==$environment || empty($config['storage_enabled'])
        || !str_starts_with($config['storage_dsn'] ?? '', 'mysql:')) throw new RuntimeException('Configuration environment mismatch.');
    $directory=$config['storage_directory'] ?? '';
    if (!$directory || realpath($directory)!==$directory || is_link($directory)
        || preg_match('~/public(?:/|$)~',$directory)) throw new RuntimeException('Private document directory required.');
    return new PDO($config['storage_dsn'],$config['storage_user'],$config['storage_password'],[
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES=>false, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
    ]);
}

function pi_transfer_json(string $path, array $value): void
{
    $bytes=json_encode($value,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT)."\n";
    $file=fopen($path,'x');
    if (!$file) throw new RuntimeException('New private file required.');
    try { chmod($path,0600); if (fwrite($file,$bytes)!==strlen($bytes)) throw new RuntimeException('Private write failed.'); }
    finally { fclose($file); }
}

function pi_transfer_file(string $path, array $document): void
{
    if (is_link($path) || !is_file($path) || filesize($path)!==(int)$document['size']
        || hash_file('sha256',$path)!==$document['sha256']) throw new RuntimeException('Document integrity mismatch.');
}

function pi_transfer_database_id(PDO $db): string
{
    return hash('sha256',json_encode($db->query('SELECT DATABASE(),@@hostname,@@port')->fetch(PDO::FETCH_NUM),JSON_THROW_ON_ERROR));
}

/** Select exactly one live property and its linked client; do not export workspace settings. */
function pi_transfer_export(array $config, array $plan, string $destination): array
{
    umask(0077); pi_transfer_plan($plan);
    $db=pi_transfer_database($config,$plan['source']['environment']);
    if (file_exists($destination) || is_link($destination) || realpath(dirname($destination))!==dirname($destination)
        || preg_match('~/public(?:/|$)~',$destination)
        || str_starts_with($destination,$config['storage_directory'].'/')) throw new RuntimeException('New separate private destination required.');
    $db->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ'); $db->beginTransaction();
    try {
        // Hold the same account lock as the application writes until all selected bytes are copied.
        $owner=$plan['source']['ownerId']; $bienId=$plan['source']['bienId'];
        if (!pi_transfer_query($db,'SELECT owner_id FROM pi_workspaces WHERE owner_id=? FOR UPDATE',[$owner])->fetch()) throw new RuntimeException('Source workspace absent.');
        $bien=pi_transfer_query($db,'SELECT * FROM pi_biens WHERE owner_id=? AND bien_id=? AND deleted_at IS NULL FOR UPDATE',[$owner,$bienId])->fetch();
        if (!$bien || !$bien['client_id']) throw new RuntimeException('Selected property and client required.');
        $client=pi_transfer_query($db,'SELECT * FROM pi_clients WHERE id=? AND owner_id=?',[$bien['client_id'],$owner])->fetch();
        if (!$client) throw new RuntimeException('Source client owner mismatch.');
        $documents=pi_transfer_query($db,'SELECT * FROM pi_documents WHERE owner_id=? AND bien_id=? ORDER BY id',[$owner,$bienId])->fetchAll();
        foreach ($documents as $document) {
            if ($document['client_id']!==$client['id'] || !preg_match('/^[a-f0-9]{32}$/D',$document['id'])) throw new RuntimeException('Source document scope mismatch.');
            pi_transfer_file($config['storage_directory'].'/'.$document['id'].'.blob',$document);
        }
        if (!mkdir($destination,0700) || !mkdir($destination.'/documents',0700)) throw new RuntimeException('Private export unavailable.');
        foreach ($documents as $document) {
            $target=$destination.'/documents/'.$document['id'].'.blob';
            if (!copy($config['storage_directory'].'/'.$document['id'].'.blob',$target)) throw new RuntimeException('Document copy failed.');
            chmod($target,0600); pi_transfer_file($target,$document);
        }
        $manifest=['format'=>'avereo-passeport-property-transfer','version'=>1,'sourceDatabaseId'=>pi_transfer_database_id($db),'plan'=>$plan,'property'=>$bien,'client'=>$client,'documents'=>$documents];
        pi_transfer_json($destination.'/manifest.json',$manifest); $db->commit();
        return ['status'=>'exported','manifestSha256'=>hash_file('sha256',$destination.'/manifest.json'),'properties'=>1,'clients'=>1,
            'documents'=>count($documents),'activeDocuments'=>count(array_filter($documents,fn($d)=>$d['archived_at']===null)),
            'archivedDocuments'=>count(array_filter($documents,fn($d)=>$d['archived_at']!==null)),'sourceRowsChanged'=>false];
    } catch (Throwable $error) { if ($db->inTransaction()) $db->rollBack(); throw $error; }
}

function pi_transfer_columns(array $row, array $expected): void
{
    $actual=array_keys($row); sort($actual); sort($expected);
    if ($actual!==$expected) throw new RuntimeException('Unexpected transfer columns.');
}

function pi_transfer_same(array $left, array $right): bool
{
    ksort($left); ksort($right); return $left===$right;
}

function pi_transfer_insert(PDO $db, string $table, array $row): void
{
    pi_transfer_query($db,'INSERT INTO '.$table.' (`'.implode('`,`',array_keys($row)).'`) VALUES ('.implode(',',array_fill(0,count($row),'?')).')',array_values($row));
}

/** By default only compare. A replay accepts an exact existing copy, never overwrites it. */
function pi_transfer_import(array $config, array $plan, string $directory, string $expectedHash, bool $apply=false): array
{
    umask(0077); pi_transfer_plan($plan);
    $db=pi_transfer_database($config,$plan['target']['environment']);
    if (realpath($directory)!==$directory || is_link($directory) || is_link($directory.'/manifest.json')
        || realpath($directory.'/documents')!==$directory.'/documents' || is_link($directory.'/documents')
        || !preg_match('/^[a-f0-9]{64}$/D',$expectedHash) || hash_file('sha256',$directory.'/manifest.json')!==$expectedHash
        || $directory===$config['storage_directory'] || str_starts_with($directory,$config['storage_directory'].'/')) throw new RuntimeException('Transfer manifest or path mismatch.');
    $manifest=json_decode(file_get_contents($directory.'/manifest.json'),true,64,JSON_THROW_ON_ERROR);
    pi_transfer_columns($manifest,['format','version','sourceDatabaseId','plan','property','client','documents']);
    if (($manifest['format'] ?? '')!=='avereo-passeport-property-transfer' || ($manifest['version'] ?? null)!==1
        || ($manifest['plan'] ?? null)!==$plan || !is_array($manifest['documents'] ?? null) || !array_is_list($manifest['documents'])
        || pi_transfer_database_id($db)===$manifest['sourceDatabaseId']) throw new RuntimeException('Transfer selection or database separation mismatch.');
    $bien=$manifest['property']; $client=$manifest['client'];
    pi_transfer_columns($bien,['owner_id','bien_id','model','client_id','deleted_at']);
    pi_transfer_columns($client,['id','owner_id','name','created_at']);
    $source=$plan['source']; $owner=$plan['target']['ownerId'];
    if ($bien['owner_id']!==$source['ownerId'] || $bien['bien_id']!==$source['bienId'] || $bien['deleted_at']!==null
        || $client['owner_id']!==$source['ownerId'] || $bien['client_id']!==$client['id'] || !preg_match('/^[a-f0-9]{32}$/D',$client['id'])) throw new RuntimeException('Transfer owner or client mismatch.');
    $model=json_decode($bien['model'],true,64,JSON_THROW_ON_ERROR);
    if ((string)($model['id'] ?? '')!==$source['bienId']) throw new RuntimeException('Property model mismatch.');
    // Stable, target-scoped IDs allow safe replay without copying source IDs over another tenant.
    $namespace=json_encode($plan,JSON_THROW_ON_ERROR);
    $map=static fn(string $kind,string $id): string=>substr(hash('sha256',$namespace.'|'.$kind.'|'.$id),0,32);
    $client['id']=$map('client',$client['id']); $client['owner_id']=$owner;
    $bien['owner_id']=$owner; $bien['client_id']=$client['id']; $documents=[]; $sourceFiles=[]; $hashes=[];
    foreach ($manifest['documents'] as $document) {
        pi_transfer_columns($document,['id','owner_id','bien_id','client_id','name','title','category','mime','size','sha256','added_at','updated_at','archived_at']);
        if (!preg_match('/^[a-f0-9]{32}$/D',$document['id']) || $document['owner_id']!==$source['ownerId']
            || $document['bien_id']!==$source['bienId'] || $document['client_id']!==$manifest['client']['id']
            || !preg_match('/^[a-f0-9]{64}$/D',$document['sha256']) || !ctype_digit((string)$document['size'])
            || isset($hashes[$document['sha256']])) throw new RuntimeException('Document scope or duplicate mismatch.');
        $sourcePath=$directory.'/documents/'.$document['id'].'.blob'; pi_transfer_file($sourcePath,$document);
        $hashes[$document['sha256']]=true; $document['id']=$map('document',$document['id']);
        $document['owner_id']=$owner; $document['client_id']=$client['id'];
        if (isset($documents[$document['id']])) throw new RuntimeException('Repeated document identifier.');
        $documents[$document['id']]=$document; $sourceFiles[$document['id']]=$sourcePath;
    }
    $entries=array_values(array_diff(scandir($directory),['.','..'])); sort($entries);
    $files=array_values(array_diff(scandir($directory.'/documents'),['.','..'])); sort($files);
    $expectedFiles=array_map('basename',array_values($sourceFiles)); sort($expectedFiles);
    if ($entries!==['documents','manifest.json'] || $files!==$expectedFiles) throw new RuntimeException('Unexpected export file; scope refused.');
    ksort($documents); $created=[]; $db->beginTransaction();
    try {
        if ($apply) pi_transfer_query($db,'INSERT IGNORE INTO pi_workspaces(owner_id,settings) VALUES (?,?)',[$owner,'{}']);
        pi_transfer_query($db,'SELECT * FROM pi_workspaces WHERE owner_id=? FOR UPDATE',[$owner])->fetch();
        $existing=pi_transfer_query($db,'SELECT * FROM pi_biens WHERE owner_id=? AND bien_id=? FOR UPDATE',[$owner,$source['bienId']])->fetch();
        $existingClient=pi_transfer_query($db,'SELECT * FROM pi_clients WHERE id=?',[$client['id']])->fetch();
        $existingDocuments=pi_transfer_query($db,'SELECT * FROM pi_documents WHERE owner_id=? AND bien_id=? ORDER BY id',[$owner,$source['bienId']])->fetchAll();
        if ($existing) {
            if (!pi_transfer_same($existing,$bien) || !$existingClient || !pi_transfer_same($existingClient,$client)
                || count($existingDocuments)!==count($documents)) throw new RuntimeException('Existing target differs; no overwrite.');
            foreach ($existingDocuments as $document) {
                if (!isset($documents[$document['id']]) || !pi_transfer_same($document,$documents[$document['id']])) throw new RuntimeException('Existing document differs; no overwrite.');
                pi_transfer_file($config['storage_directory'].'/'.$document['id'].'.blob',$document);
            }
            $db->rollBack(); return ['status'=>'already_imported','documents'=>count($documents),'liveRowsChanged'=>false];
        }
        if ($existingClient || $existingDocuments) throw new RuntimeException('Partial or conflicting target.');
        foreach ($documents as $document) {
            if (pi_transfer_query($db,'SELECT id FROM pi_documents WHERE id=?',[$document['id']])->fetch()
                || file_exists($config['storage_directory'].'/'.$document['id'].'.blob') || is_link($config['storage_directory'].'/'.$document['id'].'.blob')) throw new RuntimeException('Target identifier or blob collision.');
        }
        if (!$apply) { $db->rollBack(); return ['status'=>'ready_dry_run','documents'=>count($documents),'liveRowsChanged'=>false]; }
        pi_transfer_insert($db,'pi_clients',$client); pi_transfer_insert($db,'pi_biens',$bien);
        foreach ($documents as $document) {
            $path=$config['storage_directory'].'/'.$document['id'].'.blob'; $output=fopen($path,'x');
            if (!$output) throw new RuntimeException('New target blob required.');
            $created[]=$path; $input=fopen($sourceFiles[$document['id']],'rb');
            try { chmod($path,0600); if (!$input || stream_copy_to_stream($input,$output)!==(int)$document['size']) throw new RuntimeException('Target file copy failed.'); }
            finally { if ($input) fclose($input); fclose($output); }
            pi_transfer_file($path,$document); pi_transfer_insert($db,'pi_documents',$document);
        }
        pi_transfer_query($db,'UPDATE pi_workspaces SET revision=revision+1 WHERE owner_id=?',[$owner]);
        $db->commit(); return ['status'=>'imported','properties'=>1,'clients'=>1,'documents'=>count($documents),'liveRowsChanged'=>true];
    } catch (Throwable $error) {
        // If commit/connection outcome is uncertain, keep blobs for inspection rather than
        // risking removal of bytes belonging to rows already committed by the server.
        if ($db->inTransaction() && $db->rollBack()) {
            foreach ($created as $path) if (is_file($path) && !is_link($path)) unlink($path);
        }
        throw $error;
    }
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '')===__FILE__) {
    try {
        if (!in_array($argv[1] ?? '',['export','import'],true) || ($argv[1]==='export' && $argc!==5)
            || ($argv[1]==='import' && !($argc===6 || ($argc===7 && $argv[6]==='--apply')))) throw new RuntimeException('Usage: php transfer-property.php export CONFIG PLAN NEW_PRIVATE_DIRECTORY | import CONFIG PLAN PRIVATE_DIRECTORY MANIFEST_SHA256 [--apply]');
        $config=require $argv[2]; $plan=json_decode(file_get_contents($argv[3]),true,64,JSON_THROW_ON_ERROR);
        $result=$argv[1]==='export' ? pi_transfer_export($config,$plan,$argv[4]) : pi_transfer_import($config,$plan,$argv[4],$argv[5],$argc===7);
        echo json_encode($result,JSON_THROW_ON_ERROR)."\n";
    } catch (Throwable $error) { fwrite(STDERR,"Property transfer refused: ".$error->getMessage()."\n"); exit(1); }
}
