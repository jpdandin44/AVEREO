<?php
declare(strict_types=1);
require_once __DIR__ . '/gate.php';
$config = rga_config();
if (!avereo_gate_cookie_is_valid($config)) {
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    header('Referrer-Policy: no-referrer');
    try { $launch = avereo_gate_portal($config) . '/?app=rga'; }
    catch (Throwable $exception) { http_response_code(503); echo 'L’accès RGA doit être configuré dans CONNECT.'; exit; }
    http_response_code(403);
    $href = htmlspecialchars($launch, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    echo '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<title>Accès RGA</title><body style="font:16px/1.5 system-ui;padding:24px"><h1>Accès RGA</h1>'
        . '<p>Ouvrez RGA depuis CONNECT pour vérifier votre autorisation propre à cette application.</p>'
        . '<p><a id="rga-launch" href="' . $href . '" target="_blank" rel="noopener noreferrer">Ouvrir RGA dans CONNECT</a></p>'
        . '<p>Après ouverture, revenez dans Rapport. Votre dossier reste conservé.</p>'
        . '<script>if(window.top===window){try{if(location.hash.length<=2000)sessionStorage.setItem("avereo.rga.pending",location.hash)}catch{}'
        . 'location.replace(document.getElementById("rga-launch").href)}</script></body></html>';
    exit;
}
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex, nofollow');
