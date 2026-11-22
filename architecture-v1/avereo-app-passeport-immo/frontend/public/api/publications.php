<?php
declare(strict_types=1);

/** Owner-only sources are deliberately outside pi_documents and sharing routes. */
final class PasseportPublications
{
    public function __construct(private PasseportStorage $store) {}

    private static function invalid(): never { throw new PasseportError(422, 'Copie Rapport incomplète, altérée ou non prise en charge.'); }

    public static function inspect(string $path): array
    {
        if (!class_exists(ZipArchive::class)) throw new PasseportError(503, 'Import Rapport indisponible sur ce serveur.');
        $limits=avereo_volume_limits();
        if (!is_file($path) || filesize($path) < 22 || filesize($path) > $limits['publicationBytes']) self::invalid();
        $zip = new ZipArchive();
        if ($zip->open($path, ZipArchive::RDONLY) !== true) self::invalid();
        try {
            if ($zip->numFiles < 3 || $zip->numFiles > 2001) self::invalid();
            $files=[]; $total=0;
            for ($i=0; $i<$zip->numFiles; $i++) {
                $s=$zip->statIndex($i); if (!$s) self::invalid();
                $name=$s['name']; $total+=$s['size'];
                if (isset($files[$name]) || !preg_match('#^(manifest\.json|dossier-rapport\.json|rapport-client\.docx|originaux/[a-f0-9]{32}\.(jpg|png|webp))$#D',$name)
                    || $s['comp_method']!==ZipArchive::CM_STORE || $s['size']!==$s['comp_size'] || ($s['encryption_method'] ?? 0)!==0
                    || $s['size']<1 || $total>$limits['publicationBytes'] || ($name==='manifest.json' && $s['size']>65536)
                    || ($name==='dossier-rapport.json' && $s['size']>$limits['reportJsonBytes'])) self::invalid();
                if ($zip->getExternalAttributesIndex($i,$opsys,$attributes) && (($attributes>>16)&0170000)===0120000) self::invalid();
                $stream=$zip->getStream($name); if (!$stream) self::invalid();
                $hash=hash_init('sha256'); $read=hash_update_stream($hash,$stream); fclose($stream);
                if ($read!==$s['size']) self::invalid();
                $files[$name]=['path'=>$name,'bytes'=>$s['size'],'sha256'=>hash_final($hash)];
            }
            try { $manifest=json_decode($zip->getFromName('manifest.json'),true,64,JSON_THROW_ON_ERROR); }
            catch (Throwable) { self::invalid(); }
            if (($manifest['schema']??null)!=='avereo-rapport-publication' || ($manifest['version']??null)!==1
                || !preg_match('/^[a-f0-9]{32}$/D',$manifest['id']??'') || ($manifest['validatedByProfessional']??null)!==true
                || !is_array($manifest['entries']??null) || !array_is_list($manifest['entries']) || count($manifest['entries'])!==count($files)-1
                || !is_array($manifest['originals']??null) || !array_is_list($manifest['originals'])) self::invalid();
            $title=PasseportStorage::text($manifest['title']??null,800);
            $reference=$manifest['reference']??null;
            if (!is_string($reference) || strlen($reference)>800 || preg_match('/[\x00-\x1f\x7f]/',$reference)) self::invalid();
            if (!is_string($manifest['createdAt']??null) || !preg_match('/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?Z$/D',$manifest['createdAt'])) self::invalid();
            $seen=[];
            foreach ($manifest['entries'] as $entry) {
                $name=$entry['path']??'';
                if ($name==='manifest.json' || isset($seen[$name]) || !isset($files[$name]) || ($entry['bytes']??null)!==$files[$name]['bytes'] || ($entry['sha256']??null)!==$files[$name]['sha256']) self::invalid();
                $seen[$name]=true;
            }
            if (!isset($seen['dossier-rapport.json'],$seen['rapport-client.docx'])) self::invalid();
            if (!avereo_volume_has_memory($files['dossier-rapport.json']['bytes'] * 3 + 16 * 1024 * 1024)) throw new PasseportError(503,'Le serveur ne dispose pas de la mémoire nécessaire pour ce dossier. Le paquet complet est conservé sur votre poste.');
            try { $report=json_decode($zip->getFromName('dossier-rapport.json'),true,512,JSON_THROW_ON_ERROR); }
            catch (Throwable) { self::invalid(); }
            if (!is_array($report) || !is_array($report['observations']??null) || !array_is_list($report['observations'])) self::invalid();
            $mapped=[]; $referenced=[]; $reopenedBytes=$files['dossier-rapport.json']['bytes'];
            $jsonFlags=JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_LINE_TERMINATORS;
            if (array_key_exists('onlineReportId',$report)) $reopenedBytes-=strlen(json_encode(['onlineReportId'=>$report['onlineReportId']],$jsonFlags|JSON_THROW_ON_ERROR))-1;
            foreach ($manifest['originals'] as $item) {
                $oi=$item['observationIndex']??null; $pi=$item['photoIndex']??null;
                if (!is_int($oi) || $oi<0 || !is_int($pi) || $pi<0 || isset($mapped[$oi.':'.$pi])) self::invalid();
                $original=$report['observations'][$oi]['photos'][$pi]['original']??null;
                $name=$item['path']??''; $ext=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$item['mime']??'']??null;
                if (!$ext || !is_array($original) || $name!=='originaux/'.($original['id']??'').'.'.$ext || ($original['mime']??null)!==$item['mime']
                    || !isset($files[$name]) || ($original['bytes']??null)!==$files[$name]['bytes'] || ($original['sha256']??null)!==$files[$name]['sha256']) self::invalid();
                $photo=$report['observations'][$oi]['photos'][$pi];$replacement=$photo;
                unset($replacement['original']);$replacement['src']='data:'.$item['mime'].';base64,';
                $reopenedBytes+=strlen(json_encode($replacement,$jsonFlags|JSON_THROW_ON_ERROR))+intdiv($original['bytes']+2,3)*4-strlen(json_encode($photo,$jsonFlags|JSON_THROW_ON_ERROR));
                $mapped[$oi.':'.$pi]=true; $referenced[$name]=true;
            }
            if ($reopenedBytes>$limits['reportJsonBytes']) throw new PasseportError(422,'Cette copie dépasserait '.avereo_volume_label($limits['reportJsonBytes']).' après réouverture avec ses originaux. Le paquet complet est conservé.');
            foreach ($report['observations'] as $oi=>$observation) {
                if (!is_array($observation) || (isset($observation['photos']) && (!is_array($observation['photos']) || !array_is_list($observation['photos'])))) self::invalid();
                foreach ($observation['photos']??[] as $pi=>$photo) if (isset($photo['original']) && !isset($mapped[$oi.':'.$pi])) self::invalid();
            }
            foreach ($files as $name=>$entry) if (str_starts_with($name,'originaux/') && !isset($referenced[$name])) self::invalid();
            return ['id'=>$manifest['id'],'title'=>$title,'reference'=>$reference,'preparedAt'=>$manifest['createdAt'],'files'=>$files];
        } finally { $zip->close(); }
    }

    private function records(array $bien): array
    {
        if (!array_key_exists('report_publications',$bien)) throw new PasseportError(503, 'Publication Rapport indisponible : mise à jour de la base requise.');
        return $bien['report_publications'] ? json_decode($bien['report_publications'],true,64,JSON_THROW_ON_ERROR) : [];
    }
    public function listing(string $bien): array { return ['publications'=>array_values($this->records($this->store->bien($bien)))]; }
    public function source(string $bien,string $id): array
    {
        $record=$this->records($this->store->bien($bien))[$id]??null;
        if (!$record) throw new PasseportError(404,'Copie privée introuvable.');
        $path=$this->store->publicationPath($bien,$id);
        if (is_link($path) || !is_file($path) || filesize($path)!==$record['size'] || hash_file('sha256',$path)!==$record['sha256']) throw new RuntimeException('Copie privée indisponible.');
        return ['path'=>$path,'record'=>$record];
    }
    public function publish(string $bien,string $path,bool $uploaded=true): array
    {
        if ($uploaded && !is_uploaded_file($path)) throw new PasseportError(422,'Téléversement invalide.');
        $this->store->bien($bien); // Check ownership before opening the archive.
        $package=self::inspect($path); $sha=hash_file('sha256',$path); $size=filesize($path);
        $db=$this->store->db; $added=[]; $written=false; $temporary=null;
        $destination=$this->store->publicationPath($bien,$package['id']);
        $db->beginTransaction();
        try {
            $row=$this->store->bien($bien,true); $records=$this->records($row);
            if (!$row['client_id']) throw new PasseportError(422,'Reliez d’abord le bien à son client.');
            if (isset($records[$package['id']])) {
                if ($records[$package['id']]['sha256']!==$sha) throw new PasseportError(409,'Cette version existe avec un contenu différent. Préparez une nouvelle version dans Rapport.');
                $this->source($bien,$package['id']);
                $final=$this->store->query('SELECT id,archived_at,trashed_at FROM pi_documents WHERE owner_id=? AND bien_id=? AND id=?',[$this->store->owner,$bien,$records[$package['id']]['documentId']])->fetch();
                if (!$final || $final['archived_at'] || $final['trashed_at']) throw new PasseportError(409,'La copie privée est conservée mais sa restitution a été retirée. Restaurez le document ou préparez une nouvelle version.');
                $db->commit(); return ['publication'=>$records[$package['id']],'alreadyPublished'=>true];
            }
            if (count($records)>=1000) throw new PasseportError(422,'Ce bien contient déjà 1 000 versions Rapport.');
            $temporary=tempnam(sys_get_temp_dir(),'pi-final-'); chmod($temporary,0600);
            $zip=new ZipArchive(); if ($zip->open($path,ZipArchive::RDONLY)!==true) self::invalid();
            try { $in=$zip->getStream('rapport-client.docx'); $out=fopen($temporary,'wb'); $copied=stream_copy_to_stream($in,$out); fclose($in); fclose($out); }
            finally { $zip->close(); }
            if ($copied!==$package['files']['rapport-client.docx']['bytes'] || hash_file('sha256',$temporary)!==$package['files']['rapport-client.docx']['sha256']) self::invalid();
            $word=new ZipArchive(); if ($word->open($temporary,ZipArchive::RDONLY)!==true) self::invalid();
            try { if ($word->locateName('[Content_Types].xml')===false || $word->locateName('word/document.xml')===false) self::invalid(); }
            finally { $word->close(); }
            $existing=$this->store->query('SELECT * FROM pi_documents WHERE owner_id=? AND bien_id=? AND sha256=?',[$this->store->owner,$bien,$package['files']['rapport-client.docx']['sha256']])->fetch();
            if ($existing && ($existing['archived_at'] || ($existing['trashed_at']??null))) throw new PasseportError(409,'La restitution identique est archivée ou dans la corbeille. Restaurez-la avant de publier.');
            $result=$this->store->addFiles($bien,[['path'=>$temporary,'name'=>'rapport-client-'.substr($package['id'],0,8).'.docx']],'diagnostics',true);
            $added=$result['added']; $documentId=$existing['id']??$added[0]['id'];
            $out=@fopen($destination,'x+b'); if (!$out) throw new RuntimeException('Conservation privée impossible.');
            $written=true; chmod($destination,0600); $in=fopen($path,'rb'); $copied=stream_copy_to_stream($in,$out); fclose($in); fflush($out); fclose($out);
            if ($copied!==$size || hash_file('sha256',$destination)!==$sha) throw new RuntimeException('Conservation privée différente.');
            $record=['id'=>$package['id'],'title'=>$package['title'],'reference'=>$package['reference'],'preparedAt'=>$package['preparedAt'],'publishedAt'=>PasseportStorage::now(),'documentId'=>$documentId,'size'=>$size,'sha256'=>$sha];
            $records[$record['id']]=$record;
            $this->store->query('UPDATE pi_biens SET report_publications=? WHERE owner_id=? AND bien_id=?',[json_encode($records,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),$this->store->owner,$bien]);
            $db->commit(); return ['publication'=>$record,'alreadyPublished'=>false];
        } catch (Throwable $error) {
            if ($db->inTransaction() && $db->rollBack()) {
                if ($written) @unlink($destination);
                foreach ($added as $doc) @unlink($this->store->filePath($doc));
            }
            throw $error;
        } finally { if ($temporary) @unlink($temporary); }
    }
}
