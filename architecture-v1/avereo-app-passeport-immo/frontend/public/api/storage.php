<?php
declare(strict_types=1);

final class PasseportError extends RuntimeException
{
    public function __construct(public readonly int $status, string $message) { parent::__construct($message); }
}

final class PasseportStorage
{
    public const CATEGORIES = ['diagnostics', 'plans', 'urbanisme', 'travaux', 'juridique', 'autres'];
    public PDO $db;
    private string $directory;

    public function __construct(private array $config, public readonly string $owner)
    {
        $this->db = new PDO($config['storage_dsn'], $config['storage_user'], $config['storage_password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $this->directory = rtrim($config['storage_directory'], '/');
        $real = realpath($this->directory);
        $public = realpath(dirname(__DIR__));
        if (!$real || $real !== $this->directory || is_link($this->directory)
            || ($public && ($real === $public || str_starts_with($real, $public . '/')))) {
            throw new RuntimeException('Répertoire privé indisponible.');
        }
    }

    public static function now(): string { return gmdate('Y-m-d\TH:i:s\Z'); }
    public static function id(): string { return bin2hex(random_bytes(16)); }
    public static function text(mixed $value, int $max): string
    {
        if (!is_string($value) || trim($value) === '' || strlen($value) > $max
            || preg_match('/[\x00-\x1f\x7f]/', $value)) {
            throw new PasseportError(422, 'Texte absent ou invalide.');
        }
        return trim($value);
    }
    public function query(string $sql, array $args = []): PDOStatement
    {
        $statement = $this->db->prepare($sql); $statement->execute($args); return $statement;
    }
    public function workspace(): array
    {
        $this->query('INSERT IGNORE INTO pi_workspaces(owner_id,settings) VALUES (?,?)', [$this->owner, '{}']);
        // One consistent snapshot includes revision, settings and property models.
        $this->db->beginTransaction();
        try {
            $row = $this->query('SELECT * FROM pi_workspaces WHERE owner_id=? FOR UPDATE', [$this->owner])->fetch();
            $biens = $this->query('SELECT model FROM pi_biens WHERE owner_id=? AND deleted_at IS NULL ORDER BY bien_id', [$this->owner])->fetchAll();
            $this->db->commit();
            return ['revision' => (int) $row['revision'], 'tarifs' => json_decode($row['settings'], true, 64, JSON_THROW_ON_ERROR),
                'biens' => array_map(fn($b) => json_decode($b['model'], true, 64, JSON_THROW_ON_ERROR), $biens)];
        } catch (Throwable $error) { $this->db->rollBack(); throw $error; }
    }
    public function saveWorkspace(array $body): array
    {
        if (!is_int($body['revision'] ?? null) || !is_array($body['biens'] ?? null)
            || !array_is_list($body['biens']) || count($body['biens']) > 1000 || !is_array($body['tarifs'] ?? null)) {
            throw new PasseportError(422, 'Dossier invalide.');
        }
        $models = [];
        foreach ($body['biens'] as $bien) {
            if (!is_array($bien) || !preg_match('/^[A-Za-z0-9_-]{1,64}$/D', (string) ($bien['id'] ?? ''))
                || !is_array($bien['dossier'] ?? null)) { throw new PasseportError(422, 'Bien invalide.'); }
            $id = (string) $bien['id'];
            if (isset($models[$id])) { throw new PasseportError(422, 'Identifiant de bien répété.'); }
            $models[$id] = json_encode($bien, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        }
        $this->workspace();
        $this->db->beginTransaction();
        try {
            $revision = (int) $this->query('SELECT revision FROM pi_workspaces WHERE owner_id=? FOR UPDATE', [$this->owner])->fetchColumn();
            if ($revision !== $body['revision']) { throw new PasseportError(409, 'Le dossier a été modifié dans une autre fenêtre. Rechargez avant de poursuivre.'); }
            $this->query('UPDATE pi_biens SET deleted_at=? WHERE owner_id=? AND deleted_at IS NULL', [self::now(), $this->owner]);
            foreach ($models as $id => $model) {
                $this->query('INSERT INTO pi_biens(owner_id,bien_id,model) VALUES (?,?,?) ON DUPLICATE KEY UPDATE model=VALUES(model),deleted_at=NULL', [$this->owner, (string) $id, $model]);
            }
            $this->query('UPDATE pi_workspaces SET revision=revision+1,settings=? WHERE owner_id=?', [json_encode($body['tarifs'], JSON_THROW_ON_ERROR), $this->owner]);
            $this->db->commit();
            return ['revision' => $revision + 1];
        } catch (Throwable $error) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $error; }
    }
    public function bien(string $id, bool $lock = false): array
    {
        $row = $this->query('SELECT * FROM pi_biens WHERE owner_id=? AND bien_id=? AND deleted_at IS NULL' . ($lock ? ' FOR UPDATE' : ''), [$this->owner, $id])->fetch();
        if (!$row) throw new PasseportError(404, 'Bien introuvable.');
        return $row;
    }
    public static function document(array $d): array
    {
        return ['id'=>$d['id'], 'bienId'=>$d['bien_id'], 'clientId'=>$d['client_id'], 'name'=>$d['name'],
            'title'=>$d['title'], 'category'=>$d['category'], 'mime'=>$d['mime'], 'size'=>(int)$d['size'],
            'sha256'=>$d['sha256'], 'addedAt'=>$d['added_at'], 'updatedAt'=>$d['updated_at'], 'archivedAt'=>$d['archived_at'], 'trashedAt'=>$d['trashed_at'] ?? null];
    }
    public static function client(array $row): array { return ['id'=>$row['id'], 'name'=>$row['name'], 'createdAt'=>$row['created_at']]; }
    public function load(string $id): array
    {
        $bien = $this->bien($id);
        $clients = array_map([self::class,'client'], $this->query('SELECT * FROM pi_clients WHERE owner_id=? ORDER BY name', [$this->owner])->fetchAll());
        $client = null;
        foreach ($clients as $c) if ($c['id'] === $bien['client_id']) $client = $c;
        $documents = array_map([self::class,'document'], $this->query('SELECT * FROM pi_documents WHERE owner_id=? AND bien_id=? ORDER BY added_at DESC,id', [$this->owner,$id])->fetchAll());
        $settings=self::settings($bien['document_settings'] ?? null);
        return compact('client','clients','documents','settings');
    }
    public function linkClient(string $id, array $body): array
    {
        $this->db->beginTransaction();
        try {
            $bien = $this->bien($id, true);
            $clientId = $body['clientId'] ?? null;
            $client = $clientId ? $this->query('SELECT * FROM pi_clients WHERE owner_id=? AND id=?',[$this->owner,$clientId])->fetch() : false;
            if ($clientId && !$client) throw new PasseportError(404, 'Client introuvable.');
            if (!$client) {
                $client = ['id'=>self::id(), 'name'=>self::text($body['name'] ?? null,200), 'created_at'=>self::now()];
                $this->query('INSERT INTO pi_clients(id,owner_id,name,created_at) VALUES (?,?,?,?)',[$client['id'],$this->owner,$client['name'],$client['created_at']]);
            }
            if ($bien['client_id'] !== $client['id'] && $this->query('SELECT id FROM pi_documents WHERE owner_id=? AND bien_id=? LIMIT 1',[$this->owner,$id])->fetch()) {
                throw new PasseportError(409, 'Un bien contenant des documents conserve son client.');
            }
            $this->query('UPDATE pi_biens SET client_id=? WHERE owner_id=? AND bien_id=?',[$client['id'],$this->owner,$id]);
            $this->db->commit(); return self::client($client);
        } catch (Throwable $error) { $this->db->rollBack(); throw $error; }
    }
    public static function inspectFile(string $path, string $name): array
    {
        self::text($name,255);
        if (basename(str_replace('\\','/',$name)) !== $name) throw new PasseportError(422,'Nom de fichier invalide.');
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        $archiveTypes = ['zip'=>'application/zip','7z'=>'application/x-7z-compressed','rar'=>'application/vnd.rar',
            'tar'=>'application/x-tar','gz'=>'application/gzip','tgz'=>'application/gzip'];
        $allowed = array_merge(['pdf','jpg','jpeg','png','webp','txt','csv','doc','docx','xls','xlsx','odt'],array_keys($archiveTypes));
        $size = filesize($path);
        if (!in_array($ext,$allowed,true) || $size === false || $size < 1 || $size > 500*1024*1024) {
            throw new PasseportError(422,'Format ou taille de fichier non autorisé (500 Mo maximum par fichier).');
        }
        $handle = fopen($path,'rb'); $header = fread($handle,512); fclose($handle);
        if ($ext === 'pdf' && substr($header,0,5) !== '%PDF-') throw new PasseportError(422,'Le fichier ne contient pas un PDF valide.');
        if (isset($archiveTypes[$ext])) {
            $valid = match ($ext) {
                'zip' => $size >= 22 && in_array(substr($header,0,4),["PK\x03\x04","PK\x05\x06","PK\x07\x08"],true),
                '7z' => $size >= 32 && str_starts_with($header,"7z\xbc\xaf\x27\x1c"),
                'rar' => $size >= 14 && (str_starts_with($header,"Rar!\x1a\x07\x00") || str_starts_with($header,"Rar!\x1a\x07\x01\x00")),
                'tar' => $size >= 512 && substr($header,257,5) === 'ustar',
                'gz','tgz' => $size >= 18 && str_starts_with($header,"\x1f\x8b\x08"),
            };
            if (!$valid) throw new PasseportError(422,'Le fichier ne correspond pas au format d’archive annoncé.');
        }
        // Canonical archive types keep compressed containers out of image/PDF previews.
        $mime = $archiveTypes[$ext] ?? ((new finfo(FILEINFO_MIME_TYPE))->file($path) ?: 'application/octet-stream');
        // Every download is an attachment. No uploaded file is ever executed or served as HTML.
        return ['name'=>$name,'size'=>$size,'mime'=>$ext === 'pdf' ? 'application/pdf' : $mime,'sha256'=>hash_file('sha256',$path)];
    }
    public function addFiles(string $id, array $files, string $category, bool $migration = false): array
    {
        if (!in_array($category,self::CATEGORIES,true) || count($files)<1 || count($files)>100) throw new PasseportError(422,'Lot de fichiers invalide.');
        $validated = []; $total=0;
        foreach ($files as $file) {
            if (!$migration && !is_uploaded_file($file['path'])) throw new PasseportError(422,'Téléversement invalide.');
            $meta = self::inspectFile($file['path'],$file['name']); $total += $meta['size'];
            if ($total > 500*1024*1024) throw new PasseportError(413,'Ce lot dépasse 500 Mo. Réduisez le lot et réessayez.');
            $validated[] = [$file,$meta];
        }
        $written=[]; $added=[]; $duplicates=[];
        $this->db->beginTransaction();
        try {
            $bien=$this->bien($id,true);
            if (!$bien['client_id']) throw new PasseportError(422,'Reliez d’abord le bien à son client.');
            foreach ($validated as [$file,$meta]) {
                $duplicate=$this->query('SELECT * FROM pi_documents WHERE owner_id=? AND bien_id=? AND sha256=?',[$this->owner,$id,$meta['sha256']])->fetch();
                if ($duplicate['trashed_at'] ?? null) throw new PasseportError(409,$meta['name'].' est dans la corbeille. Restaurez-le ou supprimez-le définitivement avant de le réimporter.');
                if ($duplicate) { $duplicates[]=$meta['name']; continue; }
                $docId=self::id(); $destination=$this->directory.'/'.$docId.'.blob';
                $out=@fopen($destination,'x+b');
                if (!$out) throw new RuntimeException('Écriture du document impossible.');
                $written[]=$destination; chmod($destination,0600);
                $in=fopen($file['path'],'rb'); $copied=stream_copy_to_stream($in,$out); fclose($in); fflush($out); fclose($out);
                if ($copied !== $meta['size'] || hash_file('sha256',$destination) !== $meta['sha256']) throw new RuntimeException('Contrôle du document échoué.');
                $now=self::now();
                $this->query('INSERT INTO pi_documents(id,owner_id,bien_id,client_id,name,title,category,mime,size,sha256,added_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                    [$docId,$this->owner,$id,$bien['client_id'],$meta['name'],$meta['name'],$category,$meta['mime'],$meta['size'],$meta['sha256'],$now,$now]);
                $added[]=self::document($this->query('SELECT * FROM pi_documents WHERE id=?',[$docId])->fetch());
            }
            $this->db->commit(); return compact('added','duplicates');
        } catch (Throwable $error) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            foreach ($written as $path) @unlink($path);
            throw $error;
        }
    }
    public function findDocument(string $bien, string $id): array
    {
        $this->bien($bien);
        $row=$this->query('SELECT * FROM pi_documents WHERE owner_id=? AND bien_id=? AND id=?',[$this->owner,$bien,$id])->fetch();
        if (!$row) throw new PasseportError(404,'Document introuvable.');
        return $row;
    }
    public function updateDocument(string $bien, string $id, array $body): array
    {
        $this->db->beginTransaction();
        try {
            $property=$this->bien($bien,true); $row=$this->findDocument($bien,$id);
            if (array_key_exists('trashed',$body)) {
                $this->requireOrganisationSchema();
                if (!is_bool($body['trashed']) || count($body)!==1) throw new PasseportError(422,'Action de corbeille invalide.');
                $this->query('UPDATE pi_documents SET trashed_at=?,updated_at=? WHERE id=? AND owner_id=?',[$body['trashed'] ? ($row['trashed_at'] ?? self::now()) : null,self::now(),$id,$this->owner]);
                $result=self::document($this->findDocument($bien,$id)); $this->db->commit(); return $result;
            }
            if ($row['trashed_at'] ?? null) throw new PasseportError(409,'Restaurez le document avant de le modifier.');
            $title=array_key_exists('title',$body) ? self::text($body['title'],255) : $row['title'];
            $category=$body['category'] ?? $row['category'];
            if (!in_array($category,self::CATEGORIES,true) || (array_key_exists('archived',$body) && !is_bool($body['archived']))) throw new PasseportError(422,'Catégorie ou archive invalide.');
            $archive=array_key_exists('archived',$body) ? ($body['archived'] ? ($row['archived_at'] ?? self::now()) : null) : $row['archived_at'];
            $this->query('UPDATE pi_documents SET title=?,category=?,archived_at=?,updated_at=? WHERE id=? AND owner_id=?',[$title,$category,$archive,self::now(),$id,$this->owner]);
            if ($category!==$row['category']) $this->removeDocumentOrder($property,$id);
            $result=self::document($this->findDocument($bien,$id)); $this->db->commit(); return $result;
        } catch (Throwable $error) { $this->db->rollBack(); throw $error; }
    }
    private function requireOrganisationSchema(): void
    {
        if (!$this->query("SHOW COLUMNS FROM pi_documents LIKE 'trashed_at'")->fetch()
            || !$this->query("SHOW COLUMNS FROM pi_biens LIKE 'document_settings'")->fetch()) {
            throw new PasseportError(503,'Corbeille et organisation indisponibles : mise à jour de la base requise.');
        }
    }
    public static function settings(?string $json): array
    {
        return $json ? json_decode($json,true,64,JSON_THROW_ON_ERROR) : ['revision'=>0,'categories'=>(object)[],'order'=>(object)[]];
    }
    public function saveDocumentSettings(string $bien,array $body): array
    {
        $this->db->beginTransaction();
        try {
            $row=$this->bien($bien,true); $this->requireOrganisationSchema();
            if (!is_int($body['revision'] ?? null) || $body['revision']<0 || !is_array($body['categories'] ?? null) || !is_array($body['order'] ?? null)
                || array_diff(array_keys($body),['revision','categories','order'])) throw new PasseportError(422,'Organisation des documents invalide.');
            $current=self::settings($row['document_settings']);
            if ($current['revision']!==$body['revision']) throw new PasseportError(409,'L’organisation a changé dans une autre fenêtre. Rouvrez le bien avant de poursuivre.');
            foreach ($body['categories'] as $category=>$appearance) {
                if (!in_array($category,self::CATEGORIES,true) || !is_array($appearance) || array_diff(array_keys($appearance),['icon','color'])
                    || !in_array($appearance['icon'] ?? null,['folder','file','home','ruler','hammer','shield','key','leaf'],true)
                    || !is_string($appearance['color'] ?? null) || !preg_match('/^#[0-9a-f]{6}$/iD',$appearance['color'])) throw new PasseportError(422,'Icône ou couleur de catégorie invalide.');
            }
            $documents=$this->query('SELECT id,category FROM pi_documents WHERE owner_id=? AND bien_id=?',[$this->owner,$bien])->fetchAll();
            $allowed=[]; foreach ($documents as $document) $allowed[$document['id']]=$document['category'];
            foreach ($body['order'] as $category=>$ids) {
                if (!in_array($category,self::CATEGORIES,true) || !is_array($ids) || !array_is_list($ids) || count($ids)>10000) throw new PasseportError(422,'Ordre des documents invalide pour ce bien.');
                $seen=[]; foreach ($ids as $id) {
                    if (!is_string($id) || isset($seen[$id]) || ($allowed[$id] ?? null)!==$category) throw new PasseportError(422,'Ordre des documents invalide pour ce bien.');
                    $seen[$id]=true;
                }
            }
            $body['revision']++;
            $body['categories']=(object)$body['categories']; $body['order']=(object)$body['order'];
            $this->query('UPDATE pi_biens SET document_settings=? WHERE owner_id=? AND bien_id=?',[json_encode($body,JSON_THROW_ON_ERROR),$this->owner,$bien]);
            $this->db->commit(); return $body;
        } catch (Throwable $error) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $error; }
    }
    private function removeDocumentOrder(array $property,string $id): void
    {
        if (!array_key_exists('document_settings',$property)) return;
        $settings=self::settings($property['document_settings']);
        $settings['order']=(array)$settings['order'];
        foreach ($settings['order'] as &$ids) $ids=array_values(array_filter($ids,fn($value)=>$value!==$id));
        unset($ids); $settings['revision']++; $settings['order']=(object)$settings['order'];
        $this->query('UPDATE pi_biens SET document_settings=? WHERE owner_id=? AND bien_id=?',[json_encode($settings,JSON_THROW_ON_ERROR),$this->owner,$property['bien_id']]);
    }
    public function deleteDocument(string $bien,string $id): array
    {
        $this->db->beginTransaction(); $held=null; $source=null;
        try {
            $property=$this->bien($bien,true); $this->requireOrganisationSchema(); $row=$this->findDocument($bien,$id);
            if (!$row['trashed_at']) throw new PasseportError(409,'Placez le document dans la corbeille avant de le supprimer définitivement.');
            $source=$this->filePath($row); $held=$this->directory.'/.purge-'.$id.'-'.bin2hex(random_bytes(12));
            if (!rename($source,$held)) throw new RuntimeException('Mise en attente privée impossible.');
            $this->query('DELETE FROM pi_documents WHERE owner_id=? AND bien_id=? AND id=?',[$this->owner,$bien,$id]);
            $this->removeDocumentOrder($property,$id);
            $this->db->commit();
        } catch (Throwable $error) {
            // Restore bytes only after a confirmed SQL rollback. An uncertain commit keeps
            // the private held file for operator recovery instead of risking data loss.
            if ($this->db->inTransaction() && $this->db->rollBack() && $held && is_file($held) && !is_file($source)) rename($held,$source);
            throw $error;
        }
        if (!unlink($held)) throw new RuntimeException('Nettoyage privé de la suppression à terminer.');
        return ['deleted'=>true,'id'=>$id];
    }
    public function filePath(array $document): string
    {
        $path=$this->directory.'/'.$document['id'].'.blob';
        if (is_link($path) || !is_file($path) || filesize($path)!==(int)$document['size'] || hash_file('sha256',$path)!==$document['sha256']) throw new RuntimeException('Document privé indisponible ou altéré.');
        return $path;
    }
}
