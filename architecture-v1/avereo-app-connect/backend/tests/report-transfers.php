<?php
declare(strict_types=1);

// CLI fixture. The default uses two in-memory databases and no application credentials.
if (PHP_SAPI !== 'cli') exit(1);
require dirname(__DIR__).'/src/autoload.php';
require __DIR__.'/account-administration-fixture.php';
require __DIR__.'/report-transfer-fixture.php';
$rapport = dirname(__DIR__,3).'/avereo-app-rapport';
require $rapport.'/frontend/public/api/photo-original-store.php';
require $rapport.'/frontend/public/api/organization-exports.php';

use Avereo\Connect\Administration\ReportTransfers;
use Avereo\Connect\Repository\PdoConnectRepository;
use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Http\Request;
use Avereo\Connect\Security\AuthContext;

$native = getenv('ACCOUNT_ADMIN_MYSQL_TEMPORARY') === 'true';
if ($native && (getenv('GITHUB_ACTIONS') !== 'true' || getenv('APP_ENV') !== 'test'
    || getenv('DB_DSN') !== 'mysql:host=127.0.0.1;port=3306;dbname=avereo_connect_ci;charset=utf8mb4')) {
    throw new RuntimeException('Isolated CI database required');
}
$connect = accountTestDatabase();
if ($native) {
    $reports = new PDO(getenv('DB_DSN'), getenv('DB_USER'), getenv('DB_PASSWORD'), [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    // Migrations 001/002 were applied by the export tests in this disposable CI schema.
    foreach (['003_photo_originals.sql','004_report_transfers.sql'] as $file) {
        $reports->exec(file_get_contents($rapport.'/database/migrations/'.$file));
    }
    foreach (glob($rapport.'/database/migrations/00[1-4]_*.sql') as $file) {
        $ddl = preg_replace('/^--.*$/m', '', file_get_contents($file));
        // MariaDB temporary tables cannot have FK constraints. The original DDL runs above and in the export tests.
        $ddl = preg_replace('/,\s*FOREIGN KEY \(report_id\)[^\n]+/', '', $ddl);
        $ddl = str_replace('CREATE TABLE ', 'CREATE TEMPORARY TABLE ', $ddl);
        $reports->exec($ddl);
    }
} else {
    $reports = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $reports->sqliteCreateFunction('UTC_TIMESTAMP', static fn()=>gmdate('Y-m-d H:i:s'), -1);
    createReportTransferSqliteSchema($reports);
}
$repository = new PdoConnectRepository($connect);
// Two fictitious users: 2 owns the dossier; 1 is both the eligible recipient and its organization's approved administrator.
$service = new ReportTransfers($connect, $repository, fn() => $reports, [7=>[1]]);
$app = new \Avereo\Connect\Application(new \Avereo\Connect\Config('local', true, null, '', '', 'TEST', 1800,43200), $repository, reportTransfers:$service);
$checks = 0;
function confirmTest(bool $ok, string $name): void {
    global $checks;
    if (!$ok) throw new RuntimeException('Échec : '.$name);
    ++$checks;
}
function denied(Closure $operation, string $code): void {
    try { $operation(); } catch (ApiException|RapportPhotoOriginalException $error) {
        confirmTest($error->errorCode === $code, $code.' / '.$error->errorCode); return;
    }
    throw new RuntimeException('Refus attendu : '.$code);
}
$id=str_repeat('a',32);
$other=str_repeat('b',32);
$legacy=str_repeat('c',32);
seedReportTransferFixture($reports);
$read = static fn($public) => $reports->query("SELECT * FROM rapport_reports WHERE public_id=".$reports->quote($public))->fetch(PDO::FETCH_ASSOC);
$before=$read($id);
$payload=$before['payload_json'];
$otherBefore=$read($other);
$originalsDir=sys_get_temp_dir().'/avereo-transfer-'.bin2hex(random_bytes(12));
if (!mkdir($originalsDir,0700)) throw new RuntimeException('Private fixture directory required');
$tempPhoto=$originalsDir.'/fixture.png';
$photo=base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/sR0AAAAASUVORK5CYII=',true);
file_put_contents($tempPhoto,$photo);
try {
    $store=new RapportPhotoOriginalStore($reports,$originalsDir,4096,strlen($photo));
    $meta=$store->store('avereo_connect','2',$id,$tempPhoto,hash('sha256',$photo),'original.png');
    $input=['reportId'=>$id,'operationId'=>str_repeat('f',32),'recipientId'=>1,'reason'=>'Continuité fictive'];
    $list=$service->listing(1,7,2);
    confirmTest($list['remaining']===2 && array_column($list['reports'],'id')===[$id,$other],'décompte des dossiers vérifiés');
    confirmTest(array_map('intval',array_column($list['recipients'],'id'))===[1],'destinataire actif');
    denied(fn()=>$service->transfer(2,7,2,$input),'TRANSFER_FORBIDDEN');
    denied(fn()=>$service->transfer(1,9,2,$input),'TRANSFER_FORBIDDEN');
    denied(fn()=>$service->transfer(1,7,2,['reportId'=>$legacy]+$input),'REPORT_SCOPE_CHANGED');
    denied(fn()=>$service->transfer(1,7,2,['recipientId'=>2]+$input),'TRANSFER_INPUT_INVALID');
    $connect->exec("UPDATE users SET status='disabled' WHERE id=2");
    denied(fn()=>$service->transfer(1,7,1,['recipientId'=>2]+$input),'RECIPIENT_UNAVAILABLE');
    $connect->exec("UPDATE users SET status='active',access_starts_at='2019-12-31 00:00:00',access_ends_at='2020-01-01 00:00:00' WHERE id=2");
    denied(fn()=>$service->transfer(1,7,1,['recipientId'=>2]+$input),'RECIPIENT_UNAVAILABLE');
    $connect->exec('UPDATE users SET access_starts_at=NULL,access_ends_at=NULL WHERE id=2');
    // A second organization exists only to distinguish access granted elsewhere from access in the dossier's organization.
    $connect->exec("INSERT INTO organizations (id,status,name,slug) VALUES (8,'active','Test externe','test-externe');
        INSERT INTO memberships(id,organization_id,user_id,role,status) VALUES(3,8,1,'member','active');
        INSERT INTO entitlements(organization_id,application_id,status,granted_by_user_id) VALUES(8,1,'active',1);
        UPDATE entitlements SET status='revoked' WHERE organization_id=7 AND application_id=1");
    confirmTest($repository->canLaunchApplication(1,'rapport'),'accès Rapport via une autre organisation');
    denied(fn()=>$service->transfer(1,7,2,$input),'RECIPIENT_UNAVAILABLE');
    $connect->exec("UPDATE entitlements SET status='active' WHERE organization_id=7 AND application_id=1");
    $reports->exec("UPDATE rapport_photo_originals SET owner_id='0'");
    denied(fn()=>$service->transfer(1,7,2,$input),'PHOTO_OWNER_MISMATCH');
    $reports->exec("UPDATE rapport_photo_originals SET owner_id='2'");
    confirmTest($read($id)===$before,'contenu et propriétaire conservés après refus');
    $auth=new AuthContext(1,time(),'owner');
    $path='/api/v1/admin/organizations/7/users/2/report-transfers';
    $call=static fn($method,$body,$headers=[]) => $app->handle(new Request($method,$path,$headers,[],$body,'transfer-test'),$auth,'fixture-csrf',static fn()=>null);
    confirmTest($call('GET',[])->status===200,'inventaire du contrôleur CONNECT');
    confirmTest($call('POST',$input)->status===403,'protection de confirmation');
    $blocked=false;
    if (!$native) {
        $reports->exec("CREATE TRIGGER fail_audit BEFORE INSERT ON rapport_transfer_events BEGIN SELECT RAISE(ABORT,'fixture'); END");
        try { $service->transfer(1,7,2,$input); } catch (PDOException) { $blocked=true; }
        $reports->exec('DROP TRIGGER fail_audit');
        confirmTest($blocked && $read($id)===$before && $service->listing(1,7,2)['remaining']===2
            && count($store->listForReport('avereo_connect','2',$id))===1,'annulation complète si le journal échoue');
    }
    confirmTest($call('POST',$input,['x-csrf-token'=>'fixture-csrf'])->status===200,'transfert confirmé depuis CONNECT');
    $after=$read($id);
    confirmTest($after['owner_id']==='1' && $after['owner_email']==='owner@example.invalid','nouveau titulaire');
    foreach (['public_id','reference_code','payload_json','payload_bytes','created_at','updated_at','created_by_id','updated_by_id'] as $field) {
        confirmTest($before[$field]===$after[$field],'préservation de '.$field);
    }
    confirmTest($read($other)===$otherBefore,'deuxième dossier intact');
    denied(fn()=>$service->transfer(1,7,2,['reason'=>'Motif différent']+$input),'TRANSFER_REQUEST_CONFLICT');
    confirmTest($service->listing(1,7,2)['remaining']===1 && $service->listing(1,7,1)['remaining']===1,'décomptes actualisés');
    denied(fn()=>$store->open('avereo_connect','2',$id,$meta['id']),'not_found');
    $newStore=new RapportPhotoOriginalStore($reports,$originalsDir,4096,strlen($photo));
    $download=$newStore->open('avereo_connect','1',$id,$meta['id']);
    confirmTest(stream_get_contents($download['stream'])===$photo,'nouveau titulaire et octets de la photo originale');
    fclose($download['stream']);
    $second=$newStore->store('avereo_connect','2',$other,$tempPhoto,hash('sha256',$photo),'autre.png');
    confirmTest($second['id']!==$meta['id'],'quota libéré pour le cédant');
    $export=new RapportOrganizationExports($reports);
    confirmTest($export->download(2,$id,'test_autorise')===$payload,'export indépendant après transfert');
    confirmTest($service->transfer(1,7,2,$input)['alreadyProcessed']===true,'relance idempotente');
    denied(fn()=>$service->transfer(1,7,2,['operationId'=>str_repeat('e',32)]+$input),'REPORT_OWNER_CHANGED');
    $event=$reports->query('SELECT * FROM rapport_transfer_events')->fetchAll(PDO::FETCH_ASSOC);
    confirmTest(count($event)===1 && (int)$event[0]['source_id']===2 && (int)$event[0]['destination_id']===1
        && (int)$event[0]['actor_id']===1 && (int)$event[0]['organization_id']===7
        && $event[0]['reason']===$input['reason'] && $event[0]['created_at']!==null,'reçu unique et complet');
    confirmTest((int)$connect->query("SELECT COUNT(*) FROM users WHERE status='active'")->fetchColumn()===2,'deux comptes ouverts');
    echo "PASS ".$reports->getAttribute(PDO::ATTR_DRIVER_NAME)." : ".$checks." contrôles, deux comptes fictifs.\n";
} finally {
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($originalsDir,FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST) as $entry) {
        if ($entry->isDir() && !$entry->isLink()) rmdir($entry->getPathname()); else unlink($entry->getPathname());
    }
    rmdir($originalsDir);
}
