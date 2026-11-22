<?php
declare(strict_types=1);
const AVEREO_GATE_APP = 'uni';
require dirname(__DIR__) . '/private/gate.php';
$config = avereo_gate_config();
if (!avereo_gate_cookie_is_valid($config)) {
    avereo_gate_redirect_to_connect($config);
}
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
readfile(dirname(__DIR__) . '/private/app.html');
