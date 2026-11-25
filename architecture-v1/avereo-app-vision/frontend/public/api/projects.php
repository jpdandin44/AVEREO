<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

// Projets de relevé (R01).
//   GET   /api/projects.php[?status=active|archived|all&q=&limit=&offset=]   liste (les siens ; tous pour le fondateur)
//   GET   /api/projects.php?id=<public_id>                                     un projet
//   POST  /api/projects.php        {name, address?, client_label?}             création
//   PATCH /api/projects.php?id=…   {name?, address?, client_label?, status?}   modification, archivage (status: archived)
// Pas de suppression : on archive. Un projet d'autrui est invisible (404), jamais « interdit », pour ne pas révéler son existence.
$config = vision_bootstrap();
$method = vision_require_method(['GET', 'POST', 'PATCH']);
$identity = vision_require_identity($config);
$role = vision_role_for_identity($identity, $config);
$pdo = vision_pdo($config);

$id = $_GET['id'] ?? null;
if ($id !== null && !vision_project_id_is_valid($id)) {
    vision_error(404, 'not_found', 'Projet introuvable.');
}

if ($method === 'GET') {
    if ($id !== null) {
        $project = vision_project_find($pdo, $id);
        if ($project === null || !vision_can_on_project($role, 'read', $identity, $project)) {
            vision_error(404, 'not_found', 'Projet introuvable.');
        }
        vision_json_response(200, ['ok' => true, 'project' => vision_project_public($project)]);
    }
    if (!vision_can($role, 'project.read_own') && !vision_can($role, 'project.read_any')) {
        vision_error(403, 'forbidden', 'Action non autorisée.');
    }
    $rows = vision_projects_list($pdo, $identity, vision_can($role, 'project.read_any'), [
        'status' => vision_query_param('status', 'active'),
        'q' => vision_query_param('q'),
        'limit' => (int) vision_query_param('limit', '50'),
        'offset' => (int) vision_query_param('offset', '0'),
    ]);
    vision_json_response(200, ['ok' => true, 'projects' => array_map('vision_project_public', $rows)]);
}

if ($method === 'POST') {
    if ($id !== null) {
        vision_error(400, 'unexpected_id', "Un identifiant n'est pas attendu pour une création.");
    }
    if (!vision_can($role, 'project.create')) {
        vision_error(403, 'forbidden', 'Action non autorisée.');
    }
    $body = vision_read_json_body((int) $config['max_body_bytes']);
    ['clean' => $clean, 'errors' => $errors] = vision_project_validate($body, true);
    if ($errors !== []) {
        vision_error(422, 'validation_failed', 'Données invalides.', ['fields' => $errors]);
    }
    // Création hors ligne : l'identifiant vient du navigateur. Rejeu par le même propriétaire (réponse perdue) : 200 avec
    // le projet existant, sans doublon (le client compare les champs et renvoie une modification si besoin). Autre propriétaire : 409.
    // On insère d'abord : une collision d'identifiant (SQLSTATE 23000) est relue, même pour deux créations simultanées.
    try {
        $project = vision_project_create($pdo, $identity, $clean);
    } catch (PDOException $exception) {
        if ($exception->getCode() !== '23000' || !isset($clean['id'])) {
            throw $exception;
        }
        $existing = vision_project_find($pdo, $clean['id']);
        if ($existing === null || $existing['owner_provider'] !== $identity['provider'] || $existing['owner_id'] !== $identity['id']) {
            vision_error(409, 'id_conflict', 'Cet identifiant est déjà utilisé.');
        }
        vision_json_response(200, ['ok' => true, 'project' => vision_project_public($existing)]);
    }
    vision_json_response(201, ['ok' => true, 'project' => vision_project_public($project)]);
}

// PATCH
if ($id === null) {
    vision_error(400, 'missing_id', 'Identifiant de projet obligatoire.');
}
$project = vision_project_find($pdo, $id);
if ($project === null || !vision_can_on_project($role, 'read', $identity, $project)) {
    vision_error(404, 'not_found', 'Projet introuvable.');
}
$body = vision_read_json_body((int) $config['max_body_bytes']);
['clean' => $clean, 'errors' => $errors] = vision_project_validate($body, false);
if ($errors !== []) {
    vision_error(422, 'validation_failed', 'Données invalides.', ['fields' => $errors]);
}
$touchesStatus = array_key_exists('status', $clean);
$touchesContent = count(array_diff(array_keys($clean), ['status'])) > 0;
if (
    ($touchesContent && !vision_can_on_project($role, 'update', $identity, $project))
    || ($touchesStatus && !vision_can_on_project($role, 'archive', $identity, $project))
) {
    vision_error(403, 'forbidden', 'Action non autorisée.');
}
$updateAny = (!$touchesContent || vision_can($role, 'project.update_any'))
    && (!$touchesStatus || vision_can($role, 'project.archive_any'));
$updated = vision_project_update($pdo, $id, $identity, $clean, $updateAny);
vision_json_response(200, ['ok' => true, 'project' => vision_project_public($updated)]);
