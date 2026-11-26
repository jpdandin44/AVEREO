<?php
declare(strict_types=1);

function vision_media_uuid(mixed $id): bool
{
    return is_string($id) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/D', $id) === 1;
}

/** Validation fermée des objets terrain et de leurs sous-objets. */
function vision_terrain_valid(string $kind, mixed $data): bool
{
    if (!is_array($data) || ($data !== [] && array_is_list($data))) return false;
    $keys = static function (array $d, array $required, array $optional = []): bool {
        return array_diff($required, array_keys($d)) === [] && array_diff(array_keys($d), [...$required, ...$optional]) === [];
    };
    $int = static fn ($n, $min = 0, $max = 100000000) => is_int($n) && $n >= $min && $n <= $max;
    $text = static fn ($s, $max) => is_string($s) && vision_is_utf8($s) && trim($s) !== ''
        && vision_utf8_length($s) <= $max && preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $s) !== 1;
    if ($kind === 'cotesLaser') {
        if (!$keys($data, [], ['longueur', 'largeur', 'controle'])) return false;
        foreach ($data as $nom => $c) {
            if (!is_array($c) || !$int($c['valeurMm'] ?? null, 1, 100000)) return false;
            if ($nom !== 'controle') {
                if (!$keys($c, ['murIndex', 'valeurMm']) || !$int($c['murIndex'], 0, 63)) return false;
            } elseif (($c['type'] ?? '') === 'hauteur') {
                if (!$keys($c, ['type', 'valeurMm'])) return false;
            } elseif (($c['type'] ?? '') === 'diagonale') {
                if (!$keys($c, ['type', 'valeurMm', 'deSommet', 'aSommet']) || !$int($c['deSommet'], 0, 63) || !$int($c['aSommet'], 0, 63) || $c['deSommet'] === $c['aSommet']) return false;
            } else return false;
        }
        return true;
    }
    if ($kind === 'photo') {
        if (!$keys($data, ['xMm','yMm','prisLe','largeurPx','hauteurPx','tailleOctets','sha256','mime'], ['pieceId','legende'])) return false;
        if (!$int($data['xMm'], -100000000) || !$int($data['yMm'], -100000000)
            || !$int($data['largeurPx'], 1, 100000) || !$int($data['hauteurPx'], 1, 100000)
            || !$int($data['tailleOctets'], 1, 2500000) || !is_string($data['sha256'])
            || preg_match('/^[0-9a-f]{64}$/D', $data['sha256']) !== 1
            || !in_array($data['mime'], ['image/jpeg','image/png','image/webp'], true)) return false;
        if (!is_string($data['prisLe']) || preg_match('/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/D', $data['prisLe']) !== 1 || strtotime($data['prisLe']) === false) return false;
        return (!array_key_exists('pieceId', $data) || vision_sync_object_id_is_valid($data['pieceId']))
            && (!array_key_exists('legende', $data) || $text($data['legende'], 500));
    }
    if ($kind !== 'commentaire' || !$keys($data, ['texte','cible']) || !$text($data['texte'], 500) || !is_array($data['cible'])) return false;
    $c = $data['cible'];
    return match ($c['type'] ?? '') {
        'point' => $keys($c, ['type','xMm','yMm']) && $int($c['xMm'], -100000000) && $int($c['yMm'], -100000000),
        'mur' => $keys($c, ['type','pieceId','murIndex','positionMm']) && vision_sync_object_id_is_valid($c['pieceId']) && $int($c['murIndex'], 0, 63) && $int($c['positionMm']),
        'piece' => $keys($c, ['type','pieceId']) && vision_sync_object_id_is_valid($c['pieceId']),
        'photo' => $keys($c, ['type','photoId']) && vision_media_uuid($c['photoId']),
        default => false,
    };
}
