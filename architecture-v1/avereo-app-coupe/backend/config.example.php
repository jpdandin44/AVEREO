<?php
return [
    'db_host' => 'localhost',
    'db_port' => '3306',
    'db_name' => 'CPANELUSER_coupe',
    'db_user' => 'CPANELUSER_coupe_user',
    'db_password' => 'CHANGE_ME',

    // Mode V1 technique. Remplacer par "drupal_oauth" quand Simple OAuth est actif sur avereo.fr.
    'auth_mode' => 'api_token',
    'api_token' => 'CHANGE_ME_LONG_RANDOM_TOKEN',

    // Configuration cible Drupal OAuth / OpenID Connect.
    'drupal_issuer' => 'https://avereo.fr',
    'drupal_authorize_url' => 'https://avereo.fr/oauth/authorize',
    'drupal_token_url' => 'https://avereo.fr/oauth/token',
    'drupal_userinfo_url' => 'https://avereo.fr/oauth/userinfo',
    'drupal_client_id' => 'avereo_coupe',
    'drupal_client_secret' => '',
    'drupal_scope' => 'openid profile email',
    'drupal_redirect_uri' => 'https://coupe.avereo.fr/auth/callback/',
    'drupal_required_roles' => ['coupe_user', 'coupe_admin'],
    'drupal_admin_roles' => ['administrator', 'admin', 'coupe_admin'],

    'max_payload_bytes' => 50 * 1024 * 1024,
];
