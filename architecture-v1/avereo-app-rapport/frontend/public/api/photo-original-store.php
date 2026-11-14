<?php
declare(strict_types=1);

/**
 * Stockage privé des photos ORIGINALES d'un rapport (première tranche locale).
 *
 * Service sans dépendance au bootstrap HTTP : il reçoit un PDO déjà ouvert et une racine
 * de stockage privée. Il ne connaît ni CONNECT, ni les rôles : l'appelant lui passe
 * l'identité du compte ordinaire. Aucune exception administrateur n'existe ici — un
 * original n'est lisible et ne s'écrit que pour le propriétaire ACTUEL du rapport.
 *
 * Invariants : octets conservés tels quels, jamais remplacés ni réencodés ; empreinte
 * SHA-256 recalculée ; aucun chemin construit à partir d'un nom reçu ; aucun suivi de
 * lien symbolique ; aucune réponse contenant un chemin privé ou un détail SQL.
 */
final class RapportPhotoOriginalException extends RuntimeException
{
    public function __construct(public readonly int $status, public readonly string $errorCode, string $message)
    {
        parent::__construct($message);
    }
}

final class RapportPhotoOriginalStore
{
    /** Types réellement reconnus par signature ; tout autre format est refusé (la photo reste côté navigateur). */
    public const MIME_BY_TYPE = [
        IMAGETYPE_JPEG => 'image/jpeg',
        IMAGETYPE_PNG => 'image/png',
        IMAGETYPE_WEBP => 'image/webp',
    ];
    /** Bornes de dimensions déclarées (en-tête seul lu, aucun décodage complet). Propositions à qualifier. */
    public const MAX_SIDE_PIXELS = 32767;
    public const MAX_TOTAL_PIXELS = 200000000;

    private const EXTENSIONS = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

    private readonly string $root;

    /** @param list<string> $forbiddenRoots racines web sous lesquelles le stockage est interdit */
    public function __construct(
        private readonly PDO $pdo,
        string $root,
        private readonly int $maxBytes,
        private readonly int $ownerQuotaBytes,
        array $forbiddenRoots = [],
    ) {
        if ($this->pdo->getAttribute(PDO::ATTR_ERRMODE) !== PDO::ERRMODE_EXCEPTION) {
            throw new LogicException('Le PDO doit lever des exceptions.');
        }
        if ($maxBytes < 1 || $ownerQuotaBytes < 1) {
            throw self::unavailable('Limites de stockage non configurées.');
        }
        $this->root = self::resolveRoot($root, $forbiddenRoots);
    }

    public static function isEnabled(array $config): bool
    {
        return ($config['photo_originals_enabled'] ?? false) === true;
    }

    /** @param list<string> $webRoots */
    public static function fromConfig(PDO $pdo, array $config, array $webRoots = []): self
    {
        if (!self::isEnabled($config)) {
            throw self::unavailable('Stockage des originaux désactivé.');
        }
        $limits = [];
        foreach (['photo_originals_max_bytes', 'photo_originals_owner_quota_bytes'] as $key) {
            $value = $config[$key] ?? null;
            if (is_string($value) && ctype_digit($value)) {
                $value = (int) $value;
            }
            if (!is_int($value) || $value < 1) {
                throw self::unavailable('Limites de stockage non configurées.');
            }
            $limits[] = $value;
        }

        return new self($pdo, (string) ($config['photo_originals_directory'] ?? ''), $limits[0], $limits[1], $webRoots);
    }

    /** @return array{enabled: true, maxOriginalBytes: int, allowedMimeTypes: list<string>} */
    public function capabilities(): array
    {
        return [
            'enabled' => true,
            'maxOriginalBytes' => $this->maxBytes,
            'allowedMimeTypes' => array_values(self::MIME_BY_TYPE),
        ];
    }

    /** @return list<array<string, mixed>> */
    public function listForReport(string $ownerProvider, string $ownerId, string $reportId): array
    {
        return $this->guarded(function () use ($ownerProvider, $ownerId, $reportId): array {
            $this->assertReportOwner($ownerProvider, $ownerId, $reportId);
            $query = $this->pdo->prepare(
                'SELECT * FROM rapport_photo_originals
                 WHERE report_public_id = ? AND owner_provider = ? AND owner_id = ?
                 ORDER BY created_at, id'
            );
            $query->execute([$reportId, $ownerProvider, $ownerId]);

            return array_map([self::class, 'metadata'], $query->fetchAll(PDO::FETCH_ASSOC));
        });
    }

