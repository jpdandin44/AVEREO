<?php
declare(strict_types=1);

/** A nomination grants review of one immutable version, never property ownership. */
final class PasseportReviews
{
    public function __construct(private PasseportStorage $store, private array $config) { $this->config+=['report_review_self_validation'=>true]; }

    public static function state(array $bien): array
    {
        if (!array_key_exists('report_reviews',$bien)) throw new PasseportError(503,'La relecture attend la mise à jour de sa base privée.');
        $state=empty($bien['report_reviews'])?['revision'=>0,'items'=>[]]:json_decode($bien['report_reviews'],true,64,JSON_THROW_ON_ERROR);
        if (!is_int($state['revision']??null) || !is_array($state['items']??null) || !array_is_list($state['items']) || count($state['items'])>100) throw new RuntimeException('Invalid review state');
        return $state;
    }

    private function accounts(): array
    {
        if (!is_bool($this->config['report_review_self_validation'])) throw new PasseportError(503,'La configuration de validation experte est invalide.');
        $accounts=(new PasseportSharing($this->store,$this->config))->directory();
        if (($accounts[$this->store->owner]['eligible']??false)!==true) throw new PasseportError(403,'Votre accès CONNECT à Passeport doit être actif.');
        return $accounts;
    }

    public function resolve(string $alias): array
    {
        $accounts=$this->accounts();
        PasseportStorage::text($alias,254); $digest=PasseportSharing::alias($alias); $matches=[];
        foreach ($accounts as $id=>$account) if (in_array($digest,$account['aliases']??[],true)) $matches[$id]=$account;
        if (count($matches)!==1) throw new PasseportError(422,'Compte introuvable ou ambigu. Saisissez son identifiant CONNECT exact.');
        $id=array_key_first($matches); $account=$matches[$id];
        if (($account['eligible']??false)!==true) throw new PasseportError(422,'Le relecteur doit avoir activé son compte CONNECT et son accès Passeport.');
        if ($id===$this->store->owner && $this->config['report_review_self_validation']!==true) throw new PasseportError(422,'Cette configuration demande un second expert distinct du déposant.');
        return ['recipient'=>$id,'label'=>$account['label'],'ready'=>true];
    }

    private function view(array $record, array $row, array $accounts, bool $latest): array
    {
        $wordApproved=self::wordApproved($record);
        return $record + ['bienId'=>$row['bien_id'],'ownerLabel'=>$accounts[$row['owner_id']]['label']??'Propriétaire',
            'isOwner'=>$row['owner_id']===$this->store->owner,'canDecide'=>$record['reviewer']===$this->store->owner && $record['status']==='pending' && $latest,
            'wordApproved'=>$wordApproved,'finalPdf'=>self::activePdf($record),
            'canPreparePdf'=>$latest && $row['owner_id']===$this->store->owner && $wordApproved && in_array($record['status'],['approved','pdf_ready'],true),
            'canPublish'=>$latest && $row['owner_id']===$this->store->owner && $wordApproved && $record['status']==='pdf_ready',
            'isLatest'=>$latest];
    }

    private static function wordApproved(array $record): bool
    {
        if (($record['decision']['action']??null)!=='approve' || ($record['decision']['basis']??null)!=='word') return false;
        foreach (['client','expert'] as $kind) if (($record['decision']['wordSha256'][$kind]??null)!==($record['files']['rapport-'.$kind.'.docx']['sha256']??null)) return false;
        return true;
    }

    private static function activePdf(array $record): ?array
    {
        foreach ($record['finalPdfs']??[] as $pdf) if ($pdf['id']===($record['activeFinalPdfId']??null) && self::wordApproved($record) && $pdf['fromWordSha256']===$record['decision']['wordSha256']['client']) return $pdf;
        return null;
    }

