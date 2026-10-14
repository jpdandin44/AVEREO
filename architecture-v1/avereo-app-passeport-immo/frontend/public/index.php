<?php
declare(strict_types=1);

const AVEREO_GATE_APP = 'passeport-immo';
require __DIR__ . '/connect/gate.php';
$config = avereo_gate_config();
if (!avereo_gate_cookie_is_valid($config)) {
    avereo_gate_redirect_to_connect($config);
}
$index = __DIR__ . '/index.html';
if (!is_file($index) || ($html = file_get_contents($index)) === false) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Artefact Passeport Immo incomplet.';
    exit;
}
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
// The browser prototype is unchanged; the hosted entry is protected by CONNECT.
$logout = '<a href="/connect/logout.php" style="position:fixed;right:16px;bottom:16px;z-index:2147483647;'
    . 'padding:10px 14px;border-radius:9px;background:#142033;color:#fff;text-decoration:none;'
    . 'font:600 14px system-ui,sans-serif">Quitter Passeport Immo</a>';
echo str_replace('</body>', $logout . '</body>', $html);
