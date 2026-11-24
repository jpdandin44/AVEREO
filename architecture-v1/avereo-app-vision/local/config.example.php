<?php

// Modèle de configuration locale. `vision-local.ps1 up` écrit local/config.php (ignoré par git) avec des secrets aléatoires.
// Ce fichier vit HORS du dossier publié : l'API le lit via AVEREO_CONFIG_FILE ou $HOME/.avereo/vision/config.php.

return [
    // 'local' | 'preproduction' | 'production'
    'environment' => 'local',

    // 'token' (développement local uniquement, refusé ailleurs) | 'connect' (ticket CONNECT + cookie de passerelle)
    'auth_mode' => 'token',

    'db' => [
        'host' => 'db',
        'port' => 3306,
        'name' => 'vision',
        'user' => 'vision',
        'password' => '__VISION_DB_PASSWORD__',
    ],

    // Mode « token » : jeton statique (au moins 32 caractères). Les identités de test se choisissent avec l'en-tête X-Vision-Local-User.
    'api_token' => '__VISION_API_TOKEN__',

    // Identités « fondateur » (identifiants CONNECT ou identifiants de test locaux), chaînes.
    // Vide dans le modèle : vision-local.ps1 y met « 1 » pour le développement. Ne jamais copier cette valeur en production.
    'admin_user_ids' => [],

    // Mode « connect » : secret partagé avec CONNECT (au moins 32 caractères) et dossier des nonces à usage unique.
    'connect_launch_secret' => '__VISION_LAUNCH_SECRET__',
    'connect_launch_nonce_directory' => '/var/lib/avereo/vision/nonces',
    'connect_gate_cookie' => 'AVEREO_VISION_GATE',
    'connect_gate_session_seconds' => 1800,
];
