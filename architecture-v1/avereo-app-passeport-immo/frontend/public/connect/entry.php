<?php
declare(strict_types=1);

const AVEREO_GATE_APP = 'passeport-immo';
require __DIR__ . '/gate.php';
$config = avereo_gate_config();
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');
try {
    avereo_gate_exchange_ticket($config, (string) ($_GET['ticket'] ?? ''));
} catch (Throwable) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'L autorisation AVEREO CONNECT est invalide ou expiree.';
    exit;
}
header('Location: /', true, 303);
exit;
