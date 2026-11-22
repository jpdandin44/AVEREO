<?php
declare(strict_types=1);

/**
 * Tests du stockage privé des photos originales (première tranche serveur locale).
 *
 * Données fictives uniquement : SQLite temporaire, répertoire privé temporaire, deux propriétaires
 * fictifs. Exemple (extensions chargées pour ce seul processus, sans modifier php.ini) :
 *   php -d extension_dir=<php>/ext -d extension=pdo_sqlite -d extension=sqlite3 tests/photo-originals.php
 * Limites : la migration MySQL n'est pas exécutée (schéma SQLite équivalent, colonnes comparées à la
 * migration) ; les routes HTTP qui touchent la base relèvent de la recette avec MySQL et CONNECT réels.
 */
require dirname(__DIR__) . '/frontend/public/api/photo-original-store.php';

function check(bool $ok, string $case): void
{
    if (!$ok) {
        throw new RuntimeException('ECHEC : ' . $case);
    }
}

const HEX_A = 'a';

function jpeg(int $w, int $h, int $pad = 0, int $seed = 1): string
{
    $body = "\xFF\xD8\xFF\xC0\x00\x11\x08" . pack('nn', $h, $w) . "\x03\x01\x11\x00\x02\x11\x01\x03\x11\x01";
    while ($pad > 0) {
        $chunk = min($pad, 60000);
        $body .= "\xFF\xFE" . pack('n', $chunk + 2) . str_repeat(chr($seed % 250 + 1), $chunk);
        $pad -= $chunk;
    }

    return $body . "\xFF\xD9";
}

function png(int $w, int $h, int $pad = 0, int $seed = 1): string
{
    $chunk = static fn (string $type, string $data): string => pack('N', strlen($data)) . $type . $data . pack('N', crc32($type . $data));
    $out = "\x89PNG\r\n\x1A\n" . $chunk('IHDR', pack('NNCCCCC', $w, $h, 8, 2, 0, 0, 0));
    if ($pad > 0) {
        $out .= $chunk('tEXt', 'Comment' . "\0" . str_repeat(chr($seed % 250 + 1), $pad));
    }

    return $out . $chunk('IDAT', (string) gzcompress("\0\0\0\0")) . $chunk('IEND', '');
}

function webp(): string
{
    return (string) base64_decode('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==');
}

/**
 * PDO de test : exécute une action (suppression, réattribution du rapport…) juste avant le N-ième contrôle
 * du propriétaire. Contrôle 1 = entrée de store(), 2 = sous le verrou, 3 = juste avant l'insertion.
 */
final class InterferingPdo extends PDO
{
    /** @var array<int, Closure> */
    public array $atReportCheck = [];
    private int $reportChecks = 0;

    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        if (str_contains($query, 'FROM rapport_reports WHERE public_id')) {
            $nth = ++$this->reportChecks;
            if (isset($this->atReportCheck[$nth])) {
                $action = $this->atReportCheck[$nth];
                unset($this->atReportCheck[$nth]);
                $action();
            }
        }

        return parent::prepare($query, $options);
    }
}

function rcopy(string $from, string $to): void
{
    if (is_link($from)) {
        throw new RuntimeException('Lien dans une sauvegarde : refusé');
    }
    if (is_dir($from)) {
        if (!is_dir($to)) {
            mkdir($to, 0700, true);
        }
        foreach (scandir($from) ?: [] as $entry) {
            if ($entry !== '.' && $entry !== '..') {
                rcopy($from . '/' . $entry, $to . '/' . $entry);
            }
        }
        return;
    }
    copy($from, $to);
}

function rrmdir(string $path): void
{
    if (is_link($path)) {
        @unlink($path) || @rmdir($path);
        return;
    }
    if (is_dir($path)) {
        foreach (scandir($path) ?: [] as $entry) {
            if ($entry !== '.' && $entry !== '..') {
                rrmdir($path . '/' . $entry);
            }
        }
        @rmdir($path);
        return;
    }
    @unlink($path);
}

function php_args(): array
{
    static $args = null;
    if ($args !== null) {
        return $args;
    }
    $args = ['-d', 'extension_dir=' . ini_get('extension_dir')];
    $probe = [PHP_BINARY, '-r', 'exit(in_array("sqlite", PDO::getAvailableDrivers(), true) ? 0 : 1);'];
    $process = proc_open($probe, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    stream_get_contents($pipes[1]);
    stream_get_contents($pipes[2]);
    if (proc_close($process) !== 0) {
        $args = array_merge($args, ['-d', 'extension=pdo_sqlite', '-d', 'extension=sqlite3']);
    }

    return $args;
}

function new_pdo(string $dbFile): PDO
{
    return new PDO('sqlite:' . $dbFile, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 20,
    ]);
}

/** Schéma SQLite équivalent à database/migrations/003_photo_originals.sql (colonnes comparées plus bas). */
function create_schema(PDO $pdo): void
{
    $pdo->exec('CREATE TABLE rapport_reports (id INTEGER PRIMARY KEY, public_id TEXT NOT NULL UNIQUE, title TEXT, payload_json TEXT,
        owner_provider TEXT NOT NULL, owner_id TEXT NOT NULL, updated_at TEXT)');
    $pdo->exec("CREATE TABLE rapport_photo_originals (id INTEGER PRIMARY KEY AUTOINCREMENT, public_id TEXT NOT NULL UNIQUE,
        report_public_id TEXT NOT NULL, owner_provider TEXT NOT NULL, owner_id TEXT NOT NULL, sha256 TEXT NOT NULL,
        bytes INTEGER NOT NULL, mime TEXT NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL,
        original_name TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, UNIQUE (report_public_id, sha256))");
}

$A = ['avereo_connect', '101'];
$B = ['avereo_connect', '102'];
$ADMIN = ['avereo_connect', '1']; // administrateur CONNECT, non propriétaire des rapports ci-dessous
$R = [];
foreach (['a1', 'a2', 'b1', 'a3', 'a4'] as $index => $name) {
    $R[$name] = str_repeat(dechex($index + 10), 32);
}

/** Mode processus fils : un envoi concurrent, démarré dès que le fichier « go » existe. */
if (($argv[1] ?? '') === '--worker') {
    [, , $dbFile, $root, $reportId, $file, $go, $max, $quota] = $argv;
    $deadline = microtime(true) + 20;
    while (!is_file($go) && microtime(true) < $deadline) {
        usleep(2000);
    }
    $store = new RapportPhotoOriginalStore(new_pdo($dbFile), $root, (int) $max, (int) $quota);
    try {
        $meta = $store->store('avereo_connect', '101', $reportId, $file, hash_file('sha256', $file), 'worker.jpg');
        echo json_encode(['ok' => true, 'id' => $meta['id']]);
    } catch (RapportPhotoOriginalException $failure) {
        echo json_encode(['ok' => false, 'status' => $failure->status, 'error' => $failure->errorCode]);
    }
    exit(0);
}

$base = realpath(sys_get_temp_dir()) . '/avereo-photo-originals-' . bin2hex(random_bytes(6));
mkdir($base, 0700);
$sequence = 0;
$leaks = [];

