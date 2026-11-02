<?php
declare(strict_types=1);
require __DIR__ . '/gate.php';
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');
try {
    avereo_gate_exchange_ticket(rga_config(), (string) ($_GET['ticket'] ?? ''));
} catch (Throwable $exception) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'L’autorisation RGA est invalide ou expirée. Relancez RGA depuis CONNECT.';
    exit;
}
header('Location: /rga/resume.php', true, 303);
