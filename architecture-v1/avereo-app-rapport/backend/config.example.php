<?php
return [
    'app_slug' => 'rapport',
    'environment' => 'production',

    'db_host' => 'localhost',
    'db_port' => '3306',
    'db_name' => 'CPANELUSER_rapport',
    'db_user' => 'CPANELUSER_rapport_user',
    'db_password' => 'CHANGE_ME',

    // CONNECT est l unique point d authentification en environnement heberge.
    'auth_mode' => 'connect_gateway',

    // Secours temporaire strictement local; ne pas activer en production.
    'api_token' => 'CHANGE_ME_LOCAL_ONLY',

    // Configuration cible Drupal OAuth / OpenID Connect.
    'drupal_issuer' => 'https://avereo.fr',
    'drupal_authorize_url' => 'https://avereo.fr/oauth/authorize',
    'drupal_token_url' => 'https://avereo.fr/oauth/token',
    'drupal_userinfo_url' => 'https://avereo.fr/oauth/userinfo',
    'drupal_allowed_hosts' => ['avereo.fr'],
    'drupal_client_id' => 'avereo_rapport',
    'drupal_client_secret' => 'CHANGE_ME_WITH_AT_LEAST_32_RANDOM_CHARACTERS',
    'drupal_scope' => 'openid profile email',
    'drupal_redirect_uri' => 'https://rapport.avereo.fr/auth/callback/',
    'drupal_required_roles' => ['utilisateur_rapport', 'administrateur_rapport'],
    'drupal_admin_roles' => ['administrateur_rapport'],

    // Credential serveur distinct partage uniquement avec AVEREO CONNECT.
    'connect_portal_url' => 'https://connect.avereo.fr/',
    'connect_launch_secret' => 'CHANGE_ME_WITH_AT_LEAST_32_RANDOM_CHARACTERS',
    'connect_launch_nonce_directory' => '/home/CPANELUSER/private/rapport/launch-nonces',
    'connect_launch_max_seconds' => 300,
    'connect_gate_cookie' => 'AVEREO_RAPPORT_GATE',
    'connect_gate_session_seconds' => 1800,
    // IDs CONNECT autorises a administrer tous les rapports. Vide = aucun admin.
    'connect_admin_user_ids' => [],

    'max_payload_bytes' => 50 * 1024 * 1024,
];
