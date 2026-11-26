<?php

declare(strict_types=1);

// Synchronisation du contenu des projets (Lot 2B) : validation, envoi, réception, journal. Contrat : docs/synchronisation.md.
// Un objet = bâtiment, niveau, pièce ou ouverture. Règle de conflit (R06) : la dernière modification reçue gagne, par objet,
// et l'état écrasé d'un autre appareil est inscrit au journal.

require_once __DIR__ . '/terrain.php';

const VISION_SYNC_KINDS = ['batiment', 'niveau', 'piece', 'ouverture', 'photo', 'commentaire'];
const VISION_SYNC_MAX_CHANGES = 100;
const VISION_SYNC_MAX_BODY_BYTES = 262144;
const VISION_SYNC_MAX_DATA_BYTES = 8192;
const VISION_SYNC_MAX_OBJECTS = 5000;
const VISION_SYNC_PAGE_SIZE = 500;
const VISION_SYNC_JOURNAL_PAGE = 200;
const VISION_SYNC_COORD_MAX = 100_000_000;

function vision_sync_object_id_is_valid(mixed $id): bool
{
    return is_string($id) && preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id) === 1;
}

function vision_sync_device_id_is_valid(mixed $id): bool
{
    return is_string($id) && preg_match('/^[A-Za-z0-9_-]{8,64}$/', $id) === 1;
}

/** Entier JSON strict (un flottant, même entier, est refusé) dans [min, max]. */
function vision_sync_int(mixed $value, int $min, int $max): bool
{
    return is_int($value) && $value >= $min && $value <= $max;
}

/**
 * Valide et normalise le contenu `data` d'un objet selon son type ; aucune autre clé n'est admise.
 * @param array<string, string> $errors erreurs accumulées (chemin => message)
 * @return array<string, mixed>|null le contenu validé, ou null s'il est invalide
 */
