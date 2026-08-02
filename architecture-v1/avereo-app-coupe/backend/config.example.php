<?php
return [
    'db_host' => 'localhost',
    'db_port' => '3306',
    'db_name' => 'CPANELUSER_coupe',
    'db_user' => 'CPANELUSER_coupe_user',
    'db_password' => 'CHANGE_ME',

    'environment' => 'production',
    // CONNECT est l unique point d authentification en environnement heberge.
    'auth_mode' => 'connect_gateway',

    // Secours temporaire strictement local; ne pas activer en production.
    'api_token' => 'CHANGE_ME_LOCAL_ONLY',

    // Configuration cible Drupal OAuth / OpenID Connect.
    'drupal_issuer' => 'https://avereo.fr',
    'drupal_authorize_url' => 'https://avereo.fr/oauth/authorize',
    'drupal_token_url' => 'https://avereo.fr/oauth/token',
    'drupal_userinfo_url' => 'https://avereo.fr/oauth/userinfo',
    'drupal_client_id' => 'avereo_coupe',
    'drupal_client_secret' => 'CHANGE_ME_WITH_AT_LEAST_32_RANDOM_CHARACTERS',
    'drupal_scope' => 'openid profile email',
    'drupal_redirect_uri' => 'https://coupe.avereo.fr/auth/callback/',
    'drupal_required_roles' => ['coupe_user', 'coupe_admin'],
    'drupal_admin_roles' => ['administrator', 'admin', 'coupe_admin'],

    // Credential serveur distinct partage uniquement avec AVEREO CONNECT.
    'connect_portal_url' => 'https://connect.avereo.fr/',
    'connect_launch_secret' => 'CHANGE_ME_WITH_AT_LEAST_32_RANDOM_CHARACTERS',
    'connect_launch_nonce_directory' => '/home/CPANELUSER/private/coupe/launch-nonces',
    'connect_launch_max_seconds' => 300,
    'connect_gate_cookie' => 'AVEREO_COUPE_GATE',
    'connect_gate_session_seconds' => 1800,
    // IDs CONNECT autorises a administrer tous les projets. Vide = aucun admin.
    'connect_admin_user_ids' => [],

    'max_payload_bytes' => 50 * 1024 * 1024,
];
