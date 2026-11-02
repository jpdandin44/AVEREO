<?php
declare(strict_types=1);
require __DIR__ . '/gate.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
$config = rga_config();
echo json_encode(['authorized' => avereo_gate_cookie_is_valid($config)]);
