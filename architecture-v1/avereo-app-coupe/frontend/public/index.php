<?php

declare(strict_types=1);

require __DIR__ . '/connect/gate.php';

$config = avereo_gate_config();
if (!avereo_gate_cookie_is_valid($config)) {
    avereo_gate_redirect_to_connect($config);
}

$index = __DIR__ . '/index.html';
if (!is_file($index)) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Artefact Coupe incomplet.';
    exit;
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
readfile($index);
