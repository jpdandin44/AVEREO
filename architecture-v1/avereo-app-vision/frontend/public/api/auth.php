<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

// GET /api/auth.php : identité courante, rôle et droits. 401 sans session valide.
$config = vision_bootstrap();
vision_require_method(['GET']);
$identity = vision_require_identity($config);
$role = vision_role_for_identity($identity, $config);

vision_json_response(200, [
    'ok' => true,
    'connect_portal' => vision_connect_portal($config),
    'identity' => ['provider' => $identity['provider'], 'id' => $identity['id']],
    'role' => $role,
    'droits' => vision_droits()[$role] ?? [],
    'auth_mode' => $config['auth_mode'],
]);
