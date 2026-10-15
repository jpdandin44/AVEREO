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
            'sha256'=>$d['sha256'], 'addedAt'=>$d['added_at'], 'updatedAt'=>$d['updated_at'], 'archivedAt'=>$d['archived_at']];
    }
    public static function client(array $row): array { return ['id'=>$row['id'], 'name'=>$row['name'], 'createdAt'=>$row['created_at']]; }
    public function load(string $id): array
    {
        $bien = $this->bien($id);
        $clients = array_map([self::class,'client'], $this->query('SELECT * FROM pi_clients WHERE owner_id=? ORDER BY name', [$this->owner])->fetchAll());
        $client = null;
        foreach ($clients as $c) if ($c['id'] === $bien['client_id']) $client = $c;
        $documents = array_map([self::class,'document'], $this->query('SELECT * FROM pi_documents WHERE owner_id=? AND bien_id=? ORDER BY added_at DESC,id', [$this->owner,$id])->fetchAll());
        return compact('client','clients','documents');
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
        $allowed = ['pdf','jpg','jpeg','png','webp','txt','csv','doc','docx','xls','xlsx','odt'];
        $size = filesize($path);
        if (!in_array($ext,$allowed,true) || $size === false || $size < 1 || $size > 25*1024*1024) {
            throw new PasseportError(422,'Format ou taille de fichier non autorisé (25 Mo maximum).');
        }
        $handle = fopen($path,'rb'); $magic = fread($handle,5); fclose($handle);
        if ($ext === 'pdf' && $magic !== '%PDF-') throw new PasseportError(422,'Le fichier ne contient pas un PDF valide.');
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($path) ?: 'application/octet-stream';
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
            if ($total > 100*1024*1024) throw new PasseportError(413,'Lot supérieur à 100 Mo.');
            $validated[] = [$file,$meta];
        }
        $written=[]; $added=[]; $duplicates=[];
        $this->db->beginTransaction();
        try {
            $bien=$this->bien($id,true);
            if (!$bien['client_id']) throw new PasseportError(422,'Reliez d’abord le bien à son client.');
            foreach ($validated as [$file,$meta]) {
                if ($this->query('SELECT id FROM pi_documents WHERE owner_id=? AND bien_id=? AND sha256=?',[$this->owner,$id,$meta['sha256']])->fetch()) { $duplicates[]=$meta['name']; continue; }
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
            $this->bien($bien,true); $row=$this->findDocument($bien,$id);
            $title=array_key_exists('title',$body) ? self::text($body['title'],255) : $row['title'];
            $category=$body['category'] ?? $row['category'];
            if (!in_array($category,self::CATEGORIES,true) || (array_key_exists('archived',$body) && !is_bool($body['archived']))) throw new PasseportError(422,'Catégorie ou archive invalide.');
            $archive=array_key_exists('archived',$body) ? ($body['archived'] ? ($row['archived_at'] ?? self::now()) : null) : $row['archived_at'];
            $this->query('UPDATE pi_documents SET title=?,category=?,archived_at=?,updated_at=? WHERE id=? AND owner_id=?',[$title,$category,$archive,self::now(),$id,$this->owner]);
            $result=self::document($this->findDocument($bien,$id)); $this->db->commit(); return $result;
        } catch (Throwable $error) { $this->db->rollBack(); throw $error; }
    }
    public function filePath(array $document): string
    {
        $path=$this->directory.'/'.$document['id'].'.blob';
        if (is_link($path) || !is_file($path) || filesize($path)!==(int)$document['size'] || hash_file('sha256',$path)!==$document['sha256']) throw new RuntimeException('Document privé indisponible ou altéré.');
        return $path;
    }
}
