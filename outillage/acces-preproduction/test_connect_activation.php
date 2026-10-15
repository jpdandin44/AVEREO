<?php
declare(strict_types=1);
require __DIR__ . '/connect_preprod_backup.php';
umask(0077);
const TEST_SOURCE = __DIR__ . '/../../architecture-v1/avereo-app-connect';
if (getenv('CONNECT_ACTIVATION_TEST_DISPOSABLE') !== '1' || file_exists(CONNECT_CONFIG)) {
    throw new RuntimeException('Fixture reservee a un environnement jetable explicite sans configuration CONNECT existante.');
}

function check(bool $ok, string $label): void
{
    if (!$ok) {
        throw new RuntimeException('FAIL ' . $label);
    }
    echo 'PASS ' . $label . "\n";
}
function refused(callable $action, string $label): void
{
    try {
        $action();
    } catch (RuntimeException $error) {
        check(true, $label);
        return;
    }
    throw new RuntimeException('FAIL refus manquant : ' . $label);
}
function fixtureConfig(string $path, string $database, string $environment): void
{
    $parent = dirname($path);
    if (!is_dir($parent)) {
        mkdir($parent, 0700, true);
    }
    $host = getenv('CONNECT_ACTIVATION_TEST_HOST') ?: 'database';
    $port = getenv('CONNECT_ACTIVATION_TEST_PORT') ?: '3306';
    $values = ['DB_DSN' => 'mysql:host=' . $host . ';port=' . $port . ';dbname=' . $database . ';charset=utf8mb4',
               'DB_USER' => 'root', 'DB_PASSWORD' => 'local_root_only', 'APP_ENV' => $environment,
               'OAUTH_REDIRECT_URI' => 'https://connect-preprod.avereo.fr/api/v1/auth/callback'];
    file_put_contents($path, '<?php return ' . var_export($values, true) . ';');
    chmod($path, 0600);
}
function sql(PDO $pdo, string $contents): void
{
    $statement = '';
    foreach (preg_split('/\R/', $contents) as $line) {
        if (trim($line) === '' || str_starts_with(trim($line), '--')) {
            continue;
        }
        $statement .= $line . "\n";
        if (str_ends_with(trim($line), ';')) {
            $pdo->exec($statement);
            $statement = '';
        }
    }
    check(trim($statement) === '', 'SQL fixture entier execute');
}

