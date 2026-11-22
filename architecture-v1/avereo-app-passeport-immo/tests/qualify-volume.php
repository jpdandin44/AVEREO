<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404);exit; }
require __DIR__.'/../frontend/public/api/storage.php';
require __DIR__.'/../frontend/public/api/publications.php';
$started=microtime(true);$expected=$argv[2]??'accepted';
try {
    $result=PasseportPublications::inspect($argv[1]);
    $status='accepted';$record=['status'=>$status,'jsonBytes'=>$result['files']['dossier-rapport.json']['bytes'],'entries'=>count($result['files'])];
} catch (PasseportError $e) {
    $status='refused';$record=['status'=>$status,'code'=>$e->status,'message'=>$e->getMessage()];
}
$record['seconds']=round(microtime(true)-$started,3);$record['phpPeakBytes']=memory_get_peak_usage(true);$record['memoryLimit']=ini_get('memory_limit');
echo json_encode($record,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT).PHP_EOL;
exit($status===$expected?0:1);
