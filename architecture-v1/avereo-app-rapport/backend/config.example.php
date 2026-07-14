<?php
return [
    'app_slug' => 'rapport',
    'environment' => 'production',

    'db_host' => 'localhost',
    'db_port' => '3306',
    'db_name' => 'CPANELUSER_rapport',
    'db_user' => 'CPANELUSER_rapport_user',
    'db_password' => 'CHANGE_ME',

    'auth_mode' => 'drupal_oauth',

    // Secours temporaire strictement local; ne pas activer en production.
    'api_token' => 'CHANGE_ME_LOCAL_ONLY',

    // Configuration cible Drupal OAuth / OpenID Connect.
    'drupal_issuer' => 'https://avereo.fr',
    'drupal_authorize_url' => 'https://avereo.fr/oauth/authorize',
    'drupal_token_url' => 'https://avereo.fr/oauth/token',
    'drupal_userinfo_url' => 'https://avereo.fr/oauth/userinfo',
    'drupal_allowed_hosts' => ['avereo.fr'],
    'drupal_client_id' => 'avereo_rapport',
    'drupal_client_secret' => '',
    'drupal_scope' => 'openid profile email',
    'drupal_redirect_uri' => 'https://rapport.avereo.fr/auth/callback/',
    'drupal_required_roles' => ['utilisateur_rapport', 'administrateur_rapport'],
    'drupal_admin_roles' => ['administrateur_rapport'],

    'max_payload_bytes' => 50 * 1024 * 1024,
];
