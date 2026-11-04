<?php
declare(strict_types=1);
namespace Avereo\Connect\Administration;

use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Identity\AccountIdentityProvisioner;
use Avereo\Connect\Repository\PdoConnectRepository;

final class AccountAdministration
{
    public function __construct(private readonly \PDO $pdo, private readonly AccountIdentityProvisioner $identity,
        private readonly TrialPolicyStore $policy) {}

    public function create(int $actor, int $organization, array $input, string $requestId): array
    {
        if (array_diff(array_keys($input),['email','displayName','applications','startsAt','endsAt','linkExisting'])!==[]) $this->invalid('Champ inconnu.');
        $email = is_string($input['email']??null) ? strtolower(trim($input['email'])) : '';
        $name = is_string($input['displayName']??null) ? trim($input['displayName']) : '';
        if (!filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($email)>254 || $name==='' || strlen($name)>191) $this->invalid('Nom ou adresse e-mail invalide.');
        $apps=$input['applications']??null;
        if (!is_array($apps) || !array_is_list($apps) || count($apps)<1 || count($apps)>32
            || count(array_filter($apps,'is_string'))!==count($apps) || count(array_unique($apps))!==count($apps)) $this->invalid('Sélectionnez des applications distinctes.');
        $linkExisting = $input['linkExisting'] ?? false;
        if (array_key_exists('linkExisting', $input) && !is_bool($input['linkExisting'])) $this->invalid('Confirmez explicitement le rattachement.');
        [$start,$end]=$this->period($input);
        if ($end!==null && array_diff($apps,['rapport','rga'])!==[]) $this->invalid('L’essai temporaire est disponible pour Rapport et RGA.');
        return $this->policy->locked(function() use($actor,$organization,$email,$name,$apps,$start,$end,$requestId,$linkExisting) {
            $role = $this->authorize($actor,$organization);
            if ($linkExisting && $role !== 'owner') {
                throw new ApiException(403,'IDENTITY_LINK_OWNER_REQUIRED','Seul le propriétaire peut rattacher une identité AVEREO existante.');
            }
            $exists=$this->pdo->prepare('SELECT id FROM users WHERE email_normalized = ?');$exists->execute([$email]);
            if ($exists->fetchColumn()!==false) throw new ApiException(409,'ACCOUNT_EXISTS','Cette adresse possède déjà un compte CONNECT.');
            $available=$this->pdo->prepare("SELECT a.id,a.code FROM applications a INNER JOIN entitlements e ON e.application_id=a.id WHERE e.organization_id=? AND e.status='active' AND a.status='active' AND (e.valid_from IS NULL OR e.valid_from<=UTC_TIMESTAMP(6)) AND (e.valid_to IS NULL OR e.valid_to>UTC_TIMESTAMP(6))");
            $available->execute([$organization]);$byCode=array_column($available->fetchAll(\PDO::FETCH_ASSOC),'id','code');
            if (array_diff($apps,array_keys($byCode))!==[]) $this->invalid('Une application n’est pas disponible dans cette organisation.');
            $subject=$this->identity->provision($email,$name,$requestId,$linkExisting);
            if ($linkExisting) {
                $existing = $this->pdo->prepare('SELECT 1 FROM users WHERE drupal_subject=?');
                $existing->execute([$subject]);
                if ($existing->fetchColumn() !== false) {
                    throw new ApiException(409,'IDENTITY_ALREADY_LINKED','Cette identité AVEREO est déjà rattachée à un compte CONNECT.');
                }
            }
            $this->pdo->beginTransaction();
            try {
                $s=$this->pdo->prepare("INSERT INTO users (drupal_subject,email_normalized,display_name,status,onboarding_status,access_starts_at,access_ends_at,application_access_mode,sessions_revoked_at) VALUES (?,?,?,'active','required',?,?,'explicit',?)");
                $s->execute([$subject,$email,$name,$start,$end,$linkExisting ? time() : null]);$id=(int)$this->pdo->lastInsertId();
                $s=$this->pdo->prepare("INSERT INTO memberships (organization_id,user_id,role,status) VALUES (?,?,'member','active')");$s->execute([$organization,$id]);
                $s=$this->pdo->prepare("INSERT INTO user_application_access (organization_id,user_id,application_id,status,granted_by_user_id) VALUES (?,?,?,'active',?)");
                foreach($apps as $app) $s->execute([$organization,$id,$byCode[$app],$actor]);
                if ($linkExisting) {
                    $pending = $this->pdo->prepare('DELETE FROM pending_identities WHERE drupal_subject=? AND approved_user_id IS NULL');
                    $pending->execute([$subject]);
                }
                $this->policy->deny($id);
                $this->audit($actor,$organization,$id,$linkExisting ? 'user.create_with_identity_link' : 'user.create',$requestId);
                $this->pdo->commit();
                return ['id'=>$id,'email'=>$email,'displayName'=>$name,'onboardingStatus'=>'required','invitationSent'=>false,'identityLinked'=>$linkExisting,
                    'applications'=>$apps,'startsAt'=>$start===null?null:str_replace(' ','T',$start).'Z','endsAt'=>$end===null?null:str_replace(' ','T',$end).'Z'];
            } catch (\Throwable $e) { if($this->pdo->inTransaction())$this->pdo->rollBack(); throw $e; }
        });
    }

