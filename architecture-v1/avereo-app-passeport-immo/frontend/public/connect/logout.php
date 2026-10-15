<?php
declare(strict_types=1);

const AVEREO_GATE_APP = 'passeport-immo';
require __DIR__ . '/gate.php';
$config = avereo_gate_config();
avereo_gate_clear_cookie($config);
header('Cache-Control: no-store');
try {
    $portal = avereo_gate_portal($config);
} catch (Throwable) {
    http_response_code(503);
    exit;
}
header('Location: ' . $portal . '/?logout=1', true, 303);
exit;
