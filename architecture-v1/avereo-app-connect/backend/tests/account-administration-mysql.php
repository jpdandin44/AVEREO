<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/autoload.php';
if(!in_array(getenv('APP_ENV'),['local','test'],true))throw new RuntimeException('Test environment required.');
$control=\Avereo\Connect\Database::connect(\Avereo\Connect\Config::fromEnvironment());
if(!$control)throw new RuntimeException('MySQL test connection required.');
$tables=['users','organizations','memberships','applications','entitlements','user_application_access','audit_events','pending_identities'];
$counts=static function()use($control,$tables){$out=[];foreach($tables as $table)$out[$table]=(int)$control->query('SELECT COUNT(*) FROM `'.$table.'`')->fetchColumn();return $out;};
$persistentCountsBefore=$counts();$columnsBefore=$control->query("SHOW COLUMNS FROM users LIKE 'access_starts_at'")->fetch()!==false;
putenv('ACCOUNT_ADMIN_MYSQL_TEMPORARY=true');
require __DIR__.'/account-administration.php';
// Only this fixture connection has TEMPORARY users; never run the migration on the control connection.
$pdo->exec(file_get_contents(dirname(__DIR__,2).'/database/migrations/20261103070000_account_access_period.down.sql'));
if($pdo->query("SHOW COLUMNS FROM users LIKE 'access_starts_at'")->fetch()!==false)throw new RuntimeException('Temporary migration rollback failed.');
if($counts()!==$persistentCountsBefore || ($control->query("SHOW COLUMNS FROM users LIKE 'access_starts_at'")->fetch()!==false)!==$columnsBefore)
    throw new RuntimeException('Persistent tables changed during isolated test.');
echo json_encode(['nativeMigrationRollback'=>'passed','persistentTablesUnchanged'=>true,'databaseVersion'=>$control->getAttribute(PDO::ATTR_SERVER_VERSION)]).PHP_EOL;