    public function listing(?string $bien=null): array
    {
        $accounts=$this->accounts();
        $rows=$bien===null?$this->store->query('SELECT * FROM pi_biens WHERE deleted_at IS NULL AND report_reviews IS NOT NULL')->fetchAll():[$this->store->bien($bien)];
        $reviews=[]; $revision=0;
        foreach ($rows as $row) {
            if (($accounts[$row['owner_id']]['eligible']??false)!==true) continue;
            $state=self::state($row); $latest=[];
            foreach ($state['items'] as $record) $latest[$record['seriesId']]=$record['id'];
            foreach ($state['items'] as $record) if ($row['owner_id']===$this->store->owner || $record['reviewer']===$this->store->owner) $reviews[]=$this->view($record,$row,$accounts,$latest[$record['seriesId']]===$record['id']);
            if ($bien!==null) $revision=$state['revision'];
        }
        return ['revision'=>$revision,'reviews'=>array_reverse($reviews),'selfValidationAllowed'=>$this->config['report_review_self_validation']];
    }

    private function locate(string $id, bool $lock=false): array
    {
        if (!preg_match('/^[a-f0-9]{32}$/D',$id)) throw new PasseportError(404,'Revue introuvable.');
        $accounts=$this->accounts();
        $rows=$this->store->query('SELECT * FROM pi_biens WHERE deleted_at IS NULL AND report_reviews LIKE ?'.($lock?' FOR UPDATE':''),['%'.$id.'%'])->fetchAll();
        $found=[];
        foreach ($rows as $row) {
            if (($accounts[$row['owner_id']]['eligible']??false)!==true) continue;
            $state=self::state($row); $index=null; $latest=[];
            foreach ($state['items'] as $i=>$record) {
                $latest[$record['seriesId']]=$record['id'];
                if ($record['id']===$id && ($row['owner_id']===$this->store->owner || $record['reviewer']===$this->store->owner)) $index=$i;
            }
            if ($index!==null) $found[]=[$row,$state,$index,$latest[$state['items'][$index]['seriesId']]===$id];
        }
        if (count($found)!==1) throw new PasseportError(404,'Revue introuvable ou accès retiré.');
        return $found[0];
    }

    private function save(array $row, array $state): void
    {
        $json=json_encode($state,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);
        if (strlen($json)>2*1024*1024) throw new PasseportError(422,'Limite de l’historique des revues atteinte.');
        $this->store->query('UPDATE pi_biens SET report_reviews=? WHERE owner_id=? AND bien_id=?',[$json,$row['owner_id'],$row['bien_id']]);
    }

