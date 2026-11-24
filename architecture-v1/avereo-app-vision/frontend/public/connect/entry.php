<?php

declare(strict_types=1);

// Point d'entrée depuis AVEREO CONNECT : échange le ticket signé (paramètre « ticket ») contre le cookie de passerelle,
// puis redirige vers l'application. Aucun détail n'est donné en cas de refus (ticket invalide, expiré ou déjà utilisé).
require_once __DIR__ . '/../api/lib/config.php';
require_once __DIR__ . '/../api/lib/connect_gate.php';

function vision_entry_refuse(int $status, string $message): never
{
    http_response_code($status);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    header('Referrer-Policy: no-referrer');
    echo $message;
    exit;
}

try {
    $config = vision_config();
} catch (VisionConfigException $exception) {
    error_log('Vision CONNECT : configuration invalide : ' . $exception->getMessage());
    vision_entry_refuse(503, "L'application n'est pas configurée correctement.");
}
if ($config['auth_mode'] !== 'connect') {
    vision_entry_refuse(404, 'Introuvable.');
}

try {
    $now = time();
    $identity = vision_gate_exchange_ticket($config, (string) ($_GET['ticket'] ?? ''), $now);
    $lifetime = max(300, min(43200, (int) $config['connect_gate_session_seconds']));
    $value = vision_gate_build_cookie_value($identity, (bool) $identity['remembered'], (string) $config['connect_launch_secret'], $now, $lifetime);
    setcookie((string) $config['connect_gate_cookie'], $value, vision_gate_cookie_options($config, $now + $lifetime));
} catch (Throwable $exception) {
    error_log('Vision CONNECT : ticket refusé : ' . $exception->getMessage());
    vision_entry_refuse(403, "L'autorisation AVEREO CONNECT est invalide ou expirée.");
}

header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');
header('Location: ./../', true, 303);
exit;