    public function updatePeriod(int $actor,int $organization,int $id,array $input,string $requestId): array
    {
        if (array_diff(array_keys($input),['startsAt','endsAt'])!==[]
            || !array_key_exists('startsAt',$input) || !array_key_exists('endsAt',$input))
            $this->invalid('Indiquez explicitement le début et la fin, ou deux valeurs nulles pour un accès permanent.');
        [$start,$end]=$this->period($input);
        return $this->synchronize($id,function() use($actor,$organization,$id,$start,$end,$requestId) {
            $this->authorize($actor,$organization,$id);
            if ($end!==null) {
                $s=$this->pdo->prepare("SELECT a.code FROM user_application_access ua INNER JOIN applications a ON a.id=ua.application_id WHERE ua.user_id=? AND ua.status='active' AND a.code NOT IN ('rapport','rga')");$s->execute([$id]);
                if($s->fetchColumn()!==false) $this->invalid('Retirez les autres applications avant de définir un essai Rapport/RGA.');
            }
            $s=$this->pdo->prepare("UPDATE users SET access_starts_at=?,access_ends_at=? WHERE id=? AND application_access_mode='explicit'");$s->execute([$start,$end,$id]);
            $this->audit($actor,$organization,$id,'user.access_period.update',$requestId);
            return ['id'=>$id,'startsAt'=>$start,'endsAt'=>$end];
        },fn()=>$this->authorize($actor,$organization,$id));
    }

    /** Deny before mutation. On any failure leave the projection denied, never falsely open access. */
    public function synchronize(int $id, callable $operation, ?callable $before = null, bool $lifecycle = false): mixed
    {
        return $this->policy->locked(function () use ($id, $operation, $before, $lifecycle) {
            $query = $this->pdo->prepare('SELECT application_access_mode, archived_from_status, sessions_revoked_at FROM users WHERE id=?');
            $query->execute([$id]);
            $user = $query->fetch(\PDO::FETCH_ASSOC);
            if (!$lifecycle && ($user['archived_from_status'] ?? null) !== null) {
                throw new ApiException(409, 'ACCOUNT_ARCHIVED', 'Restaurez le compte depuis son action dédiée.');
            }
            $explicit = ($user['application_access_mode'] ?? null) === 'explicit';
            $denyBefore = $lifecycle || $explicit;
            if ($denyBefore && $before !== null) $before();
            if ($denyBefore) $this->policy->deny($id);
            $result = $operation();
            // Legacy mutations authorize in the repository. An unauthorized call
            // must not revoke a previously restored inherited account.
            if ($denyBefore || (int) ($user['sessions_revoked_at'] ?? 0) > 0) $this->publish($id);
            return $result;
        });
    }

