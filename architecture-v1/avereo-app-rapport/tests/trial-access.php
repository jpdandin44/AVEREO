<?php
declare(strict_types=1);
$app = $argv[1] ?? 'rapport';
if ($app === 'rga') require dirname(__DIR__) . '/frontend/dist/rga/gate.php';
else require dirname(__DIR__) . '/frontend/public/connect/gate.php';
$file = tempnam(sys_get_temp_dir(), 'avereo-trial-');
$key = str_repeat('local-test-only-', 4);
$cfg = ['connect_launch_secret' => $key, 'connect_gate_cookie' => 'TRIAL_TEST',
    'connect_gate_session_seconds' => 1800, 'connect_trial_access_file' => $file];
$checks = 0;
function expectTrial(bool $ok, string $name): void {
    global $checks; if (!$ok) throw new RuntimeException($name); $checks++;
}
function cookieTrial(string $id = '42', int $version = 2, ?int $issuedAt = null): string {
    global $key, $app;
    $p = ['v' => $version, 'app' => $app, 'iat' => $issuedAt ?? time(), 'exp' => time() + 600,
        'nonce' => str_repeat('a', 32)];
    if ($version === 2) $p['identity'] = ['provider' => 'avereo_connect', 'id' => $id];
    $b = avereo_gate_base64url_encode(json_encode($p, JSON_THROW_ON_ERROR));
    return $b . '.' . avereo_gate_base64url_encode(hash_hmac('sha256', $b, $key, true));
}
function policyTrial(int $start, int $end, string $status = 'active', array $apps = ['rapport','rga'], int $revokedAt = 0): void {
    global $file;
    file_put_contents($file, json_encode(['version' => 1, 'accounts' => ['42' => [
        'status' => $status, 'not_before' => $start, 'not_after' => $end, 'applications' => $apps, 'sessions_revoked_at' => $revokedAt,
    ]]], JSON_THROW_ON_ERROR));
}
try {
    $_COOKIE['TRIAL_TEST'] = cookieTrial();
    $plain = $cfg; unset($plain['connect_trial_access_file']);
    expectTrial(avereo_gate_cookie_is_valid($plain), 'Existing account without trial policy');
    policyTrial(time() + 100, time() + 1000);
    expectTrial(!avereo_gate_cookie_is_valid($cfg), 'Trial must reject before start');
    policyTrial(time() - 100, time() + 1000);
    expectTrial(avereo_gate_cookie_is_valid($cfg), 'Active trial must work');
    $unchangedCookie = $_COOKIE['TRIAL_TEST'];
    policyTrial(time() - 1000, time() - 1);
    expectTrial(!avereo_gate_cookie_is_valid($cfg), 'Already-open session must stop after deadline');
    expectTrial($_COOKIE['TRIAL_TEST'] === $unchangedCookie, 'Expiry is not simulated by clearing the cookie');
    policyTrial(time() - 100, time() + 1000, 'revoked');
    expectTrial(!avereo_gate_cookie_is_valid($cfg), 'Revocation must stop an open session');
    policyTrial(time() - 100, time() + 1000, 'active', [$app === 'rapport' ? 'rga' : 'rapport']);
    expectTrial(!avereo_gate_cookie_is_valid($cfg), 'Other app does not grant current app');
    $_COOKIE['TRIAL_TEST'] = cookieTrial('43');
    expectTrial(avereo_gate_cookie_is_valid($cfg), 'Unlisted accounts preserve normal access');
    $_COOKIE['TRIAL_TEST'] = cookieTrial('42', 1);
    expectTrial(!avereo_gate_cookie_is_valid($cfg), 'Identity-free cookie cannot bypass trial policy');
    expectTrial(avereo_gate_cookie_is_valid($plain), 'Legacy cookie remains compatible without policy');
    $_COOKIE['TRIAL_TEST'] = cookieTrial();
    file_put_contents($file, '{invalid');
    expectTrial(!avereo_gate_cookie_is_valid($cfg), 'Broken configured policy fails closed');
    $missing = $cfg; $missing['connect_trial_access_file'] .= '-absent';
    expectTrial(!avereo_gate_cookie_is_valid($missing), 'Missing configured policy fails closed');
    policyTrial(100, 200);
    foreach ([99 => false, 100 => true, 199 => true, 200 => false] as $now => $allowed) {
        $ok = true;
        try { avereo_gate_assert_trial_access($cfg, ['provider'=>'avereo_connect','id'=>'42'], $now); }
        catch (Throwable $e) { $ok = false; }
        expectTrial($ok === $allowed, 'Exact start/end boundary ' . $now);
    }
    $revokedAt = time() - 5;
    policyTrial(time() - 100, time() + 1000, 'active', ['rapport', 'rga'], $revokedAt);
    $_COOKIE['TRIAL_TEST'] = cookieTrial('42', 2, $revokedAt);
    expectTrial(!avereo_gate_cookie_is_valid($cfg), 'Restore must not revive a revoked cookie');
    $_COOKIE['TRIAL_TEST'] = cookieTrial();
    expectTrial(avereo_gate_cookie_is_valid($cfg), 'New session after restoration works');
    policyTrial(200, 100);
    expectTrial(!avereo_gate_cookie_is_valid($cfg), 'Invalid period fails closed');
    echo json_encode(['application'=>$app,'checks'=>$checks,'status'=>'passed']) . PHP_EOL;
} finally { unlink($file); }
