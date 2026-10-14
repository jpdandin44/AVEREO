<?php
declare(strict_types=1);

// CLI only. Secrets and dumps stay in the server's private directory.
const CONNECT_PRIVATE = '/home/daje3540/private/';
const CONNECT_CONFIG = CONNECT_PRIVATE . 'connect-preprod/config.php';

function privatePath(string $path, bool $directory = false): string
{
    if (($path !== rtrim(CONNECT_PRIVATE, '/') && !str_starts_with($path, CONNECT_PRIVATE)) || realpath($path) !== $path
        || ($directory ? !is_dir($path) : !is_file($path)) || (fileperms($path) & 0077)) {
        throw new RuntimeException('Chemin prive canonique et permissions 0700/0600 requis.');
    }
    return $path;
}

function configuration(string $path): array
{
    privatePath($path);
    $values = require $path;
    if (!is_array($values) || !isset($values['DB_DSN'], $values['DB_USER'], $values['DB_PASSWORD'])
        || !preg_match('/^mysql:host=([^;]+);(?:port=([0-9]+);)?dbname=([a-zA-Z0-9_]+);charset=utf8mb4$/D', $values['DB_DSN'], $match)) {
        throw new RuntimeException('Configuration MySQL privee incompatible.');
    }
    return array_merge($values, ['host' => $match[1], 'port' => $match[2] ?: '3306', 'database' => $match[3]]);
}

function connection(array $values): PDO
{
    return new PDO($values['DB_DSN'], $values['DB_USER'], $values['DB_PASSWORD'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_STRINGIFY_FETCHES => true]);
}

function identity(PDO $pdo): string
{
    return (string)$pdo->query("SELECT CONCAT(@@hostname, ':', @@port, ':', DATABASE())")->fetchColumn();
}

function preproduction(array $values): void
{
    if (($values['APP_ENV'] ?? '') !== 'preprod'
        || ($values['OAUTH_REDIRECT_URI'] ?? '') !== 'https://connect-preprod.avereo.fr/api/v1/auth/callback') {
        throw new RuntimeException('La configuration ne designe pas CONNECT preproduction.');
    }
}

function snapshot(PDO $pdo): array
{
    $tables = $pdo->query('SHOW FULL TABLES')->fetchAll(PDO::FETCH_NUM);
    $result = [];
    foreach ($tables as [$name, $kind]) {
        if ($kind !== 'BASE TABLE' || !preg_match('/^[a-zA-Z0-9_]+$/D', $name)) {
            throw new RuntimeException('Vue ou nom de table inattendu ; sauvegarde manuelle requise.');
        }
        $ddl = $pdo->query('SHOW CREATE TABLE `' . $name . '`')->fetch(PDO::FETCH_NUM)[1];
        if (!str_contains($ddl, 'ENGINE=InnoDB')) {
            throw new RuntimeException('Table non transactionnelle ; sauvegarde manuelle requise.');
        }
        $rows = [];
        $statement = $pdo->query('SELECT * FROM `' . $name . '`');
        while ($row = $statement->fetch(PDO::FETCH_NUM)) {
            $rows[] = hash('sha256', serialize($row));
        }
        sort($rows, SORT_STRING);
        $result[$name] = ['ddl_sha256' => hash('sha256', $ddl), 'rows' => count($rows),
                         'rows_sha256' => hash('sha256', implode('', $rows))];
    }
    ksort($result);
    return $result;
}

function mysqlCommand(string $binary, array $values, string $directory, array $arguments, ?string $input = null): void
{
    $defaults = $directory . '/client-' . bin2hex(random_bytes(8)) . '.cnf';
    $quote = fn(string $value): string => '"' . str_replace(["\\", '"', "\n", "\r"], ["\\\\", '\\"', '\\n', '\\r'], $value) . '"';
    $config = "[client]\n";
    foreach (['host' => $values['host'], 'port' => $values['port'], 'user' => $values['DB_USER'],
              'password' => $values['DB_PASSWORD']] as $key => $value) {
        $config .= $key . '=' . $quote((string)$value) . "\n";
    }
    if (file_put_contents($defaults, $config) === false) {
        throw new RuntimeException('Creation du fichier client prive impossible.');
    }
    chmod($defaults, 0600);
    try {
        $command = array_merge([$binary, '--defaults-extra-file=' . $defaults], $arguments, [$values['database']]);
        $process = proc_open($command, [0 => $input === null ? ['pipe', 'r'] : ['file', $input, 'r'],
                                      1 => ['file', '/dev/null', 'w'], 2 => ['file', $directory . '/client-error.log', 'a']], $pipes);
        if (!is_resource($process)) {
            throw new RuntimeException('Client MySQL indisponible.');
        }
        if (isset($pipes[0])) {
            fclose($pipes[0]);
        }
        if (proc_close($process) !== 0) {
            throw new RuntimeException('Client MySQL en echec ; journal prive a examiner sans le publier.');
        }
    } finally {
        unlink($defaults);
    }
}

