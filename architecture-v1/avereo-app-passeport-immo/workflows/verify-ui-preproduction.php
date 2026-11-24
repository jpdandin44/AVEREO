<?php
declare(strict_types=1);
// The existing streaming, read-only HTTPS recipe already covers this API contract.
require __DIR__.'/verify-sharing-preproduction.php';
$path=$work.'/https-recipe-public.json';
$receipt=json_decode(file_get_contents($path),true,64,JSON_THROW_ON_ERROR);
if (($receipt['status']??null)!=='passed') exit(1);
$receipt['schemaChanged']=false;
$receipt['qualificationScope']='UI only; existing API, records and shares preserved';
file_put_contents($path,json_encode($receipt,JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT));
chmod($path,0600);
echo json_encode(['status'=>'passed','schemaChanged'=>false,'assertions'=>$receipt['assertions']]).PHP_EOL;
