<?php
declare(strict_types=1);
namespace Avereo\Connect\Administration;

use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Repository\PdoConnectRepository;

/** Global owner only. Existing entitlements and individual refusals remain an upper bound. */
final class ProfileAdministration
{
    public function __construct(private readonly \PDO $pdo, private readonly ProfileCatalog $catalog,
        private readonly TrialPolicyStore $policy, private readonly \Closure $assertGlobalAdministrator) {}

    public function listing(int $actor): array
    {
        ($this->assertGlobalAdministrator)($actor);
        $data=$this->catalog->read();
        $data['actorId']=$actor;
        $data['profiles']=array_values($data['profiles']);
        $data['technicalReportCreation']=(object)$data['technicalReportCreation'];
        $data['audit']=array_slice($data['audit'],-50);
        $data['applications']=$this->pdo->query("SELECT code,name FROM applications WHERE status='active' ORDER BY name,code")->fetchAll(\PDO::FETCH_ASSOC);
        return $data;
    }

    public function update(int $actor, ?string $id, array $input, string $request): array
    {
        ($this->assertGlobalAdministrator)($actor);
        if (array_diff(array_keys($input),['revision','name','description','template','active','applications','reportActions'])!==[]) throw new ApiException(422,'PROFILE_INVALID','Champ de profil inconnu.');
        $profile=array_diff_key($input,['revision'=>true]);
        $profile['id']=$id??'p_'.bin2hex(random_bytes(10));
        ProfileCatalog::validate($profile);
        $known=$this->pdo->query("SELECT code FROM applications WHERE status='active'")->fetchAll(\PDO::FETCH_COLUMN);
        if (array_diff($profile['applications'],$known)!==[]) throw new ApiException(422,'PROFILE_INVALID','Application inconnue ou inactive.');
        return $this->mutate($actor,$input['revision']??null,$request,static function(array &$data) use($id,$profile):array {
            if ($id!==null && !isset($data['profiles'][$id])) throw new ApiException(404,'PROFILE_NOT_FOUND','Profil introuvable.');
            if ($id===null && count($data['profiles'])>=100) throw new ApiException(422,'PROFILE_LIMIT','Limite du catalogue atteinte.');
            foreach ($data['profiles'] as $key=>$existing) if ($key!==$profile['id'] && strcasecmp(trim($existing['name']),trim($profile['name']))===0) throw new ApiException(409,'PROFILE_NAME_EXISTS','Ce nom de profil existe déjà.');
            $before=$data['profiles'][$profile['id']]??null;
            $affected=array_keys(array_filter($data['assignments'],static fn(string $value):bool=>$value===$profile['id']));
            $data['profiles'][$profile['id']]=$profile;
            return ['event'=>$id===null?'profile.create':'profile.update','profileId'=>$profile['id'],'before'=>$before,'after'=>$profile,'affected'=>$affected];
        });
    }

    public function assign(int $actor,int $organization,int $target,array $input,string $request):array
    {
        ($this->assertGlobalAdministrator)($actor);
        if (array_diff(array_keys($input),['revision','profileId'])!==[] || !array_key_exists('profileId',$input)
            || $input['profileId']!==null && !is_string($input['profileId'])) throw new ApiException(422,'PROFILE_INVALID','Affectation de profil invalide.');
        return $this->mutate($actor,$input['revision']??null,$request,function(array &$data) use($actor,$organization,$target,$input):array {
            $s=$this->pdo->prepare("SELECT m.role,u.status,u.archived_from_status FROM users u JOIN memberships m ON m.user_id=u.id JOIN organizations o ON o.id=m.organization_id WHERE u.id=? AND m.organization_id=? AND m.status='active' AND o.status='active'");
            $s->execute([$target,$organization]); $user=$s->fetch(\PDO::FETCH_ASSOC);
            if (!$user || $target===$actor || !in_array($user['role'],['owner','member','viewer','admin'],true)
                || $user['archived_from_status']!==null || !in_array($user['status'],['active','pending'],true)) throw new ApiException(403,'PROFILE_ACCOUNT_PROTECTED','Ce compte ne peut pas recevoir ce profil.');
            $profile=$input['profileId'];
            if ($profile!==null && (!isset($data['profiles'][$profile]) || !$data['profiles'][$profile]['active'])) throw new ApiException(422,'PROFILE_UNAVAILABLE','Choisissez un profil actif.');
            $before=$data['assignments'][(string)$target]??null;
            if ($profile===null) unset($data['assignments'][(string)$target]); else $data['assignments'][(string)$target]=$profile;
            return ['event'=>'profile.assign','accountId'=>$target,'organizationId'=>$organization,'before'=>$before,'after'=>$profile,'affected'=>[$target]];
        });
    }

