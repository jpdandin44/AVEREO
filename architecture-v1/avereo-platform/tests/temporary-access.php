<?php
declare(strict_types=1);

// Each app runs in its own process because its gateway owns global PHP functions.
$app = $argv[1] ?? '';
$root = dirname(__DIR__, 2);
if (in_array($app, ['projet', 'thermo', 'drone', 'recherche'], true)) {
    define('AVEREO_GATE_APP', $app);
    require dirname(__DIR__) . '/shared/connect-gate.php';
} elseif (in_array($app, ['rapport', 'coupe'], true)) {
    require $root . '/avereo-app-' . $app . '/frontend/public/connect/gate.php';
} elseif ($app === 'rga') {
    // Apply the same constant removal as frontend/scripts/build-rga.mjs in a private copy.
    define('AVEREO_GATE_APP', 'rga');
    $rgaGate = tempnam(sys_get_temp_dir(), 'rga-gate-test-');
    file_put_contents($rgaGate, str_replace("const AVEREO_GATE_APP = 'rapport';", '',
        file_get_contents($root . '/avereo-app-rapport/frontend/public/connect/gate.php')));
    try { require $rgaGate; } finally { unlink($rgaGate); }
} elseif ($app === 'passeport-immo') {
    define('AVEREO_GATE_APP', $app);
    require $root . '/avereo-app-passeport-immo/frontend/public/connect/session.php';
} else {
    throw new RuntimeException('Choose a known application.');
}
$directory = sys_get_temp_dir() . '/temporary-app-access-' . bin2hex(random_bytes(8));
mkdir($directory, 0700);
$directory = realpath($directory);
$file = $directory . DIRECTORY_SEPARATOR . 'policy.json';
$secret = str_repeat('isolated-test-secret-', 3);
$config = ['environment'=>'local', 'connect_trial_access_file'=>$file,
    'connect_launch_secret'=>$secret, 'connect_gate_cookie'=>'TEMPORARY_ACCESS_TEST',
    'connect_gate_session_seconds'=>1800, 'connect_launch_max_seconds'=>300,
    'connect_launch_nonce_directory'=>$directory . '/nonces'];
$now = time();
$payload = ['v'=>in_array($app, ['rapport','rga','coupe'], true) ? 2 : 1,
    'app'=>$app, 'iat'=>$now-2, 'exp'=>$now+90,
    'nonce'=>avereo_gate_base64url_encode(random_bytes(24)),
    'identity'=>['provider'=>'avereo_connect','id'=>'42']];
$rule = ['status'=>'active', 'not_before'=>$now-30, 'not_after'=>$now+600,
    'sessions_revoked_at'=>0, 'applications'=>[$app]];
$checks = [];
function verify_temporary(bool $ok, string $label): void {
    global $checks;
    if (!$ok) throw new RuntimeException($label);
    $checks[] = $label;
}
$sign = static function(array $value) use ($secret): string {
    $encoded = avereo_gate_base64url_encode(json_encode($value, JSON_THROW_ON_ERROR));
    return $encoded . '.' . avereo_gate_base64url_encode(hash_hmac('sha256', $encoded, $secret, true));
};
$write = static function(array $rules) use ($file): void {
    file_put_contents($file, json_encode(['version'=>1,'accounts'=>$rules], JSON_THROW_ON_ERROR));
};
$valid = static function() use ($config,$app): bool {
    try { return $app === 'passeport-immo' ? (bool) passeport_session($config) : avereo_gate_cookie_is_valid($config); }
    catch (Throwable) { return false; }
};
$exchange = static function(string $ticket) use ($config,$app): void {
    if ($app === 'passeport-immo') passeport_exchange($config,$ticket);
    else avereo_gate_exchange_ticket($config,$ticket);
};
try {
    $write(['42'=>$rule]);
    $_COOKIE['TEMPORARY_ACCESS_TEST'] = $sign($payload);
    $originalCookie = $_COOKIE['TEMPORARY_ACCESS_TEST'];
    verify_temporary($valid(), 'selected application accepts an active temporary account');
    foreach ([
        'expired'=>['not_after'=>$now-1],
        'future'=>['not_before'=>$now+100],
        'application removed'=>['applications'=>[]],
        'account revoked'=>['status'=>'revoked'],
        'old session after restoration'=>['sessions_revoked_at'=>$now-1],
        'invalid period'=>['not_before'=>$now+700],
    ] as $label=>$change) {
        $write(['42'=>array_replace($rule,$change), '43'=>$rule]);
        verify_temporary(!$valid() && $_COOKIE['TEMPORARY_ACCESS_TEST']===$originalCookie, $label . ' denies the already-open session');
        $denied = false;
        try { $exchange($sign(array_replace($payload,['nonce'=>avereo_gate_base64url_encode(random_bytes(24))]))); } catch (Throwable) { $denied = true; }
        verify_temporary($denied, $label . ' also denies ticket exchange');
        $_COOKIE['TEMPORARY_ACCESS_TEST'] = $sign(array_replace($payload,['identity'=>['provider'=>'avereo_connect','id'=>'43']]));
        verify_temporary($valid(), $label . ' does not affect another account');
        $_COOKIE['TEMPORARY_ACCESS_TEST'] = $originalCookie;
    }
    $write(['42'=>array_replace($rule,['not_before'=>0,'not_after'=>PHP_INT_MAX])]);
    verify_temporary($valid(),'permanent account remains supported');
    $write(['42'=>$rule]);
    $anonymous=$payload;unset($anonymous['identity']);
    $_COOKIE['TEMPORARY_ACCESS_TEST']=$sign($anonymous);
    verify_temporary(!$valid(),'old anonymous cookie denied when account policy is configured');
    $_COOKIE['TEMPORARY_ACCESS_TEST']=$originalCookie;
    file_put_contents($file,'invalid JSON');
    verify_temporary(!$valid(),'malformed policy fails closed');
    unlink($file);
    verify_temporary(!$valid(),'missing configured policy fails closed');
    $write(['42'=>$rule]);
    $exchange($sign($payload));
    verify_temporary(is_dir($directory.'/nonces'),'valid ticket exchange consumes the nonce');
    $denied=false;
    try { $exchange($sign($payload)); } catch (Throwable) { $denied=true; }
    verify_temporary($denied,'valid ticket cannot be replayed');
    echo json_encode(['application'=>$app,'passed'=>count($checks),'checks'=>$checks],JSON_UNESCAPED_SLASHES).PHP_EOL;
} finally {
    foreach (glob($directory.'/nonces/*') ?: [] as $nonce) unlink($nonce);
    if (is_dir($directory.'/nonces')) rmdir($directory.'/nonces');
    if (is_file($file)) unlink($file);
    rmdir($directory);
}
