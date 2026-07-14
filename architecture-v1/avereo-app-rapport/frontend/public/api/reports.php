<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

api_no_options_response();

function api_validate_report_payload(array $payload): void
{
    foreach (['titre', 'reference_dossier', 'adresse_logement', 'signature'] as $key) {
        if (array_key_exists($key, $payload) && !is_string($payload[$key])) {
            api_json(422, [
                'ok' => false,
                'error' => 'report_field_invalid',
                'message' => "Le champ {$key} doit etre une chaine.",
            ]);
        }
    }

    if (!isset($payload['observations']) || !is_array($payload['observations']) || count($payload['observations']) > 500) {
        api_json(422, [
            'ok' => false,
            'error' => 'report_observations_invalid',
            'message' => 'La liste des observations est absente ou invalide.',
        ]);
    }

    foreach ($payload['observations'] as $observation) {
        if (!is_array($observation)) {
            api_json(422, [
                'ok' => false,
                'error' => 'report_observation_invalid',
                'message' => 'Une observation est invalide.',
            ]);
        }
        foreach (['id', 'titre', 'piece', 'surface', 'gravite', 'observations', 'actions'] as $key) {
            if (array_key_exists($key, $observation) && !is_string($observation[$key])) {
                api_json(422, [
                    'ok' => false,
                    'error' => 'report_observation_field_invalid',
                    'message' => "Le champ observation.{$key} doit etre une chaine.",
                ]);
            }
        }
        $photos = $observation['photos'] ?? [];
        if (!is_array($photos) || count($photos) > 100) {
            api_json(422, [
                'ok' => false,
                'error' => 'report_photos_invalid',
                'message' => 'La liste des photos est invalide.',
            ]);
        }
        foreach ($photos as $photo) {
            if (!is_array($photo)) {
                api_json(422, [
                    'ok' => false,
                    'error' => 'report_photo_invalid',
                    'message' => 'Une photo est invalide.',
                ]);
            }
            foreach (['src', 'name', 'horodatageISO'] as $key) {
                if (array_key_exists($key, $photo) && !is_string($photo[$key])) {
                    api_json(422, [
                        'ok' => false,
                        'error' => 'report_photo_field_invalid',
                        'message' => "Le champ photo.{$key} doit etre une chaine.",
                    ]);
                }
            }
        }
    }
}

$config = api_config();
$identity = api_require_auth($config);
$canManageAll = api_identity_can_manage_all($identity, $config);

$pdo = api_pdo($config);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = api_trim_text($_GET['id'] ?? '', 32);

    if ($id !== '') {
        $sql = 'SELECT public_id, title, reference_code, address, payload_json, payload_bytes, owner_provider, owner_id, owner_email, created_at, updated_at
             FROM rapport_reports
             WHERE public_id = :id';
        $params = ['id' => $id];
        if (!$canManageAll) {
            $sql .= ' AND owner_provider = :owner_provider AND owner_id = :owner_id';
            $params['owner_provider'] = $identity['provider'];
            $params['owner_id'] = $identity['id'];
        }

        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        $row = $statement->fetch();

        if (!$row) {
            api_json(404, [
                'ok' => false,
                'error' => 'report_not_found',
                'message' => 'Rapport introuvable.',
            ]);
        }

        api_json(200, [
            'ok' => true,
            'report' => array_merge(api_report_summary($row), [
                'payload' => json_decode((string)$row['payload_json'], true),
            ]),
        ]);
    }

    $limit = max(1, min(100, (int)($_GET['limit'] ?? 50)));
    $sql = 'SELECT public_id, title, reference_code, address, payload_bytes, owner_provider, owner_id, owner_email, created_at, updated_at
         FROM rapport_reports
         WHERE (:can_manage_all = 1 OR (owner_provider = :owner_provider AND owner_id = :owner_id))
         ORDER BY updated_at DESC
         LIMIT :limit';
    $statement = $pdo->prepare($sql);
    $statement->bindValue('can_manage_all', $canManageAll ? 1 : 0, PDO::PARAM_INT);
    $statement->bindValue('owner_provider', (string)$identity['provider']);
    $statement->bindValue('owner_id', (string)$identity['id']);
    $statement->bindValue('limit', $limit, PDO::PARAM_INT);
    $statement->execute();

    api_json(200, [
        'ok' => true,
        'reports' => array_map('api_report_summary', $statement->fetchAll()),
    ]);
}

