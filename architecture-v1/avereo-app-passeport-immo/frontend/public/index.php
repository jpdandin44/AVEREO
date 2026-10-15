<?php
declare(strict_types=1);

const AVEREO_GATE_APP = 'passeport-immo';
require __DIR__ . '/connect/gate.php';
$config = avereo_gate_config();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
header('Cache-Control: private, no-store');
if (!in_array($method, ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET, HEAD');
    exit;
}
$path = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
$asset = str_starts_with($path, '/assets/');
if (!avereo_gate_cookie_is_valid($config)) {
    if ($asset) {
        http_response_code(403);
        exit;
    }
    avereo_gate_redirect_to_connect($config);
}
if ($asset) {
    // Serve only built browser assets, never PHP, source maps or paths outside assets.
    $types = ['css' => 'text/css', 'js' => 'text/javascript', 'mjs' => 'text/javascript'];
    $base = realpath(__DIR__ . '/assets');
    $file = realpath(__DIR__ . $path);
    if (!preg_match('#^/assets/(?:[A-Za-z0-9_-]+/)*[A-Za-z0-9_-][A-Za-z0-9_.-]*\.(css|js|mjs)$#D', $path, $match)
        || $base === false || $file === false || !is_file($file)
        || !str_starts_with($file, $base . DIRECTORY_SEPARATOR)) {
        http_response_code(404);
        exit;
    }
    header('Content-Type: ' . $types[$match[1]] . '; charset=utf-8');
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
// The browser prototype is unchanged; the hosted entry is protected by CONNECT.
$logout = '<a href="/connect/logout.php" style="position:fixed;right:16px;bottom:16px;z-index:2147483647;'
    . 'padding:10px 14px;border-radius:9px;background:#142033;color:#fff;text-decoration:none;'
    . 'font:600 14px system-ui,sans-serif">Quitter Passeport Immo</a>';
echo str_replace('</body>', $logout . '</body>', $html);
