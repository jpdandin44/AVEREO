<?php

declare(strict_types=1);

use Avereo\Connect\Config;
use Avereo\Connect\Database;

require dirname(__DIR__) . '/src/autoload.php';

$options = getopt('', ['direction:', 'all', 'dry-run']);
$direction = $options['direction'] ?? 'up';
$all = array_key_exists('all', $options);
$dryRun = array_key_exists('dry-run', $options);

if (!in_array($direction, ['up', 'down'], true)) {
    fwrite(STDERR, "--direction doit valoir up ou down.\n");
    exit(2);
}

$migrationDirectories = [
    // O2Switch layout: public/, src/, bin/ and database/ share the application root.
    dirname(__DIR__) . '/database/migrations',
    // Repository layout: backend/bin sits beside the application-level database/.
    dirname(__DIR__, 2) . '/database/migrations',
];
$migrationDirectory = '';
foreach ($migrationDirectories as $candidate) {
    if (is_dir($candidate)) {
        $migrationDirectory = $candidate;
        break;
    }
}
if ($migrationDirectory === '') {
    fwrite(
        STDERR,
        "Dossier de migrations introuvable. Emplacements controles : "
        . implode(', ', $migrationDirectories)
        . "\n",
    );
    exit(2);
}
$pattern = $migrationDirectory . '/*.' . $direction . '.sql';
$files = glob($pattern) ?: [];
sort($files, SORT_STRING);

if ($files === []) {
    fwrite(STDERR, "Aucune migration trouvée dans {$migrationDirectory}.\n");
    exit(2);
}

if ($dryRun) {
    foreach ($direction === 'down' ? array_reverse($files) : $files as $file) {
        fwrite(STDOUT, basename($file) . "\n");
        if ($direction === 'down' && !$all) {
            break;
        }
    }
    exit(0);
}

try {
    $config = Config::fromEnvironment();
    $pdo = Database::connect($config);
    if (!$pdo instanceof PDO) {
        throw new RuntimeException('DB_DSN doit être configuré pour exécuter les migrations.');
    }

    $lock = $pdo->query("SELECT GET_LOCK('avereo_connect_migrations', 10)")->fetchColumn();
    if ((int) $lock !== 1) {
        throw new RuntimeException('Impossible d’obtenir le verrou de migration.');
    }

    try {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS schema_migrations ('
            . 'version VARCHAR(64) NOT NULL PRIMARY KEY, '
            . 'applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)'
            . ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
        );

        $applied = $pdo->query('SELECT version FROM schema_migrations ORDER BY version')->fetchAll(PDO::FETCH_COLUMN);
        $appliedMap = array_fill_keys(array_map('strval', $applied), true);

        if ($direction === 'up') {
            foreach ($files as $file) {
                $version = migrationVersion($file, 'up');
                if (isset($appliedMap[$version])) {
                    fwrite(STDOUT, "SKIP {$version}\n");
                    continue;
                }
                executeSqlFile($pdo, $file);
                $statement = $pdo->prepare('INSERT INTO schema_migrations (version) VALUES (:version)');
                $statement->execute(['version' => $version]);
                fwrite(STDOUT, "UP {$version}\n");
            }
        } else {
            $downFiles = [];
            foreach ($files as $file) {
                $downFiles[migrationVersion($file, 'down')] = $file;
            }
            $versions = array_reverse(array_map('strval', $applied));
            foreach ($versions as $version) {
                if (!isset($downFiles[$version])) {
                    throw new RuntimeException("Migration descendante absente pour {$version}.");
                }
                executeSqlFile($pdo, $downFiles[$version]);
                $statement = $pdo->prepare('DELETE FROM schema_migrations WHERE version = :version');
                $statement->execute(['version' => $version]);
                fwrite(STDOUT, "DOWN {$version}\n");
                if (!$all) {
                    break;
                }
            }
        }
    } finally {
        $pdo->query("SELECT RELEASE_LOCK('avereo_connect_migrations')");
    }
} catch (Throwable $exception) {
    fwrite(STDERR, 'Migration échouée : ' . $exception->getMessage() . "\n");
    exit(1);
}

function migrationVersion(string $file, string $direction): string
{
    $suffix = '.' . $direction . '.sql';
    $name = basename($file);
    if (!str_ends_with($name, $suffix)) {
        throw new RuntimeException("Nom de migration invalide : {$name}");
    }
    return substr($name, 0, -strlen($suffix));
}

function executeSqlFile(PDO $pdo, string $file): void
{
    $contents = file_get_contents($file);
    if ($contents === false) {
        throw new RuntimeException("Lecture impossible : {$file}");
    }

    $statement = '';
    foreach (preg_split('/\R/', $contents) ?: [] as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '--')) {
            continue;
        }
        $statement .= $line . "\n";
        if (str_ends_with($trimmed, ';')) {
            $pdo->exec($statement);
            $statement = '';
        }
    }
    if (trim($statement) !== '') {
        throw new RuntimeException('Instruction SQL sans point-virgule final dans ' . basename($file));
    }
}
