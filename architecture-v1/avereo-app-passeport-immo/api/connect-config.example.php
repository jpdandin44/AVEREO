<?php
declare(strict_types=1);

// Keep the completed file outside public/, for example in
// /home/CPANEL_USERNAME/.avereo/passeport-immo-preprod/config.php.
return [
    'environment' => 'preprod',
    'connect_portal_url' => 'https://connect-preprod.avereo.fr/',
    'connect_launch_secret' => '', // Same dedicated secret as CONNECT; never commit it.
    'connect_launch_nonce_directory' => '/home/CPANEL_USERNAME/.avereo-nonces/passeport-immo-preprod',
    'connect_launch_max_seconds' => 300,
    'connect_gate_cookie' => 'AVEREO_PASSEPORT_IMMO_PREPROD_GATE',
    'connect_gate_session_seconds' => 1800,
    'storage_enabled' => false, // Activate only after schema, private directory and recovery checks.
    'storage_dsn' => 'mysql:host=localhost;dbname=CPANEL_USERNAME_pimpreprod;charset=utf8mb4',
    'storage_user' => '',
    'storage_password' => '', // Dedicated database user, never a CONNECT database credential.
    'storage_directory' => '/home/CPANEL_USERNAME/.avereo/passeport-immo-preprod/documents',
    'storage_origin' => 'https://passeport-immo-preprod.avereo.fr',
    'storage_profiles' => [], // Map signed avereo_connect:<id> to app display profile only.
];
