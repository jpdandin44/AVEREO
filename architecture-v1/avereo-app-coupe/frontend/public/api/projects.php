<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

api_no_options_response();

$config = api_config();
api_require_token($config);

$pdo = api_pdo($config);
api_ensure_schema($pdo);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = api_trim_text($_GET['id'] ?? '', 32);

    if ($id !== '') {
        $statement = $pdo->prepare(
            'SELECT public_id, name, address, sources, payload_json, payload_bytes, created_at, updated_at
             FROM coupe_projects
             WHERE public_id = :id'
        );
        $statement->execute(['id' => $id]);
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
    $statement = $pdo->prepare(
        'SELECT public_id, name, address, sources, payload_bytes, created_at, updated_at
         FROM coupe_projects
         ORDER BY updated_at DESC
         LIMIT :limit'
    );
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
        'INSERT INTO coupe_projects (public_id, name, address, sources, payload_json, payload_bytes)
         VALUES (:public_id, :name, :address, :sources, :payload_json, :payload_bytes)
         ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            address = VALUES(address),
            sources = VALUES(sources),
            payload_json = VALUES(payload_json),
            payload_bytes = VALUES(payload_bytes),
            updated_at = CURRENT_TIMESTAMP'
    );
    $statement->execute([
        'public_id' => $id,
        'name' => api_trim_text($projectInfo['name'] ?? 'Projet sans nom', 190),
        'address' => api_trim_text($projectInfo['address'] ?? '', 255),
        'sources' => api_trim_text($projectInfo['sources'] ?? '', 255),
        'payload_json' => $json,
        'payload_bytes' => $payloadBytes,
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

    $statement = $pdo->prepare('DELETE FROM coupe_projects WHERE public_id = :id');
    $statement->execute(['id' => $id]);

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
