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

function passeport_session(array $config): array
{
    $payload = avereo_gate_decode_signed(
        (string) ($_COOKIE[$config['connect_gate_cookie']] ?? ''),
        (string) $config['connect_launch_secret'],
    );
    avereo_gate_assert_payload($payload, max(300, min(43200, (int) $config['connect_gate_session_seconds'])));
    passeport_identity($payload);
    return $payload;
}

function passeport_exchange(array $config, string $ticket): void
{
    if (empty($config['storage_enabled'])) {
        avereo_gate_exchange_ticket($config, $ticket);
        return;
    }
    $payload = avereo_gate_decode_signed($ticket, (string) $config['connect_launch_secret']);
    avereo_gate_assert_payload($payload, max(30, min(300, (int) $config['connect_launch_max_seconds'])));
    passeport_identity($payload);
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
