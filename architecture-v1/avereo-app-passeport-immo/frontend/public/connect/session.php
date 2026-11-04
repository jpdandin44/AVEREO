<?php
declare(strict_types=1);
require_once __DIR__ . '/gate.php';

/** The signed CONNECT identity is retained only by this application's session. */
function passeport_identity(array $payload): string
{
    $identity = $payload['identity'] ?? [];
    if (($identity['provider'] ?? null) !== 'avereo_connect'
        || !is_string($identity['id'] ?? null)
        || !preg_match('/^[1-9][0-9]{0,18}$/D', $identity['id'])) {
        throw new RuntimeException('Identité CONNECT requise.');
    }
    return 'avereo_connect:' . $identity['id'];
}

function passeport_assert_access(array $config, array $payload): void
{
    $path = trim((string) ($config['connect_trial_access_file'] ?? ''));
    if ($path === '') return;

    $owner = passeport_identity($payload);
    $id = substr($owner, strlen('avereo_connect:'));
    $real = realpath($path);
    $public = realpath(dirname(__DIR__));
    if ($real === false || $real !== $path || !is_file($real) || !is_readable($real)
        || ($public !== false && str_starts_with($real, $public . DIRECTORY_SEPARATOR))) {
        throw new RuntimeException('Politique CONNECT privée indisponible.');
    }
    $raw = file_get_contents($real, false, null, 0, 65537);
    if ($raw === false || strlen($raw) > 65536) throw new RuntimeException('Politique CONNECT indisponible.');
    $policy = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
    if (($policy['version'] ?? null) !== 1 || !is_array($policy['accounts'] ?? null)) {
        throw new RuntimeException('Politique CONNECT invalide.');
    }
    if (!array_key_exists($id, $policy['accounts'])) return;

    $rule = $policy['accounts'][$id];
    $now = time();
    if (!is_array($rule) || ($rule['status'] ?? null) !== 'active'
        || !is_int($rule['not_before'] ?? null) || !is_int($rule['not_after'] ?? null)
        || $now < $rule['not_before'] || $now >= $rule['not_after']
        || !is_array($rule['applications'] ?? null)
        || !in_array(AVEREO_GATE_APP, $rule['applications'], true)
        || $payload['iat'] <= ($rule['sessions_revoked_at'] ?? 0)) {
        throw new RuntimeException('Accès CONNECT révoqué.');
    }
}

function passeport_session(array $config): array
{
    $payload = avereo_gate_decode_signed(
        (string) ($_COOKIE[$config['connect_gate_cookie']] ?? ''),
        (string) $config['connect_launch_secret'],
    );
    avereo_gate_assert_payload($payload, max(300, min(43200, (int) $config['connect_gate_session_seconds'])));
    passeport_identity($payload);
    passeport_assert_access($config, $payload);
    return $payload;
}

function passeport_exchange(array $config, string $ticket): void
{
    if (empty($config['storage_enabled']) && empty($config['connect_trial_access_file'])) {
        avereo_gate_exchange_ticket($config, $ticket);
        return;
    }
    $payload = avereo_gate_decode_signed($ticket, (string) $config['connect_launch_secret']);
    avereo_gate_assert_payload($payload, max(30, min(300, (int) $config['connect_launch_max_seconds'])));
    passeport_identity($payload);
    passeport_assert_access($config, $payload);
    avereo_gate_consume_nonce($config, $payload['nonce']);
    $now = time();
    $payload = [
        'v' => 1, 'app' => AVEREO_GATE_APP, 'iat' => $now,
        'exp' => $now + max(300, min(43200, (int) $config['connect_gate_session_seconds'])),
        'nonce' => avereo_gate_base64url_encode(random_bytes(24)), 'identity' => $payload['identity'],
        'remembered' => ($payload['remembered'] ?? false) === true,
    ];
    $encoded = avereo_gate_base64url_encode(json_encode($payload, JSON_THROW_ON_ERROR));
    $value = $encoded . '.' . avereo_gate_base64url_encode(hash_hmac('sha256', $encoded, $config['connect_launch_secret'], true));
    setcookie($config['connect_gate_cookie'], $value, [
        'expires' => $payload['remembered'] ? $payload['exp'] : 0,
        'path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax',
    ]);
}

function passeport_csrf(array $config, array $session): string
{
    return hash_hmac('sha256', 'passeport-write:' . $session['nonce'], $config['connect_launch_secret']);
}
