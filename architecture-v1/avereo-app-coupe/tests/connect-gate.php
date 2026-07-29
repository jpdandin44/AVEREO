<?php

declare(strict_types=1);

require dirname(__DIR__) . '/frontend/public/connect/gate.php';

function gate_test_assert(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function gate_test_ticket(string $app, string $secret, string $nonce): string
{
    $issuedAt = time();
    $payload = avereo_gate_base64url_encode(json_encode([
        'v' => 1,
        'app' => $app,
        'iat' => $issuedAt,
        'exp' => $issuedAt + 90,
        'nonce' => $nonce,
    ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    return $payload . '.' . avereo_gate_base64url_encode(hash_hmac('sha256', $payload, $secret, true));
}

$directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'avereo-coupe-gate-' . bin2hex(random_bytes(8));
$secret = str_repeat('coupe-gate-secret-', 2);
$config = [
    'environment' => 'local',
    'connect_launch_secret' => $secret,
    'connect_launch_nonce_directory' => $directory,
    'connect_launch_max_seconds' => 300,
    'connect_gate_cookie' => 'AVEREO_COUPE_GATE_TEST',
    'connect_gate_session_seconds' => 3600,
];

$nonce = avereo_gate_base64url_encode(random_bytes(24));
$ticket = gate_test_ticket('coupe', $secret, $nonce);
avereo_gate_exchange_ticket($config, $ticket);
gate_test_assert(is_dir($directory), 'Le stockage anti-rejeu doit etre cree.');

try {
    avereo_gate_exchange_ticket($config, $ticket);
    throw new RuntimeException('Le rejeu du ticket aurait du etre refuse.');
} catch (RuntimeException $exception) {
    gate_test_assert($exception->getMessage() === 'Ticket deja utilise.', 'Le rejeu doit etre detecte.');
}

try {
    avereo_gate_decode_signed($ticket . 'x', $secret);
    throw new RuntimeException('La signature modifiee aurait du etre refusee.');
} catch (RuntimeException $exception) {
    gate_test_assert(
        $exception->getMessage() === 'Signature de ticket invalide.',
        'La signature doit etre controlee.',
    );
}

$wrongAppTicket = gate_test_ticket('rapport', $secret, avereo_gate_base64url_encode(random_bytes(24)));
try {
    $payload = avereo_gate_decode_signed($wrongAppTicket, $secret);
    avereo_gate_assert_payload($payload, 300);
    throw new RuntimeException('Un ticket Rapport ne doit pas ouvrir Coupe.');
} catch (RuntimeException $exception) {
    gate_test_assert(
        $exception->getMessage() === 'Ticket expire ou non conforme.',
        'Le code application doit etre lie au ticket.',
    );
}

foreach (glob($directory . DIRECTORY_SEPARATOR . '*.used') ?: [] as $file) {
    unlink($file);
}
rmdir($directory);

fwrite(STDOUT, "PASS coupe CONNECT gate\n");
