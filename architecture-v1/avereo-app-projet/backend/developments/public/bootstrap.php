<?php
declare(strict_types=1);

function development_entry(string $route):void
{
    header('Cache-Control: no-store, private');header('X-Content-Type-Options: nosniff');header('Referrer-Policy: no-referrer');
    header("Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; base-uri 'none'; frame-ancestors 'self'; form-action 'none'");
    try{
        $public=dirname(__DIR__); // Installed as <webroot>/developpements/.
        if(!defined('AVEREO_GATE_APP'))define('AVEREO_GATE_APP','projet');
        if(!is_file($public.'/connect/gate.php')||!is_readable($public.'/connect/gate.php'))throw new RuntimeException();
        require_once $public.'/connect/gate.php';
        $home=avereo_gate_home_from_path($public);
        $file=getenv('AVEREO_DEVELOPMENTS_CONFIG')?:($home===''?'':$home.'/.avereo/projet-preprod/developments.php');
        $real=$file===''?false:realpath($file);$web=realpath($public);
        if($real===false||$web===false||!is_file($real)||!is_readable($real)||is_link($file)||str_starts_with(strtolower(str_replace('\\','/',$real)),strtolower(rtrim(str_replace('\\','/',$web),'/')).'/'))throw new RuntimeException();
        if(DIRECTORY_SEPARATOR!=='\\'&&(fileperms($real)&0077)!==0)throw new RuntimeException();
        $c=require $real;if(!is_array($c)||($c['enabled']??null)!==true)throw new RuntimeException();
        $runtime=realpath($c['runtime_directory']??'');
        if($runtime===false||!is_dir($runtime)||is_link($c['runtime_directory']??'')||str_starts_with(strtolower(str_replace('\\','/',$runtime)),strtolower(rtrim(str_replace('\\','/',$web),'/')).'/')||$runtime===$web)throw new RuntimeException();
        if(DIRECTORY_SEPARATOR!=='\\'&&(fileperms($runtime)&0077)!==0)throw new RuntimeException();
        foreach(['Failure','SignedMessage','SessionAuthorization','SnapshotReader','Runtime','Factory'] as $name){$code=$runtime.'/'.$name.'.php';if(!is_file($code)||!is_readable($code)||is_link($code))throw new RuntimeException();require_once $code;}
        Avereo\Projet\Developments\Factory::outside($real,$public);
        Avereo\Projet\Developments\Factory::outside($runtime,$public,true);
        $result=Avereo\Projet\Developments\Factory::create($c,avereo_gate_config(),$public)->dispatch($route,$_SERVER,$_COOKIE,$_GET);
        header('Content-Type: '.$result['type']);
        if(isset($result['name'])){header('Content-Security-Policy: sandbox; default-src \'none\'');header('Content-Disposition: '.(!empty($result['attachment'])?'attachment':'inline').'; filename="'.$result['name'].'"');}
        echo $result['body'];
    }catch(Throwable $e){
        $status=$e instanceof Avereo\Projet\Developments\Failure?$e->status:503;
        http_response_code($status);header('Content-Type: application/json; charset=utf-8');
        if($status===405)header('Allow: GET');
        echo '{"error":"Espace privé indisponible."}';
    }
}
