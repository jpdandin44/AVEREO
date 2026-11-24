<?php

declare(strict_types=1);

// Routeur du serveur PHP intégré (développement local seulement). Reproduit les interdictions de .htaccess :
// les bibliothèques de l'API et bootstrap.php ne sont jamais servis directement.
// Chemin brut (avant « ? »), décodé, minuscules, barres fusionnées : parse_url() prend « //api/… » pour un hôte, d'où ce découpage à la main.
$uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
$path = strtolower((string) preg_replace('#/+#', '/', rawurldecode(explode('?', $uri, 2)[0])));
if (preg_match('#^/api/(lib/|bootstrap\.php$)#', $path) === 1) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Accès refusé.';
    return true;
}
return false;
