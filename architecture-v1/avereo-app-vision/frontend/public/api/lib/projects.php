<?php

declare(strict_types=1);

// Projets de relevé : validation des entrées, accès à la base. Le propriétaire est toujours revérifié dans le SQL.

const VISION_PROJECT_FIELDS = ['name', 'address', 'client_label', 'status'];
const VISION_NAME_MAX = 160;
const VISION_ADDRESS_MAX = 500;
const VISION_CLIENT_MAX = 200;

/** UTF-8 valide ? (sans l'extension mbstring, absente de certains hébergements) */
function vision_is_utf8(string $value): bool
{
    return preg_match('//u', $value) === 1;
}

/** Nombre de caractères d'un texte UTF-8 valide. */
function vision_utf8_length(string $value): int
{
    return (int) preg_match_all('/./su', $value);
}

/** Les $max premiers caractères d'un texte UTF-8 valide. */
function vision_utf8_truncate(string $value, int $max): string
{
    return implode('', array_slice(preg_split('//u', $value, -1, PREG_SPLIT_NO_EMPTY) ?: [], 0, $max));
}

/**
 * Valide le corps d'une création ou d'une modification de projet.
 * @param bool $create création : « name » est obligatoire ; modification : au moins un champ
 * @return array{clean: array<string, string>, errors: array<string, string>}
 */
function vision_project_validate(array $body, bool $create): array
{
    $clean = [];
    $errors = [];
    foreach (array_keys($body) as $key) {
        if (!in_array($key, VISION_PROJECT_FIELDS, true) || ($create && $key === 'status')) {
            $errors[(string) $key] = 'Champ inconnu ou non modifiable.';
        }
    }
    $text = static function (string $field, int $max, bool $required, bool $nonEmpty = false) use ($body, &$clean, &$errors): void {
        if (!array_key_exists($field, $body)) {
            if ($required) {
                $errors[$field] = 'Champ obligatoire.';
            }
            return;
        }
        $value = $body[$field];
        if (!is_string($value)) {
            $errors[$field] = 'Texte attendu.';
            return;
        }
        // Contrôle AVANT trim() : trim() supprime silencieusement les octets nuls en bordure de texte.
        if (!vision_is_utf8($value) || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $value) === 1) {
            $errors[$field] = 'Caractères non autorisés.';
            return;
        }
        $value = trim($value);
        if (($required || $nonEmpty) && $value === '') {
            $errors[$field] = 'Ne peut pas être vide.';
            return;
        }
        if (vision_utf8_length($value) > $max) {
            $errors[$field] = "Au plus $max caractères.";
            return;
        }
        $clean[$field] = $value;
    };
    $text('name', VISION_NAME_MAX, $create, true); // facultatif en modification, mais jamais vide s'il est fourni
    $text('address', VISION_ADDRESS_MAX, false);
    $text('client_label', VISION_CLIENT_MAX, false);
    if (array_key_exists('status', $body) && !($create && isset($errors['status']))) {
        if (!in_array($body['status'], ['active', 'archived'], true)) {
            $errors['status'] = "Valeur attendue : « active » ou « archived ».";
        } else {
            $clean['status'] = $body['status'];
        }
    }
    if (!$create && $clean === [] && $errors === []) {
        $errors['_'] = 'Aucun champ à modifier.';
    }
    return ['clean' => $clean, 'errors' => $errors];
}

/** Forme publique d'un projet : l'identifiant interne n'est jamais exposé. */
function vision_project_public(array $row): array
{
    $iso = static fn (?string $date): ?string => $date === null ? null : str_replace(' ', 'T', $date) . 'Z';
    return [
        'id' => $row['public_id'],
        'name' => $row['name'],
        'address' => $row['address'],
        'client_label' => $row['client_label'],
        'status' => $row['status'],
        'owner' => ['provider' => $row['owner_provider'], 'id' => $row['owner_id']],
        'created_at' => $iso($row['created_at']),
        'updated_at' => $iso($row['updated_at']),
        'archived_at' => $iso($row['archived_at']),
    ];
}

/** Identifiant public valide : 32 caractères hexadécimaux. */
function vision_project_id_is_valid(mixed $id): bool
{
    return is_string($id) && preg_match('/^[0-9a-f]{32}$/', $id) === 1;
}

