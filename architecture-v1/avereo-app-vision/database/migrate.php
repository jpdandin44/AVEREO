<?php

declare(strict_types=1);

// Exécuteur de migrations SQL, sans dépendance.
//   php database/migrate.php            applique les migrations en attente
//   php database/migrate.php --status   liste ce qui est appliqué et ce qui attend
//   php database/migrate.php --dry-run  montre ce qui serait appliqué, sans rien exécuter
// Fichiers : database/migrations/NNN_description.sql, appliqués dans l'ordre. Une migration déjà appliquée
// ne se modifie jamais (empreinte contrôlée) : on ajoute une nouvelle migration.

const VISION_MIGRATION_LOCK = 'avereo_vision_migrations';

/** @return string[] chemins des fichiers de migration, triés */
function vision_migration_files(string $directory): array
{
    $files = glob(rtrim($directory, '/\\') . '/[0-9][0-9][0-9]_*.sql') ?: [];
    sort($files);
    return $files;
}

/** Empreinte du contenu, insensible aux fins de ligne (Windows ou Unix). */
function vision_migration_checksum(string $path): string
{
    return hash('sha256', str_replace("\r\n", "\n", (string) file_get_contents($path)));
}

/**
 * Applique (ou simule) les migrations en attente.
 * @param PDO $pdo connexion avec PDO::ATTR_EMULATE_PREPARES = true (plusieurs instructions par fichier)
 * @return array{applied: string[], already: string[], pending: string[]}
 */
function vision_migrate_run(PDO $pdo, string $directory, bool $dryRun = false): array
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS schema_migrations ('
        . 'version VARCHAR(190) NOT NULL, checksum CHAR(64) NOT NULL, '
        . 'applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (version)'
        . ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    $locked = (int) $pdo->query("SELECT GET_LOCK('" . VISION_MIGRATION_LOCK . "', 10)")->fetchColumn();
    if ($locked !== 1) {
        throw new RuntimeException('Une autre migration est en cours (verrou non obtenu).');
    }
    $result = ['applied' => [], 'already' => [], 'pending' => []];
    try {
        $known = [];
        foreach ($pdo->query('SELECT version, checksum FROM schema_migrations') as $row) {
            $known[$row['version']] = $row['checksum'];
        }
        foreach (vision_migration_files($directory) as $path) {
            $version = basename($path, '.sql');
            $checksum = vision_migration_checksum($path);
            if (isset($known[$version])) {
                if (!hash_equals($known[$version], $checksum)) {
                    throw new RuntimeException("La migration $version a été modifiée après son application : ajoutez une nouvelle migration.");
                }
                $result['already'][] = $version;
                continue;
            }
            if ($dryRun) {
                $result['pending'][] = $version;
                continue;
            }
            $statement = $pdo->query((string) file_get_contents($path));
            do {
                // parcourt toutes les instructions du fichier : une erreur d'une instruction tardive est levée ici
            } while ($statement->nextRowset());
            $insert = $pdo->prepare('INSERT INTO schema_migrations (version, checksum) VALUES (?, ?)');
            $insert->execute([$version, $checksum]);
            $result['applied'][] = $version;
        }
    } finally {
        $pdo->query("SELECT RELEASE_LOCK('" . VISION_MIGRATION_LOCK . "')")->fetchColumn();
    }
    return $result;
}

if (PHP_SAPI === 'cli' && isset($argv[0]) && realpath($argv[0]) === __FILE__) {
    require __DIR__ . '/../frontend/public/api/lib/config.php';
    try {
        $config = vision_config();
        $db = $config['db'];
        $pdo = new PDO(
            sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $db['host'], (int) $db['port'], $db['name']),
            (string) $db['user'],
            (string) $db['password'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => true, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
        $dryRun = in_array('--dry-run', $argv, true) || in_array('--status', $argv, true);
        $result = vision_migrate_run($pdo, __DIR__ . '/migrations', $dryRun);
        foreach ($result['already'] as $version) {
            echo "  déjà appliquée  $version" . PHP_EOL;
        }
        foreach ($result['pending'] as $version) {
            echo "  en attente      $version" . PHP_EOL;
        }
        foreach ($result['applied'] as $version) {
            echo "  appliquée       $version" . PHP_EOL;
        }
        echo 'Migrations : ' . count($result['applied']) . ' appliquée(s), ' . count($result['already']) . ' déjà en place, ' . count($result['pending']) . ' en attente.' . PHP_EOL;
    } catch (Throwable $exception) {
        fwrite(STDERR, 'Migration impossible : ' . $exception->getMessage() . PHP_EOL);
        exit(1);
    }
}
