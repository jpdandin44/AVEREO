<?php

declare(strict_types=1);

// Only synthetic accounts, ephemeral nonces and a public repository tree.
use Avereo\Connect\Config;
use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Security\AppLaunchTicketIssuer;

$app = $argv[1] ?? '';
if (!in_array($app, ['rapport', 'coupe', 'projet', 'thermo', 'drone', 'recherche'], true)) {
    throw new InvalidArgumentException('Application de test inconnue.');
}
$root = realpath($argv[2] ?? dirname(__DIR__, 2));
if ($root === false) {
    throw new InvalidArgumentException('Source locale absente.');
}
require $root . '/architecture-v1/avereo-app-connect/backend/src/autoload.php';
if (!in_array($app, ['rapport', 'coupe'], true)) {
    define('AVEREO_GATE_APP', $app);
}
$gate = in_array($app, ['rapport', 'coupe'], true)
    ? '/architecture-v1/avereo-app-' . $app . '/frontend/public/connect/gate.php'
    : '/architecture-v1/avereo-platform/shared/connect-gate.php';
require $root . $gate;

function contract_expect(bool $condition, string $label): void
{
    if (!$condition) {
        throw new RuntimeException($label);
    }
}
function contract_reject(callable $action, string $label): void
{
    try {
        $action();
    } catch (RuntimeException | ApiException) {
        return;
    }
    throw new LogicException('Le refus attendu manque : ' . $label);
}
function contract_sign(array $payload, string $secret): string
{
    $encoded = avereo_gate_base64url_encode(json_encode($payload, JSON_THROW_ON_ERROR));
    return $encoded . '.' . avereo_gate_base64url_encode(hash_hmac('sha256', $encoded, $secret, true));
}

$secret = bin2hex(random_bytes(32));
$portal = new Config(
    environment: 'preproduction', debug: false, databaseDsn: null,
    databaseUser: '', databasePassword: '', sessionCookieName: 'AVEREO_TEST',
    sessionIdleSeconds: 1800, sessionAbsoluteSeconds: 43200,
    appLaunchEntryUrls: [$app => 'https://' . $app . '-preprod.avereo.fr/connect/entry.php'],
    appLaunchSecrets: [$app => $secret],
);
$issuer = new AppLaunchTicketIssuer($portal);
$location = $issuer->issueLocation($app, 42, true);
parse_str((string) parse_url($location, PHP_URL_QUERY), $query);
$ticket = (string) ($query['ticket'] ?? '');
$payload = avereo_gate_decode_signed($ticket, $secret);
avereo_gate_assert_payload($payload, 300);
contract_expect(($payload['app'] ?? '') === $app && ($payload['remembered'] ?? false) === true, 'Contrat de lancement incorrect.');
if (function_exists('avereo_gate_normalize_identity')) {
    contract_expect(avereo_gate_normalize_identity($payload['identity'])['id'] === '42', 'Identité CONNECT incompatible.');
}
$directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'avereo-contract-' . bin2hex(random_bytes(12));
$config = [
    'environment' => 'local', 'connect_launch_secret' => $secret,
    'connect_launch_nonce_directory' => $directory, 'connect_launch_max_seconds' => 300,
    'connect_gate_cookie' => 'AVEREO_CONTRACT_TEST', 'connect_gate_session_seconds' => 1800,
];
try {
    avereo_gate_exchange_ticket($config, $ticket);
    contract_reject(fn() => avereo_gate_exchange_ticket($config, $ticket), 'rejeu');
    contract_reject(fn() => avereo_gate_decode_signed($ticket, bin2hex(random_bytes(32))), 'autre secret');
    $wrongApp = $payload;
    $wrongApp['app'] = $app === 'rapport' ? 'coupe' : 'rapport';
    contract_reject(fn() => avereo_gate_exchange_ticket($config, contract_sign($wrongApp, $secret)), 'autre application');
    $expired = $payload;
    $expired['iat'] = time() - 200;
    $expired['exp'] = time() - 1;
    contract_reject(fn() => avereo_gate_exchange_ticket($config, contract_sign($expired, $secret)), 'expiration');
    $modified = $payload;
    $modified['remembered'] = 'true';
    contract_reject(fn() => avereo_gate_exchange_ticket($config, contract_sign($modified, $secret)), 'type de persistance');
    contract_reject(fn() => $issuer->issueLocation($app, 0), 'compte non provisionné');
    contract_expect(!avereo_gate_cookie_is_valid($config), 'Un visiteur anonyme ne doit pas être autorisé.');
} finally {
    if (is_dir($directory)) {
        foreach (glob($directory . DIRECTORY_SEPARATOR . '*.used') ?: [] as $file) {
            unlink($file);
        }
        rmdir($directory);
    }
}
fwrite(STDOUT, 'PASS CONNECT → ' . $app . ': émission réelle, identité, échange, refus et anti-rejeu' . PHP_EOL);
