<?php
declare(strict_types=1);
// CLI-only recovery rehearsal; no credential, business row or token is printed.
if (PHP_SAPI !== 'cli' || $argc !== 2) { exit(2); }
umask(0077);
$home = '/home/daje3540';
$destination = $argv[1];
function ensure(bool $condition, string $label): void {
    if (!$condition) { throw new RuntimeException($label); }
}
try {
    ensure(str_starts_with($destination, $home.'/private/preprod-rapport-passeport-')
        && realpath($destination) === $destination && is_dir($destination), 'Private destination');
    $report = require $home.'/.avereo/rapport-preprod/config.php';
    $production = require $home.'/.avereo/rapport/config.php';
    ensure($report['db_host'] !== $production['db_host'] || $report['db_name'] !== $production['db_name'], 'Separate report database');
    ensure(($report['auth_mode'] ?? '') === 'connect_gateway', 'Report gateway');
    ensure(($report['connect_portal_url'] ?? '') === 'https://connect-preprod.avereo.fr/', 'Report portal');
    $pdo = new PDO('mysql:host='.$report['db_host'].';port='.($report['db_port'] ?? 3306).';dbname='.$report['db_name'].';charset=utf8mb4',
        $report['db_user'], $report['db_password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $pdo->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    $pdo->beginTransaction();
    $rows = $pdo->query('SELECT * FROM rapport_reports')->fetchAll();
    $schema = $pdo->query('SHOW CREATE TABLE rapport_reports')->fetch(PDO::FETCH_NUM)[1];
    $pdo->commit();
    $path = $destination.'/rapport-data.json';
    ensure(!file_exists($path), 'Fresh data snapshot');
    file_put_contents($path, json_encode(['schema'=>$schema,'rows'=>$rows], JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE));
    chmod($path,0600);
    $copy = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    ensure($copy === ['schema'=>$schema,'rows'=>$rows], 'Report data readback');
    $pdo->exec('CREATE TEMPORARY TABLE rapport_restore_probe LIKE rapport_reports');
    foreach ($copy['rows'] as $row) {
        $columns = array_keys($row);
        foreach ($columns as $column) { ensure((bool)preg_match('/^[a-z_]+$/D', $column), 'Column name'); }
        $pdo->prepare('INSERT INTO rapport_restore_probe (`'.implode('`,`',$columns).'`) VALUES ('.implode(',',array_fill(0,count($columns),'?')).')')->execute(array_values($row));
    }
    $normalize = static function(array $values): array { $result=array_map(static fn($value)=>json_encode($value,JSON_THROW_ON_ERROR),$values); sort($result); return $result; };
    ensure($normalize($pdo->query('SELECT * FROM rapport_restore_probe')->fetchAll()) === $normalize($rows), 'Report temporary restore');
    $pdo->exec('DROP TEMPORARY TABLE rapport_restore_probe');
    ensure($normalize($pdo->query('SELECT * FROM rapport_reports')->fetchAll()) === $normalize($rows), 'Report live rows unchanged');
    $passeport = require $home.'/.avereo/passeport-immo-preprod/config.php';
    ensure(($passeport['storage_origin'] ?? '') === 'https://passeport-immo-preprod.avereo.fr', 'Passport target');
    ensure(str_contains($passeport['storage_dsn'] ?? '', 'dbname=daje3540_pimpreprod'), 'Passport dedicated database');
    require __DIR__.'/backup-storage.php';
    $passportBackup = passeport_backup($passeport, $destination.'/passeport-data');
    $receipt = ['observedAt'=>gmdate('c'), 'status'=>'passed',
        'rapport'=>['tables'=>1,'rows'=>count($rows),'snapshotSha256'=>hash_file('sha256',$path),
            'readback'=>'passed','temporaryRowRestore'=>'passed','liveRowsChanged'=>false,'productionDatabaseDistinct'=>true],
        'passeport-immo'=>$passportBackup, 'privateValuesExported'=>false];
    file_put_contents($destination.'/data-recovery.json',json_encode($receipt,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES));
    chmod($destination.'/data-recovery.json',0600);
    echo json_encode(['status'=>'passed','receipt'=>'data-recovery.json']).PHP_EOL;
} catch (Throwable $error) {
    // Avoid printing driver errors, SQL, rows or configuration values.
    fwrite(STDERR,json_encode(['status'=>'failed','check'=>$error instanceof RuntimeException && !($error instanceof PDOException) ? $error->getMessage() : get_class($error)]).PHP_EOL);
    exit(1);
}