if ($method === 'POST') {
    $maxBytes = (int)($config['max_payload_bytes'] ?? (50 * 1024 * 1024));
    $body = api_read_json_body($maxBytes);
    $payload = $body['report'] ?? $body['payload'] ?? null;

    if (!is_array($payload)) {
        api_json(400, [
            'ok' => false,
            'error' => 'report_payload_missing',
            'message' => 'Payload rapport manquant.',
        ]);
    }
    api_validate_report_payload($payload);

    $id = api_trim_text($body['id'] ?? $body['public_id'] ?? '', 32);
    if ($id === '') {
        $id = bin2hex(random_bytes(16));
    }
    if (!preg_match('/^[a-f0-9]{32}$/', $id)) {
        api_json(400, [
            'ok' => false,
            'error' => 'invalid_report_id',
            'message' => 'Identifiant rapport invalide.',
        ]);
    }

    $ownerProvider = api_trim_text($identity['provider'] ?? '', 32);
    $ownerId = api_trim_text($identity['id'] ?? '', 190);
    $ownerEmail = api_trim_text($identity['email'] ?? '', 190);

    $existingStatement = $pdo->prepare('SELECT owner_provider, owner_id FROM rapport_reports WHERE public_id = :id');
    $existingStatement->execute(['id' => $id]);
    $existing = $existingStatement->fetch();
    if ($existing && !$canManageAll) {
        $sameOwner = hash_equals((string)$existing['owner_provider'], $ownerProvider)
            && hash_equals((string)$existing['owner_id'], $ownerId);
        if (!$sameOwner) {
            api_json(403, [
                'ok' => false,
                'error' => 'report_forbidden',
                'message' => 'Vous ne pouvez pas modifier ce rapport.',
            ]);
        }
    }

    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($json)) {
        api_json(400, [
            'ok' => false,
            'error' => 'report_payload_invalid',
            'message' => 'Rapport impossible a serialiser.',
        ]);
    }

    $payloadBytes = strlen($json);
    if ($payloadBytes > $maxBytes) {
        api_json(413, [
            'ok' => false,
            'error' => 'report_payload_too_large',
            'message' => 'Rapport trop volumineux pour la configuration serveur.',
            'payloadBytes' => $payloadBytes,
            'maxPayloadBytes' => $maxBytes,
        ]);
    }

    $writeValues = [
        'public_id' => $id,
        'title' => api_trim_text($payload['titre'] ?? 'Rapport sans titre', 190),
        'reference_code' => api_trim_text($payload['reference_dossier'] ?? '', 190),
        'address' => api_trim_text($payload['adresse_logement'] ?? '', 255),
        'payload_json' => $json,
        'payload_bytes' => $payloadBytes,
        'owner_provider' => $ownerProvider,
        'owner_id' => $ownerId,
        'owner_email' => $ownerEmail,
        'created_by_id' => $ownerId,
        'updated_by_id' => $ownerId,
    ];

    if ($existing) {
        $updateSql = 'UPDATE rapport_reports
            SET title = :title,
                reference_code = :reference_code,
                address = :address,
                payload_json = :payload_json,
                payload_bytes = :payload_bytes,
                owner_email = IF(owner_email = "", :owner_email, owner_email),
                updated_by_id = :updated_by_id,
                updated_at = CURRENT_TIMESTAMP
            WHERE public_id = :public_id';
        $updateValues = $writeValues;
        unset($updateValues['owner_provider'], $updateValues['owner_id'], $updateValues['created_by_id']);
        if (!$canManageAll) {
            $updateSql .= ' AND owner_provider = :current_owner_provider AND owner_id = :current_owner_id';
            $updateValues['current_owner_provider'] = $ownerProvider;
            $updateValues['current_owner_id'] = $ownerId;
        }
        $statement = $pdo->prepare($updateSql);
        $statement->execute($updateValues);
    } else {
        try {
            $statement = $pdo->prepare(
                'INSERT INTO rapport_reports (public_id, title, reference_code, address, payload_json, payload_bytes, owner_provider, owner_id, owner_email, created_by_id, updated_by_id)
                 VALUES (:public_id, :title, :reference_code, :address, :payload_json, :payload_bytes, :owner_provider, :owner_id, :owner_email, :created_by_id, :updated_by_id)'
            );
            $statement->execute($writeValues);
        } catch (PDOException $exception) {
            if ($exception->getCode() === '23000') {
                api_json(409, [
                    'ok' => false,
                    'error' => 'report_id_conflict',
                    'message' => 'Ce rapport vient d etre cree par une autre requete. Rechargez la liste avant de recommencer.',
                ]);
            }
            error_log('Rapport insert failed with SQLSTATE ' . $exception->getCode());
            api_json(503, [
                'ok' => false,
                'error' => 'report_write_failed',
                'message' => 'Enregistrement du rapport impossible.',
            ]);
        }
    }

    api_json(200, [
        'ok' => true,
        'report' => [
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
            'error' => 'report_id_missing',
                'message' => 'Identifiant rapport manquant.',
        ]);
    }

    $sql = 'DELETE FROM rapport_reports WHERE public_id = :id';
    $params = ['id' => $id];
    if (!$canManageAll) {
        $sql .= ' AND owner_provider = :owner_provider AND owner_id = :owner_id';
        $params['owner_provider'] = $identity['provider'];
        $params['owner_id'] = $identity['id'];
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