/** Environnement isolé : base, racine privée, rapports fictifs. */
function new_env(string $base, int $max, int $quota, array $R, array $A, array $B): array
{
    static $n = 0;
    $dir = $base . '/env' . (++$n);
    mkdir($dir . '/store', 0700, true);
    mkdir($dir . '/web', 0700, true);
    mkdir($dir . '/up', 0700, true);
    $db = $dir . '/db.sqlite';
    $pdo = new_pdo($db);
    create_schema($pdo);
    $insert = $pdo->prepare('INSERT INTO rapport_reports (public_id, title, payload_json, owner_provider, owner_id, updated_at) VALUES (?,?,?,?,?,?)');
    foreach (['a1' => $A, 'a2' => $A, 'a3' => $A, 'a4' => $A, 'b1' => $B] as $name => $owner) {
        $insert->execute([$R[$name], 'Fictif ' . $name, '{"photos":[]}', $owner[0], $owner[1], '2026-01-01']);
    }
    $root = realpath($dir . '/store');

    return [
        'dir' => $dir, 'db' => $db, 'pdo' => $pdo, 'root' => $root, 'web' => realpath($dir . '/web'), 'up' => $dir . '/up',
        'max' => $max, 'quota' => $quota,
        'store' => new RapportPhotoOriginalStore($pdo, $root, $max, $quota, [realpath($dir . '/web')]),
    ];
}

function upload(array $e, string $bytes, string $name = 'f'): string
{
    static $i = 0;
    $path = $e['up'] . '/' . $name . '-' . (++$i);
    file_put_contents($path, $bytes);

    return $path;
}

function fail_with(callable $work, int $status, string $code, string $case): void
{
    global $leaks;
    try {
        $work();
    } catch (RapportPhotoOriginalException $failure) {
        check($failure->status === $status && $failure->errorCode === $code,
            $case . ' (attendu ' . $status . '/' . $code . ', reçu ' . $failure->status . '/' . $failure->errorCode . ')');
        $leaks[] = $failure->getMessage();
        return;
    }
    throw new RuntimeException('ECHEC : ' . $case . ' (aucune erreur levée)');
}

function stored_files(string $root): array
{
    $files = [];
    $walk = static function (string $dir) use (&$walk, &$files, $root): void {
        foreach (scandir($dir) ?: [] as $entry) {
            if ($entry === '.' || $entry === '..' || $entry === '.locks') {
                continue;
            }
            $path = $dir . '/' . $entry;
            if (is_dir($path) && !is_link($path)) {
                $walk($path);
            } else {
                $files[substr($path, strlen($root))] = is_link($path) ? -1 : filesize($path);
            }
        }
    };
    $walk($root);
    ksort($files);

    return $files;
}

function row_count(PDO $pdo): int
{
    return (int) $pdo->query('SELECT COUNT(*) FROM rapport_photo_originals')->fetchColumn();
}

