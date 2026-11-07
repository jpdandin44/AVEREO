<?php
declare(strict_types=1);
namespace Avereo\Projet\Developments;

/** No mkdir, lock file, write, repair or canonical-source traversal in this reader. */
final class SnapshotReader
{
    public function __construct(private readonly string $directory,private readonly string $key)
    {
        if(strlen($key)<32||realpath($directory)!==$directory||!is_dir($directory)||is_link($directory))throw new Failure(503);
    }
    private function bytes(string $name,int $limit):string
    {
        if(!preg_match('/^(?:index\\.json|[a-f0-9-]{36}\\.snapshot\\.json)$/D',$name))throw new Failure(503);
        $p=$this->directory.DIRECTORY_SEPARATOR.$name;
        if(!is_file($p)||is_link($p)||realpath($p)!==$p||filesize($p)>$limit)throw new Failure(503);
        $b=file_get_contents($p,false,null,0,$limit+1);if($b===false||strlen($b)>$limit)throw new Failure(503);return $b;
    }
    private function decode(string $raw,int $limit):array
    {
        $e=json_decode($raw,true,64,JSON_THROW_ON_ERROR);
        if(!is_array($e)||count($e)!==2||!is_string($e['payload']??null)||strlen($e['payload'])>$limit||!is_string($e['signature']??null)
            ||!preg_match('/^[a-f0-9]{64}$/D',$e['signature'])||!hash_equals(hash_hmac('sha256',$e['payload'],$this->key),$e['signature']))throw new Failure(503);
        $p=json_decode($e['payload'],true,64,JSON_THROW_ON_ERROR);if(!is_array($p))throw new Failure(503);return $p;
    }
    public function read():array
    {
        $ix=$this->decode($this->bytes('index.json',65536),65536);
        if(($ix['version']??null)!==1||!is_int($ix['highWater']??null)||!is_array($ix['current']??null)
            ||!is_string($ix['current']['file']??null)||!preg_match('/^[a-f0-9]{64}$/D',$ix['current']['hash']??''))throw new Failure(503);
        $raw=$this->bytes($ix['current']['file'],64*1024*1024+1024);
        if(!hash_equals($ix['current']['hash'],hash('sha256',$raw)))throw new Failure(503);
        $d=$this->decode($raw,32*1024*1024);$labels=['Cadrage','Développement local','Préproduction','Mise en production'];
        if(($d['schema']??null)!=='avereo-private-development-snapshot'||($d['version']??null)!==1||!is_int($d['sequence']??null)
            ||$d['sequence']<1||$d['sequence']>$ix['highWater']||!is_string($d['generatedAt']??null)||strtotime($d['generatedAt'])===false
            ||!is_array($d['iterations']??null)||!array_is_list($d['iterations'])||count($d['iterations'])<1||count($d['iterations'])>50
            ||!is_array($d['portfolio']??null)||count($d['portfolio'])>50||!is_array($d['proofs']??null)||count($d['proofs'])>500)throw new Failure(503);
        $ids=[];
        foreach($d['iterations'] as &$item){
            if(!is_array($item)||!preg_match('/^[A-Za-z0-9_-]{1,100}$/D',$item['id']??'')||isset($ids[$item['id']])
                ||($item['writable']??null)!==false||!is_array($item['phases']??null)||array_column($item['phases'],'label')!==$labels
                ||!is_array($item['blockers']??null)||!is_array($item['history']??null)||!is_array($item['declaredApprovals']??null)
                ||!is_array($item['unassignedCriteria']??null)||!is_array($item['candidate']??null)||!is_array($item['versions']??null))throw new Failure(503);
            $ids[$item['id']]=true;$item['writable']=false;$item['writeReason']='Copie de consultation ; aucune écriture dans la source canonique.';
            foreach($item['phases'] as $n=>&$phase){
                if(($phase['id']??null)!==$n||!is_array($phase['criteria']??null)||!is_array($phase['proofs']??null))throw new Failure(503);
                foreach($phase['criteria'] as &$criterion)$criterion['canApprove']=false;unset($criterion);
            }unset($phase);
        }unset($item);
        $apps=[];
        foreach($d['portfolio'] as $app){
            if(!is_array($app)||!preg_match('/^[A-Za-z0-9_-]{1,100}$/D',$app['id']??'')||isset($apps[$app['id']])||!is_array($app['iterations']??null))throw new Failure(503);
            $apps[$app['id']]=true;foreach($app['iterations'] as $it)if(!isset($ids[$it['id']??'']))throw new Failure(503);
        }
        foreach($d['iterations'] as $it)foreach($it['applicationIds']??[] as $id)if(!isset($apps[$id]))throw new Failure(503);
        return ['data'=>$d,'index'=>$ix];
    }
    public function state():array
    {
        ['data'=>$d,'index'=>$ix]=$this->read();
        return ['iterations'=>array_map(static fn($v)=>['id'=>$v['id'],'title'=>$v['title'],'application'=>$v['application'],'applicationIds'=>$v['applicationIds'],
            'status'=>$v['status'],'currentPhase'=>$v['currentPhase'],'versions'=>$v['versions'],'nextAction'=>$v['nextAction'],'blockerCount'=>count($v['blockers']),
            'phases'=>array_map(static fn($p)=>['id'=>$p['id'],'label'=>$p['label'],'status'=>$p['status'],'criteria'=>count($p['criteria']),
                'approved'=>count(array_filter($p['criteria'],static fn($c)=>($c['decision']??'')==='approved'))],$v['phases'])],$d['iterations']),
            'portfolio'=>$d['portfolio'],'snapshot'=>['sequence'=>$d['sequence'],'generatedAt'=>$d['generatedAt'],'receivedAt'=>$ix['receivedAt']??null,
                'restored'=>($ix['restored']??false)===true,'mode'=>'private_read_only_projection']];
    }
    public function iteration(string $id):array
    {
        foreach($this->read()['data']['iterations'] as $item)if($item['id']===$id){$item['readAt']=gmdate('c');return ['iteration'=>$item];}
        throw new Failure(404);
    }
    public function proof(string $id,string $proofId):array
    {
        $d=$this->read()['data'];
        foreach($d['proofs'] as $p)if(($p['iterationId']??null)===$id&&($p['proofId']??null)===$proofId){
            $ext=$p['ext']??'';$types=['.md'=>'text/plain; charset=utf-8','.txt'=>'text/plain; charset=utf-8','.log'=>'text/plain; charset=utf-8','.json'=>'application/json; charset=utf-8','.png'=>'image/png','.jpg'=>'image/jpeg','.jpeg'=>'image/jpeg','.pdf'=>'application/pdf'];
            if(!isset($types[$ext])||!preg_match('/^[A-Za-z0-9_-]{1,100}$/D',$proofId)||!is_string($p['content']??null)||strlen($p['content'])>14*1024*1024)throw new Failure(503);
            $bytes=base64_decode($p['content'],true);
            if($bytes===false||base64_encode($bytes)!==$p['content']||strlen($bytes)>10*1024*1024||!hash_equals($p['sha256']??'',hash('sha256',$bytes)))throw new Failure(503);
            $declared=false;foreach($d['iterations'] as $it)if($it['id']===$id)foreach($it['phases'] as $phase)foreach($phase['proofs'] as $ref)if(($ref['id']??null)===$proofId&&($ref['fileHash']??null)===($p['sha256']??null))$declared=true;
            if(!$declared||$ext==='.png'&&!str_starts_with($bytes,"\x89PNG\r\n\x1a\n")
                ||in_array($ext,['.jpg','.jpeg'],true)&&!str_starts_with($bytes,"\xff\xd8")||$ext==='.pdf'&&!str_starts_with($bytes,'%PDF-'))throw new Failure(503);
            return ['body'=>$bytes,'type'=>$types[$ext],'name'=>$proofId.$ext,'attachment'=>$ext==='.pdf'];
        }
        throw new Failure(404);
    }
}
