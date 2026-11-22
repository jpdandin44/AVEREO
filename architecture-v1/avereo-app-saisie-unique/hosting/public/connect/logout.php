<?php
declare(strict_types=1);
const AVEREO_GATE_APP = 'uni';
require dirname(__DIR__, 2) . '/private/gate.php';
$config = avereo_gate_config();
avereo_gate_clear_cookie($config);
header('Cache-Control: no-store');
header('Location: ' . avereo_gate_portal($config) . '/?logout=1', true, 303);
exit;
