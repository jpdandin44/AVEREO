<?php
declare(strict_types=1);

const AVEREO_GATE_APP = 'passeport-immo';
require __DIR__ . '/connect/session.php';
$config = avereo_gate_config();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
header('Cache-Control: private, no-store');
if (!in_array($method, ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET, HEAD');
    exit;
}
$path = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
$commonMenu = $path === '/account-menu.js';
$asset = $commonMenu || str_starts_with($path, '/assets/');
$valid = avereo_gate_cookie_is_valid($config);
if ($valid && (!empty($config['storage_enabled']) || !empty($config['connect_trial_access_file']))) {
    try { passeport_session($config); } catch (Throwable) { $valid = false; }
}
if (!$valid) {
    if ($asset) {
        http_response_code(403);
        exit;
    }
    avereo_gate_redirect_to_connect($config);
}
if ($asset) {
    // Serve built browser assets and the exact shared-menu path through the same gate.
    $types = ['css' => 'text/css', 'js' => 'text/javascript', 'mjs' => 'text/javascript'];
    $base = realpath(__DIR__ . ($commonMenu ? '' : '/assets'));
    $file = realpath(__DIR__ . $path);
    if ((!$commonMenu && !preg_match('#^/assets/(?:[A-Za-z0-9_-]+/)*[A-Za-z0-9_-][A-Za-z0-9_.-]*\.(css|js|mjs)$#D', $path, $match))
        || $base === false || $file === false || !is_file($file)
        || !str_starts_with($file, $base . DIRECTORY_SEPARATOR)) {
        http_response_code(404);
        exit;
    }
    header('Content-Type: ' . $types[$commonMenu ? 'js' : $match[1]] . '; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . filesize($file));
    if ($method !== 'HEAD') {
        readfile($file);
    }
    exit;
}
$index = __DIR__ . '/index.html';
if (!is_file($index) || ($html = file_get_contents($index)) === false) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Artefact Passeport Immo incomplet.';
    exit;
}
header('Content-Type: text/html; charset=utf-8');
if ($method === 'HEAD') {
    exit;
}
if (!empty($config['storage_enabled'])) {
    $html = str_replace('</head>', '<meta name="passeport-storage" content="server"></head>', $html);
}
$portalMeta = '<meta name="avereo-connect-portal" content="' . htmlspecialchars(rtrim((string) ($config['connect_portal_url'] ?? ''), '/'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '">';
echo str_replace('</head>', $portalMeta . '</head>', $html);
