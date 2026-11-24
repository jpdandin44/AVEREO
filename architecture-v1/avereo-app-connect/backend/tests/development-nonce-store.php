<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/autoload.php';
use Avereo\Connect\Developments\NonceStore;

$now = 2000000000;
if (($argv[1] ?? '') === 'child') {
    echo (new NonceStore($argv[2], static fn() => $now))->claim(str_repeat('a', 48), $now + 30) ? 'yes' : 'no';
    exit;
}
$count = 0;
function ok(bool $value, string $label): void { global $count; if (!$value) throw new RuntimeException($label); $count++; }
$directory = sys_get_temp_dir().'/avereo-nonce-test-'.bin2hex(random_bytes(12));
mkdir($directory, 0700);
$store = new NonceStore($directory, static fn() => $now);
$path = static fn(string $nonce): string => $directory.'/'.hash('sha256', $nonce).'.used';
try {
    for ($i = 0; $i < 4096; $i++) file_put_contents($directory.'/'.hash('sha256', 'old-'.$i).'.used', (string)($now - 6));
    // Reproduce the installed algorithm's saturation with expired claims only.
    ok(count(glob($directory.'/*.used')) >= 4096, 'old capacity check denies the next authorization');
    ok($store->claim(str_repeat('b', 48), $now + 30), 'expired full store recovers');
    ok(count(glob($directory.'/*.used')) === 1, 'expired claims removed');
    ok(!$store->claim(str_repeat('b', 48), $now + 30), 'live replay refused');
    ok(!$store->claim(str_repeat('c', 48), $now), 'expired request refused');
    ok(!$store->claim(str_repeat('c', 48), $now + 36), 'overlong request refused');
    ok(!$store->claim('../bad', $now + 30), 'invalid nonce refused');
    $edge = $path(str_repeat('d', 48)); file_put_contents($edge, (string)($now - 5));
    $bad = $path(str_repeat('e', 48)); file_put_contents($bad, 'invalid');
    $unexpected = $directory.'/unexpected.used'; file_put_contents($unexpected, (string)($now - 30));
    ok($store->claim(str_repeat('f', 48), $now + 30), 'fresh distinct request accepted');
    ok(is_file($edge) && is_file($bad) && is_file($unexpected), 'safety margin and malformed files retained');
    if (DIRECTORY_SEPARATOR !== '\\') {
        $outside = $directory.'-outside'; file_put_contents($outside, (string)($now - 50));
        $link = $path(str_repeat('1', 48)); symlink($outside, $link);
        ok($store->claim(str_repeat('2', 48), $now + 30), 'unrelated symlink does not prevent a valid claim');
        ok(is_link($link) && is_file($outside), 'symlink and target preserved'); unlink($link); unlink($outside);
        ok((fileperms($path(str_repeat('2', 48))) & 0077) === 0, 'claim file remains private');
    }
    foreach (glob($directory.'/*.used') as $file) unlink($file);
    for ($i = 0; $i < 4096; $i++) file_put_contents($directory.'/'.hash('sha256', 'live-'.$i).'.used', (string)($now + 30));
    ok(!$store->claim(str_repeat('3', 48), $now + 30), 'live capacity limit retained');
    ok(count(glob($directory.'/*.used')) === 4096, 'live claims preserved at capacity');
    foreach (glob($directory.'/*.used') as $file) unlink($file);
    $children = [];
    for ($i = 0; $i < 8; $i++) {
        $process = proc_open([PHP_BINARY, __FILE__, 'child', $directory], [1=>['pipe','w'], 2=>['pipe','w']], $pipes);
        if (!is_resource($process)) throw new RuntimeException('Cannot start concurrent fixture.');
        $children[] = [$process, $pipes];
    }
    $accepted = 0;
    foreach ($children as [$process, $pipes]) {
        $result = stream_get_contents($pipes[1]); $error = stream_get_contents($pipes[2]);
        fclose($pipes[1]); fclose($pipes[2]);
        ok(proc_close($process) === 0 && $error === '', 'concurrent fixture completed');
        $accepted += $result === 'yes' ? 1 : 0;
    }
    ok($accepted === 1, 'concurrent identical nonce accepted once');
} finally {
    foreach (glob($directory.'/*') as $file) unlink($file);
    if (is_file($directory.'/.nonce.lock')) unlink($directory.'/.nonce.lock');
    rmdir($directory);
}
echo json_encode(['status'=>'passed','assertions'=>$count,'realAccountsUsed'=>false,'remoteCalls'=>false], JSON_PRETTY_PRINT).PHP_EOL;
