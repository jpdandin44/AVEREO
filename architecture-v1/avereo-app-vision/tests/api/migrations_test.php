<?php

declare(strict_types=1);

// Exécuteur de migrations : tests d'intégration sur la base locale (dans le conteneur). Les migrations d'essai
// (numéros 990 et plus) vivent dans un dossier temporaire ; tout est nettoyé en fin de test.
require_once __DIR__ . '/../../frontend/public/api/lib/config.php';
require_once __DIR__ . '/../../database/migrate.php';

function vision_migration_test_pdo(): PDO
{
    try {
        $config = vision_config();
        $db = $config['db'];
        return new PDO(
            sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $db['host'], (int) $db['port'], $db['name']),
            (string) $db['user'],
            (string) $db['password'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => true, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    } catch (Throwable) {
        vision_skip('base de données locale indisponible : lancer les tests dans le conteneur');
    }
}

/** Dossier temporaire de migrations d'essai ; retourne son chemin. */
function vision_migration_test_dir(array $files): string
{
    $dir = sys_get_temp_dir() . '/vision-mig-' . bin2hex(random_bytes(4));
    mkdir($dir, 0700, true);
    foreach ($files as $name => $sql) {
        file_put_contents("$dir/$name", $sql);
    }
    return $dir;
}

function vision_migration_test_cleanup(PDO $pdo, string $dir, array $tables): void
{
    foreach ($tables as $table) {
        $pdo->exec("DROP TABLE IF EXISTS `$table`");
    }
    foreach (glob("$dir/*.sql") ?: [] as $file) {
        $pdo->prepare('DELETE FROM schema_migrations WHERE version = ?')->execute([basename($file, '.sql')]);
        unlink($file);
    }
    rmdir($dir);
}

vision_test('migrations : la migration 001 est appliquée et rejouable sans effet', function () {
    $pdo = vision_migration_test_pdo();
    $real = __DIR__ . '/../../database/migrations';
    $first = vision_migrate_run($pdo, $real);
    vision_assert_same([], $first['pending']);
    $second = vision_migrate_run($pdo, $real);
    vision_assert_same([], $second['applied'], 'rien à appliquer au deuxième passage');
    vision_assert_true(in_array('001_create_vision_projects', $second['already'], true));
    $columns = array_column($pdo->query('SHOW COLUMNS FROM vision_projects')->fetchAll(), 'Field');
    foreach (['public_id', 'name', 'owner_provider', 'owner_id', 'status', 'archived_at'] as $column) {
        vision_assert_true(in_array($column, $columns, true), $column);
    }
});

vision_test('migrations : application dans l\'ordre, empreinte enregistrée, simulation sans effet', function () {
    $pdo = vision_migration_test_pdo();
    $dir = vision_migration_test_dir([
        '991_zz_b.sql' => "CREATE TABLE zz_mig_b (id INT PRIMARY KEY);\nINSERT INTO zz_mig_b VALUES (1);",
        '990_zz_a.sql' => 'CREATE TABLE zz_mig_a (id INT PRIMARY KEY);',
    ]);
    try {
        $dry = vision_migrate_run($pdo, $dir, true);
        vision_assert_same(['990_zz_a', '991_zz_b'], $dry['pending']);
        vision_assert_same([], $pdo->query("SHOW TABLES LIKE 'zz_mig_%'")->fetchAll(), 'la simulation ne crée rien');
        $run = vision_migrate_run($pdo, $dir);
        vision_assert_same(['990_zz_a', '991_zz_b'], $run['applied']);
        vision_assert_same(1, (int) $pdo->query('SELECT COUNT(*) FROM zz_mig_b')->fetchColumn(), 'plusieurs instructions par fichier');
        $row = $pdo->query("SELECT checksum FROM schema_migrations WHERE version = '990_zz_a'")->fetch();
        vision_assert_same(64, strlen($row['checksum']));
    } finally {
        vision_migration_test_cleanup($pdo, $dir, ['zz_mig_a', 'zz_mig_b']);
    }
});

vision_test('migrations : une migration appliquée puis modifiée est refusée', function () {
    $pdo = vision_migration_test_pdo();
    $dir = vision_migration_test_dir(['992_zz_c.sql' => 'CREATE TABLE zz_mig_c (id INT PRIMARY KEY);']);
    try {
        vision_migrate_run($pdo, $dir);
        file_put_contents("$dir/992_zz_c.sql", 'CREATE TABLE zz_mig_c (id INT PRIMARY KEY, extra INT);');
        vision_assert_throws(fn () => vision_migrate_run($pdo, $dir), RuntimeException::class, 'modifiée');
    } finally {
        vision_migration_test_cleanup($pdo, $dir, ['zz_mig_c']);
    }
});

vision_test('migrations : les fins de ligne Windows ne changent pas l\'empreinte', function () {
    $pdo = vision_migration_test_pdo();
    $dir = vision_migration_test_dir(['993_zz_d.sql' => "CREATE TABLE zz_mig_d (\n  id INT PRIMARY KEY\n);"]);
    try {
        vision_migrate_run($pdo, $dir);
        file_put_contents("$dir/993_zz_d.sql", "CREATE TABLE zz_mig_d (\r\n  id INT PRIMARY KEY\r\n);");
        $again = vision_migrate_run($pdo, $dir);
        vision_assert_same(['993_zz_d'], $again['already']);
    } finally {
        vision_migration_test_cleanup($pdo, $dir, ['zz_mig_d']);
    }
});

vision_test('migrations : une instruction en erreur est signalée et la migration n\'est pas enregistrée', function () {
    $pdo = vision_migration_test_pdo();
    $dir = vision_migration_test_dir(['994_zz_e.sql' => "CREATE TABLE zz_mig_e (id INT PRIMARY KEY);\nINSERT INTO table_inexistante VALUES (1);"]);
    try {
        vision_assert_throws(fn () => vision_migrate_run($pdo, $dir), PDOException::class);
        $count = (int) $pdo->query("SELECT COUNT(*) FROM schema_migrations WHERE version = '994_zz_e'")->fetchColumn();
        vision_assert_same(0, $count);
    } finally {
        vision_migration_test_cleanup($pdo, $dir, ['zz_mig_e']);
    }
});

vision_test('migrations : le verrou est relâché après une erreur', function () {
    $pdo = vision_migration_test_pdo();
    $other = vision_migration_test_pdo();
    $dir = vision_migration_test_dir(['995_zz_f.sql' => 'INSERT INTO table_inexistante VALUES (1);']);
    try {
        try {
            vision_migrate_run($pdo, $dir);
        } catch (Throwable) {
        }
        $free = (int) $other->query("SELECT IS_FREE_LOCK('" . VISION_MIGRATION_LOCK . "')")->fetchColumn();
        vision_assert_same(1, $free);
    } finally {
        vision_migration_test_cleanup($pdo, $dir, []);
    }
});