function backup(string $productionConfig, string $output, string $dumpBinary): array
{
    $values = configuration(CONNECT_CONFIG);
    preproduction($values);
    $pdo = connection($values);
    $production = configuration($productionConfig);
    if (!in_array($production['APP_ENV'] ?? '', ['prod', 'production'], true)
        || identity($pdo) === identity(connection($production))) {
        throw new RuntimeException('Base de preproduction distincte de production non prouvee.');
    }
    privatePath(dirname($output), true);
    if (file_exists($output) || !mkdir($output, 0700)) {
        throw new RuntimeException('Un nouveau dossier prive de sauvegarde est requis.');
    }
    privatePath($output, true);
    // No database contents in stdout. Reject unqualified programmable objects.
    foreach (["SHOW TRIGGERS", "SHOW EVENTS", "SHOW PROCEDURE STATUS WHERE Db=DATABASE()", "SHOW FUNCTION STATUS WHERE Db=DATABASE()"] as $query) {
        if ($pdo->query($query)->fetch()) {
            throw new RuntimeException('Objet programmable detecte ; sauvegarde/restauration manuelle requise.');
        }
    }
    $before = snapshot($pdo);
    if (!isset($before['users'], $before['schema_migrations'])) {
        throw new RuntimeException('Schema CONNECT incomplet.');
    }
    $dump = $output . '/database.sql';
    touch($dump);
    chmod($dump, 0600);
    mysqlCommand($dumpBinary, $values, $output,
        ['--single-transaction', '--quick', '--skip-lock-tables', '--hex-blob', '--no-tablespaces', '--result-file=' . $dump]);
    if (!filesize($dump) || snapshot($pdo) !== $before) {
        throw new RuntimeException('Base modifiee pendant la sauvegarde ou dump vide ; repetition requise.');
    }
    $proof = ['target' => 'connect-preprod.avereo.fr', 'created_at' => gmdate('c'),
              'database_distinct_from_production' => true, 'dump_sha256' => hash_file('sha256', $dump),
              'dump_bytes' => filesize($dump), 'snapshot' => $before, 'source_database_modified' => false,
              'restore_verified' => false];
    file_put_contents($output . '/backup.json', json_encode($proof, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . "\n");
    chmod($output . '/backup.json', 0600);
    return $proof;
}

function verifyRestore(string $productionConfig, string $folder, string $restoreConfig, string $client): array
{
    privatePath($folder, true);
    privatePath($folder . '/backup.json');
    privatePath($folder . '/database.sql');
    $proof = json_decode(file_get_contents($folder . '/backup.json'), true, flags: JSON_THROW_ON_ERROR);
    if (!hash_equals($proof['dump_sha256'], hash_file('sha256', $folder . '/database.sql'))) {
        throw new RuntimeException('Empreinte du dump modifiee.');
    }
    $restore = configuration($restoreConfig);
    $pdo = connection($restore);
    if (($restore['APP_ENV'] ?? '') !== 'test' || $pdo->query('SHOW FULL TABLES')->fetch()
        || in_array(identity($pdo), [identity(connection(configuration(CONNECT_CONFIG))),
                                   identity(connection(configuration($productionConfig)))], true)) {
        throw new RuntimeException('Restauration autorisee seulement sur une base de test vide et distincte.');
    }
    mysqlCommand($client, $restore, $folder, ['--binary-mode'], $folder . '/database.sql');
    if (snapshot($pdo) !== $proof['snapshot']) {
        throw new RuntimeException('Restauration differente : conserver le dump et investiguer.');
    }
    $result = ['target' => 'connect-preprod.avereo.fr', 'dump_sha256' => $proof['dump_sha256'],
               'restore_verified' => true, 'restored_at' => gmdate('c'),
               'verification' => 'ddl_and_all_rows_hashes_equal', 'source_database_modified' => false];
    file_put_contents($folder . '/restore.json', json_encode($result, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . "\n");
    chmod($folder . '/restore.json', 0600);
    return $result;
}

if (PHP_SAPI === 'cli' && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    umask(0077);
    $options = getopt('', ['action:', 'production-config:', 'output:', 'restore-config:', 'dump-binary:', 'client-binary:']);
    try {
        $result = match ($options['action'] ?? '') {
            'backup' => backup($options['production-config'] ?? '', $options['output'] ?? '', $options['dump-binary'] ?? 'mysqldump'),
            'verify-restore' => verifyRestore($options['production-config'] ?? '', $options['output'] ?? '',
                                             $options['restore-config'] ?? '', $options['client-binary'] ?? 'mysql'),
            default => throw new RuntimeException('Action attendue : backup ou verify-restore. Aucune migration automatique.'),
        };
        unset($result['snapshot']);
        echo json_encode($result, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . "\n";
    } catch (Throwable $error) {
        fwrite(STDERR, $error instanceof PDOException ? "Connexion/lecture MySQL en echec (details non affiches).\n" : $error->getMessage() . "\n");
        exit(1);
    }
}
