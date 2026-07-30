<?php

declare(strict_types=1);

return [
    'environment' => 'preprod',
    'connect_portal_url' => 'https://connect-preprod.avereo.fr/',
    'connect_launch_secret' => 'CHANGE_ME_WITH_AT_LEAST_32_RANDOM_CHARACTERS',
    'connect_launch_nonce_directory' => '/home/CPANEL_USERNAME/.avereo-nonces/APPLICATION-preprod',
    'connect_launch_max_seconds' => 300,
    'connect_gate_cookie' => 'AVEREO_APPLICATION_PREPROD_GATE',
    'connect_gate_session_seconds' => 1800,
];