function vision_sync_validate_data(string $kind, mixed $data, string $path, array &$errors): ?array
{
    if (!is_array($data) || ($data !== [] && array_is_list($data))) {
        $errors[$path] = 'Objet JSON attendu.';
        return null;
    }
    if (in_array($kind, ['photo', 'commentaire'], true)) {
        if (!vision_terrain_valid($kind, $data) || strlen(json_encode($data)) > VISION_SYNC_MAX_DATA_BYTES) {
            $errors[$path] = 'Objet terrain invalide ou trop volumineux.';
            return null;
        }
        return $data;
    }
    $spec = [
        'batiment' => ['nom'],
        'niveau' => ['nom', 'ordre'],
        'piece' => ['nom', 'hauteurMm', 'ordre', 'sommets'],
        'ouverture' => ['type', 'murIndex', 'positionMm', 'largeurMm', 'hauteurMm', 'alleMm'],
    ][$kind];
    $before = count($errors);
    foreach (array_keys($data) as $key) {
        if (!in_array($key, $spec, true) && !($kind === 'piece' && $key === 'cotesLaser')) {
            $errors["$path.$key"] = 'Champ inconnu.';
        }
    }
    foreach ($spec as $key) {
        if (!array_key_exists($key, $data)) {
            $errors["$path.$key"] = 'Champ obligatoire.';
        }
    }
    if (count($errors) > $before) {
        return null;
    }
    $check = static function (string $key, bool $ok, string $message) use (&$errors, $path): void {
        if (!$ok) {
            $errors["$path.$key"] = $message;
        }
    };
    if (array_key_exists('nom', $data)) {
        $nom = $data['nom'];
        $valid = is_string($nom) && vision_is_utf8($nom)
            && preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $nom) !== 1
            && trim($nom) !== '' && vision_utf8_length($nom) <= 160;
        $check('nom', $valid, 'Texte de 1 à 160 caractères attendu.');
    }
    if (array_key_exists('ordre', $data)) {
        $check('ordre', vision_sync_int($data['ordre'], 0, 9999), 'Entier de 0 à 9999 attendu.');
    }
    if ($kind === 'piece') {
        if (array_key_exists('cotesLaser', $data)) {
            $check('cotesLaser', vision_terrain_valid('cotesLaser', $data['cotesLaser']), 'Cotes laser invalides.');
        }
        $check('hauteurMm', vision_sync_int($data['hauteurMm'], 1, 100000), 'Entier de 1 à 100000 attendu.');
        $sommets = $data['sommets'];
        $okSommets = is_array($sommets) && array_is_list($sommets) && count($sommets) >= 3 && count($sommets) <= 64;
        if ($okSommets) {
            foreach ($sommets as $point) {
                if (!is_array($point) || count($point) !== 2 || !isset($point['x'], $point['y'])
                    || !vision_sync_int($point['x'], -VISION_SYNC_COORD_MAX, VISION_SYNC_COORD_MAX)
                    || !vision_sync_int($point['y'], -VISION_SYNC_COORD_MAX, VISION_SYNC_COORD_MAX)) {
                    $okSommets = false;
                    break;
                }
            }
        }
        $check('sommets', $okSommets, '3 à 64 sommets {x, y} en millimètres entiers attendus.');
        if ($okSommets && isset($data['cotesLaser']) && vision_terrain_valid('cotesLaser', $data['cotesLaser'])) {
            foreach ($data['cotesLaser'] as $cote) {
                foreach (['murIndex', 'deSommet', 'aSommet'] as $index) {
                    if (isset($cote[$index])) $check('cotesLaser', $cote[$index] < count($sommets), 'Repère laser absent du contour.');
                }
            }
        }
    }
    if ($kind === 'ouverture') {
        $check('type', in_array($data['type'], ['porte', 'fenetre'], true), 'Valeur attendue : « porte » ou « fenetre ».');
        $check('murIndex', vision_sync_int($data['murIndex'], 0, 63), 'Entier de 0 à 63 attendu.');
        $check('positionMm', vision_sync_int($data['positionMm'], 0, VISION_SYNC_COORD_MAX), 'Entier positif attendu.');
        $check('largeurMm', vision_sync_int($data['largeurMm'], 1, 100000), 'Entier de 1 à 100000 attendu.');
        $check('hauteurMm', vision_sync_int($data['hauteurMm'], 1, 100000), 'Entier de 1 à 100000 attendu.');
        $check('alleMm', vision_sync_int($data['alleMm'], 0, 100000), 'Entier de 0 à 100000 attendu.');
    }
    if (count($errors) > $before) {
        return null;
    }
    if (strlen(json_encode($data, JSON_UNESCAPED_UNICODE)) > VISION_SYNC_MAX_DATA_BYTES) {
        $errors[$path] = 'Objet trop volumineux.';
        return null;
    }
    return $data;
}

/**
 * Valide le corps d'un envoi.
 * @return array{device_id: string, since: int, changes: array<int, array>, errors: array<string, string>}
 */
