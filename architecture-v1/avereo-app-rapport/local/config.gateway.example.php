<?php
return [
    'environment' => 'local',
    'db_host' => 'rapport-db',
    'db_port' => '3306',
    'db_name' => 'CHANGE_ME_DB_NAME',
    'db_user' => 'CHANGE_ME_DB_USER',
    'db_password' => 'CHANGE_ME_DB_PASSWORD',

    'auth_mode' => 'connect_gateway',
    'connect_portal_url' => 'http://127.0.0.1:8080/',
    'connect_launch_secret' => 'CHANGE_ME_CONNECT_GATEWAY_SECRET',
    'connect_launch_nonce_directory' => '/tmp/avereo-rapport-launch-nonces',
    'connect_launch_max_seconds' => 300,
    'connect_gate_cookie' => 'AVEREO_RAPPORT_GATE_LOCAL',
    'connect_gate_session_seconds' => 1800,
    'connect_admin_user_ids' => [],

    'max_payload_bytes' => 50 * 1024 * 1024,
];
