<?php

declare(strict_types=1);

require __DIR__ . '/../api/bootstrap.php';
$config = vision_bootstrap();
vision_require_method(['GET']);
require_once __DIR__ . '/../api/lib/connect_gate.php';
setcookie(vision_gate_cookie_name($config), '', vision_gate_cookie_options($config, time() - 3600));
$destination = vision_logout_destination($config);
if ($destination === '') {
    vision_error(503, 'misconfigured', 'Le portail AVEREO CONNECT n’est pas configuré.');
}
header('Location: ' . $destination, true, 303);
exit;
