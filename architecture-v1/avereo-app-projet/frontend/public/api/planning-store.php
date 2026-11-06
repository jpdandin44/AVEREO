<?php
declare(strict_types=1);

final class PlanningFailure extends RuntimeException
{
    public function __construct(public readonly int $status, string $message) { parent::__construct($message); }
}

/** The complete JSON is retained; no task, evidence or risk is rebuilt by the server. */
function planning_validate(mixed $project): array
{
    $fail = static function (): never { throw new PlanningFailure(422, 'Sauvegarde de planning invalide.'); };
    $text = static function ($value, int $max, bool $required = false) use ($fail): void {
        if (!is_string($value) || strlen($value) > $max * 4 || ($required && trim($value) === '')) $fail();
    };
    $date = static function ($value, bool $nullable = false) use ($fail): void {
        if ($value === null && $nullable) return;
        if (!is_string($value) || !preg_match('/^(\d{4})-(\d{2})-(\d{2})$/D', $value, $m)
            || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])) $fail();
    };
    if (!is_array($project) || ($project['schemaVersion'] ?? null) !== 1) $fail();
    $text($project['name'] ?? null, 200, true);
    $date($project['startDate'] ?? null);
    $date($project['targetDate'] ?? null, true);
    if (($project['targetDate'] ?? null) !== null && $project['targetDate'] < $project['startDate']) $fail();
    if (!is_numeric($project['capacityPerWeek'] ?? null) || $project['capacityPerWeek'] <= 0
        || !in_array($project['schedulingMode'] ?? null, ['sequential', 'dependencies'], true)
        || !is_array($project['tasks'] ?? null) || !array_is_list($project['tasks']) || count($project['tasks']) > 1000) $fail();
    $ids = [];
    foreach ($project['tasks'] as $position => $task) {
        if (!is_array($task)) $fail();
        $text($task['id'] ?? null, 128, true);
        $id = $task['id'];
        if (isset($ids[$id]) || in_array($id, ['__proto__', 'constructor', 'prototype'], true)) $fail();
        $ids[$id] = $position;
        foreach (['name' => 1000, 'lot' => 200, 'owner' => 200, 'description' => 12000] as $field => $limit) $text($task[$field] ?? '', $limit, $field === 'name');
        foreach (['duration' => 3650, 'progress' => 100] as $field => $limit) {
            if (!is_numeric($task[$field] ?? null) || $task[$field] < 0 || $task[$field] > $limit) $fail();
        }
        if (!is_bool($task['isMilestone'] ?? null) || ($task['isMilestone'] && $task['duration'] != 0)
            || !in_array($task['status'] ?? null, ['À faire', 'En cours', 'En attente', 'Bloqué', 'Terminé', 'Validé'], true)
            || !is_array($task['dependencies'] ?? null) || !array_is_list($task['dependencies']) || count($task['dependencies']) > 1000) $fail();
        $date($task['manualStart'] ?? null, true);
        if (array_key_exists('subject', $task)) {
            $text($task['subject'], 80, true);
            if (!preg_match('/\A.{1,80}\z/us', $task['subject'])) $fail();
        }
        if (array_key_exists('priority', $task) && !in_array($task['priority'], ['haute', 'normale', 'basse'], true)) $fail();
        foreach (['checklist' => 100, 'risks' => 60] as $field => $limit) {
            $items = $task[$field] ?? [];
            if (!is_array($items) || !array_is_list($items) || count($items) > $limit) $fail();
            $seen = [];
            foreach ($items as $item) {
                if (!is_array($item)) $fail();
                $text($item['id'] ?? null, 128, true);
                $text($item['title'] ?? null, 1000, true);
                if (isset($seen[$item['id']])) $fail();
                $seen[$item['id']] = true;
                if ($field === 'checklist') {
                    if (!is_bool($item['completed'] ?? null) || !is_bool($item['validated'] ?? null)) $fail();
                    if ($item['validated'] && (!$item['completed'] || empty($item['evidence']) || empty($item['validatedBy']) || empty($item['validatedAt']))) $fail();
                }
            }
        }
    }
    $done = [];
    for ($pass = 0; $pass <= count($ids); $pass++) {
        $changed = false;
        foreach ($project['tasks'] as $position => $task) {
            if (isset($done[$task['id']])) continue;
            $ready = true;
            foreach ($task['dependencies'] as $dependency) {
                if (!is_string($dependency) || !isset($ids[$dependency]) || $dependency === $task['id']
                    || ($project['schedulingMode'] === 'sequential' && $ids[$dependency] >= $position)) $fail();
                if (!isset($done[$dependency])) $ready = false;
            }
            if ($ready) { $done[$task['id']] = true; $changed = true; }
        }
        if (count($done) === count($ids)) return $project;
        if (!$changed) $fail();
    }
    $fail();
}