    public function setTechnicalCreation(int $actor,int $organization,int $target,array $input,string $request):array
    {
        ($this->assertGlobalAdministrator)($actor);
        if (array_diff(array_keys($input),['revision','technicalReport'])!==[] || !is_bool($input['technicalReport']??null)) {
            throw new ApiException(422,'TECHNICAL_ACCESS_INVALID','Choisissez explicitement autorisé ou non autorisé.');
        }
        return $this->mutate($actor,$input['revision']??null,$request,function(array &$data)use($organization,$target,$input):array {
            $s=$this->pdo->prepare("SELECT m.role,u.status,u.archived_from_status FROM users u JOIN memberships m ON m.user_id=u.id JOIN organizations o ON o.id=m.organization_id WHERE u.id=? AND m.organization_id=? AND m.status='active' AND o.status='active'");
            $s->execute([$target,$organization]);$user=$s->fetch(\PDO::FETCH_ASSOC);
            if (!$user || !in_array($user['role'],['owner','member','viewer','admin'],true)
                || $user['archived_from_status']!==null || !in_array($user['status'],['active','pending'],true)) {
                throw new ApiException(403,'TECHNICAL_ACCESS_ACCOUNT_REFUSED','Ce compte ne peut pas recevoir ce droit.');
            }
            $before=$data['technicalReportCreation'][(string)$target]??false;
            $data['technicalReportCreation'][(string)$target]=$input['technicalReport'];
            return ['event'=>'account.technical_report','accountId'=>$target,'organizationId'=>$organization,
                'before'=>$before,'after'=>$input['technicalReport'],'affected'=>[$target]];
        });
    }

    private function mutate(int $actor,mixed $revision,string $request,\Closure $operation):array
    {
        if (!is_int($revision) || $revision<0) throw new ApiException(422,'PROFILE_REVISION_REQUIRED','Rechargez le catalogue avant de modifier un profil.');
        return $this->policy->locked(function()use($actor,$revision,$request,$operation):array {
            ($this->assertGlobalAdministrator)($actor);
            $data=$this->catalog->read();
            if ($data['revision']!==$revision) throw new ApiException(409,'PROFILE_CONFLICT','Le catalogue a changé. Rechargez-le avant de confirmer.');
            $event=$operation($data);
            $ids=array_values(array_unique(array_map('intval',$event['affected'])));
            $data['revision']++;
            $data['audit'][]=array_merge(['at'=>gmdate('c'),'actorId'=>$actor,'requestId'=>$request,'revision'=>$data['revision']],$event);
            $data['audit']=array_slice($data['audit'],-500);
            while (strlen(json_encode($data,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES))>1048576 && count($data['audit'])>1) array_shift($data['audit']);
            ProfileCatalog::encoded($data); // Reject an oversized proposal before withdrawing anyone's access.
            // Fail closed before publishing a new definition. Interrupted publications can be retried.
            foreach ($ids as $id) $this->policy->deny($id);
            ($this->assertGlobalAdministrator)($actor);
            $this->catalog->save($data);
            foreach ($ids as $id) $this->publish($id);
            return ['revision'=>$data['revision'],'affectedAccounts'=>count($ids)]
                + ($event['event']==='account.technical_report' ? ['technicalReport'=>$event['after']]
                    : ['profileId'=>$event['profileId']??$event['after']]);
        });
    }

    private function publish(int $id):void
    {
        $s=$this->pdo->prepare('SELECT status,onboarding_status,access_starts_at,access_ends_at,sessions_revoked_at FROM users WHERE id=?');
        $s->execute([$id]); $u=$s->fetch(\PDO::FETCH_ASSOC);
        if (!$u) { $this->policy->deny($id); return; }
        $this->policy->set($id,['status'=>$u['status']==='active' && $u['onboarding_status']==='completed'?'active':'revoked',
            'not_before'=>$u['access_starts_at']===null?0:(new \DateTimeImmutable($u['access_starts_at'],new \DateTimeZone('UTC')))->getTimestamp(),
            'not_after'=>$u['access_ends_at']===null?PHP_INT_MAX:(new \DateTimeImmutable($u['access_ends_at'],new \DateTimeZone('UTC')))->getTimestamp(),
            'sessions_revoked_at'=>(int)$u['sessions_revoked_at'],
            'applications'=>(new PdoConnectRepository($this->pdo))->listLifecycleApplications($id)]);
    }
}