function reports_snapshot(PDO $pdo): array
{
    return $pdo->query('SELECT * FROM rapport_reports ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
}

function read_stream(array $opened): string
{
    $content = stream_get_contents($opened['stream']);
    fclose($opened['stream']);

    return (string) $content;
}

// ---------------------------------------------------------------- 0. migration et schéma
$migration = (string) file_get_contents(dirname(__DIR__) . '/database/migrations/003_photo_originals.sql');
$code = preg_replace('/^--.*$/m', '', $migration);
preg_match_all('/^\s+(\w+)\s+(?:BIGINT|INT|CHAR|VARCHAR|DATETIME)\b/m', $code, $columns);
$probe = new_env($base, 1, 1, $R, $A, $B);
$sqliteColumns = array_column($probe['pdo']->query('PRAGMA table_info(rapport_photo_originals)')->fetchAll(), 'name');
sort($columns[1]);
sort($sqliteColumns);
check($columns[1] === $sqliteColumns, 'Les colonnes de la migration 003 et du schéma de test sont identiques : ' . implode(',', $columns[1]));
check(str_contains($code, 'UNIQUE KEY uq_photo_originals_report_sha (report_public_id, sha256)'), 'Dédoublonnage par rapport et empreinte');
check(!preg_match('/FOREIGN KEY|ON DELETE|ALTER TABLE|DROP |DELETE FROM|UPDATE /i', $code) && str_contains($code, 'CREATE TABLE IF NOT EXISTS'), 'Migration additive, sans clé étrangère');

// ---------------------------------------------------------------- 1. aller-retour, empreinte, session neuve
$e = new_env($base, 5000, 20000, $R, $A, $B);
$reportsBefore = reports_snapshot($e['pdo']);
$source = jpeg(40, 30, 600, 1);
$path = upload($e, $source);
$sha = hash('sha256', $source);
$meta = $e['store']->store($A[0], $A[1], $R['a1'], $path, $sha, '../../evil/Façade <nord>.PNG');
check(preg_match('/^[0-9a-f]{32}$/D', $meta['id']) === 1 && $meta['reportId'] === $R['a1'], 'Identifiant aléatoire et rapport');
check($meta['sha256'] === $sha && $meta['bytes'] === strlen($source) && $meta['mime'] === 'image/jpeg', 'Empreinte, octets et type réel (malgré le nom .PNG)');
check($meta['width'] === 40 && $meta['height'] === 30, 'Dimensions lues dans l\'en-tête');
check(preg_match('/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/D', $meta['createdAt']) === 1, 'Horodatage UTC ISO');
check(!str_contains($meta['name'], '/') && !str_contains($meta['name'], '<') && !str_contains($meta['name'], '..'), 'Nom nettoyé : ' . $meta['name']);
check(array_keys($meta) === ['id', 'reportId', 'sha256', 'bytes', 'mime', 'width', 'height', 'name', 'createdAt'], 'Forme exacte des métadonnées');
check(!str_contains(json_encode($meta), $e['root']), 'Aucun chemin privé dans les métadonnées');
$files = stored_files($e['root']);
check(count($files) === 1, 'Un seul fichier conservé, sans temporaire résiduel');
$onDisk = $e['root'] . array_key_first($files);
check(hash_file('sha256', $onDisk) === $sha && file_get_contents($onDisk) === $source, 'Octets conservés identiques à l\'envoi');
check(!str_contains(array_key_first($files), 'evil') && !str_contains(array_key_first($files), 'Fa'), 'Le nom reçu n\'entre jamais dans le chemin');
if (DIRECTORY_SEPARATOR === '/') {
    check((fileperms($onDisk) & 0777) === 0600 && (fileperms(dirname($onDisk)) & 0777) === 0700, 'Droits 0600 / 0700');
}
$opened = $e['store']->open($A[0], $A[1], $R['a1'], $meta['id']);
check($opened['metadata'] === $meta && $opened['filename'] === 'Façade _nord_.jpg', 'Nom de téléchargement et extension cohérente avec le type réel : ' . $opened['filename']);
check(read_stream($opened) === $source, 'Relecture octet pour octet');
check($e['store']->listForReport($A[0], $A[1], $R['a1']) === [$meta], 'Liste du rapport');
$fresh = new RapportPhotoOriginalStore(new_pdo($e['db']), $e['root'], 5000, 20000);
check($fresh->listForReport($A[0], $A[1], $R['a1']) === [$meta], 'Nouvelle instance et nouvelle connexion : liste');
check(read_stream($fresh->open($A[0], $A[1], $R['a1'], $meta['id'])) === $source, 'Nouvelle instance : relecture identique');
$caps = $e['store']->capabilities();
check($caps === ['enabled' => true, 'maxOriginalBytes' => 5000, 'allowedMimeTypes' => ['image/jpeg', 'image/png', 'image/webp']], 'Capacités');

// types réels JPEG, PNG, WebP
$p = $e['store']->store($A[0], $A[1], $R['a2'], upload($e, png(8, 6, 100, 2)), hash('sha256', png(8, 6, 100, 2)), 'x.png');
$w = $e['store']->store($A[0], $A[1], $R['a2'], upload($e, webp()), hash('sha256', webp()), 'x.webp');
check($p['mime'] === 'image/png' && $p['width'] === 8 && $p['height'] === 6, 'PNG reconnu');
check($w['mime'] === 'image/webp' && $w['width'] === 1 && $w['height'] === 1, 'WebP reconnu');

// ---------------------------------------------------------------- 2. refus inter-comptes et administrateur
foreach ([[$B, 'second compte'], [$ADMIN, 'administrateur non propriétaire']] as [$other, $label]) {
    fail_with(fn () => $e['store']->listForReport($other[0], $other[1], $R['a1']), 404, 'not_found', "Liste refusée : $label");
    fail_with(fn () => $e['store']->open($other[0], $other[1], $R['a1'], $meta['id']), 404, 'not_found', "Lecture refusée : $label");
    fail_with(fn () => $e['store']->store($other[0], $other[1], $R['a1'], upload($e, jpeg(2, 2)), hash('sha256', jpeg(2, 2)), 'z.jpg'), 404, 'not_found', "Envoi refusé : $label");
}
fail_with(fn () => $e['store']->open($B[0], $B[1], $R['b1'], $meta['id']), 404, 'not_found', 'Original d\'un autre compte demandé via son propre rapport');
fail_with(fn () => $e['store']->open($A[0], $A[1], $R['a2'], $meta['id']), 404, 'not_found', 'Original demandé via un autre rapport du même propriétaire');
fail_with(fn () => $e['store']->listForReport($A[0], $A[1], str_repeat('f', 32)), 404, 'not_found', 'Rapport inexistant');
fail_with(fn () => $e['store']->listForReport('', '', $R['a1']), 404, 'not_found', 'Identité vide');
check($e['store']->listForReport($B[0], $B[1], $R['b1']) === [], 'Le second compte garde un espace propre');
$mine = $e['store']->store($B[0], $B[1], $R['b1'], upload($e, jpeg(5, 5, 50, 9)), hash('sha256', jpeg(5, 5, 50, 9)), 'b.jpg');
check($e['store']->listForReport($A[0], $A[1], $R['a1']) === [$meta], 'La liste de A ne contient pas l\'original de B');
check(!str_contains(implode(' ', array_keys(stored_files($e['root']))), 'evil'), 'Aucun fichier hors arborescence contrôlée');
check($meta['id'] !== $mine['id'], 'Identifiants distincts');

// ---------------------------------------------------------------- 3. empreinte, image invalide, limites
$count = row_count($e['pdo']);
$filesBefore = stored_files($e['root']);
$good = jpeg(10, 10, 80, 3);
fail_with(fn () => $e['store']->store($A[0], $A[1], $R['a1'], upload($e, $good), str_repeat('0', 64), 'g.jpg'), 422, 'hash_mismatch', 'Empreinte erronée');
fail_with(fn () => $e['store']->store($A[0], $A[1], $R['a1'], upload($e, $good), 'zz', 'g.jpg'), 422, 'invalid_request', 'Empreinte mal formée');
fail_with(fn () => $e['store']->store($A[0], $A[1], $R['a1'], upload($e, $good . 'x'), hash('sha256', $good), 'g.jpg'), 422, 'hash_mismatch', 'Fichier altéré après annonce de l\'empreinte');
$text = "ceci n'est pas une image";
fail_with(fn () => $e['store']->store($A[0], $A[1], $R['a1'], upload($e, $text), hash('sha256', $text), 't.jpg'), 422, 'invalid_image', 'Texte déguisé en JPEG');
$fake = "\xFF\xD8\xFF" . str_repeat('x', 200);
fail_with(fn () => $e['store']->store($A[0], $A[1], $R['a1'], upload($e, $fake), hash('sha256', $fake), 'f.jpg'), 422, 'invalid_image', 'Signature JPEG sans en-tête exploitable');
$gif = "GIF89a\x01\x00\x01\x00\x00\x00\x00;";
fail_with(fn () => $e['store']->store($A[0], $A[1], $R['a1'], upload($e, $gif), hash('sha256', $gif), 'a.gif'), 422, 'invalid_image', 'GIF non pris en charge');
$huge = png(40000, 40000, 0, 1);
fail_with(fn () => $e['store']->store($A[0], $A[1], $R['a1'], upload($e, $huge), hash('sha256', $huge), 'h.png'), 422, 'invalid_image', 'Dimensions déclarées hors limites');
$wide = jpeg(30000, 30000, 0, 1);
fail_with(fn () => $e['store']->store($A[0], $A[1], $R['a1'], upload($e, $wide), hash('sha256', $wide), 'w.jpg'), 422, 'invalid_image', 'Total de pixels hors limite');
fail_with(fn () => $e['store']->store($A[0], $A[1], $R['a1'], upload($e, ''), hash('sha256', ''), 'v.jpg'), 422, 'invalid_image', 'Fichier vide');
$big = jpeg(10, 10, 6000, 4);
fail_with(fn () => $e['store']->store($A[0], $A[1], $R['a1'], upload($e, $big), hash('sha256', $big), 'b.jpg'), 413, 'file_too_large', 'Dépassement de la limite par fichier');
fail_with(fn () => $e['store']->store($A[0], $A[1], '../../' . $R['a1'], upload($e, $good), hash('sha256', $good), 'g.jpg'), 404, 'not_found', 'Traversée de chemin via rapport');
fail_with(fn () => $e['store']->open($A[0], $A[1], $R['a1'], '../' . $meta['id']), 404, 'not_found', 'Traversée de chemin via original');
check(row_count($e['pdo']) === $count && stored_files($e['root']) === $filesBefore, 'Aucun refus ne laisse de ligne ni de fichier');

// ---------------------------------------------------------------- 4. dédoublonnage et quota
$q = new_env($base, 5000, 3600, $R, $A, $B);
$f1 = jpeg(7, 7, 1000, 11);
$f2 = jpeg(7, 7, 1000, 12);
$f3 = jpeg(7, 7, 1000, 13);
$f4 = jpeg(7, 7, 1000, 14);
$m1 = $q['store']->store($A[0], $A[1], $R['a1'], upload($q, $f1), hash('sha256', $f1), 'un.jpg');
$again = $q['store']->store($A[0], $A[1], $R['a1'], upload($q, $f1), hash('sha256', $f1), 'autre-nom.jpg');
check($again === $m1 && row_count($q['pdo']) === 1 && count(stored_files($q['root'])) === 1, 'Même fichier, même rapport : même original, sans nouvelle ligne ni fichier');
$m2 = $q['store']->store($A[0], $A[1], $R['a2'], upload($q, $f1), hash('sha256', $f1), 'un.jpg');
check($m2['id'] !== $m1['id'] && row_count($q['pdo']) === 2 && count(stored_files($q['root'])) === 2, 'Même fichier dans un autre rapport : exemplaire propre à ce rapport');
$q['store']->store($A[0], $A[1], $R['a1'], upload($q, $f2), hash('sha256', $f2), 'deux.jpg');
fail_with(fn () => $q['store']->store($A[0], $A[1], $R['a3'], upload($q, $f3), hash('sha256', $f3), 'trois.jpg'), 409, 'quota_exceeded', 'Quota du propriétaire dépassé (tous rapports confondus)');
check($q['store']->store($A[0], $A[1], $R['a1'], upload($q, $f1), hash('sha256', $f1), 'un.jpg') === $m1, 'Dédoublonnage accepté même quota plein, sans consommation');
check(row_count($q['pdo']) === 3, 'Aucune ligne ajoutée après refus de quota');
$other = $q['store']->store($B[0], $B[1], $R['b1'], upload($q, $f4), hash('sha256', $f4), 'b.jpg');
check($other['bytes'] === strlen($f4), 'Le quota d\'un propriétaire n\'affecte pas l\'autre');

// Crash after file publication or while writing: bytes without an SQL row still consume quota.
$orphan = new_env($base, 5000, 900, $R, $A, $B);
$orphanDir = $orphan['root'] . '/o-' . hash('sha256', $A[0] . "\0" . $A[1]) . '/' . $R['a1'];
mkdir($orphanDir, 0700, true);
file_put_contents($orphanDir . '/' . str_repeat('a', 32) . '.bin', str_repeat('o', 300));
file_put_contents($orphanDir . '/.tmp-interrupted', str_repeat('t', 300));
$orphanBefore = stored_files($orphan['root']);
$incoming = jpeg(8, 8, 380, 71);
fail_with(fn () => $orphan['store']->store($A[0], $A[1], $R['a2'], upload($orphan, $incoming), hash('sha256', $incoming), 'crash.jpg'), 409, 'quota_exceeded', 'Orphelin publié et temporaire interrompu comptés dans le quota');
check(stored_files($orphan['root']) === $orphanBefore && row_count($orphan['pdo']) === 0, 'Refus conservateur : aucun orphelin supprimé ou nouvelle ligne');
check($orphan['store']->store($B[0], $B[1], $R['b1'], upload($orphan, $incoming), hash('sha256', $incoming), 'b.jpg')['bytes'] === strlen($incoming), 'Les orphelins de A ne consomment pas le quota de B');

// SQL reservations for missing files cannot be cancelled out by unrelated orphan bytes.
$missing = new_env($base, 5000, 1800, $R, $A, $B);
$reserved = jpeg(8, 8, 970, 72);
$missing['store']->store($A[0], $A[1], $R['a1'], upload($missing, $reserved), hash('sha256', $reserved), 'reserved.jpg');
$reservedPath = $missing['root'] . array_key_first(stored_files($missing['root']));
unlink($reservedPath);
file_put_contents(dirname($reservedPath) . '/.tmp-crashed', str_repeat('o', 750));
$next = jpeg(8, 8, 250, 73);
fail_with(fn () => $missing['store']->store($A[0], $A[1], $R['a2'], upload($missing, $next), hash('sha256', $next), 'next.jpg'), 409, 'quota_exceeded', 'Réservation SQL sans fichier plus orphelin additionnés, sans compensation');

// ---------------------------------------------------------------- 5. exemplaire existant altéré ou absent
$a = new_env($base, 5000, 20000, $R, $A, $B);
$orig = jpeg(9, 9, 700, 21);
$stored = $a['store']->store($A[0], $A[1], $R['a1'], upload($a, $orig), hash('sha256', $orig), 'o.jpg');
$target = $a['root'] . array_key_first(stored_files($a['root']));
file_put_contents($target, 'x', FILE_APPEND);
$altered = file_get_contents($target);
fail_with(fn () => $a['store']->store($A[0], $A[1], $R['a1'], upload($a, $orig), hash('sha256', $orig), 'o.jpg'), 503, 'storage_unavailable', 'Original existant altéré : renvoi refusé');
check(file_get_contents($target) === $altered && row_count($a['pdo']) === 1, 'L\'exemplaire altéré n\'est ni remplacé ni dupliqué');
fail_with(fn () => $a['store']->open($A[0], $A[1], $R['a1'], $stored['id']), 503, 'storage_unavailable', 'Lecture d\'un exemplaire altéré refusée');
// altération à taille égale : seule l'empreinte la révèle
$flipped = $orig;
$flipped[strlen($flipped) - 5] = chr(ord($flipped[strlen($flipped) - 5]) ^ 1);
file_put_contents($target, $flipped);
check(filesize($target) === strlen($orig), 'Altération de même taille préparée');
fail_with(fn () => $a['store']->open($A[0], $A[1], $R['a1'], $stored['id']), 503, 'storage_unavailable', 'Octet modifié à taille égale : lecture refusée');
fail_with(fn () => $a['store']->store($A[0], $A[1], $R['a1'], upload($a, $orig), hash('sha256', $orig), 'o.jpg'), 503, 'storage_unavailable', 'Octet modifié à taille égale : renvoi refusé');
check(file_get_contents($target) === $flipped, 'Exemplaire à taille égale non remplacé');
file_put_contents($target, $orig);
check(read_stream($a['store']->open($A[0], $A[1], $R['a1'], $stored['id'])) === $orig, 'Exemplaire rétabli : relecture à nouveau possible');
unlink($target);
fail_with(fn () => $a['store']->open($A[0], $A[1], $R['a1'], $stored['id']), 503, 'storage_unavailable', 'Fichier absent signalé sans fuite');
fail_with(fn () => $a['store']->store($A[0], $A[1], $R['a1'], upload($a, $orig), hash('sha256', $orig), 'o.jpg'), 503, 'storage_unavailable', 'Ligne sans fichier : aucun renvoi silencieux');

// ---------------------------------------------------------------- 6. liens symboliques et configuration
$s = new_env($base, 5000, 20000, $R, $A, $B);
$outside = $s['dir'] . '/outside';
mkdir($outside);
$ownerDir = $s['root'] . '/o-' . hash('sha256', $A[0] . "\0" . $A[1]);
mkdir($ownerDir);
/** Lien symbolique, ou jonction NTFS sous Windows sans droit de lien (même risque ; PHP ne la voit ni comme lien ni comme dossier). */
$makeLink = static function (string $target, string $link): string {
    if (@symlink($target, $link)) {
        return 'symlink';
    }
    if (DIRECTORY_SEPARATOR === '\\') {
        $w = static fn (string $p): string => str_replace('/', '\\', $p);
        exec('cmd /c mklink /J "' . $w($link) . '" "' . $w($target) . '" 2>&1', $ignored, $status);
        if ($status === 0) {
            return 'jonction';
        }
    }

    return '';
};
$linkKind = $makeLink($outside, $ownerDir . '/' . $R['a1']);
$linkOk = $linkKind !== '';
if ($linkOk) {
    $pic = jpeg(4, 4, 90, 31);
    fail_with(fn () => $s['store']->store($A[0], $A[1], $R['a1'], upload($s, $pic), hash('sha256', $pic), 'l.jpg'), 503, 'storage_unavailable', 'Répertoire de rapport remplacé par un lien symbolique');
    check(scandir($outside) === ['.', '..'] && row_count($s['pdo']) === 0, 'Rien n\'est écrit à travers le lien symbolique');
    @unlink($ownerDir . '/' . $R['a1']) || @rmdir($ownerDir . '/' . $R['a1']);
    $rootLink = $s['dir'] . '/rootlink';
    if ($makeLink($s['root'], $rootLink) !== '') {
        fail_with(fn () => new RapportPhotoOriginalStore($s['pdo'], $rootLink, 100, 100), 503, 'storage_unavailable', 'Racine fournie par un lien');
        @unlink($rootLink) || @rmdir($rootLink);
    }
    echo "liens : vérifié ($linkKind)\n";
} else {
    echo "symlink : SKIP (création de lien symbolique non autorisée sur cette machine)\n";
}
$cfg = ['photo_originals_enabled' => true, 'photo_originals_directory' => $s['root'], 'photo_originals_max_bytes' => 1000, 'photo_originals_owner_quota_bytes' => '5000'];
fail_with(fn () => RapportPhotoOriginalStore::fromConfig($s['pdo'], ['photo_originals_enabled' => false] + $cfg), 503, 'storage_unavailable', 'Désactivé par défaut');
fail_with(fn () => RapportPhotoOriginalStore::fromConfig($s['pdo'], array_diff_key($cfg, ['photo_originals_enabled' => 1])), 503, 'storage_unavailable', 'Sans réglage explicite : désactivé');
fail_with(fn () => RapportPhotoOriginalStore::fromConfig($s['pdo'], ['photo_originals_enabled' => 'true'] + $cfg), 503, 'storage_unavailable', 'Seul le booléen vrai active');
fail_with(fn () => RapportPhotoOriginalStore::fromConfig($s['pdo'], ['photo_originals_max_bytes' => null] + $cfg), 503, 'storage_unavailable', 'Limite par fichier requise');
fail_with(fn () => RapportPhotoOriginalStore::fromConfig($s['pdo'], ['photo_originals_owner_quota_bytes' => 0] + $cfg), 503, 'storage_unavailable', 'Quota requis et positif');
fail_with(fn () => RapportPhotoOriginalStore::fromConfig($s['pdo'], ['photo_originals_directory' => 'relatif/dir'] + $cfg), 503, 'storage_unavailable', 'Répertoire relatif refusé');
fail_with(fn () => RapportPhotoOriginalStore::fromConfig($s['pdo'], ['photo_originals_directory' => $s['dir'] . '/inexistant'] + $cfg), 503, 'storage_unavailable', 'Répertoire absent refusé (jamais créé)');
fail_with(fn () => RapportPhotoOriginalStore::fromConfig($s['pdo'], ['photo_originals_directory' => $s['root'] . '/../store'] + $cfg), 503, 'storage_unavailable', 'Segment .. refusé');
mkdir($s['web'] . '/sous-racine');
fail_with(fn () => RapportPhotoOriginalStore::fromConfig($s['pdo'], ['photo_originals_directory' => realpath($s['web'] . '/sous-racine')] + $cfg, [$s['web']]), 503, 'storage_unavailable', 'Racine sous la racine web refusée');
fail_with(fn () => RapportPhotoOriginalStore::fromConfig($s['pdo'], ['photo_originals_directory' => $s['web']] + $cfg, [$s['web']]), 503, 'storage_unavailable', 'Racine égale à la racine web refusée');
$viaConfig = RapportPhotoOriginalStore::fromConfig($s['pdo'], $cfg, [$s['web']]);
check($viaConfig->capabilities()['maxOriginalBytes'] === 1000, 'Configuration valide acceptée (entiers en chaîne tolérés)');

// ---------------------------------------------------------------- 7. pannes de stockage et d'écriture
$p = new_env($base, 5000, 20000, $R, $A, $B);
$first = jpeg(6, 6, 300, 41);
$firstMeta = $p['store']->store($A[0], $A[1], $R['a1'], upload($p, $first), hash('sha256', $first), 'p1.jpg');
$filesNow = stored_files($p['root']);
$second = jpeg(6, 6, 300, 42);
// (a) le répertoire du rapport A2 est remplacé par un fichier ordinaire : écriture impossible
$ownerKey = hash('sha256', $A[0] . "\0" . $A[1]);
file_put_contents($p['root'] . '/o-' . $ownerKey . '/' . $R['a2'], 'bloqueur');
fail_with(fn () => $p['store']->store($A[0], $A[1], $R['a2'], upload($p, $second), hash('sha256', $second), 'p2.jpg'), 503, 'storage_unavailable', 'Panne d\'écriture : refus sans annonce de conservation');
check(row_count($p['pdo']) === 1 && $p['store']->listForReport($A[0], $A[1], $R['a1']) === [$firstMeta], 'Panne d\'écriture : aucune ligne ajoutée, l\'existant intact');
unlink($p['root'] . '/o-' . $ownerKey . '/' . $R['a2']);
// (b) l'insertion échoue : le fichier tout juste créé est retiré, l'exemplaire préexistant reste
$p['pdo']->exec("CREATE TRIGGER bloque_insert BEFORE INSERT ON rapport_photo_originals BEGIN SELECT RAISE(ABORT, 'insert indisponible /secret/chemin'); END");
fail_with(fn () => $p['store']->store($A[0], $A[1], $R['a1'], upload($p, $second), hash('sha256', $second), 'p2.jpg'), 503, 'storage_unavailable', 'Insertion refusée');
check(stored_files($p['root']) === $filesNow && read_stream($p['store']->open($A[0], $A[1], $R['a1'], $firstMeta['id'])) === $first, 'Insertion refusée : fichier neuf retiré, exemplaire préexistant conservé');
$p['pdo']->exec('DROP TRIGGER bloque_insert');
check($p['store']->store($A[0], $A[1], $R['a1'], upload($p, $second), hash('sha256', $second), 'p2.jpg')['bytes'] === strlen($second), 'Reprise après échec : l\'envoi réussit ensuite');
// (c) racine disparue
$gone = new_env($base, 5000, 20000, $R, $A, $B);
rrmdir($gone['root']);
fail_with(fn () => $gone['store']->store($A[0], $A[1], $R['a1'], upload($gone, $first), hash('sha256', $first), 'g.jpg'), 503, 'storage_unavailable', 'Racine privée disparue');
check(row_count($gone['pdo']) === 0, 'Racine disparue : aucune ligne');
foreach ($leaks as $message) {
    check(!str_contains($message, $base) && !str_contains($message, 'SQLSTATE') && !str_contains($message, 'secret') && !str_contains($message, 'rapport_photo'),
        'Aucun chemin privé ni détail SQL dans les messages : ' . $message);
}

// ---------------------------------------------------------------- 8. suppression du rapport, changement de propriétaire
$d = new_env($base, 5000, 3000, $R, $A, $B);
$d1 = jpeg(3, 3, 1200, 51);
$dm = $d['store']->store($A[0], $A[1], $R['a3'], upload($d, $d1), hash('sha256', $d1), 'd.jpg');
$d['pdo']->exec("DELETE FROM rapport_reports WHERE public_id = '" . $R['a3'] . "'");
fail_with(fn () => $d['store']->listForReport($A[0], $A[1], $R['a3']), 404, 'not_found', 'Rapport supprimé : liste refusée');
fail_with(fn () => $d['store']->open($A[0], $A[1], $R['a3'], $dm['id']), 404, 'not_found', 'Rapport supprimé : lecture refusée');
check(row_count($d['pdo']) === 1 && count(stored_files($d['root'])) === 1, 'Rapport supprimé : métadonnées et fichier conservés (effacement à décider)');
$d2 = jpeg(3, 3, 1200, 52);
$d3 = jpeg(3, 3, 1200, 53);
$d['store']->store($A[0], $A[1], $R['a1'], upload($d, $d2), hash('sha256', $d2), 'd2.jpg');
fail_with(fn () => $d['store']->store($A[0], $A[1], $R['a1'], upload($d, $d3), hash('sha256', $d3), 'd3.jpg'), 409, 'quota_exceeded', 'Les métadonnées d\'un rapport supprimé restent comptées dans le quota');
// changement de propriétaire du rapport a4
$c4 = jpeg(3, 3, 100, 61);
$c4m = $d['store']->store($A[0], $A[1], $R['a4'], upload($d, $c4), hash('sha256', $c4), 'c.jpg');
$d['pdo']->exec("UPDATE rapport_reports SET owner_id = '102' WHERE public_id = '" . $R['a4'] . "'");
fail_with(fn () => $d['store']->open($A[0], $A[1], $R['a4'], $c4m['id']), 404, 'not_found', 'Ancien propriétaire refusé après changement');
fail_with(fn () => $d['store']->open($B[0], $B[1], $R['a4'], $c4m['id']), 404, 'not_found', 'Nouveau propriétaire : la métadonnée appartient encore à l\'ancien');
check($d['store']->listForReport($B[0], $B[1], $R['a4']) === [], 'Nouveau propriétaire : aucun original hérité');

// ---------------------------------------------------------------- 9. rapports source inchangés
check($reportsBefore === array_slice(reports_snapshot($e['pdo']), 0, count($reportsBefore)) && $reportsBefore === reports_snapshot($e['pdo']), 'Lignes et propriétaires des rapports inchangés par les originaux');

// ---------------------------------------------------------------- 10. envois concurrents sous quota
$k = new_env($base, 5000, 1500, $R, $A, $B);
$k1 = upload($k, jpeg(5, 5, 900, 71));
$k2 = upload($k, jpeg(5, 5, 900, 72));
$go = $k['dir'] . '/go';
$workers = [];
foreach ([$k1, $k2] as $file) {
    $command = array_merge([PHP_BINARY], php_args(), [__FILE__, '--worker', $k['db'], $k['root'], $R['a1'], $file, $go, '5000', '1500']);
    $process = proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    $workers[] = [$process, $pipes];
}
usleep(400000);
file_put_contents($go, '1');
$outcomes = [];
foreach ($workers as [$process, $pipes]) {
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    proc_close($process);
    $decoded = json_decode($stdout, true);
    check(is_array($decoded), 'Le processus concurrent répond : ' . $stdout . $stderr);
    $outcomes[] = $decoded;
}
$succeeded = array_values(array_filter($outcomes, static fn (array $o): bool => $o['ok'] === true));
$refused = array_values(array_filter($outcomes, static fn (array $o): bool => $o['ok'] === false));
check(count($succeeded) === 1 && count($refused) === 1 && $refused[0]['error'] === 'quota_exceeded' && $refused[0]['status'] === 409, 'Deux envois simultanés : un seul passe sous un quota de 1500 octets');
check(row_count($k['pdo']) === 1 && count(stored_files($k['root'])) === 1, 'Concurrence : une ligne et un fichier');

// ---------------------------------------------------------------- 10b. propriétaire courant recontrôlé pendant l'envoi
$pdoOptions = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_TIMEOUT => 20];
foreach ([2 => 'sous le verrou', 3 => 'juste avant l\'insertion'] as $nth => $moment) {
    foreach (['supprimé' => "DELETE FROM rapport_reports WHERE public_id = '%s'",
        'réattribué' => "UPDATE rapport_reports SET owner_id = '102' WHERE public_id = '%s'"] as $change => $sql) {
        $g = new_env($base, 5000, 20000, $R, $A, $B);
        $interfering = new InterferingPdo('sqlite:' . $g['db'], null, null, $pdoOptions);
        $interfering->atReportCheck[$nth] = static fn () => $g['pdo']->exec(sprintf($sql, $R['a1']));
        $store = new RapportPhotoOriginalStore($interfering, $g['root'], 5000, 20000);
        $img = jpeg(6, 6, 200, 80 + $nth);
        fail_with(fn () => $store->store($A[0], $A[1], $R['a1'], upload($g, $img), hash('sha256', $img), 'c.jpg'), 404, 'not_found',
            "Rapport $change $moment : envoi refusé");
        check(row_count($g['pdo']) === 0 && stored_files($g['root']) === [], "Rapport $change $moment : aucune ligne, aucun fichier conservé");
        check(!$interfering->inTransaction(), "Rapport $change $moment : aucune transaction laissée ouverte");
        if ($change === 'réattribué') {
            check($g['pdo']->query("SELECT owner_id FROM rapport_reports WHERE public_id = '" . $R['a1'] . "'")->fetchColumn() === '102', 'Le propriétaire modifié par ailleurs n\'est pas touché');
        }
    }
}
$g = new_env($base, 5000, 20000, $R, $A, $B);
$neutral = new InterferingPdo('sqlite:' . $g['db'], null, null, $pdoOptions);
$img = jpeg(6, 6, 200, 99);
check((new RapportPhotoOriginalStore($neutral, $g['root'], 5000, 20000))->store($A[0], $A[1], $R['a1'], upload($g, $img), hash('sha256', $img), 'c.jpg')['bytes'] === strlen($img),
    'Sans modification pendant l\'envoi, les trois contrôles laissent passer');