function planning_directory(array $config, string $publicRoot): string
{
    $path = realpath((string) ($config['directory'] ?? ''));
    $public = realpath($publicRoot);
    if (!$path || !$public || !is_dir($path) || !is_writable($path)) throw new PlanningFailure(503, 'Stockage privé indisponible.');
    $canonical = strtolower(str_replace('\\', '/', $path));
    $public = rtrim(strtolower(str_replace('\\', '/', $public)), '/');
    if ($canonical === $public || str_starts_with($canonical, $public . '/')) throw new PlanningFailure(503, 'Stockage privé invalide.');
    return $path;
}

function planning_read(string $directory, string $file = 'current.json'): array
{
    $path = $directory . '/' . $file;
    if (!file_exists($path)) return ['revision' => 0, 'savedAt' => null, 'project' => null];
    if (is_link($path) || filesize($path) > 6 * 1024 * 1024) throw new PlanningFailure(503, 'Sauvegarde à vérifier.');
    try {
        $record = json_decode((string) file_get_contents($path), true, 64, JSON_THROW_ON_ERROR);
        if (!is_array($record) || !is_int($record['revision'] ?? null) || $record['revision'] < 1 || !is_string($record['savedAt'] ?? null)) throw new RuntimeException();
        planning_validate($record['project'] ?? null);
        return $record;
    } catch (Throwable) { throw new PlanningFailure(503, 'Sauvegarde à vérifier ; aucun remplacement automatique.'); }
}

function planning_atomic(string $path, string $bytes): void
{
    $temp = tempnam(dirname($path), '.planning-');
    if ($temp === false) throw new PlanningFailure(503, 'Écriture indisponible.');
    try {
        chmod($temp, 0600);
        $handle = fopen($temp, 'wb');
        if (!$handle) throw new RuntimeException();
        try {
            if (fwrite($handle, $bytes) !== strlen($bytes) || !fflush($handle) || !fsync($handle)) throw new RuntimeException();
        } finally { fclose($handle); }
        if (!rename($temp, $path)) throw new RuntimeException();
    } catch (Throwable) { throw new PlanningFailure(503, 'Enregistrement impossible ; réessayer.'); }
    finally { if (is_file($temp)) unlink($temp); }
}

function planning_save(string $directory, array $project, int $revision): array
{
    planning_validate($project);
    $lock = fopen($directory . '/planning.lock', 'c');
    if (!$lock) throw new PlanningFailure(503, 'Verrou indisponible.');
    chmod($directory . '/planning.lock', 0600);
    try {
        if (!flock($lock, LOCK_EX)) throw new PlanningFailure(503, 'Verrou indisponible.');
        $current = planning_read($directory);
        if ($current['revision'] !== $revision) throw new PlanningFailure(409, 'Une autre session a enregistré une version plus récente. Ton travail reste conservé dans ce navigateur.');
        if ($current['project'] === $project) return $current;
        if ($current['revision'] > 0) {
            $bytes = json_encode($current, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            // Twenty rotating private recovery copies, plus the explicit previous version.
            planning_atomic($directory . '/history-' . ($current['revision'] % 20) . '.json', $bytes);
            planning_atomic($directory . '/previous.json', $bytes);
        }
        $record = ['revision' => $revision + 1, 'savedAt' => gmdate('Y-m-d\TH:i:s\Z'), 'project' => $project];
        planning_atomic($directory . '/current.json', json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
        return $record;
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}
