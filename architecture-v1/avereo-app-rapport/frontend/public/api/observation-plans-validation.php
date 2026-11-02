<?php
declare(strict_types=1);

// Optional payload fields only; authentication, ownership and storage remain unchanged.
function api_observation_plans_error(array $payload): ?string
{
    $plans = $payload['plans'] ?? [];
    if (!is_array($plans) || !array_is_list($plans) || count($plans) > 20) return 'Liste des plans invalide (20 vues maximum).';
    $ids = [];
    foreach ($plans as $plan) {
        if (!is_array($plan) || !isset($plan['id']) || !is_string($plan['id']) || $plan['id'] === '' || strlen($plan['id']) > 190 || isset($ids[$plan['id']])) return 'Identifiant de plan invalide ou dupliqué.';
        $ids[$plan['id']] = true;
        if (!isset($plan['title'], $plan['kind'], $plan['source']) || !is_string($plan['title']) || trim($plan['title']) === '' || strlen($plan['title']) > 800
            || !in_array($plan['kind'], ['niveau', 'coupe'], true) || !is_string($plan['source']) || strlen($plan['source']) > 4000) return 'Informations de plan invalides.';
        $src = $plan['src'] ?? null;
        if (!is_string($src) || strlen($src) > (int) ceil(4 * 1024 * 1024 / 3) * 4 + 32 || !preg_match('#^data:image/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$#D', $src, $parts)) return 'Image de plan invalide.';
        $bytes = base64_decode($parts[2], true);
        if ($bytes === false || strlen($bytes) > 4 * 1024 * 1024) return 'Image de plan trop volumineuse ou invalide.';
        $size = @getimagesizefromstring($bytes);
        if ($size === false || !in_array($size[2], [IMAGETYPE_PNG, IMAGETYPE_JPEG], true) || $size['mime'] !== 'image/' . $parts[1]) return 'Le contenu du plan doit être une image PNG ou JPEG.';
        if (!isset($plan['width'], $plan['height']) || !is_int($plan['width']) || !is_int($plan['height'])
            || $plan['width'] !== $size[0] || $plan['height'] !== $size[1] || $size[0] > 12000 || $size[1] > 12000
            || $size[0] * $size[1] > 24000000) return 'Dimensions du plan invalides.';
    }
    $observationIds = [];
    foreach ((is_array($payload['observations'] ?? null) ? $payload['observations'] : []) as $observation) {
        if (!is_array($observation)) continue; // Existing general validator reports this error.
        if ($plans !== []) {
            $id = $observation['id'] ?? null;
            if (!is_string($id) || $id === '' || strlen($id) > 190 || isset($observationIds[$id])) return 'Identifiants des observations invalides ou dupliqués.';
            $observationIds[$id] = true;
        }
        $points = $observation['reperes'] ?? [];
        if (!is_array($points) || !array_is_list($points) || count($points) > 20) return 'Liste des repères invalide.';
        $used = [];
        foreach ($points as $point) {
            if (!is_array($point) || !isset($point['planId']) || !is_string($point['planId']) || !isset($ids[$point['planId']]) || isset($used[$point['planId']])) return 'Vue du repère absente ou dupliquée.';
            $used[$point['planId']] = true;
            foreach (['x', 'y'] as $axis) {
                $value = $point[$axis] ?? null;
                if ((!is_int($value) && !is_float($value)) || !is_finite((float) $value) || $value < 0 || $value > 1) return 'Coordonnées de repère invalides.';
            }
        }
    }
    return null;
}
