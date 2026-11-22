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
        if(!preg_match('/^(?:index\\.json|publisher-status\\.json|[a-f0-9-]{36}\\.snapshot\\.json)$/D',$name))throw new Failure(503);
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
            ||!is_array($d['iterations']??null)||!array_is_list($d['iterations'])||count($d['iterations'])<1||count($d['iterations'])>100
            ||!is_array($d['portfolio']??null)||count($d['portfolio'])>5000||!is_array($d['proofs']??null)||count($d['proofs'])>500)throw new Failure(503);
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
        $this->inventory($d['githubSnapshot']['inventory']??null);
        return ['data'=>$d,'index'=>$ix];
    }
    /** GitHub metadata in the signed projection; never repository contents or credentials. */
    private function inventory(mixed $v):void
    {
        if($v===null)return;
        $ok=static function(bool $valid):void{if(!$valid)throw new Failure(503);};
        $list=static fn($x,$max)=>is_array($x)&&array_is_list($x)&&count($x)<=$max;
        $text=static fn($x,$max=600)=>is_string($x)&&preg_match('/^[^\x00-\x1f\x7f]{0,'.$max.'}$/uD',$x);
        $sha=static fn($x)=>is_string($x)&&preg_match('/^[a-f0-9]{40,64}$/D',$x);
        $ok(is_array($v)&&($v['schema']??null)==='avereo-github-inventory'&&($v['version']??null)===1&&preg_match('/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/D',$v['owner']??'')
            &&is_string($v['observedAt']??null)&&strtotime($v['observedAt'])!==false&&($v['coverage']??null)==='public_and_accessible_private_repositories_all_returned_pages'
            &&$list($v['repositories']??null,1000)&&$list($v['projects']??null,5000)&&$list($v['pullRequests']??null,10000)&&$list($v['limitations']??null,30));
        foreach($v['limitations'] as $s)$ok((bool)$text($s));
        $repos=[];$prs=[];$projects=[];$branchNames=[];
        foreach($v['repositories'] as $r){
            $name=$r['repository']??'';$url='https://github.com/'.$name;
            $ok(is_array($r)&&preg_match('/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/D',$name)&&strtolower(explode('/',$name)[0])===strtolower($v['owner'])&&!isset($repos[$name])&&($r['url']??null)===$url
                &&in_array($r['visibility']??null,['public','private'],true)&&is_bool($r['archived']??null)&&$text($r['defaultBranch']??null,255)&&$r['defaultBranch']!==''&&is_bool($r['empty']??null)
                &&($r['empty']?($r['headSha']??null)===null:$sha($r['headSha']??null))&&$list($r['branches']??null,10000)&&$list($r['pullRequestUrls']??null,10000));
            $repos[$name]=true;$names=[];
            foreach($r['branches'] as $b){$ok(is_array($b)&&$text($b['name']??null,255)&&$b['name']!==''&&!isset($names[$b['name']])&&$sha($b['headSha']??null)&&($b['url']??null)===$url.'/tree/'.$b['headSha']&&is_bool($b['isDefault']??null)&&$list($b['openPrs']??null,10000));$names[$b['name']]=true;}
            $branchNames[$name]=$names;$defaults=array_filter($r['branches'],static fn($b)=>$b['isDefault']);
            $ok($r['empty']?count($r['branches'])===0:count($defaults)===1&&count(array_filter($defaults,static fn($b)=>$b['name']===$r['defaultBranch']&&$b['headSha']===$r['headSha']))===1);
        }
        foreach($v['pullRequests'] as $p){$repo=$p['repository']??'';$number=$p['number']??null;$url='https://github.com/'.$repo.'/pull/'.$number;
            $ok(is_array($p)&&isset($repos[$repo])&&is_int($number)&&$number>0&&($p['url']??null)===$url&&!isset($prs[$url])&&$text($p['title']??null)&&in_array($p['state']??null,['open','closed','merged'],true)&&is_bool($p['draft']??null)&&$sha($p['headSha']??null)&&$sha($p['baseSha']??null));$prs[$url]=$repo;
        }
        foreach($v['repositories'] as $r){foreach($r['pullRequestUrls'] as $url)$ok(is_string($url)&&($prs[$url]??null)===$r['repository']);foreach($r['branches'] as $b)foreach($b['openPrs'] as $url)$ok(is_string($url)&&($prs[$url]??null)===$r['repository']);}
        foreach($v['projects'] as $p){
            $id=$p['id']??'';$path=$p['path']??null;$repo=$p['repository']??'';
            $ok(is_array($p)&&preg_match('/^[a-z0-9_-]{1,100}$/D',$id)&&!isset($projects[$id])&&isset($repos[$repo])&&$text($path,1000)&&!str_starts_with($path,'/')&&!str_contains($path,'\\')
                &&($path===''||!array_intersect(explode('/',$path),['','..','.']))&&$text($p['name']??null)&&$text($p['kind']??null)&&is_bool($p['inDefaultBranch']??null)&&is_bool($p['historical']??null)&&$sha($p['headSha']??null)&&$sha($p['treeSha']??null)
                &&($p['url']??null)==='https://github.com/'.$repo.'/tree/'.$p['headSha'].($path!==''?'/'.implode('/',array_map('rawurlencode',explode('/',$path))):'')&&$list($p['branches']??null,10000)&&$list($p['markers']??null,30));
             $ok(count($p['branches'])>0&&count(array_unique($p['branches']))===count($p['branches']));foreach($p['branches'] as $b)$ok($text($b,255)&&isset($branchNames[$repo][$b]));foreach($p['markers'] as $m)$ok((bool)$text($m));$projects[$id]=true;
        }
    }
    /** Optional bounded metadata, never a filesystem traversal on the host. */
    private function patrimony(mixed $p):?array
    {
        if($p===null)return null;
        $keys=static fn($v,$ks)=>is_array($v)&&count($v)===count($ks)&&!array_diff(array_keys($v),$ks);
        $id=static fn($v)=>is_string($v)&&preg_match('/^[a-z0-9_-]{1,100}$/D',$v);
        $text=static fn($v)=>is_string($v)&&preg_match('/^.{0,600}$/usD',$v)&&!preg_match('/[\x00-\x1f<>]|[a-z]:[\\\\\/]|\/home\//i',$v);
        $date=static fn($v)=>is_string($v)&&str_contains($v,'T')&&strtotime($v)!==false;
        $list=static fn($v,$max)=>is_array($v)&&array_is_list($v)&&count($v)<=$max;
        $states=['observed','partial','unavailable','not_configured'];
        if(!$keys($p,['schema','version','collectedAt','scope','mode','sources','metrics','exclusions','limitations'])
            ||$p['schema']!=='avereo-development-patrimony'||$p['version']!==1||!$date($p['collectedAt'])||$p['scope']!=='AVEREO-reference'||$p['mode']!=='metadata_only_read_only'
            ||!$list($p['sources'],20)||!$list($p['metrics'],30)||!$list($p['exclusions'],30)||!$list($p['limitations'],30))throw new Failure(503);
        foreach(array_merge($p['exclusions'],$p['limitations']) as $value)if(!$text($value))throw new Failure(503);
        $sources=[];$metrics=[];
        foreach($p['sources'] as $s){
            if(!$keys($s,['id','label','status','asOf','sha256'])||!$id($s['id'])||isset($sources[$s['id']])||!$text($s['label'])||!in_array($s['status'],$states,true)
                ||$s['asOf']!==null&&!$date($s['asOf'])||$s['sha256']!==null&&(!is_string($s['sha256'])||!preg_match('/^[a-f0-9]{64}$/D',$s['sha256'])))throw new Failure(503);
            $sources[$s['id']]=true;
        }
        foreach($p['metrics'] as $m){
            if(!$keys($m,['id','label','value','unit','status','sourceId','asOf','meaning','items'])||!$id($m['id'])||isset($metrics[$m['id']])||!$text($m['label'])||!$text($m['unit'])||!$text($m['meaning'])
                ||!is_string($m['sourceId'])||!isset($sources[$m['sourceId']])||!in_array($m['status'],$states,true)||$m['asOf']!==null&&!$date($m['asOf'])||!$list($m['items'],5000))throw new Failure(503);
            if($m['value']!==null&&(!is_int($m['value'])||$m['value']<0||$m['value']>9007199254740991)||in_array($m['status'],['unavailable','not_configured'],true)&&$m['value']!==null
                ||$m['status']==='observed'&&$m['value']!==count($m['items'])||$m['status']==='partial'&&($m['value']===null||$m['value']<count($m['items'])))throw new Failure(503);
            $ids=[];foreach($m['items'] as $i){
                if(!$keys($i,['id','label','kind','applicationIds'])||!$id($i['id'])||isset($ids[$i['id']])||!$text($i['label'])||!$text($i['kind'])||!$list($i['applicationIds'],50))throw new Failure(503);
                foreach($i['applicationIds'] as $app)if(!$id($app))throw new Failure(503);$ids[$i['id']]=true;
            }$metrics[$m['id']]=true;
        }
        if(strlen(json_encode($p,JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE))>2*1024*1024)throw new Failure(503);
        return $p;
    }
    private function publisherStatus():?array
    {
        try{
            $p=$this->decode($this->bytes('publisher-status.json',16384),8192);
            $keys=['schema','version','mode','status','startedAt','finishedAt','lastSuccessAt','githubObservedAt','sourcesReceivedAt','sourceDigest','sequence','intervalSeconds','errorCode','credentialExpiresAt'];
            if(count($p)!==count($keys)||array_diff(array_keys($p),$keys)||($p['schema']??null)!=='avereo-private-publisher-status'||($p['version']??null)!==1||($p['mode']??null)!=='scheduled'
                ||!in_array($p['status']??null,['ok','failed'],true)||!is_int($p['sequence']??null)||$p['sequence']<1||!is_int($p['intervalSeconds']??null)||$p['intervalSeconds']<60||$p['intervalSeconds']>3600
                ||!preg_match('/^[a-f0-9]{64}$/D',$p['sourceDigest']??'')||!in_array($p['errorCode']??null,['','publication_failed'],true))return null;
            foreach(['startedAt','finishedAt','lastSuccessAt','githubObservedAt','sourcesReceivedAt','credentialExpiresAt'] as $k)if($p[$k]!==null&&(!is_string($p[$k])||strtotime($p[$k])===false))return null;
            if($p['startedAt']===null||$p['finishedAt']===null)return null;
            return $p;
        }catch(\Throwable){return null;}
    }
    private static function quality(array $v):array
    {
        $criteria=$v['unassignedCriteria']??[];$proofs=[];
        foreach($v['phases'] as $p){$criteria=array_merge($criteria,$p['criteria']);foreach($p['proofs'] as $proof)$proofs[$proof['id']]=$proof;}
        foreach($v['unassignedProofs']??[] as $proof)$proofs[$proof['id']]=$proof;
        $c=['total'=>count($criteria),'approved'=>0,'unlinked'=>0,'brokenLinks'=>0,'stale'=>0,'changesRequested'=>0,'unassigned'=>count($v['unassignedCriteria']??[])];
        foreach($criteria as $item){$decision=$item['decision']??'';if($decision==='approved')$c['approved']++;if($decision==='stale')$c['stale']++;if($decision==='changes_requested')$c['changesRequested']++;
            if(empty($item['proofIds']))$c['unlinked']++;
            if(array_diff($item['proofIds']??[],array_column($item['proofs']??[],'id')))$c['brokenLinks']++;
        }
        $p=['total'=>count($proofs),'available'=>0,'external'=>0,'unpublished'=>0,'missing'=>0,'stale'=>0,'unversioned'=>0,'undated'=>0];
        foreach($proofs as $item){$availability=$item['availability']??'';
            if($availability==='available')$p['available']++;elseif($availability==='reference')$p['external']++;elseif(($item['sourceAvailability']??'')==='available')$p['unpublished']++;else $p['missing']++;
            if(($item['freshness']??'')==='stale')$p['stale']++;
            if(empty($item['sourceSha'])&&empty($item['artifactSha256']))$p['unversioned']++;
            if(empty($item['observedAt'])||strtotime($item['observedAt'])===false)$p['undated']++;
        }
        return ['criteria'=>$c,'proofs'=>$p];
    }
    public function state():array
    {
        ['data'=>$d,'index'=>$ix]=$this->read();
        return ['publisherStatus'=>$this->publisherStatus(),'iterations'=>array_map(static fn($v)=>['id'=>$v['id'],'quality'=>self::quality($v),'title'=>$v['title'],'application'=>$v['application'],'applicationIds'=>$v['applicationIds'],
            'revision'=>$v['revision']??null,'status'=>$v['status'],'currentPhase'=>$v['currentPhase'],'versions'=>$v['versions'],'nextAction'=>$v['nextAction'],'blockerCount'=>count($v['blockers']),
            'phases'=>array_map(static fn($p)=>['id'=>$p['id'],'label'=>$p['label'],'status'=>$p['status'],'criteria'=>count($p['criteria']),
                'approved'=>count(array_filter($p['criteria'],static fn($c)=>($c['decision']??'')==='approved'))],$v['phases'])],$d['iterations']),
            'portfolio'=>$d['portfolio'],'patrimony'=>$this->patrimony($d['patrimony']??null),'githubSnapshot'=>$d['githubSnapshot']??null,'githubRefreshAvailable'=>false,'snapshot'=>['sequence'=>$d['sequence'],'generatedAt'=>$d['generatedAt'],'receivedAt'=>$ix['receivedAt']??null,
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
            $declared=false;foreach($d['iterations'] as $it)if($it['id']===$id)foreach(array_merge(...array_merge(array_column($it['phases'],'proofs'),[$it['unassignedProofs']??[]])) as $ref)if(($ref['id']??null)===$proofId&&($ref['fileHash']??null)===($p['sha256']??null))$declared=true;
            if(!$declared||$ext==='.png'&&!str_starts_with($bytes,"\x89PNG\r\n\x1a\n")
                ||in_array($ext,['.jpg','.jpeg'],true)&&!str_starts_with($bytes,"\xff\xd8")||$ext==='.pdf'&&!str_starts_with($bytes,'%PDF-'))throw new Failure(503);
            return ['body'=>$bytes,'type'=>$types[$ext],'name'=>$proofId.$ext,'attachment'=>$ext==='.pdf'];
        }
        throw new Failure(404);
    }
}
