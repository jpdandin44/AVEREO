<?php
return [
    'environment' => 'local',
    'auth_mode' => 'connect_gateway',
    'connect_portal_url' => 'http://127.0.0.1:8080/',
    'connect_launch_secret' => 'CHANGE_ME_CONNECT_GATEWAY_SECRET',
    'connect_launch_nonce_directory' => '/tmp/avereo-coupe-launch-nonces',
    'connect_launch_max_seconds' => 300,
    'connect_gate_cookie' => 'AVEREO_COUPE_GATE_LOCAL',
    'connect_gate_session_seconds' => 1800,
    'connect_admin_user_ids' => [],
    // This local phase uses file export/import, without a Coupe database.
];
