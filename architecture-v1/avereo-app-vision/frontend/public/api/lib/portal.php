<?php

declare(strict_types=1);

/** Portail autorisé : aucune donnée de requête ne peut choisir la destination. */
function vision_portal_url_is_allowed(array $config, string $url): bool
{
    if (preg_match('/[\x00-\x20\x7f\\\\]/', $url) || filter_var($url, FILTER_VALIDATE_URL) === false) return false;
    $parts = parse_url($url);
    if (!is_array($parts) || isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])) return false;
    $scheme = strtolower($parts['scheme'] ?? '');
    $host = strtolower($parts['host'] ?? '');
    if (($config['environment'] ?? '') === 'local') {
        return in_array($scheme, ['http', 'https'], true)
            && ($host === 'localhost' || $host === '127.0.0.1' || $host === '[::1]' || str_ends_with($host, '.localhost'));
    }
    return $scheme === 'https' && ($host === 'avereo.fr' || str_ends_with($host, '.avereo.fr'));
}

/** Seule valeur de configuration publique, normalisée. */
function vision_connect_portal(array $config): string
{
    $url = $config['connect_portal_url'] ?? '';
    return is_string($url) && vision_portal_url_is_allowed($config, $url) ? rtrim($url, '/') : '';
}

function vision_logout_destination(array $config): string
{
    $portal = vision_connect_portal($config);
    return $portal === '' ? '' : $portal . '/?logout=1';
}
