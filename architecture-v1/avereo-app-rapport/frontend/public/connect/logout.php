<?php

declare(strict_types=1);

require __DIR__ . '/gate.php';

$config = avereo_gate_config();
avereo_gate_clear_cookie($config);
$portal = rtrim((string) ($config['connect_portal_url'] ?? ''), '/');
if (!avereo_gate_portal_url_is_allowed($config, $portal)) {
    http_response_code(503);
    echo 'Le portail AVEREO CONNECT n est pas configure.';
    exit;
}
header('Cache-Control: no-store');
header('Location: ' . $portal . '/?logout=1', true, 303);
exit;
