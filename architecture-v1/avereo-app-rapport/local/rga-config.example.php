<?php
return [
    'environment' => 'preproduction',
    'connect_portal_url' => 'https://connect-preprod.avereo.fr',
    'connect_launch_secret' => '', // RGA-specific secret, server only, distinct from Rapport.
    'connect_launch_nonce_directory' => '/home/CPANEL_USERNAME/.avereo/rga-preprod/nonces',
    'connect_gate_session_seconds' => 1800,
];
