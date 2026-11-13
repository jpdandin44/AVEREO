<?php
declare(strict_types=1);

/**
 * Photos originales privées d'un rapport : liste, lecture et envoi individuel.
 *
 * Même origine, cookie CONNECT existant. Identité ordinaire uniquement : aucune exception
 * administrateur, aucun DELETE, remplacement, partage ni copie dans cette tranche. Les photos
 * restent désactivées tant que photo_originals_enabled n'est pas explicitement vrai.
 */
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/photo-original-store.php';

api_no_options_response();

function photo_originals_refuse(int $status, string $error, string $message): never
{
    api_json($status, ['ok' => false, 'error' => $error, 'message' => $message]);
}

function photo_originals_text(array $source, string $key): string
{
    $value = $source[$key] ?? '';

    return is_string($value) ? $value : '';
}

$config = api_config();
$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');
api_require_connect_gate($config);
$policyPath = trim((string) ($config['connect_trial_access_file'] ?? ''));
if ($method === 'POST' && $policyPath !== '') {
    // Verrou partagé tenu jusqu'à la fin de la requête, comme reports.php : une révocation ne
    // peut pas s'intercaler entre le contrôle du sas et l'écriture de l'original.
    $writeLock = fopen($policyPath . '.lock', 'c');
    if ($writeLock === false || !flock($writeLock, LOCK_SH)) {
        photo_originals_refuse(503, 'storage_unavailable', 'Politique d\'accès indisponible.');
    }
    api_require_connect_gate($config);
}
$identity = api_require_auth($config);
$ownerProvider = (string) ($identity['provider'] ?? '');
$ownerId = (string) ($identity['id'] ?? '');

if (!in_array($method, ['GET', 'POST'], true)) {
    photo_originals_refuse(405, 'method_not_allowed', 'Methode HTTP non autorisee.');
}

if ($method === 'POST') {
    if (($_SERVER['HTTP_X_AVEREO_PHOTO'] ?? '') !== '1') {
        photo_originals_refuse(403, 'photo_header_required', 'En-tête de requête photo manquant.');
    }
    $origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin !== '' && !hash_equals(api_current_origin(), $origin)) {
        photo_originals_refuse(403, 'origin_refused', 'Origine de requête refusée.');
    }
    $fetchSite = strtolower(trim((string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
    if ($fetchSite !== '' && $fetchSite !== 'same-origin') {
        photo_originals_refuse(403, 'origin_refused', 'Origine de requête refusée.');
    }
}

$action = photo_originals_text($_GET, 'action');
if ($method === 'GET' && $action === 'capabilities' && !RapportPhotoOriginalStore::isEnabled($config)) {
    api_json(200, ['ok' => true, 'enabled' => false]);
}
if (!RapportPhotoOriginalStore::isEnabled($config)) {
    photo_originals_refuse(503, 'storage_unavailable', 'Le stockage des originaux n\'est pas activé.');
}

try {
    $webRoots = [(string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), (string) ($_SERVER['CONTEXT_DOCUMENT_ROOT'] ?? ''), dirname(__DIR__)];
    $store = RapportPhotoOriginalStore::fromConfig(api_pdo($config), $config, $webRoots);

    if ($method === 'GET') {
        if ($action === 'capabilities') {
            api_json(200, ['ok' => true] + $store->capabilities());
        }
        $reportId = photo_originals_text($_GET, 'reportId');
        $originalId = photo_originals_text($_GET, 'id');
        if ($originalId === '') {
            api_json(200, ['ok' => true, 'originals' => $store->listForReport($ownerProvider, $ownerId, $reportId)]);
        }

        $opened = $store->open($ownerProvider, $ownerId, $reportId, $originalId);
        $filename = $opened['filename'];
        header('Content-Type: ' . $opened['metadata']['mime']);
        header('Content-Length: ' . $opened['metadata']['bytes']);
        header('Content-Disposition: attachment; filename="' . preg_replace('/[^A-Za-z0-9._-]/', '_', $filename)
            . '"; filename*=UTF-8\'\'' . rawurlencode($filename));
        header('Cache-Control: private, no-store');
        header('X-Content-Type-Options: nosniff');
        header("Content-Security-Policy: default-src 'none'; sandbox");
        http_response_code(200);
        fpassthru($opened['stream']);
        fclose($opened['stream']);
        exit;
    }

    // POST : un seul fichier multipart, champs reportId et sha256.
    $maxBytes = $store->capabilities()['maxOriginalBytes'];
    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($contentLength > $maxBytes + 65536 || ($contentLength > 0 && $_POST === [] && $_FILES === [])) {
        photo_originals_refuse(413, 'file_too_large', 'Photo trop volumineuse pour le stockage des originaux.');
    }
    $file = $_FILES['file'] ?? null;
    if (!is_array($file) || count($_FILES) !== 1 || !is_string($file['name'] ?? null) || !is_string($file['tmp_name'] ?? null)) {
        photo_originals_refuse(422, 'invalid_request', 'Un seul fichier « file » est attendu.');
    }
    $uploadError = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if (in_array($uploadError, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
        photo_originals_refuse(413, 'file_too_large', 'Photo trop volumineuse pour le stockage des originaux.');
    }
    if ($uploadError !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
        photo_originals_refuse(422, 'invalid_image', 'Fichier reçu incomplet ou invalide.');
    }
    $reportId = photo_originals_text($_POST, 'reportId');
    $sha256 = photo_originals_text($_POST, 'sha256');
    if (!preg_match('/^[0-9a-f]{32}$/D', $reportId) || !preg_match('/^[0-9a-fA-F]{64}$/D', $sha256)) {
        photo_originals_refuse(422, 'invalid_request', 'Identifiant de rapport ou empreinte invalide.');
    }

    $original = $store->store($ownerProvider, $ownerId, $reportId, $file['tmp_name'], $sha256, $file['name']);
    api_json(200, ['ok' => true, 'original' => $original]);
} catch (RapportPhotoOriginalException $exception) {
    photo_originals_refuse($exception->status, $exception->errorCode, $exception->getMessage());
} catch (PDOException $exception) {
    // Filet de sécurité : table absente ou base indisponible = 503 générique, sans détail SQL.
    error_log('Rapport photo original: erreur base, SQLSTATE ' . (string) $exception->getCode());
    photo_originals_refuse(503, 'storage_unavailable', 'Le stockage des originaux est indisponible.');
}
