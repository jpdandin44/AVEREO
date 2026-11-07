<?php
declare(strict_types=1);
namespace Avereo\Projet\Developments;

final class Runtime
{
    public function __construct(private readonly SessionAuthorization $authorization,private readonly array $gate,
        private readonly \Closure $reader,private readonly string $assetDirectory){}
    /** Every entry, API and asset follows the same session and live-role check. */
    public function dispatch(string $route,array $server,array $cookies,array $query):array
    {
        if(($server['REQUEST_METHOD']??'')!=='GET')throw new Failure(405);
        $identity=$this->authorization->authorize($server,$cookies,$this->gate);
        if($route==='capability')return $this->json(['available'=>true,'scope'=>'single_global_administrator','identity'=>$identity]);
        if($route==='index')return ['type'=>'text/html; charset=utf-8','body'=>$this->asset('index.html')['body']];
        if($route==='asset')return $this->asset($query['name']??'');
        $reader=($this->reader)();
        if($route==='state')return $this->json($reader->state()+['identity'=>$identity,'csrf'=>null]);
        $id=$query['iteration']??'';if(!is_string($id)||!preg_match('/^[A-Za-z0-9_-]{1,100}$/D',$id))throw new Failure(404);
        if($route==='iteration')return $this->json($reader->iteration($id));
        $proof=$query['proof']??'';
        if($route==='proof'&&is_string($proof)&&preg_match('/^[A-Za-z0-9_-]{1,100}$/D',$proof))return $reader->proof($id,$proof);
        throw new Failure(404);
    }
    private function json(array $value):array{return ['type'=>'application/json; charset=utf-8','body'=>json_encode($value,JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE)];}
    private function asset(mixed $name):array
    {
        if(!is_string($name)||!preg_match('/^(?:index\\.html|[A-Za-z0-9_-]+\\.(?:js|css))$/D',$name))throw new Failure(404);
        $manifestFile=$this->assetDirectory.DIRECTORY_SEPARATOR.'assets.json';
        if(is_link($manifestFile)||realpath($manifestFile)!==$manifestFile||filesize($manifestFile)>65536)throw new Failure(503);
        $manifest=json_decode(file_get_contents($manifestFile),true,8,JSON_THROW_ON_ERROR);
        if(!is_array($manifest)||!is_string($manifest[$name]??null)||!preg_match('/^[a-f0-9]{64}$/D',$manifest[$name]))throw new Failure(404);
        $file=$this->assetDirectory.DIRECTORY_SEPARATOR.$name;
        if(is_link($file)||realpath($file)!==$file||!is_file($file)||filesize($file)>5*1024*1024)throw new Failure(503);
        $bytes=file_get_contents($file);if(!is_string($bytes)||!hash_equals($manifest[$name],hash('sha256',$bytes)))throw new Failure(503);
        $ext=pathinfo($name,PATHINFO_EXTENSION);
        return ['body'=>$bytes,'type'=>['html'=>'text/html; charset=utf-8','js'=>'text/javascript; charset=utf-8','css'=>'text/css; charset=utf-8'][$ext]];
    }
}
