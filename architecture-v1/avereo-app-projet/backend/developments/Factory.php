<?php
declare(strict_types=1);
namespace Avereo\Projet\Developments;

/** Opt-in only; owner and origin are reused from existing planning configuration. */
final class Factory
{
    public static function outside(string $path,string $public,bool $directory=false):string
    {
        $p=realpath($path);$web=realpath($public);
        if($p===false||$web===false||($directory?!is_dir($p):!is_file($p)))throw new Failure(503);
        $n=str_replace('\\','/',$p);$w=rtrim(str_replace('\\','/',$web),'/');
        if(strtolower($n)===strtolower($w)||str_starts_with(strtolower($n),strtolower($w).'/'))throw new Failure(503);
        for($part=$p;;$part=dirname($part)){if(is_link($part))throw new Failure(503);if(dirname($part)===$part)break;}
        if(DIRECTORY_SEPARATOR!=='\\'&&((fileperms($p)&0077)!==0||function_exists('posix_geteuid')&&fileowner($p)!==posix_geteuid()))throw new Failure(503);
        return $p;
    }
    public static function create(array $c,array $gate,string $public):Runtime
    {
        if(($c['enabled']??null)!==true||($c['environment']??null)!=='preproduction')throw new Failure(503);
        foreach(['planning_config_file','storage_directory','asset_directory','project_channel_key','connect_authorization_url'] as $k)if(!is_string($c[$k]??null)||$c[$k]==='')throw new Failure(503);
        $file=self::outside($c['planning_config_file'],$public);$planning=require $file;
        if(!is_array($planning)||!is_string($planning['owner_connect_id']??null)||($planning['origin']??null)!=='https://projet-preprod.avereo.fr'||!is_string($planning['directory']??null))throw new Failure(503);
        $storage=self::outside($c['storage_directory'],$public,true);$assets=self::outside($c['asset_directory'],$public,true);
        $plan=realpath($planning['directory']);
        if($plan===false)throw new Failure(503);
        $s=strtolower(str_replace('\\','/',$storage));$p=strtolower(str_replace('\\','/',$plan));$a=strtolower(str_replace('\\','/',$assets));
        foreach([$s,$a] as $path)if($path===$p||str_starts_with($path,$p.'/')||str_starts_with($p,$path.'/'))throw new Failure(503);
        if($s===$a||str_starts_with($s,$a.'/')||str_starts_with($a,$s.'/'))throw new Failure(503);
        $keyFile=self::outside($storage.DIRECTORY_SEPARATOR.'publication-key',$public);
        $publicationKey=trim((string)file_get_contents($keyFile));
        if(strlen($publicationKey)<32||strlen($c['project_channel_key'])<32||hash_equals($publicationKey,$c['project_channel_key'])
            ||hash_equals($publicationKey,(string)($gate['connect_launch_secret']??''))||hash_equals($c['project_channel_key'],(string)($gate['connect_launch_secret']??'')))throw new Failure(503);
        $u=parse_url($c['connect_authorization_url']);
        if(!is_array($u)||($u['scheme']??'')!=='https'||!isset($u['host'])||isset($u['user'])||isset($u['pass'])||isset($u['query'])||isset($u['fragment'])
            ||($u['path']??'')!=='/api/v1/developments/authorize')throw new Failure(503);
        $transport=static function(array $message)use($c):array{
            $body='';$h=curl_init($c['connect_authorization_url']);if($h===false)throw new Failure(403);
            curl_setopt_array($h,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>json_encode($message,JSON_THROW_ON_ERROR),CURLOPT_HTTPHEADER=>['Content-Type: application/json','Accept: application/json'],
                CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_TIMEOUT=>5,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,
                CURLOPT_WRITEFUNCTION=>static function($h,string $x)use(&$body):int{if(strlen($body)+strlen($x)>16384)return 0;$body.=$x;return strlen($x);}]);
            $ok=curl_exec($h);$status=curl_getinfo($h,CURLINFO_RESPONSE_CODE);curl_close($h);
            if($ok===false||$status!==200)throw new Failure(403);
            $response=json_decode($body,true,16,JSON_THROW_ON_ERROR);if(!is_array($response['data']??null))throw new Failure(403);return $response['data'];
        };
        return new Runtime(new SessionAuthorization($planning['owner_connect_id'],$planning['origin'],$c['project_channel_key'],$transport),
            $gate,static fn()=>new SnapshotReader($storage,$publicationKey),$assets);
    }
}
