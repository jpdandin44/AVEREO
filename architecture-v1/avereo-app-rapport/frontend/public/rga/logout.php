<?php
declare(strict_types=1);
require __DIR__ . '/gate.php';
$config = rga_config();
avereo_gate_clear_cookie($config);
header('Cache-Control: no-store');
header('Location: ' . avereo_gate_portal($config) . '/?logout=1', true, 303);
exit;