function vision_sync_validate_request(array $body): array
{
    $errors = [];
    foreach (array_keys($body) as $key) {
        if (!in_array($key, ['device_id', 'since', 'changes'], true)) {
            $errors[(string) $key] = 'Champ inconnu.';
        }
    }
    $deviceId = $body['device_id'] ?? null;
    if (!vision_sync_device_id_is_valid($deviceId)) {
        $errors['device_id'] = 'Identifiant d\'appareil invalide (8 à 64 caractères : lettres, chiffres, - et _).';
    }
    $since = $body['since'] ?? 0;
    if (!vision_sync_int($since, 0, PHP_INT_MAX)) {
        $errors['since'] = 'Entier positif attendu.';
    }
    $changesRaw = $body['changes'] ?? [];
    $changes = [];
    if (!is_array($changesRaw) || ($changesRaw !== [] && !array_is_list($changesRaw))) {
        $errors['changes'] = 'Liste attendue.';
    } elseif (count($changesRaw) > VISION_SYNC_MAX_CHANGES) {
        $errors['changes'] = 'Au plus ' . VISION_SYNC_MAX_CHANGES . ' changements par envoi.';
    } else {
        foreach ($changesRaw as $index => $change) {
            $path = "changes.$index";
            if (!is_array($change) || array_is_list($change)) {
                $errors[$path] = 'Objet JSON attendu.';
                continue;
            }
            $before = count($errors);
            foreach (array_keys($change) as $key) {
                if (!in_array($key, ['object_id', 'kind', 'parent_id', 'base_rev', 'deleted', 'data'], true)) {
                    $errors["$path.$key"] = 'Champ inconnu.';
                }
            }
            if (!vision_sync_object_id_is_valid($change['object_id'] ?? null)) {
                $errors["$path.object_id"] = 'Identifiant d\'objet invalide.';
            }
            $kind = $change['kind'] ?? null;
            if ($kind === 'photo' && !vision_media_uuid($change['object_id'] ?? null)) $errors["$path.object_id"] = 'UUID de photo attendu.';
            if (!in_array($kind, VISION_SYNC_KINDS, true)) {
                $errors["$path.kind"] = 'Type d\'objet inconnu.';
            }
            $parent = $change['parent_id'] ?? null;
            if ($kind === 'batiment' ? $parent !== null : !vision_sync_object_id_is_valid($parent)) {
                $errors["$path.parent_id"] = $kind === 'batiment' ? 'Un bâtiment n\'a pas de parent.' : 'Identifiant du parent invalide.';
            }
            if (!vision_sync_int($change['base_rev'] ?? null, 0, 4294967295)) {
                $errors["$path.base_rev"] = 'Entier positif attendu.';
            }
            $deleted = $change['deleted'] ?? false;
            if (!is_bool($deleted)) {
                $errors["$path.deleted"] = 'Booléen attendu.';
            }
            $data = null;
            if ($deleted === false && count($errors) === $before) {
                $data = vision_sync_validate_data((string) $kind, $change['data'] ?? null, "$path.data", $errors);
            }
            if (count($errors) === $before) {
                $changes[] = [
                    'object_id' => $change['object_id'],
                    'kind' => $kind,
                    'parent_id' => $parent,
                    'base_rev' => $change['base_rev'],
                    'deleted' => $deleted,
                    'data' => $data,
                ];
            }
        }
    }
    return ['device_id' => (string) $deviceId, 'since' => is_int($since) ? $since : 0, 'changes' => $changes, 'errors' => $errors];
}

