<?php
declare(strict_types=1);
use Avereo\Connect\Administration\ApplicationAccessDelegations;
use Avereo\Connect\Repository\PdoConnectRepository;
use Avereo\Connect\Http\ApiException;
require dirname(__DIR__).'/src/autoload.php';
require __DIR__.'/account-administration-fixture.php';

function check(bool $ok, string $message): void { if (!$ok) throw new RuntimeException($message); }
function refused(callable $operation): void {
    try { $operation(); } catch (ApiException $e) { check(in_array($e->status,[403,404],true),'Unexpected refusal'); return; }
    throw new RuntimeException('Expected refusal');
}
$pdo=accountTestDatabase();
$mysql=$pdo->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql';
$pdo->exec('CREATE '.($mysql?'TEMPORARY ':'').'TABLE application_access_delegations (membership_id BIGINT PRIMARY KEY, decision_reference VARCHAR(190), expires_at DATETIME NULL)');
$pdo->exec("INSERT INTO organizations(id,name,slug,status) VALUES(8,'B','test-b','active');
    INSERT INTO users (id,drupal_subject,email_normalized,display_name,status,onboarding_status,application_access_mode)
      VALUES (3,'test-client','test-client@example.invalid','Client fictif','active','completed','explicit');
    INSERT INTO memberships(id,organization_id,user_id,role,status) VALUES
      (3,7,3,'member','active'),(4,8,2,'member','active'),(5,8,3,'member','active');
    INSERT INTO entitlements(organization_id,application_id,status,granted_by_user_id) VALUES(8,1,'active',1);
    INSERT INTO application_access_delegations VALUES(2,'fixture-A',NULL),(4,'fixture-B',NULL)");
$repo=new PdoConnectRepository($pdo,new ApplicationAccessDelegations($pdo));
foreach ([7,8] as $org) {
    $snap=$repo->getAccountAdministration(2,$org);
    check($snap['actorRole']==='access_manager' && !$snap['pendingIdentities'] && !$snap['assignableRoles'],'Limited snapshot');
    check(array_column($snap['users'],'id')==[3] && !isset($snap['users'][0]['email']),'Scope of account fields');
    check($snap['users'][0]['canManageApplications'] && empty($snap['users'][0]['canChangeStatus']),'Access-only action');
}
refused(fn()=>$repo->updateUserApplicationAccess(2,7,2,'rapport','active','fixture-self'));
refused(fn()=>$repo->updateUserApplicationAccess(2,7,1,'rapport','active','fixture-owner'));
refused(fn()=>$repo->updateUserStatus(2,7,3,'disabled','fixture-status'));
refused(fn()=>(new PdoConnectRepository($pdo))->getAccountAdministration(2,7));
if ($mysql) {
    foreach ([7,8] as $org) $repo->updateUserApplicationAccess(2,$org,3,'rapport','active','fixture-grant');
    $repo->updateUserApplicationAccess(2,7,3,'rapport','revoked','fixture-revoke');
    $s=$pdo->query('SELECT organization_id,status FROM user_application_access WHERE user_id=3 ORDER BY organization_id');
    check($s->fetchAll(PDO::FETCH_KEY_PAIR)==[7=>'revoked',8=>'active'],'Independent grants and removal');
    check((int)$pdo->query("SELECT COUNT(*) FROM audit_events WHERE actor_user_id=2 AND outcome='success'")->fetchColumn()===3,'Audit of operations');
}
$pdo->exec('DELETE FROM application_access_delegations WHERE membership_id=2');
refused(fn()=>$repo->getAccountAdministration(2,7));
refused(fn()=>$repo->updateUserApplicationAccess(2,7,3,'rapport','active','fixture-withdrawn'));
check($repo->getAccountAdministration(2,8)['actorRole']==='access_manager','Other scope preserved');
$pdo->exec("UPDATE application_access_delegations SET expires_at='2000-01-01' WHERE membership_id=4");
refused(fn()=>$repo->getAccountAdministration(2,8));
echo "PASS CONNECT scopes, protected accounts, revocation and expiration (".($mysql?'MariaDB including grant/remove/audit':'SQLite scope checks').")\n";
