<?php
return [
    'environment' => 'local',
    'db_host' => 'rapport-db',
    'db_port' => '3306',
    'db_name' => 'CHANGE_ME_DB_NAME',
    'db_user' => 'CHANGE_ME_DB_USER',
    'db_password' => 'CHANGE_ME_DB_PASSWORD',

    'auth_mode' => 'drupal_oauth',
    'drupal_issuer' => 'http://oauth-rapport.avereo.localhost:8102',
    'drupal_authorize_url' => 'http://oauth-rapport.avereo.localhost:8102/oauth/authorize',
    'drupal_token_url' => 'http://rapport-oauth-mock/oauth/token',
    'drupal_userinfo_url' => 'http://rapport-oauth-mock/oauth/userinfo',
    'drupal_client_id' => 'avereo_rapport_local',
    'drupal_client_secret' => '',
    'drupal_scope' => 'openid profile email',
    'drupal_redirect_uri' => 'http://rapport.avereo.localhost/auth/callback/',
    'drupal_required_roles' => ['utilisateur_rapport'],
    'drupal_admin_roles' => ['administrateur_rapport'],

    'max_payload_bytes' => 50 * 1024 * 1024,
];