    public function submit(string $bien,string $path,array $body,bool $uploaded=true): array
    {
        $this->store->bien($bien);
        if ($uploaded && !is_uploaded_file($path)) throw new PasseportError(422,'Téléversement invalide.');
        if (($body['confirm']??null)!==true || !is_int($body['revision']??null)) throw new PasseportError(422,'Confirmez la version privée et le relecteur.');
        $recipient=$this->resolve((string)($body['recipient']??''));
        if (($body['expectedRecipient']??null)!==$recipient['recipient']) throw new PasseportError(409,'Le compte a changé. Vérifiez de nouveau le relecteur.');
        $package=PasseportPublications::inspect($path,true); $sha=hash_file('sha256',$path); $size=filesize($path);
        $destination=$this->store->reviewPath($this->store->owner,$bien,$package['id']); $written=false;
        $this->store->db->beginTransaction();
        try {
            $row=$this->store->bien($bien,true); $state=self::state($row);
            if (!$row['client_id']) throw new PasseportError(422,'Associez d’abord le bien à son client.');
            foreach ($state['items'] as $record) if ($record['id']===$package['id']) {
                if ($record['sha256']!==$sha || $record['reviewer']!==$recipient['recipient']) throw new PasseportError(409,'Cette version existe avec un autre contenu ou relecteur.');
                $this->archive($row,$record); $this->store->db->commit(); return ['review'=>$record,'alreadySubmitted'=>true];
            }
            if ($body['revision']!==$state['revision']) throw new PasseportError(409,'Les revues ont changé. Actualisez avant de soumettre.');
            if (count($state['items'])>=100) throw new PasseportError(422,'Ce bien conserve déjà 100 versions de revue.');
            foreach ($state['items'] as &$old) if ($old['seriesId']===$package['seriesId'] && in_array($old['status'],['pending','approved','pdf_ready','corrections'],true)) { $old['status']='superseded'; ++$old['revision']; }
            unset($old);
            $out=@fopen($destination,'x+b'); if (!$out) throw new RuntimeException('Conservation privée indisponible.');
            $written=true; chmod($destination,0600); $in=fopen($path,'rb');
            try { $copied=stream_copy_to_stream($in,$out); } finally { fclose($in); fclose($out); }
            if ($copied!==$size || hash_file('sha256',$destination)!==$sha) throw new RuntimeException('Copie privée différente.');
            $files=$package['files']; unset($files['manifest.json']);
            $record=['id'=>$package['id'],'seriesId'=>$package['seriesId'],'title'=>$package['title'],'reference'=>$package['reference'],
                'preparedAt'=>$package['preparedAt'],'submittedAt'=>PasseportStorage::now(),'reviewer'=>$recipient['recipient'],'reviewerLabel'=>$recipient['label'],
                'status'=>'pending','revision'=>0,'size'=>$size,'sha256'=>$sha,'files'=>$files,'reviewFormat'=>$package['reviewFormat'],'decision'=>null,'documentId'=>null,'finalPdfs'=>[],'activeFinalPdfId'=>null];
            $state['items'][]=$record; ++$state['revision']; $this->save($row,$state);
            $this->store->db->commit(); return ['review'=>$record,'alreadySubmitted'=>false];
        } catch (Throwable $e) {
            if ($this->store->db->inTransaction() && $this->store->db->rollBack() && $written) @unlink($destination);
            throw $e;
        }
    }

    private function archive(array $row,array $record): string
    {
        $path=$this->store->reviewPath($row['owner_id'],$row['bien_id'],$record['id']);
        if (is_link($path) || !is_file($path) || filesize($path)!==$record['size'] || hash_file('sha256',$path)!==$record['sha256']) throw new RuntimeException('Version privée altérée ou indisponible.');
        return $path;
    }

    public function file(string $id,string $kind): array
    {
        [$row,$state,$index]=$this->locate($id); $record=$state['items'][$index];
        if ($kind==='source') {
            if ($row['owner_id']!==$this->store->owner) throw new PasseportError(404,'Copie privée introuvable.');
            return ['path'=>$this->archive($row,$record),'size'=>$record['size'],'sha256'=>$record['sha256'],'mime'=>'application/zip','name'=>'rapport.review.avereo.zip','temporary'=>false];
        }
        if ($kind==='final') {
            if ($row['owner_id']!==$this->store->owner) throw new PasseportError(404,'PDF final privé introuvable.');
            return $this->finalFile($row,$record);
        }
        if (!in_array($kind,['client','expert','word-client','word-expert'],true) || ($row['owner_id']!==$this->store->owner && $record['status']==='cancelled')) throw new PasseportError(404,'Fichier de revue indisponible.');
        return $this->extract($row,$record,$kind);
    }

    private function extract(array $row,array $record,string $kind): array
    {
        $path=$this->archive($row,$record);
        $word=str_starts_with($kind,'word-');$name='rapport-'.($word?substr($kind,5):$kind).($word?'.docx':'.pdf');
        $meta=$record['files'][$name]??null;if (!$meta) throw new PasseportError(404,'Fichier absent de cette version.');
        $zip=new ZipArchive(); if ($zip->open($path,ZipArchive::RDONLY)!==true) throw new RuntimeException('Archive privée indisponible.');
        $temp=tempnam(sys_get_temp_dir(),'pi-review-'); if ($temp===false) throw new RuntimeException('Lecture de revue indisponible.');
        chmod($temp,0600);
        try {
            $in=$zip->getStream($name); $out=fopen($temp,'wb'); if (!$in || !$out) throw new RuntimeException('PDF indisponible.');
            try { $copied=stream_copy_to_stream($in,$out); } finally { fclose($in); fclose($out); }
            if ($copied!==$meta['bytes'] || hash_file('sha256',$temp)!==$meta['sha256']) throw new RuntimeException('PDF différent de la version soumise.');
            return ['path'=>$temp,'size'=>$meta['bytes'],'sha256'=>$meta['sha256'],'mime'=>$word?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'application/pdf','name'=>$name,'temporary'=>true];
        } catch (Throwable $e) { @unlink($temp); throw $e; }
        finally { $zip->close(); }
    }

