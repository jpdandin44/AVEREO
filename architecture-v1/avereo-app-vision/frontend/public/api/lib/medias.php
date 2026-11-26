<?php
declare(strict_types=1);
require_once __DIR__ . '/terrain.php';
const VISION_MEDIA_MAX_BYTES = 2500000;

/** Vérifie signature ET décodage des en-têtes d'image, sans extension ni nom client. */
function vision_media_validate(string $raw, string $mime, string $sha): void
{
    if (strlen($raw) > VISION_MEDIA_MAX_BYTES) throw new VisionHttpException(413, 'payload_too_large', 'Photo trop volumineuse.');
    $signature = match ($mime) {
        'image/jpeg' => str_starts_with($raw, "\xff\xd8\xff"),
        'image/png' => str_starts_with($raw, "\x89PNG\r\n\x1a\n"),
        'image/webp' => substr($raw, 0, 4) === 'RIFF' && substr($raw, 8, 4) === 'WEBP',
        default => false,
    };
    $info = $signature ? @getimagesizefromstring($raw) : false;
    if (!$info || ($info['mime'] ?? '') !== $mime) throw new VisionHttpException(415, 'unsupported_media_type', 'Image JPEG, PNG ou WebP attendue.');
    if (preg_match('/^[0-9a-f]{64}$/D', $sha) !== 1 || !hash_equals(hash('sha256', $raw), $sha)) throw new VisionHttpException(422, 'invalid_sha256', 'Empreinte de photo invalide.');
}

/** Appel sous verrou du projet ; un rejeu ne touche jamais le fichier existant. */
function vision_media_put(PDO $pdo, array $project, array $identity, string $id, string $raw, string $mime, string $sha, string $directory): int
{
    vision_media_validate($raw, $mime, $sha);
    $pdo->beginTransaction();
    $tmp = null;
    try {
        $lock = $pdo->prepare('SELECT status FROM vision_projects WHERE id = ? FOR UPDATE');
        $lock->execute([$project['id']]);
        if ($lock->fetchColumn() !== 'active') throw new VisionHttpException(409, 'project_archived', 'Projet archivé.');
        $find = $pdo->prepare('SELECT * FROM vision_media WHERE project_id = ? AND id = ?');
        $find->execute([$project['id'], $id]);
        $old = $find->fetch();
        if ($old) {
            if ($old['deleted_at'] !== null || !hash_equals($old['sha256'], $sha)) throw new VisionHttpException(409, 'media_conflict', 'Identifiant de photo déjà utilisé.');
            $pdo->commit();
            return 200;
        }
        $folder = $directory . '/' . $project['public_id'];
        if (is_link($folder) || (!is_dir($folder) && !mkdir($folder, 0700))) throw new RuntimeException('Stockage média indisponible.');
        $tmp = tempnam($folder, '.photo-');
        if ($tmp === false || file_put_contents($tmp, $raw) !== strlen($raw) || !chmod($tmp, 0600) || !rename($tmp, $folder . '/' . $id)) throw new RuntimeException('Écriture média impossible.');
        $tmp = null;
        $pdo->prepare("INSERT INTO vision_media (id, project_id, kind, mime, size_bytes, sha256, created_by) VALUES (?, ?, 'photo', ?, ?, ?, ?)")
            ->execute([$id, $project['id'], $mime, strlen($raw), $sha, $identity['id']]);
        $pdo->commit();
        return 201;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    } finally {
        if (is_string($tmp) && is_file($tmp)) unlink($tmp);
    }
}
