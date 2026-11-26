<?php
declare(strict_types=1);

/** Read the existing CONNECT projection; never grant access from a mission profile. */
function api_can_transfer_to_project(array $config,array $identity,?int $now=null):bool
{
    if(($identity['provider']??'')!=='avereo_connect')return false;
    $path=trim((string)($config['connect_trial_access_file']??''));
    clearstatcache(true,$path);
    if($path===''||!is_file($path)||is_link($path)||!is_readable($path)||filesize($path)>65536)return false;
    try{
        $policy=json_decode((string)file_get_contents($path),true,16,JSON_THROW_ON_ERROR);
        if(($policy['version']??null)!==1||!is_array($policy['accounts']??null))return false;
        $rule=$policy['accounts'][(string)($identity['id']??'')]??null;
        $now??=time();
        return is_array($rule)&&($rule['status']??'')==='active'
            &&is_int($rule['not_before']??null)&&is_int($rule['not_after']??null)
            &&$rule['not_before']>=0&&$now>=$rule['not_before']&&$now<$rule['not_after']
            &&is_array($rule['applications']??null)&&in_array('projet',$rule['applications'],true);
    }catch(Throwable){return false;}
}
