<?php
declare(strict_types=1);

function workspace_defaults(): array
{
    return ['zoom' => 'weeks', 'collapsed' => true];
}

function workspace_locked(string $directory, int $mode, callable $action): array
{
    $path = $directory . '/workspace.lock';
    if (is_link($path)) throw new PlanningFailure(503, 'Verrou invalide.');
    $lock = fopen($path, 'c');
    if (!$lock) throw new PlanningFailure(503, 'Espace indisponible.');
    chmod($path, 0600);
    try {
        if (!flock($lock, $mode)) throw new PlanningFailure(503, 'Espace occupé.');
        return $action();
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}

function workspace_id(mixed $id): bool
{
    return is_string($id) && ($id === 'principal' || preg_match('/^p-[a-f0-9]{32}$/D', $id) === 1);
}

function workspace_read(string $directory): array
{
    $path = $directory . '/workspace.json';
    // The existing planning stays in place, including its revision and recovery copies.
    if (!file_exists($path)) return ['revision' => 0, 'preferences' => workspace_defaults(), 'projects' => [
        'principal' => ['client' => '', 'archivedAt' => null],
    ]];
    try {
        if (is_link($path) || filesize($path) > 128 * 1024) throw new RuntimeException();
        $data = json_decode((string) file_get_contents($path), true, 16, JSON_THROW_ON_ERROR);
        if (!is_array($data) || !is_int($data['revision'] ?? null) || $data['revision'] < 1
            || !is_array($data['projects'] ?? null) || count($data['projects']) > 100
            || !isset($data['projects']['principal']) || !is_array($data['preferences'] ?? null)
            || !in_array($data['preferences']['zoom'] ?? '', ['days', 'weeks'], true)
            || !is_bool($data['preferences']['collapsed'] ?? null)) throw new RuntimeException();
        foreach ($data['projects'] as $id => $meta) {
            if (!workspace_id($id) || !is_array($meta) || !is_string($meta['client'] ?? null)
                || strlen($meta['client']) > 800 || !array_key_exists('archivedAt', $meta)
                || ($meta['archivedAt'] !== null && !is_string($meta['archivedAt']))) throw new RuntimeException();
        }
        return $data;
    } catch (Throwable) { throw new PlanningFailure(503, 'Liste des projets à vérifier ; aucun remplacement automatique.'); }
}

function workspace_project_directory(string $directory, array $workspace, mixed $id): string
{
    if (!workspace_id($id) || !isset($workspace['projects'][$id])) throw new PlanningFailure(404, 'Projet introuvable dans ton espace.');
    if ($id === 'principal') return $directory;
    $parent = $directory . '/projects';
    $path = $parent . '/' . $id;
    if (is_link($parent) || is_link($path) || !is_dir($path)) throw new PlanningFailure(503, 'Dossier privé indisponible.');
    return $path;
}

function workspace_listing(string $directory, array $workspace): array
{
    $projects = [];
    foreach ($workspace['projects'] as $id => $meta) {
        $record = planning_read(workspace_project_directory($directory, $workspace, $id));
        if (!$record['project']) continue;
        $projects[] = $meta + ['id' => $id, 'name' => $record['project']['name'], 'savedAt' => $record['savedAt'],
            'taskCount' => count($record['project']['tasks']), 'revision' => $record['revision']];
    }
    return ['revision' => $workspace['revision'], 'preferences' => $workspace['preferences'], 'projects' => $projects];
}

function workspace_change(string $directory, array $body): array
{
    return workspace_locked($directory, LOCK_EX, function () use ($directory, $body): array {
        $data = workspace_read($directory);
        if ($data['revision'] !== $body['revision']) throw new PlanningFailure(409, 'La liste a changé dans une autre session. Actualise Mes projets avant de réessayer.');
        $action = $body['action'] ?? '';
        $created = null;
        if ($action === 'create') {
            if (count($data['projects']) >= 100) throw new PlanningFailure(422, 'Limite de 100 projets atteinte, archives comprises.');
            $project = planning_validate($body['project'] ?? null);
            $client = $body['client'] ?? '';
            if (!is_string($client) || strlen($client) > 800) throw new PlanningFailure(422, 'Référence client invalide.');
            $parent = $directory . '/projects';
            if (is_link($parent)) throw new PlanningFailure(503, 'Dossier invalide.');
            if (!is_dir($parent) && !mkdir($parent, 0700)) throw new PlanningFailure(503, 'Création indisponible.');
            $created = 'p-' . bin2hex(random_bytes(16));
            $path = $parent . '/' . $created;
            if (!mkdir($path, 0700)) throw new PlanningFailure(503, 'Création indisponible.');
            planning_save($path, $project, 0);
            $data['projects'][$created] = ['client' => trim($client), 'archivedAt' => null];
        } elseif ($action === 'preferences') {
            $preferences = $body['preferences'] ?? null;
            if (!is_array($preferences) || !in_array($preferences['zoom'] ?? '', ['days', 'weeks'], true)
                || !is_bool($preferences['collapsed'] ?? null)) throw new PlanningFailure(422, 'Préférences invalides.');
            $data['preferences'] = ['zoom' => $preferences['zoom'], 'collapsed' => $preferences['collapsed']];
        } elseif (in_array($action, ['archive', 'restore', 'client'], true)) {
            $id = $body['id'] ?? null;
            workspace_project_directory($directory, $data, $id);
            if ($action === 'client') {
                if (!is_string($body['client'] ?? null) || strlen($body['client']) > 800) throw new PlanningFailure(422, 'Référence client invalide.');
                $data['projects'][$id]['client'] = trim($body['client']);
            } else $data['projects'][$id]['archivedAt'] = $action === 'archive' ? gmdate('Y-m-d\TH:i:s\Z') : null;
        } else throw new PlanningFailure(422, 'Action inconnue.');
        $data['revision']++;
        $path = $directory . '/workspace.json';
        if (is_file($path)) planning_atomic($directory . '/workspace.previous.json', (string) file_get_contents($path));
        planning_atomic($path, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
        return workspace_listing($directory, $data) + ['createdId' => $created];
    });
}