    /**
     * Ouvre un original en lecture. Contrôle le propriétaire du rapport courant ET celui de la
     * métadonnée, puis la taille et l'empreinte du fichier réellement présent.
     *
     * @return array{metadata: array<string, mixed>, stream: resource, filename: string}
     */
    public function open(string $ownerProvider, string $ownerId, string $reportId, string $originalId): array
    {
        $row = $this->guarded(function () use ($ownerProvider, $ownerId, $reportId, $originalId): array {
            $this->assertReportOwner($ownerProvider, $ownerId, $reportId);
            if (!preg_match('/^[0-9a-f]{32}$/D', $originalId)) {
                throw self::notFound();
            }
            $query = $this->pdo->prepare(
                'SELECT * FROM rapport_photo_originals
                 WHERE public_id = ? AND report_public_id = ? AND owner_provider = ? AND owner_id = ?'
            );
            $query->execute([$originalId, $reportId, $ownerProvider, $ownerId]);
            $found = $query->fetch(PDO::FETCH_ASSOC);
            $query->closeCursor();
            if (!$found) {
                throw self::notFound();
            }

            return $found;
        });

        $path = $this->existingFilePath($row, $ownerProvider, $ownerId);
        $stream = @fopen($path, 'rb');
        if ($stream === false) {
            throw self::unavailable('Original inaccessible.');
        }
        $metadata = self::metadata($row);

        return ['metadata' => $metadata, 'stream' => $stream, 'filename' => self::downloadName($metadata)];
    }