// ---------------------------------------------------------------- 10c. noms UTF-8 sans mbstring
$accented = 'a' . str_repeat('é', 150) . '.JPG';
$clean = RapportPhotoOriginalStore::sanitizeName($accented);
check(preg_match('//u', $clean) === 1 && preg_match_all('/./us', $clean) === 120, 'Nom long accentué : 120 caractères, UTF-8 valide (mbstring ' . (function_exists('mb_substr') ? 'chargé' : 'absent') . ')');
$cut = RapportPhotoOriginalStore::sanitizeName(str_repeat('日本', 100));
check(preg_match('//u', $cut) === 1 && preg_match_all('/./us', $cut) === 120, 'Caractères sur plusieurs octets : coupe sans casser le dernier');
check(RapportPhotoOriginalStore::sanitizeName("\xFF\xFE.jpg") !== '' && preg_match('//u', RapportPhotoOriginalStore::sanitizeName("\xFF\xFE.jpg")) === 1, 'Octets invalides : nom de repli valide');
check(RapportPhotoOriginalStore::sanitizeName('.. / ..') === 'photo' && RapportPhotoOriginalStore::sanitizeName("a\x00b\r\n.jpg") === 'ab.jpg', 'Points, séparateurs et contrôles neutralisés');
$long = new_env($base, 5000, 20000, $R, $A, $B);
$longMeta = $long['store']->store($A[0], $A[1], $R['a1'], upload($long, jpeg(4, 4, 80, 90)), hash('sha256', jpeg(4, 4, 80, 90)), $accented);
check(preg_match('//u', $longMeta['name']) === 1 && preg_match('//u', RapportPhotoOriginalStore::downloadName($longMeta)) === 1, 'Nom stocké et nom de téléchargement : UTF-8 valide');

