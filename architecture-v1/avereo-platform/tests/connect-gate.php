<?php

declare(strict_types=1);

const AVEREO_GATE_APP = 'projet';
require dirname(__DIR__) . '/shared/connect-gate.php';

function shared_gate_assert(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function shared_gate_ticket(string $app, string $secret, string $nonce, bool $remembered): string
{
    $issuedAt = time();
    $payload = avereo_gate_base64url_encode(json_encode([
        'v' => 1,
        'app' => $app,
        'iat' => $issuedAt,
        'exp' => $issuedAt + 90,
        'nonce' => $nonce,
        'remembered' => $remembered,
    ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    return $payload . '.' . avereo_gate_base64url_encode(
        hash_hmac('sha256', $payload, $secret, true),
    );
}

$directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'avereo-shared-gate-' . bin2hex(random_bytes(8));
$secret = str_repeat('shared-gate-secret-', 2);
$config = [
    'environment' => 'local',
    'connect_launch_secret' => $secret,
    'connect_launch_nonce_directory' => $directory,
    'connect_launch_max_seconds' => 300,
    'connect_gate_cookie' => 'AVEREO_SHARED_GATE_TEST',
    'connect_gate_session_seconds' => 3600,
];

$nonce = avereo_gate_base64url_encode(random_bytes(24));
$ticket = shared_gate_ticket('projet', $secret, $nonce, true);
$payload = avereo_gate_decode_signed($ticket, $secret);
avereo_gate_assert_payload($payload, 300);
shared_gate_assert(($payload['remembered'] ?? null) === true, 'La persistance doit etre signee.');
avereo_gate_exchange_ticket($config, $ticket);
shared_gate_assert(is_dir($directory), 'Le stockage anti-rejeu doit etre cree.');

try {
    avereo_gate_exchange_ticket($config, $ticket);
    throw new RuntimeException('Le rejeu du ticket aurait du etre refuse.');
} catch (RuntimeException $exception) {
    shared_gate_assert($exception->getMessage() === 'Ticket deja utilise.', 'Le rejeu doit etre detecte.');
}

$wrongApp = shared_gate_ticket(
    'thermo',
    $secret,
    avereo_gate_base64url_encode(random_bytes(24)),
    false,
);
try {
    avereo_gate_assert_payload(avereo_gate_decode_signed($wrongApp, $secret), 300);
    throw new RuntimeException('Un ticket Thermo ne doit pas ouvrir Projet.');
} catch (RuntimeException $exception) {
    shared_gate_assert(
        $exception->getMessage() === 'Ticket expire ou non conforme.',
        'Le ticket doit rester lie a son application.',
    );
}

foreach (glob($directory . DIRECTORY_SEPARATOR . '*.used') ?: [] as $file) {
    unlink($file);
}
rmdir($directory);

fwrite(STDOUT, "PASS shared CONNECT gate\n");