/**
 * Liste des projets visibles : tous pour qui a « project.read_any », sinon les siens.
 * @param array{status?: string, q?: string, limit?: int, offset?: int} $filters
 * @return array<int, array>
 */
function vision_projects_list(PDO $pdo, array $identity, bool $readAny, array $filters = []): array
{
    $where = [];
    $params = [];
    if (!$readAny) {
        $where[] = 'owner_provider = ? AND owner_id = ?';
        array_push($params, $identity['provider'], $identity['id']);
    }
    $status = $filters['status'] ?? 'active';
    if (in_array($status, ['active', 'archived'], true)) {
        $where[] = 'status = ?';
        $params[] = $status;
    }
    $q = trim((string) ($filters['q'] ?? ''));
    if ($q !== '') {
        $like = '%' . addcslashes(vision_utf8_truncate($q, 100), '%_\\') . '%';
        $where[] = '(name LIKE ? OR address LIKE ? OR client_label LIKE ?)';
        array_push($params, $like, $like, $like);
    }
    $limit = max(1, min(200, (int) ($filters['limit'] ?? 50)));
    $offset = max(0, min(10000, (int) ($filters['offset'] ?? 0)));
    $sql = 'SELECT * FROM vision_projects'
        . ($where === [] ? '' : ' WHERE ' . implode(' AND ', $where))
        . " ORDER BY updated_at DESC, id DESC LIMIT $limit OFFSET $offset";
    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    return $statement->fetchAll();
}

/** Projet par identifiant public, ou null. Le contrôle des droits se fait avec vision_can_on_project. */
function vision_project_find(PDO $pdo, string $publicId): ?array
{
    $statement = $pdo->prepare('SELECT * FROM vision_projects WHERE public_id = ?');
    $statement->execute([$publicId]);
    $row = $statement->fetch();
    return $row === false ? null : $row;
}

/** Crée un projet au nom de l'identité. */
function vision_project_create(PDO $pdo, array $identity, array $clean, ?string $email = null): array
{
    $publicId = bin2hex(random_bytes(16));
    $statement = $pdo->prepare(
        'INSERT INTO vision_projects (public_id, name, address, client_label, owner_provider, owner_id, owner_email, created_by_id, updated_by_id) '
        . 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $statement->execute([
        $publicId,
        $clean['name'],
        $clean['address'] ?? '',
        $clean['client_label'] ?? '',
        $identity['provider'],
        $identity['id'],
        $email,
        $identity['id'],
        $identity['id'],
    ]);
    return vision_project_find($pdo, $publicId) ?? throw new RuntimeException('Projet créé introuvable.');
}

/**
 * Modifie un projet (champs validés) ; l'archivage fixe archived_at.
 * Sans le droit « _any », le propriétaire est revérifié dans le SQL : un projet d'autrui n'est jamais modifié.
 */
function vision_project_update(PDO $pdo, string $publicId, array $identity, array $clean, bool $updateAny = false): array
{
    $sets = [];
    $params = [];
    foreach (['name', 'address', 'client_label'] as $field) {
        if (array_key_exists($field, $clean)) {
            $sets[] = "$field = ?";
            $params[] = $clean[$field];
        }
    }
    if (array_key_exists('status', $clean)) {
        $sets[] = 'status = ?';
        $params[] = $clean['status'];
        $sets[] = $clean['status'] === 'archived' ? 'archived_at = CURRENT_TIMESTAMP(3)' : 'archived_at = NULL';
    }
    $sets[] = 'updated_by_id = ?';
    $params[] = $identity['id'];
    $params[] = $publicId;
    $ownerClause = '';
    if (!$updateAny) {
        $ownerClause = ' AND owner_provider = ? AND owner_id = ?';
        array_push($params, $identity['provider'], $identity['id']);
    }
    $statement = $pdo->prepare('UPDATE vision_projects SET ' . implode(', ', $sets) . ' WHERE public_id = ?' . $ownerClause);
    $statement->execute($params);
    return vision_project_find($pdo, $publicId) ?? throw new RuntimeException('Projet introuvable après modification.');
}
