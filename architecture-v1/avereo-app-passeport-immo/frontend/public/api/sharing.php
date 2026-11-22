<?php
declare(strict_types=1);

/** Sharing grants never change ownership or the owner's normal write routes. */
final class PasseportSharing
{
    public function __construct(private PasseportStorage $store, private array $config) {}

    public static function alias(string $value): string { return hash('sha256',strtolower(trim($value))); }

    public function directory(): array
    {
        $path=$this->config['document_share_directory']??'';
        $public=realpath(dirname(__DIR__));
        if (!is_string($path) || $path==='' || realpath($path)!==$path || is_link($path)
            || !is_file($path) || filesize($path)>2*1024*1024
            || ($public && str_starts_with($path,$public.'/'))) {
            throw new PasseportError(503,'Le partage attend la vérification des comptes CONNECT. Réessayez dans un instant.');
        }
        $data=json_decode(file_get_contents($path),true,32,JSON_THROW_ON_ERROR);
        if (($data['version']??null)!==1 || ($data['environment']??null)!==($this->config['environment']??null)
            || !is_int($data['generatedAt']??null) || $data['generatedAt']>time()+5 || time()-$data['generatedAt']>180
            || !is_array($data['accounts']??null)) {
            throw new PasseportError(503,'La vérification des comptes CONNECT doit être actualisée. Aucun nouvel accès n’est accordé.');
        }
        return $data['accounts'];
    }

    public static function grants(?string $raw): array
    {
        if ($raw===null) return ['revision'=>0,'grants'=>[]];
        $data=json_decode($raw,true,32,JSON_THROW_ON_ERROR);
        if (!is_array($data) || !is_int($data['revision']??null) || !is_array($data['grants']??null)
            || !array_is_list($data['grants']) || count($data['grants'])>500) throw new RuntimeException('Invalid share state');
        foreach($data['grants']as$g) {
            if (!is_array($g) || !preg_match('/^[a-f0-9]{32}$/D',(string)($g['id']??''))
                || !preg_match('/^avereo_connect:[1-9][0-9]{0,18}$/D',(string)($g['recipient']??''))
                || !is_string($g['label']??null) || !is_string($g['createdAt']??null)
                || !array_key_exists('revokedAt',$g) || ($g['revokedAt']!==null && !is_string($g['revokedAt']))) throw new RuntimeException('Invalid share grant');
        }
        return $data;
    }

    private function eligible(array $accounts,string $owner): bool { return ($accounts[$owner]['eligible']??false)===true; }

    public function resolve(string $alias): array
    {
        PasseportStorage::text($alias,254);$digest=self::alias($alias);$matches=[];
        foreach($this->directory()as$id=>$a) if(in_array($digest,$a['aliases']??[],true)) $matches[$id]=$a;
        if(count($matches)!==1) throw new PasseportError(422,'Compte introuvable ou ambigu. Saisissez son identifiant CONNECT ou son adresse e-mail exacte.');
        $id=array_key_first($matches);$a=$matches[$id];
        if($id===$this->store->owner) throw new PasseportError(422,'Vous êtes déjà propriétaire de ce dossier.');
        if(($a['invitable']??false)!==true) throw new PasseportError(422,'Ce compte ne dispose pas actuellement du droit Passeport Immo.');
        return ['recipient'=>$id,'label'=>$a['label'],'ready'=>($a['eligible']??false)===true];
    }

    public function outgoing(string $bien): array
    {
        $row=$this->store->bien($bien);$state=self::grants($row['document_shares']??null);$accounts=$this->directory();
        foreach($state['grants']as&$g) $g['ready']=$this->eligible($accounts,$g['recipient']);
        unset($g);return $state;
    }