/** Forme canonique (clés triées récursivement) pour comparer deux contenus sans dépendre de l'ordre des clés. */
function vision_sync_canonical(mixed $value): string
{
    $sort = static function (mixed $v) use (&$sort): mixed {
        if (!is_array($v)) {
            return $v;
        }
        if (!array_is_list($v)) {
            ksort($v);
        }
        return array_map($sort, $v);
    };
    return json_encode($sort($value), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
}

/** Heure ISO 8601 UTC d'une date MySQL. */
function vision_sync_iso(string $date): string
{
    return str_replace(' ', 'T', $date) . 'Z';
}

/** Forme publique d'un objet stocké. */
function vision_sync_object_public(array $row): array
{
    return [
        'object_id' => $row['object_id'],
        'kind' => $row['kind'],
        'parent_id' => $row['parent_id'],
        'data' => (int) $row['deleted'] === 1 ? null : json_decode((string) $row['data'], true),
        'deleted' => (int) $row['deleted'] === 1,
        'rev' => (int) $row['rev'],
        'seq' => (int) $row['seq'],
        'updated_by' => $row['updated_by'],
        'device_id' => $row['device_id'],
    ];
}

/** Dernier seq du projet, sans verrou (0 si le projet n'a encore aucun changement). */
function vision_sync_current_seq(PDO $pdo, int $projectId): int
{
    $statement = $pdo->prepare('SELECT last_seq FROM vision_project_counters WHERE project_id = ?');
    $statement->execute([$projectId]);
    $value = $statement->fetchColumn();
    return $value === false ? 0 : (int) $value;
}

/**
 * Réception : objets dont seq > $since, jusqu'au seq $upTo (instantané), au plus une page.
 * @return array{changes: array<int, array>, seq: int, has_more: bool}
 */
function vision_sync_pull(PDO $pdo, int $projectId, int $since, int $upTo): array
{
    $limit = VISION_SYNC_PAGE_SIZE + 1;
    $statement = $pdo->prepare(
        'SELECT object_id, kind, parent_id, data, deleted, rev, seq, updated_by, device_id FROM vision_objects '
        . "WHERE project_id = ? AND seq > ? AND seq <= ? ORDER BY seq ASC LIMIT $limit"
    );
    $statement->execute([$projectId, $since, $upTo]);
    $rows = $statement->fetchAll();
    $hasMore = count($rows) > VISION_SYNC_PAGE_SIZE;
    if ($hasMore) {
        $rows = array_slice($rows, 0, VISION_SYNC_PAGE_SIZE);
    }
    $cursor = $hasMore ? (int) $rows[count($rows) - 1]['seq'] : max($upTo, $since);
    return ['changes' => array_map('vision_sync_object_public', $rows), 'seq' => $cursor, 'has_more' => $hasMore];
}

/**
 * Envoi (éventuellement vide) puis réception, en une transaction. Tout ou rien : un changement refusé annule l'envoi.
 * @param array<int, array> $changes changements déjà validés (vision_sync_validate_request)
 * @return array{applied: array<int, array>, changes: array<int, array>, seq: int, has_more: bool}
 */
function vision_sync_exchange(PDO $pdo, array $project, array $identity, string $deviceId, int $since, array $changes): array
{
    $projectId = (int) $project['id'];
    $by = (string) $identity['id'];
    $applied = [];
    $pdo->beginTransaction();
    try {
        if ($changes === []) {
            // Réception seule : lecture cohérente (instantané) sans verrou.
            $snapshot = vision_sync_current_seq($pdo, $projectId);
        } else {
            $pdo->prepare('INSERT IGNORE INTO vision_project_counters (project_id, last_seq) VALUES (?, 0)')->execute([$projectId]);
            $statement = $pdo->prepare('SELECT last_seq FROM vision_project_counters WHERE project_id = ? FOR UPDATE');
            $statement->execute([$projectId]);
            $seq = (int) $statement->fetchColumn();
            $count = $pdo->prepare('SELECT COUNT(*) FROM vision_objects WHERE project_id = ?');
            $count->execute([$projectId]);
            $objectCount = (int) $count->fetchColumn();

            $find = $pdo->prepare('SELECT * FROM vision_objects WHERE project_id = ? AND object_id = ? FOR UPDATE');
            $insert = $pdo->prepare(
                'INSERT INTO vision_objects (project_id, object_id, kind, parent_id, data, rev, seq, deleted, device_id, updated_by, created_at, updated_at) '
                . 'VALUES (?, ?, ?, ?, ?, 1, ?, 0, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))'
            );
            $update = $pdo->prepare(
                'UPDATE vision_objects SET parent_id = ?, data = ?, rev = ?, seq = ?, deleted = ?, device_id = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP(3) '
                . 'WHERE project_id = ? AND object_id = ?'
            );
            $log = $pdo->prepare(
                'INSERT INTO vision_sync_log (project_id, seq, object_id, kind, lost_rev, lost_data, lost_deleted, lost_device_id, lost_by, won_rev, won_device_id, won_by) '
                . 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );

            foreach ($changes as $change) {
                $find->execute([$projectId, $change['object_id']]);
                $existing = $find->fetch();
                if ($existing === false) {
                    if ($change['deleted']) {
                        // Suppression d'un objet que le serveur ne connaît pas : rien à faire.
                        $applied[] = ['object_id' => $change['object_id'], 'rev' => 0, 'seq' => $seq, 'status' => 'unchanged'];
                        continue;
                    }
                    if ($objectCount >= VISION_SYNC_MAX_OBJECTS) {
                        throw new VisionHttpException(413, 'project_too_large', 'Le projet contient trop d\'objets.');
                    }
                    $seq++;
                    $objectCount++;
                    $insert->execute([
                        $projectId, $change['object_id'], $change['kind'], $change['parent_id'],
                        json_encode($change['data'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), $seq, $deviceId, $by,
                    ]);
                    $applied[] = ['object_id' => $change['object_id'], 'rev' => 1, 'seq' => $seq, 'status' => 'applied'];
                    continue;
                }
                if ($existing['kind'] !== $change['kind']) {
                    throw new VisionHttpException(422, 'kind_mismatch', 'Le type d\'un objet existant ne peut pas changer.');
                }
                $existingDeleted = (int) $existing['deleted'] === 1;
                $same = $existing['parent_id'] === $change['parent_id']
                    && $existingDeleted === $change['deleted']
                    && ($change['deleted'] || vision_sync_canonical(json_decode((string) $existing['data'], true)) === vision_sync_canonical($change['data']));
                if ($same) {
                    $applied[] = ['object_id' => $change['object_id'], 'rev' => (int) $existing['rev'], 'seq' => (int) $existing['seq'], 'status' => 'unchanged'];
                    continue;
                }
                $rev = (int) $existing['rev'] + 1;
                $seq++;
                // Une suppression garde le dernier contenu connu (pour le journal et une éventuelle restauration).
                $newData = $change['deleted'] ? (string) $existing['data'] : json_encode($change['data'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
                $conflict = (int) $change['base_rev'] !== (int) $existing['rev'] && $existing['device_id'] !== $deviceId;
                if ($conflict) {
                    $log->execute([
                        $projectId, $seq, $change['object_id'], $change['kind'], (int) $existing['rev'], (string) $existing['data'],
                        $existingDeleted ? 1 : 0, $existing['device_id'], $existing['updated_by'], $rev, $deviceId, $by,
                    ]);
                }
                $update->execute([$change['parent_id'], $newData, $rev, $seq, $change['deleted'] ? 1 : 0, $deviceId, $by, $projectId, $change['object_id']]);
                $applied[] = ['object_id' => $change['object_id'], 'rev' => $rev, 'seq' => $seq, 'status' => $conflict ? 'conflict' : 'applied'];
            }
            $pdo->prepare('UPDATE vision_project_counters SET last_seq = ? WHERE project_id = ?')->execute([$seq, $projectId]);
            // Le contenu a changé : la date de modification du projet aussi (liste triée par activité, préchargement des appareils).
            if (array_filter($applied, static fn (array $a): bool => $a['status'] !== 'unchanged') !== []) {
                $pdo->prepare('UPDATE vision_projects SET updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?')->execute([$projectId]);
            }
            $snapshot = $seq;
        }
        $pull = vision_sync_pull($pdo, $projectId, $since, $snapshot);
        $pdo->commit();
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $exception;
    }
    return ['applied' => $applied] + $pull;
}

/**
 * Journal des écrasements d'un projet (200 entrées au plus, par id croissant).
 * @return array<int, array>
 */
function vision_sync_journal(PDO $pdo, int $projectId, int $after): array
{
    $limit = VISION_SYNC_JOURNAL_PAGE;
    $statement = $pdo->prepare(
        'SELECT * FROM vision_sync_log WHERE project_id = ? AND id > ? ORDER BY id ASC LIMIT ' . $limit
    );
    $statement->execute([$projectId, $after]);
    return array_map(static fn (array $row): array => [
        'id' => (int) $row['id'],
        'seq' => (int) $row['seq'],
        'object_id' => $row['object_id'],
        'kind' => $row['kind'],
        'created_at' => vision_sync_iso((string) $row['created_at']),
        'lost' => [
            'rev' => (int) $row['lost_rev'],
            'data' => json_decode((string) $row['lost_data'], true),
            'deleted' => (int) $row['lost_deleted'] === 1,
            'device_id' => $row['lost_device_id'],
            'by' => $row['lost_by'],
        ],
        'won' => ['rev' => (int) $row['won_rev'], 'device_id' => $row['won_device_id'], 'by' => $row['won_by']],
    ], $statement->fetchAll());
}
