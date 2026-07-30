<?php

declare(strict_types=1);

const AVEREO_GATE_APP = 'drone';
require __DIR__ . '/gate.php';

$config = avereo_gate_config();
try {
    avereo_gate_exchange_ticket($config, (string) ($_GET['ticket'] ?? ''));
} catch (Throwable $exception) {
    error_log('Drone CONNECT gate rejected: ' . $exception->getMessage());
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo 'L autorisation AVEREO CONNECT est invalide ou expiree.';
    exit;
}
header('Cache-Control: no-store');
header('Location: /', true, 303);
exit;