    public function change(string $bien,array $body,?string $revoke=null): array
    {
        $accounts=$this->directory();
        if(!$this->eligible($accounts,$this->store->owner)) throw new PasseportError(403,'Votre droit CONNECT doit être actif pour gérer le partage.');
        if(!is_int($body['revision']??null)) throw new PasseportError(422,'Révision de partage requise.');
        $recipient=$revoke===null?$this->resolve((string)($body['recipient']??'')):null;
        if($revoke===null && ($body['confirm']??null)!==true) throw new PasseportError(422,'Confirmez le destinataire et les documents partagés.');
        if($revoke===null && ($body['expectedRecipient']??null)!==$recipient['recipient']) throw new PasseportError(409,'Le destinataire a changé. Vérifiez à nouveau son compte avant de confirmer.');
        $db=$this->store->db;$db->beginTransaction();
        try {
            $row=$this->store->bien($bien,true);$state=self::grants($row['document_shares']??null);
            if($body['revision']!==$state['revision']) throw new PasseportError(409,'Le partage a changé dans une autre fenêtre. Actualisez la liste.');
            if($revoke!==null) {
                $found=false;
                foreach($state['grants']as&$g) if($g['id']===$revoke){$g['revokedAt']??=PasseportStorage::now();$found=true;}
                unset($g);if(!$found) throw new PasseportError(404,'Partage introuvable.');
            } else {
                foreach($state['grants']as$g) if($g['recipient']===$recipient['recipient'] && $g['revokedAt']===null) throw new PasseportError(409,'Ce compte possède déjà un partage de ce bien.');
                if(count($state['grants'])>=500) throw new PasseportError(422,'Limite de partages atteinte. Contactez l’administrateur.');
                $state['grants'][]=['id'=>PasseportStorage::id(),'recipient'=>$recipient['recipient'],'label'=>$recipient['label'],'createdAt'=>PasseportStorage::now(),'revokedAt'=>null];
            }
            ++$state['revision'];$this->store->query('UPDATE pi_biens SET document_shares=? WHERE owner_id=? AND bien_id=?',[json_encode($state,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),$this->store->owner,$bien]);
            $db->commit();return $this->outgoing($bien);
        }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
    }

    public function incoming(): array
    {
        $accounts=$this->directory();if(!$this->eligible($accounts,$this->store->owner)) return [];
        $rows=$this->store->query('SELECT owner_id,bien_id,model,document_shares FROM pi_biens WHERE deleted_at IS NULL AND document_shares IS NOT NULL')->fetchAll();$result=[];
        foreach($rows as$row) {
            if(!$this->eligible($accounts,$row['owner_id']))continue;
            foreach(self::grants($row['document_shares'])['grants']as$g) if($g['recipient']===$this->store->owner && $g['revokedAt']===null){
                $model=json_decode($row['model'],true,64,JSON_THROW_ON_ERROR);
                $result[]=['id'=>$g['id'],'address'=>(string)($model['address']??'Bien partagé'),'ownerLabel'=>$accounts[$row['owner_id']]['label'],'createdAt'=>$g['createdAt']];
            }
        }
        return $result;
    }

    private function access(string $share): array
    {
        if(!preg_match('/^[a-f0-9]{32}$/D',$share))throw new PasseportError(404,'Partage indisponible.');
        $accounts=$this->directory();
        if(!$this->eligible($accounts,$this->store->owner))throw new PasseportError(404,'Partage indisponible.');
        $rows=$this->store->query('SELECT * FROM pi_biens WHERE deleted_at IS NULL AND document_shares LIKE ?',['%'.$share.'%'])->fetchAll();
        if(count($rows)!==1)throw new PasseportError(404,'Partage indisponible ou révoqué.');
        $row=$rows[0];if(!$this->eligible($accounts,$row['owner_id']))throw new PasseportError(404,'Partage indisponible.');
        foreach(self::grants($row['document_shares'])['grants']as$g) if($g['id']===$share && $g['recipient']===$this->store->owner && $g['revokedAt']===null)return $row;
        throw new PasseportError(404,'Partage indisponible ou révoqué.');
    }

    public function load(string $share): array
    {
        $row=$this->access($share);$model=json_decode($row['model'],true,64,JSON_THROW_ON_ERROR);
        $documents=$this->store->query('SELECT * FROM pi_documents WHERE owner_id=? AND bien_id=? AND archived_at IS NULL AND trashed_at IS NULL ORDER BY added_at DESC,id',[$row['owner_id'],$row['bien_id']])->fetchAll();
        $documents=array_map(static function($d){$d=PasseportStorage::document($d);unset($d['clientId'],$d['bienId']);return $d;},$documents);
        $settings=PasseportStorage::settings($row['document_settings']??null);$ids=array_column($documents,'id');
        foreach($settings['order']as&$order)$order=array_values(array_intersect($order,$ids));unset($order);
        return ['bien'=>['id'=>$share,'address'=>(string)($model['address']??'Bien partagé')],'client'=>null,'clients'=>[],'documents'=>$documents,'settings'=>$settings,'readOnly'=>true];
    }

    public function document(string $share,string $id): array
    {
        $row=$this->access($share);
        $doc=$this->store->query('SELECT * FROM pi_documents WHERE owner_id=? AND bien_id=? AND id=? AND archived_at IS NULL AND trashed_at IS NULL',[$row['owner_id'],$row['bien_id'],$id])->fetch();
        if(!$doc)throw new PasseportError(404,'Document indisponible.');return $doc;
    }
}
