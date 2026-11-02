<?php
declare(strict_types=1);
require dirname(__DIR__) . '/frontend/dist/rga/gate.php';
$checks = 0;
function expectRgaGate(bool $ok): void { global $checks; if (!$ok) throw new RuntimeException('RGA gate assertion failed'); $checks++; }
function rgaTicket(string $app, string $secret, int $expiry = 90): string {
    $p = avereo_gate_base64url_encode(json_encode(['v' => 1, 'app' => $app, 'iat' => time(), 'exp' => time() + $expiry,
        'nonce' => avereo_gate_base64url_encode(random_bytes(24))]));
    return $p . '.' . avereo_gate_base64url_encode(hash_hmac('sha256', $p, $secret, true));
}
$dir = sys_get_temp_dir() . '/avereo-rga-' . bin2hex(random_bytes(8));
$secret = str_repeat('rga-test-only-', 4);
$config = ['environment' => 'local', 'connect_launch_secret' => $secret,
    'connect_launch_nonce_directory' => $dir, 'connect_gate_cookie' => 'AVEREO_RGA_GATE'];
$ticket = rgaTicket('rga', $secret);
avereo_gate_exchange_ticket($config, $ticket);
$rejected = false;
try { avereo_gate_exchange_ticket($config, $ticket); } catch (RuntimeException $e) { $rejected = true; }
expectRgaGate($rejected);
foreach ([rgaTicket('rapport', $secret), rgaTicket('rga', str_repeat('rapport-test-', 4)), rgaTicket('rga', $secret, -1)] as $invalid) {
    $rejected = false;
    try { avereo_gate_exchange_ticket($config, $invalid); } catch (RuntimeException $e) { $rejected = true; }
    expectRgaGate($rejected);
}
$_COOKIE = ['AVEREO_RAPPORT_GATE' => rgaTicket('rapport', $secret)];
expectRgaGate(!avereo_gate_cookie_is_valid($config));
$_COOKIE['AVEREO_RGA_GATE'] = rgaTicket('rapport', $secret);
expectRgaGate(!avereo_gate_cookie_is_valid($config));
$_COOKIE['AVEREO_RGA_GATE'] = rgaTicket('rga', $secret);
expectRgaGate(avereo_gate_cookie_is_valid($config));
expectRgaGate(rga_config()['connect_gate_cookie'] === 'AVEREO_RGA_GATE');
foreach (glob($dir . '/*.used') ?: [] as $file) unlink($file);
rmdir($dir);
echo "$checks contrôles du sas RGA réussis.\n";
