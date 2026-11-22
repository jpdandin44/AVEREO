<?php
declare(strict_types=1);
namespace Avereo\Connect\Administration;

use Avereo\Connect\Http\ApiException;

/** Canonical private catalogue. Mutations use the shared access-policy lock. */
final class ProfileCatalog
{
    public const ACTIONS = ['read', 'create', 'update', 'delete', 'export'];
    public const TEMPLATES = ['habitologue', 'architecte', 'maitre_oeuvre'];

    public function __construct(private readonly string $path)
    {
        $parent = realpath(dirname($path));
        $public = realpath((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''));
        if ($parent === false || !preg_match('~^(?:/|[A-Za-z]:[\\\\/])~', $path) || is_link($path)
            || $public !== false && str_starts_with(strtolower(str_replace('\\', '/', $parent)) . '/', rtrim(strtolower(str_replace('\\', '/', $public)), '/') . '/')) {
            throw new \InvalidArgumentException('Le catalogue doit rester dans un répertoire privé.');
        }
    }

    public static function initial(): array
    {
        $profiles = [];
        foreach (['habitologue'=>'Habitologue', 'architecte'=>'Architecte', 'maitre_oeuvre'=>'Maître d’œuvre'] as $id=>$name) {
            $profiles[$id] = ['id'=>$id, 'name'=>$name, 'description'=>'', 'template'=>$id, 'active'=>true, 'applications'=>[], 'reportActions'=>[]];
        }
        return ['version'=>1, 'revision'=>0, 'profiles'=>$profiles, 'assignments'=>[], 'audit'=>[]];
    }

    public function read(): array
    {
        clearstatcache(true, $this->path);
        if (!is_file($this->path) || is_link($this->path) || filesize($this->path) > 1048576) throw new \RuntimeException('Catalogue privé indisponible.');
        $data = json_decode((string)file_get_contents($this->path), true, 16, JSON_THROW_ON_ERROR);
        if (!is_array($data) || ($data['version']??null)!==1 || !is_int($data['revision']??null)
            || !is_array($data['profiles']??null) || !is_array($data['assignments']??null) || !is_array($data['audit']??null)) throw new \RuntimeException('Catalogue privé invalide.');
        foreach ($data['profiles'] as $id=>$profile) {
            if (!is_string($id) || ($profile['id']??null)!==$id) throw new \RuntimeException('Profil privé invalide.');
            self::validate($profile);
        }
        foreach ($data['assignments'] as $id=>$profile) {
            if (!preg_match('/^[1-9][0-9]*$/D', (string)$id) || !is_string($profile) || !isset($data['profiles'][$profile])) throw new \RuntimeException('Affectation privée invalide.');
        }
        return $data;
    }

    public static function validate(array $profile): void
    {
        if (array_diff(array_keys($profile), ['id','name','description','template','active','applications','reportActions'])!==[]
            || !is_string($profile['id']??null) || !preg_match('/^[a-z][a-z0-9_-]{1,63}$/D', $profile['id'])
            || !is_string($profile['name']??null) || trim($profile['name'])==='' || strlen($profile['name'])>160
            || !is_string($profile['description']??null) || strlen($profile['description'])>1000
            || !in_array($profile['template']??null, self::TEMPLATES, true) || !is_bool($profile['active']??null)) {
            throw new ApiException(422, 'PROFILE_INVALID', 'Nom, description ou parcours du profil invalide.');
        }
        foreach (['applications','reportActions'] as $key) {
            if (!is_array($profile[$key]??null) || !array_is_list($profile[$key]) || count($profile[$key])>32) throw new ApiException(422,'PROFILE_INVALID','Liste de droits invalide.');
            foreach ($profile[$key] as $value) {
                if (!is_string($value) || !preg_match('/^[a-z][a-z0-9_-]{1,63}$/D',$value)) throw new ApiException(422,'PROFILE_INVALID','Droit invalide.');
            }
            if (count(array_unique($profile[$key]))!==count($profile[$key])) throw new ApiException(422,'PROFILE_INVALID','Droit dupliqué.');
        }
        if (array_diff($profile['reportActions'],self::ACTIONS)!==[]
            || $profile['reportActions']!==[] && (!in_array('rapport',$profile['applications'],true) || !in_array('read',$profile['reportActions'],true))
            || in_array('rapport',$profile['applications'],true) && !in_array('read',$profile['reportActions'],true)) {
            throw new ApiException(422,'PROFILE_INVALID','Les actions Rapport demandent son accès et le droit de consultation.');
        }
    }

    public function save(array $data): void
    {
        $bytes=self::encoded($data);
        $temporary=$this->path.'.'.bin2hex(random_bytes(8)).'.tmp';
        try {
            if (file_put_contents($temporary,$bytes,LOCK_EX)!==strlen($bytes)) throw new \RuntimeException('Enregistrement du catalogue impossible.');
            if (!chmod($temporary,0600) || !rename($temporary,$this->path)) throw new \RuntimeException('Publication du catalogue impossible.');
        } finally { if (is_file($temporary)) unlink($temporary); }
    }

    public static function encoded(array $data):string
    {
        $bytes=json_encode($data,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        if(strlen($bytes)>1048576)throw new \RuntimeException('Catalogue privé trop volumineux.');
        return $bytes;
    }

    public function profileFor(int $id): ?array
    {
        $data=$this->read();
        $key=$data['assignments'][(string)$id]??null;
        return $key===null ? null : $data['profiles'][$key];
    }

    public function allowsApplication(int $id, string $application): bool
    {
        $profile=$this->profileFor($id);
        return $profile===null || $profile['active'] && in_array($application,$profile['applications'],true);
    }

    public function filterApplications(int $id, array $applications):array
    {
        $profile=$this->profileFor($id);
        return $profile===null ? $applications : array_values(array_filter($applications,
            static fn(array $app):bool=>$profile['active'] && in_array($app['code'],$profile['applications'],true)));
    }

    public function project(int $id, array $rule): array
    {
        $profile=$this->profileFor($id);
        if ($profile===null) return $rule;
        $rule['applications']= $profile['active'] ? array_values(array_intersect($rule['applications']??[], $profile['applications'])) : [];
        $rule['report_actions']=$profile['active'] ? $profile['reportActions'] : [];
        $rule['access_profile']=['id'=>$profile['id'],'name'=>$profile['name'],'template'=>$profile['template']];
        return $rule;
    }

    public function choices(): array
    {
        return array_values(array_map(static fn(array $p):array=>array_intersect_key($p,array_flip(['id','name','template'])),
            array_filter($this->read()['profiles'],static fn(array $p):bool=>$p['active'])));
    }
}