    /**
     * Conserve un original. $sourcePath est un fichier déjà reçu (le contrôle d'envoi HTTP
     * appartient à l'appelant). Renvoie les métadonnées ; le même fichier dans le même rapport
     * renvoie l'original existant après vérification réelle de ses octets, sans consommer de quota.
     *
     * @return array<string, mixed>
     */
    public function store(
        string $ownerProvider,
        string $ownerId,
        string $reportId,
        string $sourcePath,
        string $claimedSha256,
        string $clientName = '',
    ): array {
        $this->guarded(fn () => $this->assertReportOwner($ownerProvider, $ownerId, $reportId));
        $claimedSha256 = strtolower($claimedSha256);
        if (!preg_match('/^[0-9a-f]{64}$/D', $claimedSha256)) {
            throw new RapportPhotoOriginalException(422, 'invalid_request', 'Empreinte SHA-256 invalide.');
        }
        clearstatcache(true, $sourcePath);
        if (!is_file($sourcePath) || is_link($sourcePath)) {
            throw new RapportPhotoOriginalException(422, 'invalid_image', 'Fichier reçu invalide.');
        }
        $size = filesize($sourcePath);
        if ($size === false || $size < 1) {
            throw new RapportPhotoOriginalException(422, 'invalid_image', 'Fichier vide ou illisible.');
        }
        if ($size > $this->maxBytes) {
            throw new RapportPhotoOriginalException(413, 'file_too_large', 'Photo trop volumineuse pour le stockage des originaux.');
        }
        $actual = hash_file('sha256', $sourcePath);
        if ($actual === false || !hash_equals($actual, $claimedSha256)) {
            throw new RapportPhotoOriginalException(422, 'hash_mismatch', 'Empreinte incorrecte : le fichier reçu diffère de celui annoncé.');
        }
        [$mime, $width, $height] = self::inspectImage($sourcePath);
        $name = self::sanitizeName($clientName);
        $ownerKey = hash('sha256', $ownerProvider . "\0" . $ownerId);

        return $this->guarded(fn (): array => $this->withOwnerLock($ownerKey, function () use (
            $ownerProvider, $ownerId, $reportId, $sourcePath, $actual, $size, $mime, $width, $height, $name, $ownerKey
        ): array {
            // Propriétaire ACTUEL recontrôlé sous verrou : le rapport a pu être supprimé ou réattribué
            // pendant la validation du fichier ou l'attente du verrou.
            $this->assertReportOwner($ownerProvider, $ownerId, $reportId);
            $existing = $this->findBySha($reportId, $ownerProvider, $ownerId, $actual);
            if ($existing !== null) {
                $this->existingFilePath($existing, $ownerProvider, $ownerId);

                return self::metadata($existing);
            }

            $usedBytes = $this->accountedOwnerBytes($ownerProvider, $ownerId, $ownerKey);
            if ($size > $this->ownerQuotaBytes || $usedBytes > $this->ownerQuotaBytes - $size) {
                throw new RapportPhotoOriginalException(409, 'quota_exceeded', 'Espace de stockage des originaux insuffisant.');
            }

            $publicId = bin2hex(random_bytes(16));
            $directory = $this->reportDirectory($ownerKey, $reportId, true);
            $final = $directory . '/' . $publicId . '.bin';
            $this->writeAtomically($sourcePath, $directory, $final, $actual, $size);

            $createdAt = gmdate('Y-m-d H:i:s');
            try {
                $this->pdo->beginTransaction();
                // Dernier contrôle juste avant l'insertion (verrou de ligne sous MySQL) : un rapport supprimé
                // ou réattribué entre-temps ne reçoit aucune ligne et le fichier neuf est retiré ci-dessous.
                $this->assertReportOwner($ownerProvider, $ownerId, $reportId, true);
                $insert = $this->pdo->prepare(
                    'INSERT INTO rapport_photo_originals
                     (public_id, report_public_id, owner_provider, owner_id, sha256, bytes, mime, width, height, original_name, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                );
                $insert->execute([$publicId, $reportId, $ownerProvider, $ownerId, $actual, $size, $mime, $width, $height, $name, $createdAt]);
                $this->pdo->commit();
            } catch (Throwable $failure) {
                if ($this->pdo->inTransaction()) {
                    $this->pdo->rollBack();
                }
                // Seul le fichier créé par cette requête (nom aléatoire) est retiré ; jamais un exemplaire préexistant.
                @unlink($final);
                if ($failure instanceof RapportPhotoOriginalException) {
                    throw $failure;
                }
                error_log('Rapport photo original: insertion refusée, SQLSTATE ' . (string) $failure->getCode());
                if ($failure instanceof PDOException && $failure->getCode() === '23000') {
                    $raced = $this->findBySha($reportId, $ownerProvider, $ownerId, $actual);
                    if ($raced !== null) {
                        $this->existingFilePath($raced, $ownerProvider, $ownerId);

                        return self::metadata($raced);
                    }
                }
                throw self::unavailable('Enregistrement de l\'original impossible.');
            }

            return self::metadata([
                'public_id' => $publicId, 'report_public_id' => $reportId, 'sha256' => $actual, 'bytes' => $size,
                'mime' => $mime, 'width' => $width, 'height' => $height, 'original_name' => $name, 'created_at' => $createdAt,
            ]);
        }));
    }

    /** @param array<string, mixed> $row */
    public static function metadata(array $row): array
    {
        return [
            'id' => (string) $row['public_id'],
            'reportId' => (string) $row['report_public_id'],
            'sha256' => (string) $row['sha256'],
            'bytes' => (int) $row['bytes'],
            'mime' => (string) $row['mime'],
            'width' => (int) $row['width'],
            'height' => (int) $row['height'],
            'name' => (string) $row['original_name'],
            'createdAt' => str_replace(' ', 'T', (string) $row['created_at']) . 'Z',
        ];
    }

    /** Nom sûr : jamais de chemin, de caractère de contrôle ni de point initial. */
    public static function sanitizeName(string $name): string
    {
        $name = basename(str_replace('\\', '/', $name));
        $name = preg_replace('/[\x00-\x1F\x7F]/u', '', $name) ?? '';
        $name = preg_replace('/[^\p{L}\p{N} ._()\-]/u', '_', $name) ?? '';
        // 120 caractères (et non octets), sans dépendre de mbstring : la coupe ne tranche jamais un caractère UTF-8.
        if (preg_match('/^.{0,120}/us', $name, $head) === 1) {
            $name = $head[0];
        }
        $name = trim($name, " .");

        return $name === '' ? 'photo' : $name;
    }

    /** Nom de téléchargement : nom nettoyé avec l'extension cohérente avec le type réel. */
    public static function downloadName(array $metadata): string
    {
        $stem = self::sanitizeName((string) pathinfo((string) $metadata['name'], PATHINFO_FILENAME));

        return $stem . '.' . (self::EXTENSIONS[$metadata['mime']] ?? 'bin');
    }

    // ---------------------------------------------------------------- interne

    /**
     * Under the owner lock, count SQL reservations plus unregistered bytes left by a crash.
     * Missing registered files retain their reservation; registered bytes are not counted twice.
     * This method never deletes or repairs files. Unknown entries are counted or fail closed.
     */
    private function accountedOwnerBytes(string $ownerProvider, string $ownerId, string $ownerKey): int
    {
        $query = $this->pdo->prepare('SELECT report_public_id, public_id, bytes FROM rapport_photo_originals WHERE owner_provider = ? AND owner_id = ?');
        $query->execute([$ownerProvider, $ownerId]);
        $registered = [];
        $used = 0;
        foreach ($query->fetchAll(PDO::FETCH_ASSOC) as $row) {
            if (!preg_match('/^[a-f0-9]{32}$/D', (string) $row['report_public_id']) || !preg_match('/^[a-f0-9]{32}$/D', (string) $row['public_id']) || (int) $row['bytes'] < 1) {
                throw self::unavailable('Inventaire privé non conforme.');
            }
            $bytes = (int) $row['bytes'];
            $registered[$row['report_public_id'] . '/' . $row['public_id'] . '.bin'] = $bytes;
            $used = $bytes > PHP_INT_MAX - $used ? PHP_INT_MAX : $used + $bytes;
        }
        $query->closeCursor();
        $ownerRoot = $this->root . '/o-' . $ownerKey;
        if (is_link($ownerRoot)) {
            throw self::unavailable('Lien symbolique refusé dans le stockage.');
        }
        if (!file_exists($ownerRoot)) {
            return $used;
        }
        $this->ensureDirectory($ownerRoot, false);
        try {
            $entries = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($ownerRoot, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST);
            foreach ($entries as $entry) {
                $path = str_replace('\\', '/', $entry->getPathname());
                $real = realpath($path);
                if ($entry->isLink() || $real === false || self::normalize($real) !== self::normalize($path)) {
                    throw self::unavailable('Lien ou chemin non conforme dans le stockage.');
                }
                if ($entry->isDir()) {
                    continue;
                }
                if (!$entry->isFile()) {
                    throw self::unavailable('Inventaire privé inaccessible.');
                }
                $bytes = $entry->getSize();
                $relative = substr($path, strlen($ownerRoot) + 1);
                $extra = max(0, $bytes - ($registered[$relative] ?? 0));
                $used = $extra > PHP_INT_MAX - $used ? PHP_INT_MAX : $used + $extra;
            }
        } catch (UnexpectedValueException $failure) {
            throw self::unavailable('Inventaire privé inaccessible.');
        }
        return $used;
    }

    private static function notFound(): RapportPhotoOriginalException
    {
        return new RapportPhotoOriginalException(404, 'not_found', 'Dossier ou original introuvable.');
    }

    private static function unavailable(string $message): RapportPhotoOriginalException
    {
        return new RapportPhotoOriginalException(503, 'storage_unavailable', $message);
    }

    /**
     * Toute erreur de base (table absente, connexion perdue…) devient un 503 générique : le détail
     * SQL n'est ni renvoyé ni journalisé au-delà du code SQLSTATE.
     */
    private function guarded(callable $work): mixed
    {
        try {
            return $work();
        } catch (PDOException $failure) {
            error_log('Rapport photo original: base indisponible, SQLSTATE ' . (string) $failure->getCode());
            throw self::unavailable('Base des originaux indisponible.');
        }
    }

    /**
     * Propriétaire ACTUEL du rapport ; absent ou autre compte = même réponse (aucune fuite d'existence).
     * $forUpdate verrouille la ligne du rapport sous MySQL, dans la transaction d'insertion.
     */
    private function assertReportOwner(string $ownerProvider, string $ownerId, string $reportId, bool $forUpdate = false): void
    {
        if ($ownerProvider === '' || $ownerId === '' || !preg_match('/^[0-9a-f]{32}$/D', $reportId)) {
            throw self::notFound();
        }
        $sql = 'SELECT owner_provider, owner_id FROM rapport_reports WHERE public_id = ?';
        if ($forUpdate && $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql') {
            $sql .= ' FOR UPDATE';
        }
        $query = $this->pdo->prepare($sql);
        $query->execute([$reportId]);
        $row = $query->fetch(PDO::FETCH_ASSOC);
        $query->closeCursor();
        if (
            !$row
            || !hash_equals((string) $row['owner_provider'], $ownerProvider)
            || !hash_equals((string) $row['owner_id'], $ownerId)
        ) {
            throw self::notFound();
        }
    }

    /** @return array<string, mixed>|null */
    private function findBySha(string $reportId, string $ownerProvider, string $ownerId, string $sha256): ?array
    {
        $query = $this->pdo->prepare(
            'SELECT * FROM rapport_photo_originals
             WHERE report_public_id = ? AND sha256 = ? AND owner_provider = ? AND owner_id = ?'
        );
        $query->execute([$reportId, $sha256, $ownerProvider, $ownerId]);
        $row = $query->fetch(PDO::FETCH_ASSOC);
        $query->closeCursor();

        return $row ?: null;
    }

    /**
     * Chemin d'un exemplaire déjà conservé, après contrôle réel : pas de lien symbolique, taille
     * et empreinte conformes à la métadonnée. Un exemplaire altéré n'est ni servi ni remplacé.
     *
     * @param array<string, mixed> $row
     */
    private function existingFilePath(array $row, string $ownerProvider, string $ownerId): string
    {
        $ownerKey = hash('sha256', $ownerProvider . "\0" . $ownerId);
        $directory = $this->reportDirectory($ownerKey, (string) $row['report_public_id'], false);
        $path = $directory . '/' . $row['public_id'] . '.bin';
        clearstatcache(true, $path);
        if (!is_file($path) || is_link($path) || filesize($path) !== (int) $row['bytes']) {
            error_log('Rapport photo original: exemplaire absent ou de taille inattendue.');
            throw self::unavailable('Original inaccessible ou altéré ; aucun remplacement effectué.');
        }
        $actual = hash_file('sha256', $path);
        if ($actual === false || !hash_equals((string) $row['sha256'], $actual)) {
            error_log('Rapport photo original: empreinte de l\'exemplaire conservé différente.');
            throw self::unavailable('Original inaccessible ou altéré ; aucun remplacement effectué.');
        }

        return $path;
    }

    /** Répertoire du rapport ; construit uniquement à partir d'empreintes et d'identifiants hexadécimaux validés. */
    private function reportDirectory(string $ownerKey, string $reportId, bool $create): string
    {
        if (!preg_match('/^[0-9a-f]{64}$/D', $ownerKey) || !preg_match('/^[0-9a-f]{32}$/D', $reportId)) {
            throw self::unavailable('Chemin de stockage refusé.');
        }
        $path = $this->root;
        foreach (['o-' . $ownerKey, $reportId] as $segment) {
            $path .= '/' . $segment;
            $this->ensureDirectory($path, $create);
        }

        return $path;
    }

    private function ensureDirectory(string $path, bool $create): void
    {
        if (is_link($path)) {
            throw self::unavailable('Lien symbolique refusé dans le stockage.');
        }
        if (!is_dir($path)) {
            if (!$create) {
                throw self::unavailable('Original inaccessible.');
            }
            if (!@mkdir($path, 0700) && !is_dir($path)) {
                throw self::unavailable('Création du répertoire de stockage impossible.');
            }
            @chmod($path, 0700);
        }
        $real = realpath($path);
        if ($real === false || self::normalize($real) !== self::normalize($path) || is_link($path)) {
            throw self::unavailable('Répertoire de stockage non conforme.');
        }
    }

    private function writeAtomically(string $source, string $directory, string $final, string $sha256, int $size): void
    {
        $temporary = $directory . '/.tmp-' . bin2hex(random_bytes(8));
        $in = @fopen($source, 'rb');
        $out = $in === false ? false : @fopen($temporary, 'xb');
        if ($in === false || $out === false) {
            if (is_resource($in)) {
                fclose($in);
            }
            throw self::unavailable('Écriture de l\'original impossible.');
        }
        $copied = @stream_copy_to_stream($in, $out);
        $flushed = $copied === $size && fflush($out);
        if ($flushed && function_exists('fsync')) {
            @fsync($out);
        }
        fclose($in);
        fclose($out);
        @chmod($temporary, 0600);
        clearstatcache(true, $temporary);
        $written = $flushed ? hash_file('sha256', $temporary) : false;
        if (!$flushed || $written === false || !hash_equals($sha256, $written) || filesize($temporary) !== $size) {
            @unlink($temporary);
            throw self::unavailable('Écriture de l\'original incomplète ; rien n\'a été conservé.');
        }
        if (file_exists($final) || is_link($final) || !@rename($temporary, $final)) {
            @unlink($temporary);
            throw self::unavailable('Publication de l\'original impossible ; rien n\'a été conservé.');
        }
    }

    /**
     * Verrou privé par propriétaire : deux envois concurrents ne peuvent pas dépasser ensemble le
     * quota. Valable pour les processus d'un même hôte (cas du serveur web), pas entre machines.
     */
    private function withOwnerLock(string $ownerKey, callable $work): mixed
    {
        $directory = $this->root . '/.locks';
        $this->ensureDirectory($directory, true);
        $path = $directory . '/' . $ownerKey . '.lock';
        if (is_link($path)) {
            throw self::unavailable('Lien symbolique refusé dans le stockage.');
        }
        $handle = @fopen($path, 'c');
        if ($handle === false || !flock($handle, LOCK_EX)) {
            throw self::unavailable('Verrou de stockage indisponible.');
        }
        @chmod($path, 0600);
        try {
            return $work();
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    /** @return array{0: string, 1: int, 2: int} type réel, largeur, hauteur */
    private static function inspectImage(string $path): array
    {
        $handle = @fopen($path, 'rb');
        $head = $handle === false ? '' : (string) fread($handle, 12);
        if ($handle !== false) {
            fclose($handle);
        }
        $signature = match (true) {
            str_starts_with($head, "\xFF\xD8\xFF") => 'image/jpeg',
            str_starts_with($head, "\x89PNG\r\n\x1A\n") => 'image/png',
            str_starts_with($head, 'RIFF') && substr($head, 8, 4) === 'WEBP' => 'image/webp',
            default => '',
        };
        // getimagesize ne lit que l'en-tête : les octets de l'image ne sont pas décodés.
        $info = $signature === '' ? false : @getimagesize($path);
        $mime = is_array($info) ? (self::MIME_BY_TYPE[$info[2]] ?? '') : '';
        if ($mime === '' || $mime !== $signature) {
            throw new RapportPhotoOriginalException(422, 'invalid_image', 'Image non reconnue : JPEG, PNG ou WebP attendu.');
        }
        $width = (int) $info[0];
        $height = (int) $info[1];
        if (
            $width < 1 || $height < 1
            || $width > self::MAX_SIDE_PIXELS || $height > self::MAX_SIDE_PIXELS
            || $width * $height > self::MAX_TOTAL_PIXELS
        ) {
            throw new RapportPhotoOriginalException(422, 'invalid_image', 'Dimensions de l\'image hors limites.');
        }

        return [$mime, $width, $height];
    }

    /** @param list<string> $forbiddenRoots */
    private static function resolveRoot(string $root, array $forbiddenRoots): string
    {
        $trimmed = rtrim($root, '/\\');
        $absolute = preg_match('~^(?:/|[A-Za-z]:[\\\\/])~', $trimmed) === 1;
        if (
            $trimmed === '' || !$absolute || str_contains($trimmed, "\0") || str_contains($trimmed, '://')
            || in_array('..', preg_split('~[\\\\/]+~', $trimmed) ?: [], true)
        ) {
            throw self::unavailable('Répertoire privé non configuré.');
        }
        if (is_link($trimmed) || !is_dir($trimmed) || !is_writable($trimmed)) {
            throw self::unavailable('Répertoire privé absent, lien symbolique ou non inscriptible.');
        }
        $real = realpath($trimmed);
        // Un lien symbolique dans les ancêtres change le chemin réel : refusé aussi.
        if ($real === false || self::normalize($real) !== self::normalize($trimmed)) {
            throw self::unavailable('Le répertoire privé doit être indiqué par son chemin réel, sans lien symbolique.');
        }
        foreach ($forbiddenRoots as $web) {
            $webReal = $web === '' ? false : realpath($web);
            if ($webReal === false) {
                continue;
            }
            $candidate = self::normalize($real);
            $forbidden = self::normalize($webReal);
            if ($candidate === $forbidden || str_starts_with($candidate . '/', $forbidden . '/')) {
                throw self::unavailable('Le répertoire privé ne doit pas se trouver sous la racine web.');
            }
        }

        return rtrim(str_replace('\\', '/', $real), '/');
    }

    private static function normalize(string $path): string
    {
        $path = rtrim(str_replace('\\', '/', $path), '/');

        return DIRECTORY_SEPARATOR === '\\' ? strtolower($path) : $path;
    }
}
