<?php

declare(strict_types=1);

$publicDirectory = realpath(dirname(__DIR__) . '/public');
if ($publicDirectory === false) {
    http_response_code(500);
    echo 'Local public directory is unavailable.';
    return true;
}

$requestUri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
$requestPath = rawurldecode((string) (parse_url($requestUri, PHP_URL_PATH) ?: '/'));

if (str_contains($requestPath, "\0")) {
    http_response_code(400);
    echo 'Invalid local request path.';
    return true;
}

header('Cache-Control: no-store');
header('Content-Security-Policy: default-src \'self\'; style-src \'self\' \'unsafe-inline\'; script-src \'self\' \'unsafe-inline\'; connect-src \'self\'; form-action \'self\'; frame-ancestors \'none\'; base-uri \'none\'');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');

if ($requestPath === '/' || $requestPath === '/index.html') {
    header('Content-Type: text/html; charset=utf-8');
    readfile($publicDirectory . '/index.html');
    return true;
}

$candidate = realpath($publicDirectory . DIRECTORY_SEPARATOR . ltrim($requestPath, '/'));
$allowedStaticExtensions = ['css', 'gif', 'html', 'ico', 'jpeg', 'jpg', 'js', 'png', 'svg', 'webp', 'woff', 'woff2'];

if (
    $candidate !== false
    && str_starts_with($candidate, $publicDirectory . DIRECTORY_SEPARATOR)
    && is_file($candidate)
    && in_array(strtolower((string) pathinfo($candidate, PATHINFO_EXTENSION)), $allowedStaticExtensions, true)
) {
    return false;
}

require $publicDirectory . '/index.php';
return true;