    private function publish(int $id): void
    {
        $s=$this->pdo->prepare('SELECT status,onboarding_status,access_starts_at,access_ends_at,sessions_revoked_at FROM users WHERE id=?');$s->execute([$id]);$u=$s->fetch(\PDO::FETCH_ASSOC);
        if(!$u)throw new \RuntimeException('Compte indisponible pour publication.');
        $applications = (new PdoConnectRepository($this->pdo))->listLifecycleApplications($id);
        $this->policy->set($id,['status'=>$u['status']==='active' && $u['onboarding_status']==='completed'?'active':'revoked',
            'not_before'=>$u['access_starts_at']===null?0:(new \DateTimeImmutable($u['access_starts_at'],new \DateTimeZone('UTC')))->getTimestamp(),
            'not_after'=>$u['access_ends_at']===null?PHP_INT_MAX:(new \DateTimeImmutable($u['access_ends_at'],new \DateTimeZone('UTC')))->getTimestamp(),
            'sessions_revoked_at'=>(int) $u['sessions_revoked_at'],
            'applications'=>$applications]);
    }

    public function authorize(int $actor,int $organization,?int $target=null,bool $allowArchived=false): string
    {
        $s=$this->pdo->prepare("SELECT m.role FROM memberships m INNER JOIN users u ON u.id=m.user_id INNER JOIN organizations o ON o.id=m.organization_id WHERE m.user_id=? AND m.organization_id=? AND m.status='active' AND o.status='active' AND u.status='active' AND u.onboarding_status='completed'");$s->execute([$actor,$organization]);$role=$s->fetchColumn();
        if(!in_array($role,['owner','admin'],true))throw new ApiException(403,'ADMIN_REQUIRED','Administration de cette organisation requise.');
        if($target!==null){
            $s=$this->pdo->prepare("SELECT m.role,u.application_access_mode,u.archived_from_status FROM memberships m INNER JOIN users u ON u.id=m.user_id WHERE m.organization_id=? AND m.user_id=? AND m.status='active'");$s->execute([$organization,$target]);$u=$s->fetch(\PDO::FETCH_ASSOC);
            if(!$u || $u['application_access_mode']!=='explicit' || !in_array($u['role'],['member','viewer'],true) || $target===$actor)throw new ApiException(403,'ACCOUNT_PROTECTED','Ce compte ne peut pas être modifié par ce parcours.');
            if (!$allowArchived && $u['archived_from_status'] !== null) {
                throw new ApiException(409, 'ACCOUNT_ARCHIVED', 'Ce compte est archivé.');
            }
        }
        return $role;
    }

    public function authorizeApplication(int $actor,int $organization,int $id,string $app,string $status):void
    {
        $this->authorize($actor,$organization,$id);
        $s=$this->pdo->prepare('SELECT access_ends_at FROM users WHERE id=?');$s->execute([$id]);
        if($s->fetchColumn()!==null && $status==='active' && !in_array($app,['rapport','rga'],true))$this->invalid('L’essai temporaire est limité à Rapport et RGA.');
    }

    private function period(array $input): array
    {
        $start=$input['startsAt']??null;$end=$input['endsAt']??null;
        if($start===null && $end===null)return [null,null];
        foreach([$start,$end] as $v) if(!is_string($v) || !preg_match('/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/',$v))$this->invalid('Indiquez deux dates avec leur fuseau horaire.');
        $dates=[];
        foreach([$start,$end] as $v) {
            try {$d=new \DateTimeImmutable($v);}catch(\Throwable){$this->invalid('Dates invalides.');}
            $errors=\DateTimeImmutable::getLastErrors();
            if($errors!==false && ($errors['warning_count'] || $errors['error_count']))$this->invalid('Dates invalides.');
            $dates[]=$d;
        }
        [$a,$b]=$dates;
        if($b<=$a || $b->getTimestamp()<=time())$this->invalid('La fin doit être future et postérieure au début.');
        return [$a->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d H:i:s'),$b->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d H:i:s')];
    }

    private function audit(int $actor,int $organization,int $id,string $action,string $request):void
    {
        $s=$this->pdo->prepare("INSERT INTO audit_events (actor_user_id,organization_id,action,target_type,target_id,outcome,request_id,metadata_json) VALUES (?,?,?,'user',?,'success',?,'{}')");$s->execute([$actor,$organization,$action,(string)$id,$request]);
    }
    private function invalid(string $message):never {throw new ApiException(422,'ACCOUNT_INPUT_INVALID',$message);}
}
