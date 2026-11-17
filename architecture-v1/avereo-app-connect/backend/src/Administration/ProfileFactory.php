<?php
declare(strict_types=1);
namespace Avereo\Connect\Administration;

use Avereo\Connect\Repository\PdoConnectRepository;
use Avereo\Connect\Security\AuthContext;

final class ProfileFactory
{
    public static function create(string $file,string $documentRoot,\PDO $pdo,PdoConnectRepository $repository,
        AuthContext $auth,string $policyPath,string $identityIssuer,array $otherSecrets=[]):array
    {
        $public=realpath($documentRoot);
        if ($public===false) throw new \RuntimeException('Racine publique indisponible.');
        $private=static function(string $path)use($public):string {
            $real=realpath($path);
            if ($real===false || !is_file($real) || is_link($path)
                || str_starts_with(strtolower(str_replace('\\','/',$real)),rtrim(strtolower(str_replace('\\','/',$public)),'/').'/')) throw new \RuntimeException('Fichier privé requis.');
            return $real;
        };
        $c=require $private($file);
        if (!is_array($c) || ($c['enabled']??null)!==true || !is_int($c['owner_connect_id']??null)) throw new \RuntimeException('Configuration des profils indisponible.');
        foreach (['catalogue_file','identity_url','identity_issuer','identity_key'] as $k) if (!is_string($c[$k]??null)||$c[$k]==='') throw new \RuntimeException('Configuration des profils incomplète.');
        $u=parse_url($c['identity_url']);$issuer=parse_url($identityIssuer);
        if ($c['identity_issuer']!==rtrim($identityIssuer,'/') || !is_array($u) || !is_array($issuer)
            || ($u['scheme']??'')!=='https' || ($u['host']??null)!==($issuer['host']??null)
            || ($u['port']??443)!==($issuer['port']??443) || ($u['path']??'')!=='/avereo/profiles/authorization'
            || isset($u['user']) || isset($u['pass']) || isset($u['query']) || isset($u['fragment'])) throw new \RuntimeException('Cible Identité des profils refusée.');
        foreach ($otherSecrets as $secret) if (is_string($secret)&&$secret!==''&&hash_equals($secret,$c['identity_key'])) throw new \RuntimeException('Clé dédiée aux profils requise.');
        $catalog=new ProfileCatalog($private($c['catalogue_file'])); $catalog->read();
        $account=static function(int $id)use($repository,$auth):array {
            $p=$repository->findUserProfile($id);
            return ['subject'=>(string)$p['drupalSubject'],'active'=>$auth->authenticatedAt!==null && $auth->authenticatedAt>0
                && $auth->drupalSubject===(string)$p['drupalSubject']
                && $repository->findIdentityStatusByDrupalSubject((string)$p['drupalSubject'])==='active'
                && !$repository->isAccountSessionRevoked($id,$auth->authenticatedAt)];
        };
        $transport=static function(array $envelope)use($c):array {
            $h=curl_init($c['identity_url']);if($h===false)throw new \RuntimeException('Identité indisponible.');$body='';
            curl_setopt_array($h,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>json_encode($envelope,JSON_THROW_ON_ERROR),
                CURLOPT_HTTPHEADER=>['Content-Type: application/json','Accept: application/json'],CURLOPT_FOLLOWLOCATION=>false,
                CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_TIMEOUT=>5,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,
                CURLOPT_WRITEFUNCTION=>static function($h,string $chunk)use(&$body):int{if(strlen($body)+strlen($chunk)>16384)return 0;$body.=$chunk;return strlen($chunk);}]);
            try {$ok=curl_exec($h);$status=curl_getinfo($h,CURLINFO_RESPONSE_CODE);}finally{curl_close($h);}
            if($ok===false||$status!==200)throw new \RuntimeException('Identité indisponible.');
            $reply=json_decode($body,true,16,JSON_THROW_ON_ERROR);if(!is_array($reply))throw new \RuntimeException('Identité indisponible.');return $reply;
        };
        $guard=new GlobalProfileAdministrator($c['owner_connect_id'],$c['identity_key'],$c['identity_issuer'],$account,$transport);
        $policy=new TrialPolicyStore($policyPath,$catalog);
        return [$catalog,$policy,new ProfileAdministration($pdo,$catalog,$policy,$guard->assert(...))];
    }
}