// ---------------------------------------------------------------- 10d. erreurs de base : 503 générique, sans détail SQL
$m = new_env($base, 5000, 20000, $R, $A, $B);
$known = $m['store']->store($A[0], $A[1], $R['a1'], upload($m, jpeg(4, 4, 80, 91)), hash('sha256', jpeg(4, 4, 80, 91)), 'k.jpg');
$m['pdo']->exec('DROP TABLE rapport_photo_originals');
$filesWithoutTable = stored_files($m['root']);
$sqlLeaks = [];
$noSql = static function (callable $work, string $case) use (&$sqlLeaks): void {
    fail_with($work, 503, 'storage_unavailable', $case);
    global $leaks;
    $sqlLeaks[] = end($leaks);
};
$noSql(fn () => $m['store']->listForReport($A[0], $A[1], $R['a1']), 'Table des originaux absente : liste en 503');
$noSql(fn () => $m['store']->open($A[0], $A[1], $R['a1'], $known['id']), 'Table des originaux absente : lecture en 503');
$noSql(fn () => $m['store']->store($A[0], $A[1], $R['a1'], upload($m, jpeg(4, 4, 80, 92)), hash('sha256', jpeg(4, 4, 80, 92)), 'n.jpg'), 'Table des originaux absente : envoi en 503');
check(stored_files($m['root']) === $filesWithoutTable, 'Table absente : aucun fichier nouveau conservé');
$m['pdo']->exec('DROP TABLE rapport_reports');
$noSql(fn () => $m['store']->listForReport($A[0], $A[1], $R['a1']), 'Table des rapports absente : liste en 503');
$noSql(fn () => $m['store']->store($A[0], $A[1], $R['a1'], upload($m, jpeg(4, 4, 80, 93)), hash('sha256', jpeg(4, 4, 80, 93)), 'n.jpg'), 'Table des rapports absente : envoi en 503');
foreach ($sqlLeaks as $message) {
    check(!preg_match('/no such table|rapport_|SQLSTATE|SQLITE|SELECT|INSERT/i', $message), 'Aucun détail SQL dans le message : ' . $message);
}

