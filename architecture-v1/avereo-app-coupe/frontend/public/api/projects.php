<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

api_no_options_response();

$config = api_config();
$identity = api_require_auth($config);
$canManageAll = api_identity_can_manage_all($identity, $config);

$pdo = api_pdo($config);
api_ensure_schema($pdo);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = api_trim_text($_GET['id'] ?? '', 32);

    if ($id !== '') {
        $sql = 'SELECT public_id, name, address, sources, payload_json, payload_bytes, owner_drupal_uid, owner_email, created_at, updated_at
             FROM coupe_projects
             WHERE public_id = :id';
        $params = ['id' => $id];
        if (!$canManageAll) {
            $sql .= ' AND owner_drupal_uid = :owner_drupal_uid';
            $params['owner_drupal_uid'] = $identity['id'];
        }

        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        $row = $statement->fetch();

        if (!$row) {
            api_json(404, [
                'ok' => false,
                'error' => 'project_not_found',
                'message' => 'Projet introuvable.',
            ]);
        }

        api_json(200, [
            'ok' => true,
            'project' => array_merge(api_project_summary($row), [
                'payload' => json_decode((string)$row['payload_json'], true),
            ]),
        ]);
    }

    $limit = max(1, min(100, (int)($_GET['limit'] ?? 50)));
    $sql = 'SELECT public_id, name, address, sources, payload_bytes, owner_drupal_uid, owner_email, created_at, updated_at
         FROM coupe_projects
         WHERE (:can_manage_all = 1 OR owner_drupal_uid = :owner_drupal_uid)
         ORDER BY updated_at DESC
         LIMIT :limit';
    $statement = $pdo->prepare($sql);
    $statement->bindValue('can_manage_all', $canManageAll ? 1 : 0, PDO::PARAM_INT);
    $statement->bindValue('owner_drupal_uid', (string)$identity['id']);
    $statement->bindValue('limit', $limit, PDO::PARAM_INT);
    $statement->execute();

    api_json(200, [
        'ok' => true,
        'projects' => array_map('api_project_summary', $statement->fetchAll()),
    ]);
}

if ($method === 'POST') {
    $body = api_read_json_body();
    $payload = $body['project'] ?? $body['payload'] ?? null;

    if (!is_array($payload)) {
        api_json(400, [
            'ok' => false,
            'error' => 'project_payload_missing',
            'message' => 'Payload projet manquant.',
        ]);
    }

    $projectInfo = $payload['meta']['projectInfo'] ?? [];
    $id = api_trim_text($body['id'] ?? $body['public_id'] ?? '', 32);
    if ($id === '') {
        $id = bin2hex(random_bytes(16));
    }
    if (!preg_match('/^[a-f0-9]{32}$/', $id)) {
        api_json(400, [
            'ok' => false,
            'error' => 'invalid_project_id',
            'message' => 'Identifiant projet invalide.',
        ]);
    }

    $ownerDrupalUid = ($identity['provider'] ?? '') === 'drupal' ? (string)$identity['id'] : null;
    $ownerEmail = ($identity['provider'] ?? '') === 'drupal' ? (string)$identity['email'] : '';
    $updatedByDrupalUid = ($identity['provider'] ?? '') === 'drupal' ? (string)$identity['id'] : null;

    $existingStatement = $pdo->prepare('SELECT owner_drupal_uid FROM coupe_projects WHERE public_id = :id');
    $existingStatement->execute(['id' => $id]);
    $existing = $existingStatement->fetch();
    if ($existing && !$canManageAll) {
        $existingOwner = trim((string)($existing['owner_drupal_uid'] ?? ''));
        if ($existingOwner !== '' && $existingOwner !== $ownerDrupalUid) {
            api_json(403, [
                'ok' => false,
                'error' => 'project_forbidden',
                'message' => 'Vous ne pouvez pas modifier ce projet.',
            ]);
        }
    }

    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($json)) {
        api_json(400, [
            'ok' => false,
            'error' => 'project_payload_invalid',
            'message' => 'Projet impossible a serialiser.',
        ]);
    }

    $payloadBytes = strlen($json);
    $maxBytes = (int)($config['max_payload_bytes'] ?? (50 * 1024 * 1024));
    if ($payloadBytes > $maxBytes) {
        api_json(413, [
            'ok' => false,
            'error' => 'project_payload_too_large',
            'message' => 'Projet trop volumineux pour la configuration serveur.',
            'payloadBytes' => $payloadBytes,
            'maxPayloadBytes' => $maxBytes,
        ]);
    }

    $statement = $pdo->prepare(
        'INSERT INTO coupe_projects (public_id, name, address, sources, payload_json, payload_bytes, owner_drupal_uid, owner_email, created_by_drupal_uid, updated_by_drupal_uid)
         VALUES (:public_id, :name, :address, :sources, :payload_json, :payload_bytes, :owner_drupal_uid, :owner_email, :created_by_drupal_uid, :updated_by_drupal_uid)
         ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            address = VALUES(address),
            sources = VALUES(sources),
            payload_json = VALUES(payload_json),
            payload_bytes = VALUES(payload_bytes),
            owner_drupal_uid = COALESCE(owner_drupal_uid, VALUES(owner_drupal_uid)),
            owner_email = IF(owner_email = "", VALUES(owner_email), owner_email),
            updated_by_drupal_uid = VALUES(updated_by_drupal_uid),
            updated_at = CURRENT_TIMESTAMP'
    );
    $statement->execute([
        'public_id' => $id,
        'name' => api_trim_text($projectInfo['name'] ?? 'Projet sans nom', 190),
        'address' => api_trim_text($projectInfo['address'] ?? '', 255),
        'sources' => api_trim_text($projectInfo['sources'] ?? '', 255),
        'payload_json' => $json,
        'payload_bytes' => $payloadBytes,
        'owner_drupal_uid' => $ownerDrupalUid,
        'owner_email' => api_trim_text($ownerEmail, 190),
        'created_by_drupal_uid' => $updatedByDrupalUid,
        'updated_by_drupal_uid' => $updatedByDrupalUid,
    ]);

    api_json(200, [
        'ok' => true,
        'project' => [
            'id' => $id,
            'payloadBytes' => $payloadBytes,
        ],
    ]);
}

if ($method === 'DELETE') {
    $id = api_trim_text($_GET['id'] ?? '', 32);
    if ($id === '') {
        api_json(400, [
            'ok' => false,
            'error' => 'project_id_missing',
            'message' => 'Identifiant projet manquant.',
        ]);
    }

    $sql = 'DELETE FROM coupe_projects WHERE public_id = :id';
    $params = ['id' => $id];
    if (!$canManageAll) {
        $sql .= ' AND owner_drupal_uid = :owner_drupal_uid';
        $params['owner_drupal_uid'] = $identity['id'];
    }

    $statement = $pdo->prepare($sql);
    $statement->execute($params);

    api_json(200, [
        'ok' => true,
        'deleted' => $statement->rowCount() > 0,
    ]);
}

api_json(405, [
    'ok' => false,
    'error' => 'method_not_allowed',
    'message' => 'Methode HTTP non autorisee.',
]);
