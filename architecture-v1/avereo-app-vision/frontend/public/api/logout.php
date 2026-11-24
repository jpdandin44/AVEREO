<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

// POST /api/logout.php : efface le cookie de passerelle (mode « connect »). Sans effet en mode « token ».
// La session CONNECT elle-même n'est pas fermée : un compte désactivé dans CONNECT garde l'accès jusqu'à l'expiration du cookie.
$config = vision_bootstrap();
vision_require_method(['POST']);
if ($config['auth_mode'] === 'connect') {
    require_once __DIR__ . '/lib/connect_gate.php';
    setcookie(vision_gate_cookie_name($config), '', vision_gate_cookie_options($config, time() - 3600));
}
vision_json_response(200, ['ok' => true]);
