<?php
declare(strict_types=1);

use Avereo\Connect\Config;
use Avereo\Connect\Security\AppLaunchTicketIssuer;

const AVEREO_GATE_APP = 'passeport-immo';
require dirname(__DIR__) . '/frontend/public/connect/session.php';
require dirname(__DIR__, 2) . '/avereo-app-connect/backend/src/autoload.php';

$count = 0;
function verify(bool $condition, string $label): void {
    global $count;
    if (!$condition) throw new RuntimeException($label);
    $count++;
}
function signedPayload(array $payload, string $secret): string {
    $body = avereo_gate_base64url_encode(json_encode($payload, JSON_THROW_ON_ERROR));
    return $body . '.' . avereo_gate_base64url_encode(hash_hmac('sha256', $body, $secret, true));
}
function denied(callable $operation): void {
    try { $operation(); } catch (Throwable) { verify(true, 'Refus attendu'); return; }
    throw new RuntimeException('Une preuve invalide a été acceptée.');
}

$secret = bin2hex(random_bytes(32));
putenv('APP_LAUNCH_PASSEPORT_IMMO_URL=https://passeport-immo-preprod.avereo.fr/connect/entry.php');
putenv('APP_LAUNCH_PASSEPORT_IMMO_SECRET=' . $secret);
$config = Config::fromEnvironment();
$issuer = new AppLaunchTicketIssuer($config);
verify($issuer->isConfigured('passeport-immo'), 'La configuration Passeport Immo doit être reconnue.');
$location = $issuer->issueLocation('passeport-immo', 42, true);
parse_str((string) parse_url($location, PHP_URL_QUERY), $query);
$ticket = $query['ticket'];
$payload = avereo_gate_decode_signed($ticket, $secret);
avereo_gate_assert_payload($payload, 300);
verify($payload['app'] === AVEREO_GATE_APP, 'Ticket lié à Passeport Immo.');
verify($payload['identity']['id'] === '42', 'Ticket émis par le vrai composant CONNECT.');
verify($payload['remembered'] === true, 'Persistance signée.');

$folder = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'passeport-gate-' . bin2hex(random_bytes(8));
$settings = ['environment' => 'local', 'connect_launch_secret' => $secret,
    'connect_launch_nonce_directory' => $folder, 'connect_launch_max_seconds' => 300,
    'connect_gate_cookie' => 'PASSEPORT_TEST', 'connect_gate_session_seconds' => 1800];
try {
    avereo_gate_exchange_ticket($settings, $ticket);
    verify(is_dir($folder), 'Le nonce a été consommé.');
    denied(fn() => avereo_gate_exchange_ticket($settings, $ticket));
    denied(fn() => avereo_gate_decode_signed($ticket, str_repeat('wrong-test-key', 4)));
    denied(fn() => avereo_gate_assert_payload(array_merge($payload, ['app' => 'rapport']), 300));
    denied(fn() => avereo_gate_assert_payload(array_merge($payload, ['exp' => time() - 1]), 300));
    denied(fn() => avereo_gate_assert_payload(array_merge($payload, ['iat' => time() + 120]), 300));
    denied(fn() => avereo_gate_assert_payload(array_merge($payload, ['exp' => $payload['iat'] + 301]), 300));
    $_COOKIE['PASSEPORT_TEST'] = signedPayload(['v' => 1, 'app' => AVEREO_GATE_APP,
        'iat' => time(), 'exp' => time() + 900, 'nonce' => avereo_gate_base64url_encode(random_bytes(24))], $secret);
    verify(avereo_gate_cookie_is_valid($settings), 'Session applicative signée acceptée.');
    $_COOKIE['PASSEPORT_TEST'] .= 'invalid';
    verify(!avereo_gate_cookie_is_valid($settings), 'Session altérée refusée.');
    verify(avereo_gate_portal(['connect_portal_url' => 'https://connect-preprod.avereo.fr/']) === 'https://connect-preprod.avereo.fr', 'Portail préproduction.');
    denied(fn() => avereo_gate_portal(['connect_portal_url' => 'https://example.invalid/']));
    $policy = $folder . DIRECTORY_SEPARATOR . 'policy.json';
    $scoped = $settings + ['connect_trial_access_file' => $policy];
    $rule = ['status'=>'active','not_before'=>0,'not_after'=>PHP_INT_MAX,'applications'=>['passeport-immo']];
    $write = static fn(array $value) => file_put_contents($policy, json_encode(['version'=>1,'accounts'=>['42'=>$value]], JSON_THROW_ON_ERROR));
    $write($rule);
    $_COOKIE['PASSEPORT_TEST'] = signedPayload($payload, $secret);
    verify(passeport_identity(passeport_session($scoped)) === 'avereo_connect:42', 'Session Passeport autorisée avant archivage.');
    $unconsumed = signedPayload(array_replace($payload, ['nonce'=>avereo_gate_base64url_encode(random_bytes(24))]), $secret);
    $write(array_replace($rule,['status'=>'revoked']));
    denied(fn() => passeport_session($scoped));
    denied(fn() => passeport_exchange($scoped, $unconsumed));
    $write($rule + ['sessions_revoked_at'=>$payload['iat']]);
    denied(fn() => passeport_session($scoped));
    denied(fn() => passeport_exchange($scoped, $unconsumed));
    $new = array_replace($payload,['iat'=>$payload['iat']+1,'exp'=>$payload['iat']+120]);
    $_COOKIE['PASSEPORT_TEST'] = signedPayload($new, $secret);
    verify(passeport_session($scoped)['iat'] === $new['iat'], 'Nouvelle session acceptée après restauration.');
    $new['identity']['id'] = '43';
    $_COOKIE['PASSEPORT_TEST'] = signedPayload($new, $secret);
    verify(passeport_session($scoped)['identity']['id'] === '43', 'Autre compte non impacté.');
    unlink($policy);
    denied(fn() => passeport_session($scoped));

} finally {
    foreach (glob($folder . DIRECTORY_SEPARATOR . '*.used') ?: [] as $file) unlink($file);
    if (is_file($folder . DIRECTORY_SEPARATOR . 'policy.json')) unlink($folder . DIRECTORY_SEPARATOR . 'policy.json');
    if (is_dir($folder)) rmdir($folder);
    putenv('APP_LAUNCH_PASSEPORT_IMMO_URL'); putenv('APP_LAUNCH_PASSEPORT_IMMO_SECRET');
    unset($_COOKIE['PASSEPORT_TEST']);
}
fwrite(STDOUT, "PASS Passeport Immo / CONNECT : {$count} assertions\n");
