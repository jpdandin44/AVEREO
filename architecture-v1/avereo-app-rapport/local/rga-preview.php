<?php
declare(strict_types=1);
// UI preview only. Never include this router in an artefact or an hosted web root.
if (PHP_SAPI !== 'cli-server' || ($_SERVER['REMOTE_ADDR'] ?? '') !== '127.0.0.1') {
    http_response_code(403);
    exit;
}
$root = dirname(__DIR__) . '/frontend/dist';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (str_starts_with((string) $path, '/api/') || str_starts_with((string) $path, '/connect/')) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo '{"error":"Prévisualisation locale sans compte ni sauvegarde serveur."}';
    exit;
}
if ($path === '/') {
    header('Content-Type: text/html; charset=utf-8');
    readfile($root . '/index.html');
    exit;
}
$maps = ['/rga/' => 'index.php', '/rga/carte.php' => 'carte.php', '/rga/france.php' => 'france.php', '/rga/haute-garonne.php' => 'haute-garonne.php'];
if (isset($maps[$path])) {
    header('Content-Type: text/html; charset=utf-8');
    $html = (string) file_get_contents($root . '/rga/' . $maps[$path]);
    echo preg_replace('/^<\?php require __DIR__ \. \'\/guard.php\'; \?>\s*/', '', $html, 1);
    exit;
}
if (str_ends_with((string) $path, '.php')) {
    http_response_code(403);
    exit;
}
return false;
