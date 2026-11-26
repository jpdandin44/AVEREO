<?php
declare(strict_types=1);
// Exécuté par le workflow via php /dev/stdin, avant transfert du code : autonome.
function vision_private_portal_is_allowed(string $url): bool
{
    if (preg_match('/[\x00-\x20\x7f\\\\]/', $url) || filter_var($url, FILTER_VALIDATE_URL) === false) return false;
    $parts = parse_url($url);
    return is_array($parts) && !isset($parts['user']) && !isset($parts['pass'])
        && !isset($parts['query']) && !isset($parts['fragment'])
        && strtolower($parts['scheme'] ?? '') === 'https'
        && (strtolower($parts['host'] ?? '') === 'avereo.fr' || str_ends_with(strtolower($parts['host'] ?? ''), '.avereo.fr'));
}

function vision_verify_private_portal(array $config): void
{
    if (in_array($config['environment'] ?? '', ['preproduction', 'production'], true)
        && (!is_string($config['connect_portal_url'] ?? null)
            || !vision_private_portal_is_allowed($config['connect_portal_url']))) {
        throw new RuntimeException('Portail CONNECT absent ou invalide.');
    }
}

if (($_SERVER['SCRIPT_FILENAME'] ?? '') !== '/dev/stdin' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') !== __FILE__) return;
try {
    $directory = $argv[1];
    $path = $directory . '/config.php';
    if (!is_file($path) || (fileperms($path) & 0777) !== 0600 || !is_dir($directory . '/nonces')) throw new RuntimeException();
    ob_start();
    $config = require $path;
    ob_end_clean();
    vision_verify_private_portal(is_array($config) ? $config : []);
    if (!is_array($config) || ($config['environment'] ?? '') !== $argv[2]) throw new RuntimeException();
} catch (Throwable) {
    while (ob_get_level()) ob_end_clean();
    fwrite(STDERR, "Configuration privée absente ou invalide, voir étape 2 de la procédure.\n");
    exit(1);
}
