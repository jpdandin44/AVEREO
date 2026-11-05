<?php
declare(strict_types=1);

const AVEREO_GATE_APP = 'projet';
require dirname(__DIR__) . '/connect/gate.php';
require __DIR__ . '/planning-store.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

try {
    $gate = avereo_gate_config();
    if (!avereo_gate_cookie_is_valid($gate)) throw new PlanningFailure(401, 'Reconnecte-toi à AVEREO CONNECT, puis ouvre Projet.');
    $cookie = (string) ($_COOKIE[$gate['connect_gate_cookie']] ?? '');
    $identity = avereo_gate_decode_signed($cookie, $gate['connect_launch_secret'])['identity'] ?? null;
    $home = avereo_gate_home_from_path(dirname(__DIR__));
    $settingsFile = getenv('AVEREO_PLANNING_CONFIG') ?: $home . '/.avereo/projet-preprod/planning.php';
    if (!is_file($settingsFile)) throw new PlanningFailure(503, 'Enregistrement en ligne non configuré.');
    $settings = require $settingsFile;
    if (!is_array($settings) || !is_string($settings['owner_connect_id'] ?? null) || !preg_match('/^[1-9][0-9]{0,18}$/D', $settings['owner_connect_id'])) throw new PlanningFailure(503, 'Espace privé non configuré.');
    $originHost = parse_url((string) ($settings['origin'] ?? ''), PHP_URL_HOST);
    $originPort = parse_url((string) ($settings['origin'] ?? ''), PHP_URL_PORT);
    $expectedHost = $originHost . ($originPort === null ? '' : ':' . $originPort);
    if (!$originHost || strtolower((string) ($_SERVER['HTTP_HOST'] ?? '')) !== strtolower($expectedHost)) throw new PlanningFailure(503, 'Cible de stockage non autorisée.');
    if (!is_array($identity) || ($identity['provider'] ?? null) !== 'avereo_connect' || ($identity['id'] ?? null) !== $settings['owner_connect_id']) throw new PlanningFailure(403, 'Ce planning est réservé à son propriétaire.');
    $directory = planning_directory($settings, (string) ($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__)));
    $method = $_SERVER['REQUEST_METHOD'];
    $csrf = hash_hmac('sha256', 'projet-planning:' . $cookie, $gate['connect_launch_secret']);
    $scope = hash_hmac('sha256', 'projet-owner:' . $settings['owner_connect_id'], $gate['connect_launch_secret']);
    if ($method === 'GET') {
        $record = planning_read($directory, ($_GET['version'] ?? '') === 'previous' ? 'previous.json' : 'current.json');
    } elseif ($method === 'PUT') {
        if (empty($settings['origin']) || ($_SERVER['HTTP_ORIGIN'] ?? '') !== $settings['origin']
            || !hash_equals($csrf, (string) ($_SERVER['HTTP_X_PROJET_CSRF'] ?? ''))
            || strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') throw new PlanningFailure(403, 'Requête refusée ; reconnecte-toi avant de réessayer.');
        $raw = file_get_contents('php://input', false, null, 0, 5 * 1024 * 1024 + 1);
        if ($raw === false || strlen($raw) > 5 * 1024 * 1024) throw new PlanningFailure(413, 'Planning trop volumineux (maximum 5 Mo).');
        try { $body = json_decode($raw, true, 64, JSON_THROW_ON_ERROR); }
        catch (Throwable) { throw new PlanningFailure(422, 'JSON invalide.'); }
        if (!is_array($body) || !is_int($body['revision'] ?? null) || $body['revision'] < 0) throw new PlanningFailure(422, 'Révision requise.');
        $record = planning_save($directory, planning_validate($body['project'] ?? null), $body['revision']);
    } else {
        header('Allow: GET, PUT');
        throw new PlanningFailure(405, 'Méthode non autorisée.');
    }
    echo json_encode($record + ['csrf' => $csrf, 'scope' => $scope], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
} catch (PlanningFailure $error) {
    http_response_code($error->status);
    echo json_encode(['error' => $error->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable) {
    http_response_code(503);
    echo json_encode(['error' => 'Service indisponible ; le planning reste conservé dans ce navigateur.']);
}