    private function finalFile(array $row,array $record): array
    {
        $pdf=self::activePdf($record);if (!$pdf) throw new PasseportError(404,'Préparez le PDF après la validation des Word.');
        $path=$this->store->reviewFinalPath($row['owner_id'],$row['bien_id'],$record['id'],$pdf['id']);
        if (is_link($path) || !is_file($path) || filesize($path)!==$pdf['size'] || hash_file('sha256',$path)!==$pdf['sha256']) throw new RuntimeException('PDF final privé différent.');
        return ['path'=>$path,'size'=>$pdf['size'],'sha256'=>$pdf['sha256'],'mime'=>'application/pdf','name'=>'rapport-client-final.pdf','temporary'=>false];
    }

    public function attachPdf(string $id,string $path,array $body,bool $uploaded=true): array
    {
        if ($uploaded && !is_uploaded_file($path)) throw new PasseportError(422,'Téléversement invalide.');
        if (!is_int($body['revision']??null) || ($body['confirmLayout']??null)!==true) throw new PasseportError(422,'Confirmez la conversion du Word client validé et le contrôle de mise en page.');
        $meta=PasseportStorage::inspectFile($path,'rapport-client-final.pdf');$written=false;$destination=null;
        $this->store->db->beginTransaction();
        try {
            [$row,$state,$index,$latest]=$this->locate($id,true);$record=&$state['items'][$index];
            if ($row['owner_id']!==$this->store->owner || !self::wordApproved($record) || !in_array($record['status'],['approved','pdf_ready'],true)) throw new PasseportError(403,'Le propriétaire doit attendre la validation des Word avant de préparer le PDF.');
            if ($record['revision']!==$body['revision'] || !$latest || ($body['fromWordSha256']??null)!==$record['decision']['wordSha256']['client']) throw new PasseportError(409,'La version Word validée a changé. Actualisez avant de préparer le PDF.');
            $this->archive($row,$record);$active=self::activePdf($record);
            if ($active && $active['sha256']===$meta['sha256']) { $this->finalFile($row,$record);$this->store->db->commit();return ['review'=>$record,'alreadyPrepared'=>true]; }
            $record['finalPdfs']??=[];
            if (count($record['finalPdfs'])>=20) throw new PasseportError(422,'Cette revue conserve déjà 20 versions PDF de mise en page.');
            $pdfId=PasseportStorage::id();$destination=$this->store->reviewFinalPath($row['owner_id'],$row['bien_id'],$id,$pdfId);
            $out=@fopen($destination,'x+b');if (!$out) throw new RuntimeException('Conservation du PDF indisponible.');
            $written=true;chmod($destination,0600);$in=fopen($path,'rb');
            try { $copied=stream_copy_to_stream($in,$out); } finally { fclose($in);fclose($out); }
            if ($copied!==$meta['size'] || hash_file('sha256',$destination)!==$meta['sha256']) throw new RuntimeException('Copie du PDF différente.');
            $record['finalPdfs'][]=['id'=>$pdfId,'size'=>$meta['size'],'sha256'=>$meta['sha256'],'fromWordSha256'=>$body['fromWordSha256'],'preparedBy'=>$this->store->owner,'preparedAt'=>PasseportStorage::now(),'layoutConfirmed'=>true];
            $record['activeFinalPdfId']=$pdfId;$record['status']='pdf_ready';++$record['revision'];++$state['revision'];$this->save($row,$state);$result=$record;
            $this->store->db->commit();return ['review'=>$result,'alreadyPrepared'=>false];
        } catch (Throwable $e) {
            if ($this->store->db->inTransaction() && $this->store->db->rollBack() && $written) @unlink($destination);
            throw $e;
        }
    }

