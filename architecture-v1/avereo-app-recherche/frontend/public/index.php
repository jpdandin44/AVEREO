<?php

declare(strict_types=1);

const AVEREO_GATE_APP = 'recherche';
require __DIR__ . '/connect/gate.php';

$config = avereo_gate_config();
if (!avereo_gate_cookie_is_valid($config)) {
    avereo_gate_redirect_to_connect($config);
}
$index = __DIR__ . '/index.html';
if (!is_file($index)) {
    http_response_code(500);
    echo 'Artefact Recherche incomplet.';
    exit;
}
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
$html = file_get_contents($index);
if ($html === false) {
    http_response_code(500);
    exit;
}
$portalMeta = '<meta name="avereo-connect-portal" content="' . htmlspecialchars(rtrim((string) ($config['connect_portal_url'] ?? ''), '/'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '">';
echo str_replace('</head>', $portalMeta . '</head>', $html);