$testHost = getenv('CONNECT_ACTIVATION_TEST_HOST') ?: 'database';
$testPort = getenv('CONNECT_ACTIVATION_TEST_PORT') ?: '3306';
$admin = new PDO('mysql:host=' . $testHost . ';port=' . $testPort . ';dbname=avereo_connect_test;charset=utf8mb4', 'root', 'local_root_only');
foreach (['connect_prod_stub', 'connect_restore_test', 'connect_integration_test'] as $database) {
    $admin->exec('CREATE DATABASE `' . $database . '` CHARACTER SET utf8mb4');
}
fixtureConfig(CONNECT_CONFIG, 'avereo_connect_test', 'preprod');
$prodConfig = CONNECT_PRIVATE . 'connect-prod-stub/config.php';
$restoreConfig = CONNECT_PRIVATE . 'connect-restore-test/config.php';
fixtureConfig($prodConfig, 'connect_prod_stub', 'prod');
fixtureConfig($restoreConfig, 'connect_restore_test', 'test');
$sameProdConfig = CONNECT_PRIVATE . 'connect-same-prod/config.php';
$prodRestoreConfig = CONNECT_PRIVATE . 'connect-prod-restore/config.php';
fixtureConfig($sameProdConfig, 'avereo_connect_test', 'prod');
fixtureConfig($prodRestoreConfig, 'connect_prod_stub', 'test');
$pdo = connection(configuration(CONNECT_CONFIG));
$pdo->exec('CREATE TABLE schema_migrations (version VARCHAR(64) NOT NULL PRIMARY KEY, applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
$migrationFolder = TEST_SOURCE . '/database/migrations/';
$legacy = ['20260721120000_core', '20260729120000_pending_identities', '20260730120000_catalog_metadata', '20260803160000_user_application_access'];
foreach ($legacy as $version) {
    sql($pdo, file_get_contents($migrationFolder . $version . '.up.sql'));
    $pdo->prepare('INSERT INTO schema_migrations(version) VALUES (?)')->execute([$version]);
}
$pdo->exec("INSERT INTO users(drupal_subject,email_normalized,display_name,status) VALUES ('fixture-active','active@example.invalid','Actif fictif','active'),('fixture-suspended','suspended@example.invalid','Suspendu fictif','suspended')");
$oldUsers = $pdo->query('SELECT * FROM users ORDER BY id')->fetchAll();
$original = snapshot($pdo);
$folder = CONNECT_PRIVATE . 'activation-test';
refused(fn() => backup($sameProdConfig, $folder, 'mariadb-dump'), 'base production egale refusee');
refused(fn() => privatePath('/workspace'), 'destination publique refusee');
$proof = backup($prodConfig, $folder, 'mariadb-dump');
check($proof['snapshot'] === $original && !$proof['restore_verified'], 'dump complet sans qualification prematuree de restauration');
refused(fn() => verifyRestore($prodConfig, $folder, CONNECT_CONFIG, 'mariadb'), 'restauration dans la base source refusee');
refused(fn() => verifyRestore($prodConfig, $folder, $prodRestoreConfig, 'mariadb'), 'restauration dans une base production vide refusee');
$restoreProof = verifyRestore($prodConfig, $folder, $restoreConfig, 'mariadb');
check($restoreProof['restore_verified'], 'restauration des DDL et empreintes de toutes les lignes identique');
check(snapshot($pdo) === $original, 'source inchangee par sauvegarde et restauration');
refused(fn() => verifyRestore($prodConfig, $folder, $restoreConfig, 'mariadb'), 'base de restauration non vide refusee');
$data = file_get_contents($folder . '/database.sql');
file_put_contents($folder . '/database.sql', $data . '-- altered');
refused(fn() => verifyRestore($prodConfig, $folder, $restoreConfig, 'mariadb'), 'dump altere refuse avant import');
file_put_contents($folder . '/database.sql', $data);
check((fileperms($folder . '/database.sql') & 0077) === 0 && glob($folder . '/client-*.cnf') === [], 'dump prive et fichier de secrets temporaire retire');

// Apply the real runner to the restored test database, never the source.
$restored = connection(configuration($restoreConfig));
$command = [PHP_BINARY, TEST_SOURCE . '/backend/bin/migrate.php', '--direction=up', '--config=' . $restoreConfig];
$process = proc_open($command, [0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']], $pipes);
fclose($pipes[0]);
$output = stream_get_contents($pipes[1]); fclose($pipes[1]);
$error = stream_get_contents($pipes[2]); fclose($pipes[2]);
check(proc_close($process) === 0 && $error === '' && substr_count($output, 'UP ') === 1 && substr_count($output, 'SKIP ') === 4, 'runner reel : quatre SKIP et une migration activation');
$newUsers = $restored->query('SELECT * FROM users ORDER BY id')->fetchAll();
foreach ($newUsers as $index => $user) {
    check($user['onboarding_status'] === 'completed' && $user['activation_email_sent_at'] === null, 'ancien compte conserve sans reenvoi de mail');
    unset($user['onboarding_status'], $user['activation_email_sent_at']);
    check($user === $oldUsers[$index], 'donnees et statut ancien compte preserves');
}
refused(fn() => $restored->exec("UPDATE users SET onboarding_status='unexpected' WHERE id=1"), 'contrainte activation invalide refusee');
$process = proc_open($command, [0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']], $pipes);
fclose($pipes[0]); $output = stream_get_contents($pipes[1]); fclose($pipes[1]);
$error = stream_get_contents($pipes[2]); fclose($pipes[2]);
check(proc_close($process) === 0 && $error === '' && substr_count($output, 'SKIP ') === 5 && !str_contains($output, 'UP '), 'deuxieme migration idempotente');
check(snapshot($pdo) === $original, 'base originale toujours intacte apres migration du clone');
echo "PASS repetition locale : sauvegarde, restauration distincte et migration activation\n";
