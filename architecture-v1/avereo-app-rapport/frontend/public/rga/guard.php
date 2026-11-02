<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/connect/gate.php';
$config = avereo_gate_config();
if (!avereo_gate_cookie_is_valid($config)) {
    $portal = trim((string) ($config['connect_portal_url'] ?? ''));
    if (avereo_gate_portal_url_is_allowed($config, $portal)) {
        header('Cache-Control: no-store');
        header('Location: ' . $portal . (str_contains($portal, '?') ? '&' : '?') . 'app=rga', true, 303);
        exit;
    }
    avereo_gate_redirect_to_connect($config);
}
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex, nofollow');
