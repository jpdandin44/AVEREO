<?php

declare(strict_types=1);

require __DIR__ . '/gate.php';

$config = avereo_gate_config();
if (!avereo_gate_cookie_is_valid($config)) {
    avereo_gate_redirect_to_connect($config);
}

$legacy = dirname(__DIR__) . '/legacy-app.html';
if (!is_file($legacy)) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Artefact Coupe incomplet.';
    exit;
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
readfile($legacy);