// ---------------------------------------------------------------- 10e. sauvegarde puis restauration à blanc (copie privée)
$bk = new_env($base, 5000, 4000, $R, $A, $B);
$sent = [];
foreach ([[$A, 'a1', jpeg(30, 20, 700, 101)], [$A, 'a1', png(10, 10, 600, 102)], [$A, 'a2', jpeg(31, 21, 650, 103)], [$B, 'b1', jpeg(32, 22, 640, 104)]] as [$who, $name, $bytes]) {
    $sent[] = [$who, $name, $bytes, $bk['store']->store($who[0], $who[1], $R[$name], upload($bk, $bytes), hash('sha256', $bytes), $name . '.img')];
}
$ownersBefore = reports_snapshot($bk['pdo']);
$listsBefore = [$R['a1'] => $bk['store']->listForReport($A[0], $A[1], $R['a1']), $R['a2'] => $bk['store']->listForReport($A[0], $A[1], $R['a2']),
    $R['b1'] => $bk['store']->listForReport($B[0], $B[1], $R['b1'])];
$treeBefore = stored_files($bk['root']);
// sauvegarde : base + arbre privé copiés tels quels
mkdir($bk['dir'] . '/backup');
copy($bk['db'], $bk['dir'] . '/backup/db.sqlite');
rcopy($bk['root'], $bk['dir'] . '/backup/store');
// restauration à blanc : copie privée neuve et vide
mkdir($bk['dir'] . '/restore/store', 0700, true);
copy($bk['dir'] . '/backup/db.sqlite', $bk['dir'] . '/restore/db.sqlite');
rcopy($bk['dir'] . '/backup/store', $bk['dir'] . '/restore/store');
$restoredPdo = new_pdo($bk['dir'] . '/restore/db.sqlite');
$restored = new RapportPhotoOriginalStore($restoredPdo, realpath($bk['dir'] . '/restore/store'), 5000, 4000);
check(reports_snapshot($restoredPdo) === $ownersBefore, 'Restauration : rapports et propriétaires identiques');
foreach ([$R['a1'] => $A, $R['a2'] => $A, $R['b1'] => $B] as $reportId => $who) {
    check($restored->listForReport($who[0], $who[1], $reportId) === $listsBefore[$reportId], 'Restauration : métadonnées identiques pour ' . substr($reportId, 0, 4));
}
foreach ($sent as [$who, $name, $bytes, $metadata]) {
    $opened = $restored->open($who[0], $who[1], $R[$name], $metadata['id']);
    check($opened['metadata'] === $metadata && read_stream($opened) === $bytes, 'Restauration : réouverture octet-identique de ' . $metadata['id']);
    $stat = $restoredPdo->query("SELECT owner_provider, owner_id FROM rapport_photo_originals WHERE public_id = '" . $metadata['id'] . "'")->fetch();
    check($stat['owner_provider'] === $who[0] && $stat['owner_id'] === $who[1], 'Restauration : même propriétaire pour ' . $metadata['id']);
}
fail_with(fn () => $restored->open($B[0], $B[1], $R['a1'], $sent[0][3]['id']), 404, 'not_found', 'Restauration : le second compte reste refusé');
fail_with(fn () => $restored->listForReport($A[0], $A[1], $R['b1']), 404, 'not_found', 'Restauration : refus inter-comptes conservé');
$extra = jpeg(40, 30, 3500, 105);
fail_with(fn () => $restored->store($A[0], $A[1], $R['a2'], upload($bk, $extra), hash('sha256', $extra), 'x.jpg'), 409, 'quota_exceeded', 'Restauration : quota du propriétaire retrouvé');
check($restored->store($A[0], $A[1], $R['a1'], upload($bk, $sent[0][2]), hash('sha256', $sent[0][2]), 'z.jpg') === $sent[0][3], 'Restauration : dédoublonnage retrouvé sans nouvelle ligne');
check(stored_files($bk['root']) === $treeBefore && $bk['store']->listForReport($A[0], $A[1], $R['a1']) === $listsBefore[$R['a1']], 'La source n\'a pas été modifiée par la restauration');
// restauration partielle : base sans fichiers → la référence sans fichier est détectée, jamais servie
mkdir($bk['dir'] . '/partial/store', 0700, true);
copy($bk['dir'] . '/backup/db.sqlite', $bk['dir'] . '/partial/db.sqlite');
$partialPdo = new_pdo($bk['dir'] . '/partial/db.sqlite');
$partial = new RapportPhotoOriginalStore($partialPdo, realpath($bk['dir'] . '/partial/store'), 5000, 4000);
check($partial->listForReport($A[0], $A[1], $R['a1']) === $listsBefore[$R['a1']], 'Restauration partielle : métadonnées présentes');
fail_with(fn () => $partial->open($A[0], $A[1], $R['a1'], $sent[0][3]['id']), 503, 'storage_unavailable', 'Restauration partielle : fichier absent signalé');

