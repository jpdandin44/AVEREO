<?php

declare(strict_types=1);

// Même normalisation que local/router.php : parse_url() interpréterait « //api/… » comme un hôte.
$uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
$path = strtolower((string) preg_replace('#/+#', '/', rawurldecode(explode('?', $uri, 2)[0])));
if (preg_match('#^/api/(lib/|bootstrap\.php$)#', $path) === 1) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Accès refusé.';
    return true;
}
if ($path === '/revue' || str_starts_with($path, '/revue/')) {
    require __DIR__ . '/index.php';
    return true;
}
return false;
