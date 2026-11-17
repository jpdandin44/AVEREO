<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/autoload.php';
require __DIR__.'/account-administration-fixture.php';
require __DIR__.'/report-transfer-fixture.php';
require dirname(__DIR__,2).'/integrations/drupal/avereo_identity_bridge/src/Security/ProfileRoleAssertion.php';
require dirname(__DIR__,3).'/avereo-app-rapport/frontend/public/api/profile-access.php';

use Avereo\Connect\Administration\{ProfileCatalog,ProfileAdministration,TrialPolicyStore,GlobalProfileAdministrator};
use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Repository\PdoConnectRepository;
use Drupal\avereo_identity_bridge\Security\ProfileRoleAssertion;

$count=0;
function check(bool $ok,string $message):void {global $count;if(!$ok)throw new RuntimeException($message);$count++;echo "PASS $message\n";}
function refused(callable $operation,int $status,string $message):void {
    try{$operation();}catch(ApiException $e){check($e->status===$status,$message);return;}throw new RuntimeException('Expected refusal: '.$message);
}
$dir=sys_get_temp_dir().'/avereo-profiles-'.bin2hex(random_bytes(8));mkdir($dir,0700);
$catalog=new ProfileCatalog($dir.'/catalogue.json');$catalog->save(ProfileCatalog::initial());
$policyPath=$dir.'/access.json';file_put_contents($policyPath,'{"version":1,"accounts":{}}');chmod($policyPath,0600);
$policy=new TrialPolicyStore($policyPath,$catalog);$pdo=accountTestDatabase();
$pdo->exec("UPDATE users SET drupal_subject='10' WHERE id=1; UPDATE users SET application_access_mode='explicit' WHERE id=2; UPDATE users SET sessions_revoked_at=0; INSERT INTO user_application_access VALUES (7,2,1,'active',1),(7,2,2,'active',1)");
$pdo->exec("INSERT INTO users(id,drupal_subject,email_normalized,display_name,status,onboarding_status,sessions_revoked_at) VALUES(3,'30','owner2@example.invalid','Other owner','active','completed',0); INSERT INTO memberships VALUES(3,7,3,'owner','active')");
$before=[];foreach(['users','memberships','user_application_access','entitlements'] as $table)$before[$table]=$pdo->query('SELECT * FROM '.$table)->fetchAll();
$active=true;$global=true;$seen=[];$key=str_repeat('profiles-dedicated-key-',3);$issuer='https://identity.example.invalid';
$authority=new ProfileRoleAssertion($key,$issuer,'10',static function(string $id)use(&$active,&$global):array{return ['active'=>$active,'adminRole'=>'administrator','adminRoleIsGlobal'=>$global,'hasAdminRole'=>$global];},static function(string $nonce,int $exp)use(&$seen):bool{if(isset($seen[$nonce]))return false;$seen[$nonce]=true;return true;});
$guard=new GlobalProfileAdministrator(1,$key,$issuer,static function(int $id)use(&$active):array{return ['active'=>$active,'subject'=>'10'];},$authority->decide(...));
$service=new ProfileAdministration($pdo,$catalog,$policy,$guard->assert(...));
try {
    check(count($service->listing(1)['profiles'])===3,'three seed types, no implicit account assignment');
    check($catalog->profileFor(2)===null,'existing account remains unmanaged');
    $legacy=new PdoConnectRepository($pdo,null,$catalog);
    check($legacy->canLaunchApplication(2,'rga'),'legacy application access preserved');
    refused(fn()=>$service->listing(2),403,'organization member cannot administer global catalogue');
    $global=false;refused(fn()=>$service->listing(1),403,'exact owner without native global role refused');$global=true;
    $active=false;refused(fn()=>$service->listing(1),403,'inactive native owner refused');$active=true;
    $input=['revision'=>0,'name'=>'Conseiller rénovation','description'=>'Profil de recette','template'=>'habitologue','active'=>true,'applications'=>['rapport'],'reportActions'=>['read','export']];
    refused(fn()=>$service->update(1,null,$input+['globalAdmin'=>true],'test'),422,'unknown privilege field refused');
    $result=$service->update(1,null,$input,'create');$id=$result['profileId'];
    check(str_starts_with($id,'p_')&&$result['revision']===1,'custom type persisted with server-generated identifier');
    refused(fn()=>$service->update(1,null,$input,'stale'),409,'stale revision refused');
    refused(fn()=>$service->assign(1,7,1,['revision'=>1,'profileId'=>$id],'self'),403,'owner self-assignment protected');
    refused(fn()=>$service->assign(1,8,2,['revision'=>1,'profileId'=>$id],'foreign'),403,'foreign organization target refused');
    $service->assign(1,7,2,['revision'=>1,'profileId'=>$id],'assign');
    $data=$catalog->read();check($data['assignments'][2]===$id,'account assignment persisted');
    $rule=json_decode(file_get_contents($policyPath),true)['accounts'][2];
    check($rule['applications']===['rapport']&&$rule['report_actions']===['read','export'],'private projection contains exact allowed actions');
    check(!$legacy->canLaunchApplication(2,'rga')&&$legacy->canLaunchApplication(2,'rapport'),'assigned profile filters catalogue and launch');
    check(array_column($legacy->listApplications(2,7),'code')===['rapport'],'organization application list obeys profile');
    check($legacy->listLifecycleApplications(2)===['rapport'],'lifecycle publication obeys profile');
    $access=api_profile_access(['connect_trial_access_file'=>$policyPath],['provider'=>'avereo_connect','id'=>'2']);
    check($access['managed']&&$access['actions']===['read','export'],'Rapport reads assigned actions for the same identity');
    $prefs=new Avereo\Connect\Account\Preferences($dir.'/preferences');$prefs->save(2,['professionalProfile'=>'architecte']);
    check($catalog->profileFor(2)['reportActions']===['read','export'],'self-declared profession never changes rights');
    $edit=$data['profiles'][$id];unset($edit['id']);$edit['reportActions']=['read'];$edit['revision']=2;
    $service->update(1,$id,$edit,'revoke-export');
    check(api_profile_access(['connect_trial_access_file'=>$policyPath],['provider'=>'avereo_connect','id'=>'2'])['actions']===['read'],'open session sees export revocation without cached rights');
    $policy->locked(fn()=>$policy->set(2,['status'=>'active','not_before'=>0,'not_after'=>PHP_INT_MAX,'applications'=>['rapport','rga']]));
    check(json_decode(file_get_contents($policyPath),true)['accounts'][2]['report_actions']===['read'],'later account policy publication cannot drop profile restrictions');
    $edit['revision']=3;$edit['active']=false;$service->update(1,$id,$edit,'disable');
    check(!$legacy->canLaunchApplication(2,'rapport'),'disabled assigned type withdraws access');
    refused(fn()=>$service->assign(1,7,2,['revision'=>4,'profileId'=>$id],'inactive'),422,'inactive type cannot be newly assigned');
    $service->assign(1,7,2,['revision'=>4,'profileId'=>null],'remove');
    check($legacy->canLaunchApplication(2,'rga'),'explicit removal restores previous application access');
    check(!api_profile_access(['connect_trial_access_file'=>$policyPath],['provider'=>'avereo_connect','id'=>'2'])['managed'],'explicit removal restores legacy actions');
    foreach($before as $table=>$rows)check($rows===$pdo->query('SELECT * FROM '.$table)->fetchAll(),'unchanged database table '.$table);
    check(count($catalog->read()['audit'])===5,'durable audit contains only successful changes');
    $reports=new PDO('sqlite::memory:',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    createReportTransferSqliteSchema($reports);seedReportTransferFixture($reports);
    $transfers=new Avereo\Connect\Administration\ReportTransfers($pdo,$legacy,static fn()=>$reports,[7=>[1]]);
    $service->assign(1,7,3,['revision'=>5,'profileId'=>'architecte'],'other-owner');
    check($catalog->profileFor(3)['id']==='architecte','global administrator can assign another organization owner without changing roles');
    check(!in_array(3,array_column($transfers->listing(1,7,2)['recipients'],'id')),'profile without Rapport excludes a transfer recipient');
    refused(fn()=>$transfers->transfer(1,7,2,['reportId'=>str_repeat('a',32),'operationId'=>str_repeat('d',32),'recipientId'=>3,'reason'=>'Recette profil']),409,'transfer rechecks profile application restriction');
    $service->assign(1,7,3,['revision'=>6,'profileId'=>null],'restore-other-owner');
    check($catalog->profileFor(3)===null,'other owner restored explicitly without changing memberships');
    check(in_array(3,array_column($transfers->listing(1,7,2)['recipients'],'id')),'removing profile restores eligible transfer recipient');
    $old=$catalog->read();unlink($dir.'/catalogue.json');
    try{$catalog->profileFor(2);throw new LogicException('Missing catalogue accepted');}catch(RuntimeException $e){check(!$e instanceof LogicException,'missing catalogue fails closed');}
    $catalog->save($old);
    echo "Profile checks: $count passed\n";
} finally {
    foreach(glob($dir.'/preferences/*')?:[] as $file)unlink($file);
    if(is_dir($dir.'/preferences'))rmdir($dir.'/preferences');
    foreach(glob($dir.'/*')?:[] as $file)if(is_file($file))unlink($file);
    rmdir($dir);
}
