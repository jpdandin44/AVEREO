<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/lib/sync.php';

// Synchronisation du contenu d'un projet (R03, R05, R06). Contrat : docs/synchronisation.md.
//   GET  /api/sync.php?project=<id>&since=N            réception des objets modifiés depuis le seq N
//   GET  /api/sync.php?project=<id>&journal=1[&after=] journal des écrasements
//   POST /api/sync.php?project=<id>  {device_id, since, changes[]}   envoi puis réception, en une transaction
// Un projet d'autrui est invisible (404). Un projet archivé reste lisible mais refuse l'envoi (409).
$config = vision_bootstrap();
$method = vision_require_method(['GET', 'POST']);
$identity = vision_require_identity($config);
$role = vision_role_for_identity($identity, $config);
$pdo = vision_pdo($config);

$projectId = $_GET['project'] ?? null;
if (!vision_project_id_is_valid($projectId)) {
    vision_error(404, 'not_found', 'Projet introuvable.');
}
$project = vision_project_find($pdo, $projectId);
if ($project === null || !vision_can_on_project($role, 'read', $identity, $project)) {
    vision_error(404, 'not_found', 'Projet introuvable.');
}
$internalId = (int) $project['id'];

/** Entier positif d'un paramètre de requête (400 sinon). */
$positiveParam = static function (string $key): int {
    $value = vision_query_param($key, '0');
    if (preg_match('/^[0-9]{1,15}$/', $value) !== 1) {
        vision_error(400, 'invalid_parameter', "Paramètre « $key » invalide.");
    }
    return (int) $value;
};

if ($method === 'GET') {
    if (vision_query_param('journal') === '1') {
        vision_json_response(200, ['ok' => true, 'entries' => vision_sync_journal($pdo, $internalId, $positiveParam('after'))]);
    }
    $since = $positiveParam('since');
    $result = vision_sync_exchange($pdo, $project, $identity, 'lecture', $since, []);
    unset($result['applied']);
    vision_json_response(200, ['ok' => true] + $result);
}

// POST : l'envoi exige le droit de modifier ce projet, et un projet actif.
if (!vision_can_on_project($role, 'update', $identity, $project)) {
    vision_error(403, 'forbidden', 'Action non autorisée.');
}
if ($project['status'] !== 'active') {
    vision_error(409, 'project_archived', 'Le projet est archivé : il n\'accepte plus de modification.');
}
$body = vision_read_json_body(VISION_SYNC_MAX_BODY_BYTES);
$request = vision_sync_validate_request($body);
if ($request['errors'] !== []) {
    vision_error(422, 'validation_failed', 'Données invalides.', ['fields' => $request['errors']]);
}
$result = vision_sync_exchange($pdo, $project, $identity, $request['device_id'], $request['since'], $request['changes']);
vision_json_response(200, ['ok' => true] + $result);
