<?php

declare(strict_types=1);

// Routeur du serveur PHP intégré (développement local seulement). Reproduit les interdictions de .htaccess :
// les bibliothèques de l'API et bootstrap.php ne sont jamais servis directement.
$path = (string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
if (preg_match('#^/api/(lib/|bootstrap\.php$)#', $path) === 1) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Accès refusé.';
    return true;
}
return false;