// ---------------------------------------------------------------- 11. routes HTTP indépendantes de la base
$public = dirname(__DIR__) . '/frontend/public';
$secret = str_repeat('photo-test-secret-', 3);
$configFile = $base . '/http-config.php';
$writeConfig = static function (array $extra) use ($configFile, $secret): void {
    file_put_contents($configFile, '<?php return ' . var_export([
        'environment' => 'local', 'auth_mode' => 'connect_gateway', 'connect_launch_secret' => $secret,
        'connect_gate_cookie' => 'AVEREO_RAPPORT_GATE', 'connect_gate_session_seconds' => 3600,
    ] + $extra, true) . ';');
};
$cookie = static function (?array $identity, int $issuedAt) use ($secret): string {
    $payload = ['v' => $identity === null ? 1 : 2, 'app' => 'rapport', 'iat' => $issuedAt, 'exp' => $issuedAt + 300,
        'nonce' => rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=')];
    if ($identity !== null) {
        $payload['identity'] = $identity;
    }
    $encoded = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');

    return 'AVEREO_RAPPORT_GATE=' . $encoded . '.' . rtrim(strtr(base64_encode(hash_hmac('sha256', $encoded, $secret, true)), '+/', '-_'), '=');
};
$probeSocket = stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
$port = (int) substr(strrchr((string) stream_socket_get_name($probeSocket, false), ':'), 1);
fclose($probeSocket);
$writeConfig(['photo_originals_enabled' => false]);
$environment = array_merge(getenv(), ['AVEREO_CONFIG_FILE' => $configFile]);
$server = proc_open([PHP_BINARY, '-S', '127.0.0.1:' . $port, '-t', $public], [0 => ['pipe', 'r'], 1 => ['file', $base . '/server.log', 'a'], 2 => ['file', $base . '/server.log', 'a']], $serverPipes, $public, $environment);
for ($attempt = 0; $attempt < 50; $attempt++) {
    $socket = @stream_socket_client('tcp://127.0.0.1:' . $port, $errno, $errstr, 0.2);
    if ($socket) {
        fclose($socket);
        break;
    }
    usleep(100000);
}
$http = static function (string $method, string $query, array $headers = [], ?string $body = null) use ($port): array {
    $context = stream_context_create(['http' => ['method' => $method, 'header' => implode("\r\n", $headers), 'content' => $body ?? '',
        'ignore_errors' => true, 'timeout' => 15, 'follow_location' => 0]]);
    $raw = @file_get_contents('http://127.0.0.1:' . $port . '/api/photo-originals.php' . $query, false, $context);
    $status = 0;
    foreach ($http_response_header ?? [] as $line) {
        if (preg_match('~^HTTP/\S+ (\d{3})~', $line, $m)) {
            $status = (int) $m[1];
        }
    }

    return [$status, json_decode((string) $raw, true) ?: [], (string) $raw];
};
try {
    $now = time();
    $user = ['provider' => 'avereo_connect', 'id' => '101'];
    $withCookie = ['Cookie: ' . $cookie($user, $now)];
    [$status, $json] = $http('GET', '?action=capabilities');
    check($status === 403 && ($json['error'] ?? '') === 'connect_gateway_required', 'HTTP : sans sas CONNECT, accès refusé');
    [$status, $json] = $http('GET', '?action=capabilities', ['Cookie: AVEREO_RAPPORT_GATE=forge.signature']);
    check($status === 403, 'HTTP : cookie falsifié refusé');
    [$status, $json] = $http('GET', '?action=capabilities', ['Cookie: ' . $cookie($user, $now - 7200)]);
    check($status === 403, 'HTTP : cookie expiré refusé');
    [$status, $json] = $http('GET', '?action=capabilities', ['Cookie: ' . $cookie(null, $now)]);
    check($status === 401 && ($json['error'] ?? '') === 'connect_identity_missing', 'HTTP : sas sans identité refusé');
    [$status, $json] = $http('GET', '?action=capabilities', $withCookie);
    check($status === 200 && $json === ['ok' => true, 'enabled' => false], 'HTTP : capacités, désactivé par défaut');
    [$status, $json] = $http('GET', '?reportId=' . $R['a1'], $withCookie);
    check($status === 503 && ($json['error'] ?? '') === 'storage_unavailable', 'HTTP : liste refusée tant que non activé');
    [$status, $json] = $http('POST', '', $withCookie);
    check($status === 403 && ($json['error'] ?? '') === 'photo_header_required', 'HTTP : en-tête X-Avereo-Photo obligatoire');
    [$status, $json] = $http('POST', '', array_merge($withCookie, ['X-Avereo-Photo: 1', 'Origin: https://autre.example']));
    check($status === 403 && ($json['error'] ?? '') === 'origin_refused', 'HTTP : Origin étrangère refusée');
    [$status, $json] = $http('POST', '', array_merge($withCookie, ['X-Avereo-Photo: 1', 'Sec-Fetch-Site: cross-site']));
    check($status === 403 && ($json['error'] ?? '') === 'origin_refused', 'HTTP : Sec-Fetch-Site cross-site refusé');
    [$status, $json] = $http('POST', '', array_merge($withCookie, ['X-Avereo-Photo: 1', 'Origin: http://127.0.0.1:' . $port, 'Sec-Fetch-Site: same-origin']));
    check($status === 503 && ($json['error'] ?? '') === 'storage_unavailable', 'HTTP : même origine acceptée, puis refus car non activé');
    foreach (['DELETE', 'PUT'] as $method) {
        [$status, $json] = $http($method, '?reportId=' . $R['a1'], $withCookie);
        check($status === 405 && ($json['error'] ?? '') === 'method_not_allowed', "HTTP : $method non autorisé");
    }
    [$status, , $raw] = $http('GET', '?action=capabilities', $withCookie);
    check(!str_contains($raw, 'Access-Control-Allow'), 'HTTP : aucun CORS permissif');
    // Activé mais base absente de la configuration : refus propre, sans chemin ni détail.
    $writeConfig(['photo_originals_enabled' => true, 'photo_originals_directory' => $base . '/store-http', 'photo_originals_max_bytes' => 1000, 'photo_originals_owner_quota_bytes' => 5000]);
    [$status, $json, $raw] = $http('GET', '?action=capabilities', $withCookie);
    check($status === 503 && ($json['error'] ?? '') === 'database_not_configured' && !str_contains($raw, $base), 'HTTP : activé sans base, refus sans fuite de chemin');
} finally {
    proc_terminate($server);
    proc_close($server);
}

// Libère les connexions SQLite (Windows verrouille les fichiers ouverts) puis supprime les données fictives.
$e = $q = $a = $s = $p = $gone = $d = $k = $probe = $fresh = $viaConfig = $opened = null;
$g = $interfering = $neutral = $store = $long = $m = $bk = $restoredPdo = $restored = $partialPdo = $partial = $noSql = null;
$orphan = $missing = null;
gc_collect_cycles();
rrmdir($base);
check(!file_exists($base), 'Données temporaires supprimées');
echo "PASS Rapport : originaux privés — aller-retour, nouvelle instance, refus inter-comptes et administrateur, empreinte, images invalides, limites, quota, dédoublonnage, altération, liens symboliques, pannes, suppression/changement de propriétaire, propriétaire recontrôlé sous verrou et avant insertion, noms UTF-8, erreurs de base en 503 sans détail SQL, sauvegarde puis restauration à blanc, concurrence, routes HTTP hors base\n";
