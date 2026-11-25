<?php
declare(strict_types=1);

/** Same private projection and request lock as CONNECT's application/revocation gate. */
function api_profile_access(array $config,array $identity):array
{
    $all=['read','create','update','delete','export'];
    $legacy=['managed'=>false,'profile'=>null,'actions'=>$all,'technicalReport'=>false];
    $path=trim((string)($config['connect_trial_access_file']??''));
    if ($path==='' || ($identity['provider']??'')!=='avereo_connect') return $legacy;
    clearstatcache(true,$path);
    if (!is_file($path) || is_link($path) || filesize($path)>65536) throw new RuntimeException('Politique de profils indisponible.');
    $policy=json_decode((string)file_get_contents($path),true,16,JSON_THROW_ON_ERROR);
    if (($policy['version']??null)!==1 || !is_array($policy['accounts']??null)) throw new RuntimeException('Politique de profils invalide.');
    $rule=$policy['accounts'][(string)$identity['id']]??null;
    if (!is_array($rule)) return $legacy;
    if (array_key_exists('report_technical_create',$rule) && !is_bool($rule['report_technical_create'])) throw new RuntimeException('Droit technique invalide.');
    $legacy['technicalReport']=$rule['report_technical_create']??false;
    if (!array_key_exists('access_profile',$rule)) return $legacy;
    $actions=$rule['report_actions']??null;$profile=$rule['access_profile'];
    if (!is_array($actions) || !array_is_list($actions) || array_diff($actions,$all)!==[] || count(array_unique($actions))!==count($actions)
        || !is_array($profile) || !is_string($profile['id']??null) || !is_string($profile['name']??null)
        || !in_array($profile['template']??null,['habitologue','architecte','maitre_oeuvre'],true)) throw new RuntimeException('Droits de profil invalides.');
    return ['managed'=>true,'profile'=>$profile,'actions'=>$actions,'technicalReport'=>$legacy['technicalReport']];
}

function api_require_profile_action(array $config,array $identity,string $action):void
{
    if (!in_array($action,api_profile_access($config,$identity)['actions'],true)) {
        api_json(403,['ok'=>false,'error'=>'profile_action_refused','message'=>'Cette action n’est pas autorisée par le profil de votre compte.']);
    }
}
