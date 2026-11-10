<?php
declare(strict_types=1);

require __DIR__.'/bootstrap.php';
require __DIR__.'/organization-exports.php';

$config = api_config();
if (($config['organization_exports_enabled'] ?? false) !== true || api_auth_mode($config) !== 'connect_gateway') {
    api_json(404,['ok'=>false,'error'=>'not_found']);
}
api_require_connect_gate($config);
$identity = api_require_auth($config);
$id = filter_var($identity['id'],FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
if ($identity['provider'] !== 'avereo_connect' || $id === false) api_json(403,['ok'=>false,'error'=>'export_denied']);
$method = $_SERVER['REQUEST_METHOD'];
try {
    $exports = new RapportOrganizationExports(api_pdo($config));
    if ($method === 'GET') {
        $reference = $_GET['reference'] ?? '';
        if (!is_string($reference) || strlen($reference)>760) api_json(422,['ok'=>false,'error'=>'reference_invalid']);
        api_json(200,['ok'=>true,'reports'=>$exports->listing($id,trim($reference))]);
    }
    if ($method !== 'POST') api_json(405,['ok'=>false,'error'=>'method_not_allowed']);
    if (($_SERVER['HTTP_X_AVEREO_EXPORT'] ?? '') !== '1'
        || !str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''),'application/json')) {
        api_json(403,['ok'=>false,'error'=>'export_denied']);
    }
    $body = api_read_json_body(2048);
    if (!is_string($body['id'] ?? null) || !is_string($body['purpose'] ?? null)) {
        api_json(422,['ok'=>false,'error'=>'invalid_export']);
    }
    $bytes = $exports->download($id,$body['id'],$body['purpose']);
    if ($bytes === null) api_json(404,['ok'=>false,'error'=>'report_not_found','message'=>'Dossier indisponible pour cet export.']);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    header('Content-Disposition: attachment; filename="rapport-'.$body['id'].'.json"');
    echo $bytes;
} catch (InvalidArgumentException $failure) {
    api_json(422,['ok'=>false,'error'=>'invalid_export']);
} catch (Throwable $failure) {
    api_json(503,['ok'=>false,'error'=>'export_unavailable','message'=>'Service d’export temporairement indisponible.']);
}
