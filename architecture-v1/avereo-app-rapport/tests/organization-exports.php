<?php
declare(strict_types=1);
require dirname(__DIR__).'/frontend/public/api/organization-exports.php';

$native = getenv('REPORT_EXPORT_MARIADB_FIXTURE') === 'true';
if ($native) {
    $dsn='mysql:host=127.0.0.1;port=3306;dbname=avereo_connect_ci;charset=utf8mb4';
    if (getenv('GITHUB_ACTIONS')!=='true' || getenv('APP_ENV')!=='test' || getenv('DB_DSN')!==$dsn) {
        throw new RuntimeException('Isolated CI service required');
    }
    $db=new PDO($dsn,getenv('DB_USER'),getenv('DB_PASSWORD'),[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    if ($db->query("SHOW TABLES LIKE 'rapport%'")->fetchColumn() !== false) throw new RuntimeException('Empty report namespace required');
    foreach (['001_create_rapport_reports.sql','002_organization_exports.sql'] as $migration) {
        $db->exec(file_get_contents(dirname(__DIR__).'/database/migrations/'.$migration));
    }
} else {
    $db=new PDO('sqlite::memory:',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $db->sqliteCreateFunction('UTC_TIMESTAMP',static fn(): string => gmdate('Y-m-d H:i:s'));
    $db->exec('CREATE TABLE rapport_reports(id INTEGER PRIMARY KEY,public_id TEXT,title TEXT,reference_code TEXT,payload_json TEXT,owner_provider TEXT,owner_id TEXT,updated_at TEXT,created_by_id TEXT,updated_by_id TEXT);
        CREATE TABLE rapport_export_scopes(report_id INTEGER PRIMARY KEY, organization_id INTEGER, owner_provider TEXT, owner_id TEXT, verification_reference TEXT);
        CREATE TABLE rapport_export_grants(organization_id INTEGER,connect_user_id INTEGER,decision_reference TEXT,expires_at DATETIME);
        CREATE TABLE rapport_export_events(organization_id INTEGER,connect_user_id INTEGER,report_public_id TEXT,decision_reference TEXT,purpose TEXT);');
}
function check(bool $ok, string $case): void { if (!$ok) throw new RuntimeException($case); }
$payload='{"observations":[{"photos":[{"src":"data:image/png;base64,AA=="}]}],"signature":"fictive","champInconnu":{"nombre":9007199254740993}}';
$insert=$db->prepare("INSERT INTO rapport_reports(id,public_id,title,reference_code,payload_json,owner_provider,owner_id,updated_at,created_by_id,updated_by_id) VALUES(?,?,?,?,?,'avereo_connect','101','2026-01-01','101','101')");
foreach ([1,2,3,4] as $num) $insert->execute([$num,str_repeat((string)$num,32),'Fictif','MISSION-'.$num,$payload]);
$db->exec("INSERT INTO rapport_export_grants VALUES(10,401,'test-A',NULL),(20,402,'test-B',NULL);
    INSERT INTO rapport_export_scopes VALUES(1,10,'avereo_connect','101','test-mission-A'),
    (2,20,'avereo_connect','101','test-mission-B'),(4,10,'avereo_connect','102','test-obsolete')");
$service=new RapportOrganizationExports($db);
$before=$db->query('SELECT * FROM rapport_reports ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
$id=fn(int $n):string=>str_repeat((string)$n,32);
check($service->hasGrant(401) && !$service->hasGrant(999),'Permission by account');
check(array_column($service->listing(401,''),'id')===[$id(1)],'Visible scope excludes legacy and obsolete records');
check($service->listing(401,'MISSION-2')===[],'Search remains scoped');
check($service->download(401,$id(2),'continuite')===null,'Shared owner, unauthorized organization');
check($service->download(401,$id(3),'continuite')===null,'Historical report, no verified organization');
check($service->download(401,$id(4),'continuite')===null,'Ownership changed since binding');
check($service->download(999,$id(1),'assistance')===null,'Other account');
check($service->download(402,$id(2),'assistance')===$payload,'Exact bytes, including attachments and large integer');
$db->exec("INSERT INTO rapport_export_grants VALUES(20,401,'test-B-bis',NULL)");
check(count($service->listing(401,''))===2 && $service->download(401,$id(2),'continuite')===$payload,'Two separately authorized organizations');
$db->exec('DELETE FROM rapport_export_grants WHERE organization_id=20 AND connect_user_id=401');
check($service->download(401,$id(2),'continuite')===null,'Withdrawn from the same session');
$db->exec("UPDATE rapport_export_grants SET expires_at='2000-01-01' WHERE connect_user_id=401");
check(!$service->hasGrant(401) && $service->listing(401,'')===[],'Expired grant');
check($before===$db->query('SELECT * FROM rapport_reports ORDER BY id')->fetchAll(PDO::FETCH_ASSOC),'Contents, owner and timestamp preserved');
check((int)$db->query('SELECT COUNT(*) FROM rapport_export_events')->fetchColumn()===2,'One receipt per delivery');
if ($native) {
    $db->exec("CREATE TRIGGER block_test_export BEFORE INSERT ON rapport_export_events FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='audit unavailable in fixture'");
} else {
    $db->exec("CREATE TRIGGER block_test_export BEFORE INSERT ON rapport_export_events BEGIN SELECT RAISE(ABORT,'audit unavailable in fixture'); END");
}
try { $service->download(402,$id(2),'assistance'); throw new RuntimeException('Missing audit should block download'); } catch (PDOException) {}
echo "PASS Rapport: scoped listing, full JSON, revocation, missing bindings, audit and source preservation\n";
