<?php
declare(strict_types=1);
const AVEREO_GATE_APP = 'passeport-immo';
require dirname(__DIR__) . '/connect/session.php';
require __DIR__ . '/storage.php';
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
header('Content-Type: application/json; charset=utf-8');
function passeport_json(mixed $data, int $status=200): never {
    http_response_code($status); echo json_encode($data,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE); exit;
}
try {
    $config=avereo_gate_config();
    if (empty($config['storage_enabled'])) throw new PasseportError(503,'Stockage serveur non configuré.');
    try { $session=passeport_session($config); } catch (Throwable) { throw new PasseportError(401,'Votre session a expiré. Rouvrez Passeport Immo depuis CONNECT.'); }
    $owner=passeport_identity($session);
    $method=$_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method,['GET','PUT','POST','PATCH'],true)) throw new PasseportError(405,'Méthode non autorisée.');
    if ($method !== 'GET') {
        $origin=(string)($config['storage_origin'] ?? '');
        if ($origin === '' || ($_SERVER['HTTP_ORIGIN'] ?? '') !== $origin
            || !hash_equals(passeport_csrf($config,$session),(string)($_SERVER['HTTP_X_PASSEPORT_CSRF'] ?? ''))) {
            throw new PasseportError(403,'Origine ou autorisation d’écriture invalide.');
        }
        if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0)>105*1024*1024) throw new PasseportError(413,'Requête trop volumineuse.');
    }
    $path=(string)parse_url($_SERVER['REQUEST_URI'] ?? '',PHP_URL_PATH);
    if ($path==='/api/session' && $method==='GET') {
        $profile=$config['storage_profiles'][$owner] ?? ['name'=>'Compte CONNECT','role'=>'user','plan'=>'pro'];
        passeport_json(['user'=>$profile,'csrf'=>passeport_csrf($config,$session),'expiresAt'=>$session['exp'],'storage'=>'server']);
    }
    $store=new PasseportStorage($config,$owner);
    $body=[];
    if ($method!=='GET' && !str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data')) {
        if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) throw new PasseportError(415,'JSON requis.');
        $raw=file_get_contents('php://input',false,null,0,2*1024*1024+1);
        if (strlen($raw)>2*1024*1024) throw new PasseportError(413,'Dossier trop volumineux.');
        try { $body=json_decode($raw,true,64,JSON_THROW_ON_ERROR); } catch (Throwable) { throw new PasseportError(422,'JSON invalide.'); }
        if (!is_array($body)) throw new PasseportError(422,'Corps invalide.');
    }
    if ($path==='/api/workspace') {
        if ($method==='GET') passeport_json($store->workspace());
        if ($method==='PUT') passeport_json($store->saveWorkspace($body));
    }
    if (preg_match('#^/api/biens/([A-Za-z0-9_-]{1,64})/(documents|client)(?:/([a-f0-9]{32})(/file)?)?$#D',$path,$m)) {
        [, $bien, $kind]=$m; $document=$m[3] ?? null; $file=isset($m[4]);
        if ($kind==='client' && !$document && $method==='POST') passeport_json($store->linkClient($bien,$body));
        if ($kind==='documents') {
            if (!$document && $method==='GET') passeport_json($store->load($bien));
            if (!$document && $method==='POST') {
                $upload=$_FILES['files'] ?? null; $files=[];
                if (!is_array($upload) || !is_array($upload['name'] ?? null)) throw new PasseportError(422,'Aucun fichier reçu ou limite serveur dépassée.');
                if (filter_var($_POST['expectedCount'] ?? null,FILTER_VALIDATE_INT)!==count($upload['name'])) throw new PasseportError(422,'Le nombre de fichiers reçus diffère du lot demandé. Réduisez le lot et réessayez.');
                foreach ($upload['name'] as $i=>$name) {
                    if (($upload['error'][$i] ?? -1)!==UPLOAD_ERR_OK) throw new PasseportError(422,'Un fichier n’a pas été reçu entièrement.');
                    $files[]=['path'=>$upload['tmp_name'][$i],'name'=>$name];
                }
                passeport_json($store->addFiles($bien,$files,(string)($_POST['category'] ?? 'autres')),201);
            }
            if ($document && !$file && $method==='PATCH') passeport_json($store->updateDocument($bien,$document,$body));
            if ($document && $file && $method==='GET') {
                $row=$store->findDocument($bien,$document); $file=$store->filePath($row);
                header('Content-Type: '.$row['mime']); header('Content-Length: '.$row['size']);
                header("Content-Disposition: attachment; filename=\"document\"; filename*=UTF-8''".rawurlencode($row['name']));
                header("Content-Security-Policy: sandbox; default-src 'none'"); readfile($file); exit;
            }
        }
    }
    throw new PasseportError(404,'Ressource introuvable.');
} catch (PasseportError $error) { passeport_json(['error'=>$error->getMessage()],$error->status); }
catch (Throwable $error) {
    $reference=bin2hex(random_bytes(6));
    // No filenames, identities, paths or credentials are returned to the browser or log.
    error_log('Passeport storage '.$reference.' '.get_class($error));
    passeport_json(['error'=>'Stockage serveur indisponible. Référence '.$reference],503);
}
