<?php
declare(strict_types=1);
require __DIR__ . '/connect_preprod_backup.php';
umask(0077);
try {
    $options = getopt('', ['manifest:', 'production-config:']);
    $manifest = json_decode(file_get_contents(privatePath($options['manifest'] ?? '')), true, flags: JSON_THROW_ON_ERROR);
    $root = '/home/daje3540/connect-preprod.avereo.fr';
    if (realpath($root) !== $root || realpath($root . '/public') !== $root . '/public') {
        throw new RuntimeException('Racine CONNECT differente de la cible canonique.');
    }
    $values = configuration(CONNECT_CONFIG);
    preproduction($values);
    $pdo = connection($values);
    $production = configuration($options['production-config'] ?? '');
    if (!in_array($production['APP_ENV'] ?? '', ['prod', 'production'], true)) {
        throw new RuntimeException('Configuration production non qualifiee.');
    }
    $versions = $pdo->query('SELECT version FROM schema_migrations ORDER BY version')->fetchAll(PDO::FETCH_COLUMN);
    $columns = array_column($pdo->query('DESCRIBE users')->fetchAll(), 'Field');
    $different = []; $missing = []; $matched = 0;
    foreach ($manifest['files'] as $name => $file) {
        if ($name === 'public/.htaccess' || !preg_match('#^(public|src|bin|database)/[a-zA-Z0-9_./-]+$#D', $name) || str_contains($name, '..')) {
            continue;
        }
        $path = $root . '/' . $name;
        if (!is_file($path)) {
            $missing[] = $name;
        } elseif (realpath($path) !== $path) {
            throw new RuntimeException('Lien symbolique dans les fichiers heberges.');
        } elseif (hash('sha256', str_replace("\r\n", "\n", file_get_contents($path))) !== $file['sha256']) {
            $different[] = $name;
        } else {
            $matched++;
        }
    }
    $htaccess = file_get_contents($root . '/public/.htaccess');
    $activation = (string)($values['IDENTITY_ACCOUNT_ACTIVATION_URL'] ?? '');
    $passportRoot = '/home/daje3540/passeport-immo-preprod.avereo.fr/public';
    $report = ['observed_at' => gmdate('c'), 'source_sha' => $manifest['source_sha'],
               'artifact_sha256' => $manifest['artifact_sha256'], 'document_root' => $root . '/public',
               'database_distinct_from_production' => identity($pdo) !== identity(connection($production)),
               'mysql_version' => $pdo->query('SELECT VERSION()')->fetchColumn(),
               'migration_versions' => $versions, 'users_columns' => $columns,
               'users_count' => (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
               'active_catalog_codes' => $pdo->query("SELECT code FROM applications WHERE status='active' ORDER BY code")->fetchAll(PDO::FETCH_COLUMN),
               'files_matched' => $matched, 'files_different' => $different, 'files_missing' => $missing,
               'htaccess_sha256' => hash('sha256', $htaccess), 'basic_auth_preserved' => str_contains($htaccess, 'BEGIN AVEREO PREPROD BASIC AUTH'),
               'activation_url_is_preproduction' => str_starts_with($activation, 'https://auth-next-preprod.avereo.fr/'),
               'activation_secret_configured' => strlen((string)($values['IDENTITY_ACCOUNT_ACTIVATION_SECRET'] ?? '')) >= 32,
               'passport_launch_url_configured' => !empty($values['APP_LAUNCH_PASSEPORT_IMMO_URL']),
               'passport_launch_secret_configured' => !empty($values['APP_LAUNCH_PASSEPORT_IMMO_SECRET']),
               'passport_root_canonical' => realpath($passportRoot) === $passportRoot,
               'passport_files' => is_dir($passportRoot) ? array_values(array_diff(scandir($passportRoot), ['.', '..'])) : [],
               'hosted_application_modified' => false, 'production_modified' => false];
    $receipt = dirname($options['manifest']) . '/inspection.json';
    file_put_contents($receipt, json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . "\n");
    chmod($receipt, 0600);
    echo json_encode($report, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n";
} catch (Throwable $error) {
    fwrite(STDERR, $error instanceof PDOException ? "Connexion/lecture MySQL en echec (details non affiches).\n" : $error->getMessage() . "\n");
    exit(1);
}
