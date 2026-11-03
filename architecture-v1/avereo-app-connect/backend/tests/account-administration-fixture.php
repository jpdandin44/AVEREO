<?php
// Test-only isolated databases. Native mode shadows every referenced real table with an empty TEMPORARY table.
declare(strict_types=1);
function accountTestDatabase(?string $file=null):PDO {
    if(getenv('ACCOUNT_ADMIN_MYSQL_TEMPORARY')!=='true') {
        $pdo=new PDO($file===null?'sqlite::memory:':'sqlite:'.$file,null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
        $pdo->sqliteCreateFunction('UTC_TIMESTAMP',static fn(...$args)=>gmdate('Y-m-d H:i:s'),-1);
        if($file!==null && $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")->fetchColumn()!==false)return $pdo;
        $pdo->exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT,drupal_subject TEXT UNIQUE,email_normalized TEXT UNIQUE,display_name TEXT,status TEXT,onboarding_status TEXT,access_starts_at TEXT,access_ends_at TEXT,application_access_mode TEXT DEFAULT 'inherit');
        CREATE TABLE memberships(id INTEGER PRIMARY KEY,organization_id INT,user_id INT,role TEXT,status TEXT);
        CREATE TABLE organizations(id INTEGER PRIMARY KEY,status TEXT);
        CREATE TABLE applications(id INTEGER PRIMARY KEY,code TEXT,name TEXT,description TEXT,display_order INT,status TEXT);
        CREATE TABLE entitlements(organization_id INT,application_id INT,status TEXT,valid_from TEXT,valid_to TEXT,granted_by_user_id INT);
        CREATE TABLE user_application_access(organization_id INT,user_id INT,application_id INT,status TEXT,granted_by_user_id INT);
        CREATE TABLE audit_events(actor_user_id INT,organization_id INT,action TEXT,target_type TEXT,target_id TEXT,outcome TEXT,request_id TEXT,metadata_json TEXT);
        INSERT INTO users(id,drupal_subject,email_normalized,display_name,status,onboarding_status) VALUES (1,'owner','owner@example.invalid','Owner','active','completed'),(2,'member','member@example.invalid','Member','active','completed');
        INSERT INTO organizations VALUES(7,'active'); INSERT INTO memberships VALUES(1,7,1,'owner','active'),(2,7,2,'member','active');
        INSERT INTO applications VALUES(1,'rapport','Rapport','',1,'active'),(2,'rga','RGA','',2,'active'),(3,'coupe','Coupe','',3,'active');
        INSERT INTO entitlements(organization_id,application_id,status) VALUES(7,1,'active'),(7,2,'active'),(7,3,'active');");
        $pdo->exec('ALTER TABLE applications ADD COLUMN launch_url TEXT; ALTER TABLE applications ADD COLUMN required_scope TEXT');
        $pdo->exec("ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT '2026-11-03 07:00:00'; ALTER TABLE users ADD COLUMN updated_at TEXT; ALTER TABLE users ADD COLUMN activation_email_sent_at TEXT;
        ALTER TABLE organizations ADD COLUMN name TEXT DEFAULT 'Organisation de recette'; ALTER TABLE organizations ADD COLUMN slug TEXT DEFAULT 'test'; ALTER TABLE organizations ADD COLUMN owner_membership_id INT;
        CREATE TABLE pending_identities(id INT,email_normalized TEXT,display_name TEXT,first_seen_at TEXT,last_seen_at TEXT,status TEXT);");
        return $pdo;
    }
    if(!in_array(getenv('APP_ENV'),['test','local'],true))throw new RuntimeException('Explicit test environment required.');
    $pdo=\Avereo\Connect\Database::connect(\Avereo\Connect\Config::fromEnvironment());
    if(!$pdo)throw new RuntimeException('MySQL test connection required.');
    foreach(['users','organizations','memberships','applications','entitlements','user_application_access','audit_events','pending_identities'] as $table) {
        $pdo->exec('CREATE TEMPORARY TABLE `__account_fixture_'.$table.'` LIKE `'.$table.'`');
        $pdo->exec('ALTER TABLE `__account_fixture_'.$table.'` RENAME TO `'.$table.'`');
        if((int)$pdo->query('SELECT COUNT(*) FROM `'.$table.'`')->fetchColumn()!==0)throw new RuntimeException('Temporary fixture not empty.');
    }
    if($pdo->query("SHOW COLUMNS FROM users LIKE 'onboarding_status'")->fetch()===false)
        $pdo->exec(file_get_contents(dirname(__DIR__,2).'/database/migrations/20260804140000_account_activation_status.up.sql'));
    if($pdo->query("SHOW COLUMNS FROM users LIKE 'access_starts_at'")->fetch()===false)
        $pdo->exec(file_get_contents(dirname(__DIR__,2).'/database/migrations/20261103070000_account_access_period.up.sql'));
    $pdo->exec("INSERT INTO users(id,drupal_subject,email_normalized,display_name,status,onboarding_status) VALUES (1,'owner','owner@example.invalid','Owner','active','completed'),(2,'member','member@example.invalid','Member','active','completed');
INSERT INTO organizations(id,name,slug,status) VALUES(7,'Organisation de recette','account-test','active');
INSERT INTO memberships(id,organization_id,user_id,role,status) VALUES(1,7,1,'owner','active'),(2,7,2,'member','active');
INSERT INTO applications(id,code,name,launch_url,description,display_order,status) VALUES(1,'rapport','Rapport','https://example.invalid/rapport','',1,'active'),(2,'rga','RGA','https://example.invalid/rga','',2,'active'),(3,'coupe','Coupe','https://example.invalid/coupe','',3,'active');
INSERT INTO entitlements(organization_id,application_id,status,granted_by_user_id) VALUES(7,1,'active',1),(7,2,'active',1),(7,3,'active',1);");
    return $pdo;
}