    public function change(string $id,array $body): array
    {
        if (!is_int($body['revision']??null) || ($body['confirm']??null)!==true) throw new PasseportError(422,'Confirmez votre décision sur cette version.');
        $action=$body['action']??null; $file=null; $added=[];
        $this->store->db->beginTransaction();
        try {
            [$row,$state,$index,$latest]=$this->locate($id,true); $record=&$state['items'][$index];
            if ($record['revision']!==$body['revision'] || !$latest) throw new PasseportError(409,'Cette version a changé ou a été remplacée. Actualisez les revues.');
            $this->archive($row,$record);
            if (in_array($action,['approve','corrections'],true)) {
                if ($record['reviewer']!==$this->store->owner || $record['status']!=='pending') throw new PasseportError(403,'Seul le relecteur désigné peut décider sur une demande en attente.');
                foreach (['client','expert'] as $kind) if (($body['wordSha256'][$kind]??null)!==$record['files']['rapport-'.$kind.'.docx']['sha256']) throw new PasseportError(409,'Les Word doivent correspondre exactement à la version relue.');
                $comment=$body['comment']??'';
                if (!is_string($comment) || strlen($comment)>8000 || preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/',$comment) || ($action==='corrections' && trim($comment)==='')) throw new PasseportError(422,'Indiquez les corrections demandées (8 000 octets maximum).');
                $record['status']=$action==='approve'?'approved':'corrections';
                $record['decision']=['by'=>$this->store->owner,'at'=>PasseportStorage::now(),'action'=>$action,'comment'=>trim($comment),'basis'=>'word','wordSha256'=>$body['wordSha256']];
            } elseif ($action==='cancel') {
                if ($row['owner_id']!==$this->store->owner || !in_array($record['status'],['pending','approved','pdf_ready','corrections'],true)) throw new PasseportError(403,'Cette demande ne peut pas être retirée par ce compte.');
                $record['status']='cancelled'; $record['cancelledAt']=PasseportStorage::now();
            } elseif ($action==='publish') {
                if ($row['owner_id']!==$this->store->owner || $record['status']!=='pdf_ready' || !self::wordApproved($record)) throw new PasseportError(403,'Validez les Word puis préparez et contrôlez le PDF client avant de publier.');
                $sharing=(new PasseportSharing($this->store,$this->config))->outgoing($row['bien_id']);
                if (($body['shareRevision']??null)!==$sharing['revision']) throw new PasseportError(409,'Les destinataires du bien ont changé. Relisez le périmètre de publication.');
                $file=$this->finalFile($row,$record);
                $existing=$this->store->query('SELECT * FROM pi_documents WHERE owner_id=? AND bien_id=? AND sha256=?',[$row['owner_id'],$row['bien_id'],$file['sha256']])->fetch();
                if ($existing && ($existing['archived_at'] || $existing['trashed_at'])) throw new PasseportError(409,'Le PDF identique est archivé ou dans la corbeille. Restaurez-le explicitement.');
                $result=$this->store->addFiles($row['bien_id'],[['path'=>$file['path'],'name'=>'rapport-client-'.substr($id,0,8).'.pdf']],'diagnostics',true);
                $added=$result['added']; $record['documentId']=$existing['id']??$added[0]['id'];
                $record['status']='published'; $record['publishedAt']=PasseportStorage::now(); $record['publishedBy']=$this->store->owner;
            } else throw new PasseportError(422,'Action de revue inconnue.');
            ++$record['revision']; ++$state['revision']; $this->save($row,$state); $result=$record;
            $this->store->db->commit(); return ['review'=>$result];
        } catch (Throwable $e) {
            if ($this->store->db->inTransaction() && $this->store->db->rollBack()) foreach ($added as $doc) @unlink($this->store->filePath($doc));
            throw $e;
        } finally { if ($file && $file['temporary']) @unlink($file['path']); }
    }
}
