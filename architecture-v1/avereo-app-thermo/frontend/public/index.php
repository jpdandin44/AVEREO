<?php

declare(strict_types=1);

const AVEREO_GATE_APP = 'thermo';
require __DIR__ . '/connect/gate.php';

$config = avereo_gate_config();
if (!avereo_gate_cookie_is_valid($config)) {
    avereo_gate_redirect_to_connect($config);
}
$index = __DIR__ . '/index.html';
if (!is_file($index)) {
    http_response_code(500);
    echo 'Artefact Thermo incomplet.';
    exit;
}
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
$html = file_get_contents($index);
if ($html === false) {
    http_response_code(500);
    exit;
}
$logout = '<a href="/connect/logout.php" style="position:fixed;right:16px;bottom:16px;z-index:2147483647;'
    . 'padding:10px 14px;border-radius:9px;background:#142033;color:#fff;text-decoration:none;'
    . 'font:600 14px system-ui,sans-serif">Se déconnecter</a>';
echo str_replace('</body>', $logout . '</body>', $html);
