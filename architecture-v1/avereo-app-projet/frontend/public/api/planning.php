<?php
declare(strict_types=1);
require __DIR__ . '/planning-auth.php';
require __DIR__ . '/workspace-store.php';

planning_response(function (array $auth): array {
    $method = $_SERVER['REQUEST_METHOD'];
    if (!in_array($method, ['GET', 'PUT'], true)) {
        header('Allow: GET, PUT');
        throw new PlanningFailure(405, 'Méthode non autorisée.');
    }
    $body = $method === 'PUT' ? planning_body($auth) : null;
    return workspace_locked($auth['directory'], LOCK_SH, function () use ($auth, $method, $body): array {
        $id = $_GET['project'] ?? 'principal';
        $workspace = workspace_read($auth['directory']);
        $directory = workspace_project_directory($auth['directory'], $workspace, $id);
        if ($method === 'PUT') {
            if ($workspace['projects'][$id]['archivedAt'] !== null) throw new PlanningFailure(409, 'Ce projet est archivé. Restaure-le depuis Mes projets avant de le modifier.');
            return planning_save($directory, planning_validate($body['project'] ?? null), $body['revision']);
        }
        return planning_read($directory, ($_GET['version'] ?? '') === 'previous' ? 'previous.json' : 'current.json');
    });
});
