<?php
declare(strict_types=1);
require dirname(__DIR__).'/frontend/public/api/project-access.php';
$path=tempnam(sys_get_temp_dir(),'rapport-project-');$config=['connect_trial_access_file'=>$path];$identity=['provider'=>'avereo_connect','id'=>'42'];$count=0;
function check(bool $ok,string $label):void{global $count;if(!$ok)throw new RuntimeException($label);$count++;}
$rule=['status'=>'active','not_before'=>100,'not_after'=>200,'applications'=>['rapport','projet']];
$write=static function(array $row)use($path):void{file_put_contents($path,json_encode(['version'=>1,'accounts'=>['42'=>$row]],JSON_THROW_ON_ERROR));};
try{
 $write($rule);check(api_can_transfer_to_project($config,$identity,150),'Explicit active access');
 foreach([99,200,201]as$time)check(!api_can_transfer_to_project($config,$identity,$time),'Time boundary');
 foreach([['status'=>'disabled'],['applications'=>['rapport']],['not_before'=>'100'],['not_after'=>null]]as$variation){$write(array_replace($rule,$variation));check(!api_can_transfer_to_project($config,$identity,150),'Refused policy');}
 $write($rule);check(!api_can_transfer_to_project($config,['provider'=>'drupal','id'=>'42'],150),'No legacy provider grant');
 check(!api_can_transfer_to_project($config,['provider'=>'avereo_connect','id'=>'43','roles'=>['administrateur_rapport']],150),'No administrator implicit grant');
 check(!api_can_transfer_to_project([],$identity,150),'Absent projection');
 $write($rule);check(api_can_transfer_to_project($config,$identity,150),'Access initially granted');$write(array_replace($rule,['applications'=>['rapport']]));check(!api_can_transfer_to_project($config,$identity,150),'Withdrawal read again');
 file_put_contents($path,'invalid');check(!api_can_transfer_to_project($config,$identity,150),'Broken projection');
 file_put_contents($path,str_repeat(' ',65537));check(!api_can_transfer_to_project($config,$identity,150),'Oversized projection');
 echo json_encode(['status'=>'passed','checks'=>$count]).PHP_EOL;
}finally{unlink($path);}
