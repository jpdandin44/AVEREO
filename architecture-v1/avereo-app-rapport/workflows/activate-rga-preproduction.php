<?php
declare(strict_types=1);
// Private staging only. No secret, database credential or account identity is printed.
use Avereo\Connect\Repository\RgaRegistration;
if (PHP_SAPI !== 'cli' || dirname(__DIR__) !== '/home/daje3540/.avereo/rga-preprod') {
    throw new RuntimeException('Exécution CLI dans le dossier privé de préproduction requise.');
}
require __DIR__ . '/candidate/connect/src/Repository/RgaRegistration.php';
const CONNECT_CONFIG = '/home/daje3540/private/connect-preprod/config.php';
const RGA_CONFIG = '/home/daje3540/.avereo/rga-preprod/config.php';
const RGA_URL = 'https://rapport-preprod.avereo.fr/rga/';

function readJson(string $name): array {
    return json_decode(file_get_contents(__DIR__ . '/' . $name), true, 512, JSON_THROW_ON_ERROR);
}
function requireCheck(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
function writePrivate(string $path, string $bytes): void {
    $tmp = $path . '.rga-pending';
    $f = fopen($tmp, 'x');
    requireCheck($f !== false, 'Fichier temporaire déjà présent.');
    chmod($tmp, 0600);
    requireCheck(fwrite($f, $bytes) === strlen($bytes), 'Écriture privée incomplète.');
    fclose($f);
    requireCheck(rename($tmp, $path), 'Installation du fichier privé impossible.');
}
function saveJson(string $name, array $value): void {
    writePrivate(__DIR__ . '/' . $name, json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n");
}
function database(array $config): PDO {
    return new PDO($config['DB_DSN'], $config['DB_USER'], $config['DB_PASSWORD'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
}
function copyRows(PDO $pdo, string $table, array $rows): void {
    foreach ($rows as $row) {
        $columns = array_keys($row);
        foreach ($columns as $name) requireCheck((bool) preg_match('/^[a-z_]+$/', $name), 'Colonne invalide.');
        $q = $pdo->prepare('INSERT INTO ' . $table . ' (' . implode(',', $columns) . ') VALUES (' . implode(',', array_fill(0, count($row), '?')) . ')');
        $q->execute(array_values($row));
    }
}
function rehearse(PDO $live, array $plan, int $actor): void {
    $q = $live->prepare('SELECT * FROM users WHERE id=?'); $q->execute([$actor]); $user = $q->fetch();
    requireCheck(is_array($user), 'Opérateur absent.');
    $q = $live->prepare('SELECT user_id,organization_id,status,role FROM memberships WHERE user_id=?'); $q->execute([$actor]); $memberships = $q->fetchAll();
    $db = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $onboarding = array_key_exists('onboarding_status', $user);
    $db->exec('CREATE TABLE users (id INTEGER PRIMARY KEY,status TEXT' . ($onboarding ? ',onboarding_status TEXT' : '') . ');
        CREATE TABLE memberships (user_id INTEGER,organization_id INTEGER,status TEXT,role TEXT);
        CREATE TABLE applications (id INTEGER PRIMARY KEY AUTOINCREMENT,code TEXT UNIQUE,name TEXT,description TEXT,launch_url TEXT,required_scope TEXT,display_order INTEGER,status TEXT,created_at TEXT,updated_at TEXT);
        CREATE TABLE entitlements (organization_id INTEGER,application_id INTEGER,status TEXT,valid_from TEXT,valid_to TEXT,granted_by_user_id INTEGER);
        CREATE TABLE user_application_access (organization_id INTEGER,user_id INTEGER,application_id INTEGER,status TEXT,granted_by_user_id INTEGER);
        CREATE TABLE audit_events (actor_user_id INTEGER,action TEXT,target_type TEXT,target_id TEXT,outcome TEXT,request_id TEXT,metadata_json TEXT);');
    $minimal = ['id' => (int) $user['id'], 'status' => $user['status']];
    if ($onboarding) $minimal['onboarding_status'] = $user['onboarding_status'];
    copyRows($db, 'users', [$minimal]); copyRows($db, 'memberships', $memberships);
    $source = $plan['source']; copyRows($db, 'applications', [$source['application']]);
    foreach (['entitlements' => 'entitlements', 'access' => 'user_application_access'] as $key => $table) {
        $rows = array_map(fn ($row) => $row + ['application_id' => $source['application']['id']], $source[$key]);
        copyRows($db, $table, $rows);
    }
    $r = new RgaRegistration($db);
    requireCheck($r->plan()['sourceFingerprint'] === $plan['sourceFingerprint'], 'Copie de répétition inexacte.');
    $receipt = $r->register($actor, RGA_URL, $plan['sourceFingerprint']);
    $created = $r->snapshot('rga');
    requireCheck($created['entitlements'] === $source['entitlements'] && $created['access'] === $source['access'], 'Droits répétés inexacts.');
    $r->rollback($actor, $receipt);
    requireCheck($r->snapshot('rga')['application'] === null && $r->snapshot('rapport') === $source, 'Restauration répétée inexacte.');
}

try {
    $action = $argv[1] ?? '';
    requireCheck(in_array($action, ['prepare', 'activate', 'verify', 'rollback'], true), 'Action invalide.');
    $manifest = readJson('manifest.json');
    requireCheck(($manifest['kind'] ?? '') === 'rga-independent-access', 'Manifeste incorrect.');
    $config = require CONNECT_CONFIG;
    $production = require '/home/daje3540/private/connect-production/config.php';
    requireCheck(!empty($config['DB_DSN']) && $config['DB_DSN'] !== $production['DB_DSN'], 'Base de préproduction non isolée.');
    requireCheck(parse_url($config['APP_LAUNCH_RAPPORT_URL'] ?? '', PHP_URL_HOST) === 'rapport-preprod.avereo.fr', 'Cible CONNECT incorrecte.');
    $pdo = database($config); $registration = new RgaRegistration($pdo);
    if ($action === 'prepare') {
        requireCheck(!file_exists(__DIR__ . '/access-recovery.json') && !file_exists(RGA_CONFIG), 'Préparation ou configuration RGA déjà présente.');
        requireCheck(!isset($config['APP_LAUNCH_RGA_URL']) && !isset($config['APP_LAUNCH_RGA_SECRET']), 'Paramètres RGA existants : revue requise.');
        $files = readJson('recovery.json');
        requireCheck($files['sourceSha'] === $manifest['sourceSha'] && $files['restoreVerified'] === true, 'Sauvegarde de fichiers non qualifiée.');
        requireCheck(($files['configs'][CONNECT_CONFIG] ?? '') === hash_file('sha256', CONNECT_CONFIG), 'Configuration modifiée depuis la sauvegarde.');
        $actor = (int) ($argv[2] ?? 0);
        $plan = $registration->plan();
        requireCheck($plan['existingRga']['application'] === null, 'RGA existe déjà : aucune recopie automatique.');
        rehearse($pdo, $plan, $actor);
        $secret = bin2hex(random_bytes(32));
        $next = $config + ['APP_LAUNCH_RGA_URL' => RGA_URL . 'entry.php', 'APP_LAUNCH_RGA_SECRET' => $secret];
        $rga = ['environment' => 'preproduction', 'connect_portal_url' => 'https://connect-preprod.avereo.fr',
            'connect_launch_secret' => $secret, 'connect_launch_nonce_directory' => '/home/daje3540/.avereo/rga-preprod/nonces',
            'connect_gate_session_seconds' => 1800];
        writePrivate(__DIR__ . '/connect-config-before.php', file_get_contents(CONNECT_CONFIG));
        writePrivate(__DIR__ . '/connect-config-next.php', "<?php\nreturn " . var_export($next, true) . ";\n");
        writePrivate(__DIR__ . '/rga-config-next.php', "<?php\nreturn " . var_export($rga, true) . ";\n");
        saveJson('registration-plan.json', $plan);
        $state = ['sourceSha' => $manifest['sourceSha'], 'artifactSha256' => $manifest['artifactSha256'], 'actorId' => $actor,
            'sourceFingerprint' => $plan['sourceFingerprint'], 'connectBefore' => hash_file('sha256', CONNECT_CONFIG),
            'connectAfter' => hash_file('sha256', __DIR__ . '/connect-config-next.php'),
            'rgaAfter' => hash_file('sha256', __DIR__ . '/rga-config-next.php'), 'restoreRehearsed' => true,
            'observedAt' => gmdate('c')];
        saveJson('access-recovery.json', $state);
        echo json_encode(['status' => 'prepared', 'permissionCopyAndRollbackRehearsed' => true,
            'entitlements' => count($plan['source']['entitlements']), 'individualAccess' => count($plan['source']['access']), 'liveDatabaseWrites' => false]) . "\n";
        exit;
    }
    $state = readJson('access-recovery.json');
    requireCheck($state['sourceSha'] === $manifest['sourceSha'] && $state['artifactSha256'] === $manifest['artifactSha256'], 'Candidat modifié.');
    if ($action === 'activate') {
        requireCheck(!file_exists(__DIR__ . '/registration-receipt.json'), 'Activation déjà exécutée.');
        $delivery = readJson('deploy-verification.json');
        requireCheck($delivery['sourceSha'] === $state['sourceSha'] && $delivery['artifactSha256'] === $state['artifactSha256'], 'Fichiers non livrés.');
        requireCheck(hash_file('sha256', CONNECT_CONFIG) === $state['connectBefore'] && !file_exists(RGA_CONFIG), 'Configuration active modifiée.');
        requireCheck(hash_file('sha256', __DIR__ . '/connect-config-next.php') === $state['connectAfter'] && hash_file('sha256', __DIR__ . '/rga-config-next.php') === $state['rgaAfter'], 'Configuration préparée modifiée.');
        $receipt = $registration->register($state['actorId'], RGA_URL, $state['sourceFingerprint']);
        requireCheck($receipt['status'] === 'registered', 'Déclaration RGA inattendue.');
        try {
            saveJson('registration-receipt.json', $receipt);
            writePrivate(RGA_CONFIG, file_get_contents(__DIR__ . '/rga-config-next.php'));
            writePrivate(CONNECT_CONFIG, file_get_contents(__DIR__ . '/connect-config-next.php'));
        } catch (Throwable $exception) {
            if (is_file(RGA_CONFIG) && hash_file('sha256', RGA_CONFIG) === $state['rgaAfter']) unlink(RGA_CONFIG);
            if (hash_file('sha256', CONNECT_CONFIG) === $state['connectAfter']) writePrivate(CONNECT_CONFIG, file_get_contents(__DIR__ . '/connect-config-before.php'));
            $registration->rollback($state['actorId'], $receipt);
            throw $exception;
        }
    }
    requireCheck(hash_file('sha256', CONNECT_CONFIG) === $state['connectAfter'] && is_file(RGA_CONFIG) && hash_file('sha256', RGA_CONFIG) === $state['rgaAfter'], 'Configuration RGA modifiée après préparation.');
    $receipt = readJson('registration-receipt.json');
    if ($action === 'rollback') {
        $registration->rollback($state['actorId'], $receipt);
        writePrivate(CONNECT_CONFIG, file_get_contents(__DIR__ . '/connect-config-before.php'));
        unlink(RGA_CONFIG); // The exact previous bytes remain in private staging for recovery.
        saveJson('access-rollback.json', ['status' => 'rolled_back', 'observedAt' => gmdate('c')]);
        echo "RGA rollback verified; restore the file package next.\n"; exit;
    }
    $current = $registration->snapshot('rga');
    requireCheck(RgaRegistration::fingerprint($current) === $receipt['createdFingerprint'], 'Les droits RGA ont changé depuis la déclaration.');
    requireCheck($registration->plan()['sourceFingerprint'] === $state['sourceFingerprint'], 'Les droits Rapport ont changé depuis la préparation.');
    $proof = ['status' => 'activated_and_verified', 'sourceSha' => $state['sourceSha'], 'artifactSha256' => $state['artifactSha256'],
        'observedAt' => gmdate('c'), 'applicationId' => $receipt['applicationId'], 'rightsCopiedExactly' => true,
        'rapportRightsUnchanged' => true, 'entitlements' => count($current['entitlements']), 'individualAccess' => count($current['access'])];
    saveJson('access-verification.json', $proof); echo json_encode($proof) . "\n";
} catch (Throwable $exception) {
    // Details may contain infrastructure identifiers: keep them in private staging.
    file_put_contents(__DIR__ . '/access-error.log', gmdate('c') . ' ' . $exception->getMessage() . "\n", FILE_APPEND);
    chmod(__DIR__ . '/access-error.log', 0600);
    fwrite(STDERR, "Activation RGA arrêtée ; consulter access-error.log dans le dossier privé.\n"); exit(1);
}
