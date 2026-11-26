<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/lib/medias.php';
$config = vision_bootstrap();
$method = vision_require_method(['PUT','GET','DELETE']);
$identity = vision_require_identity($config);
$role = vision_role_for_identity($identity, $config);
$pdo = vision_pdo($config);
$projectId = $_GET['project'] ?? null;
$id = $_GET['id'] ?? null;
if (!vision_project_id_is_valid($projectId) || !vision_media_uuid($id)) vision_error(404, 'not_found', 'Photo introuvable.');
$project = vision_project_find($pdo, $projectId);
if (!$project || !vision_can_on_project($role, 'read', $identity, $project)) vision_error(404, 'not_found', 'Photo introuvable.');
if (!is_string($config['media_directory']) || $config['media_directory'] === '') throw new VisionConfigException('media_directory absent.');
$directory = realpath($config['media_directory']);
if (!$directory || !is_writable($directory)) throw new RuntimeException('Stockage média indisponible.');
if ($method !== 'GET') {
    if (!vision_can_on_project($role, 'update', $identity, $project)) vision_error(403, 'forbidden', 'Action non autorisée.');
    if ($project['status'] !== 'active') vision_error(409, 'project_archived', 'Projet archivé.');
}
if ($method === 'PUT') {
    $raw = (string) file_get_contents('php://input', false, null, 0, VISION_MEDIA_MAX_BYTES + 1);
    $status = vision_media_put($pdo, $project, $identity, $id, $raw, (string) ($_SERVER['CONTENT_TYPE'] ?? ''), (string) ($_SERVER['HTTP_X_VISION_SHA256'] ?? ''), $directory);
    vision_json_response($status, ['ok' => true]);
}
$find = $pdo->prepare('SELECT * FROM vision_media WHERE project_id = ? AND id = ? AND deleted_at IS NULL');
$find->execute([$project['id'], $id]);
$media = $find->fetch();
if (!$media) vision_error(404, 'not_found', 'Photo introuvable.');
if ($method === 'DELETE') {
    $pdo->prepare('UPDATE vision_media SET deleted_at = CURRENT_TIMESTAMP(3) WHERE project_id = ? AND id = ? AND deleted_at IS NULL')->execute([$project['id'], $id]);
    vision_json_response(200, ['ok' => true]);
}
// Même dossier qu'à l'écriture : l'identifiant enregistré du projet, jamais la valeur reçue.
$path = $directory . '/' . $project['public_id'] . '/' . $id;
if (is_link(dirname($path)) || is_link($path) || !is_file($path)) vision_error(404, 'not_found', 'Photo introuvable.');
header('Content-Type: ' . $media['mime']);
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, max-age=86400');
header('Vary: Cookie, Authorization, X-Vision-Expected-Identity');
header('Content-Disposition: inline');
readfile($path);
