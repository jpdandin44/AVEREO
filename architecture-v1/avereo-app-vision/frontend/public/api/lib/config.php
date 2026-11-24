<?php

declare(strict_types=1);

// Configuration de l'API. Les secrets (mot de passe MySQL, jeton local, secret CONNECT) vivent dans un fichier PHP
// HORS du dossier publié : AVEREO_CONFIG_FILE, sinon ~/.avereo/vision/config.php (~/.avereo/vision-preprod/config.php pour
// un site « preprod »), dossier personnel déduit de $HOME ou de la racine web. Jamais dans le navigateur.

final class VisionConfigException extends RuntimeException
{
}

const VISION_ENVIRONMENTS = ['local', 'preproduction', 'production'];
const VISION_AUTH_MODES = ['token', 'connect'];

/** Valeurs par défaut sûres : production et ticket CONNECT. Le jeton local doit être demandé explicitement. */
function vision_default_config(): array
{
    return [
        'environment' => 'production',
        'auth_mode' => 'connect',
        'db' => ['host' => '127.0.0.1', 'port' => 3306, 'name' => 'vision', 'user' => '', 'password' => ''],
        'api_token' => '',
        'admin_user_ids' => [],
        'connect_launch_secret' => '',
        'connect_launch_nonce_directory' => '',
        'connect_gate_cookie' => 'AVEREO_VISION_GATE',
        'connect_gate_session_seconds' => 1800,
        'max_body_bytes' => 65536,
    ];
}

/** Dossier personnel (« /home/COMPTE ») déduit d'un chemin, ou chaîne vide. Sert quand $HOME n'est pas défini (hébergement mutualisé). */
function vision_home_from_path(string $path): string
{
    $path = str_replace('\\', '/', $path);
    return preg_match('#^(/home/[^/]+)(?:/|$)#', $path, $matches) === 1 ? $matches[1] : '';
}

/**
 * Chemins possibles du fichier de configuration, du plus probable au moins probable, tous hors du dossier publié.
 * Un site dont la racine web ou le dossier du code (`$apiDirectory`, seul indice en ligne de commande, où il n'y a pas de racine
 * web) contient « preprod » cherche « vision-preprod » et jamais « vision » : une préproduction ne lit donc jamais par erreur
 * la configuration de production, y compris pour `database/migrate.php`.
 * @param array<string, mixed> $server contenu de $_SERVER (injecté pour les tests)
 * @return string[]
 */
function vision_config_candidates(array $server, string $home, string $apiDirectory): array
{
    $documentRoot = strtolower(str_replace('\\', '/', (string) ($server['CONTEXT_DOCUMENT_ROOT'] ?? $server['DOCUMENT_ROOT'] ?? '')));
    $codeDirectory = strtolower(str_replace('\\', '/', $apiDirectory));
    $names = str_contains($documentRoot, 'preprod') || str_contains($codeDirectory, 'preprod') ? ['vision-preprod'] : ['vision'];
    $roots = [];
    foreach ([$home, (string) ($server['HOME'] ?? '')] as $path) {
        $roots[] = rtrim($path, '/\\');
    }
    foreach ([(string) ($server['DOCUMENT_ROOT'] ?? ''), (string) ($server['CONTEXT_DOCUMENT_ROOT'] ?? ''), $apiDirectory] as $path) {
        $roots[] = vision_home_from_path($path);
    }
    $roots = array_values(array_unique(array_filter($roots, static fn (string $root): bool => $root !== '')));
    $candidates = [];
    foreach ($roots as $root) {
        foreach ($names as $name) {
            $candidates[] = $root . '/.avereo/' . $name . '/config.php';
        }
    }
    return $candidates;
}

/**
 * Chemin du fichier de configuration, ou null s'il n'y a aucun candidat.
 * Ordre : AVEREO_CONFIG_FILE (variable d'environnement), puis le premier candidat existant, sinon le premier candidat.
 */
function vision_config_path(): ?string
{
    $explicit = getenv('AVEREO_CONFIG_FILE');
    if (!is_string($explicit) || $explicit === '') {
        $explicit = (string) ($_SERVER['AVEREO_CONFIG_FILE'] ?? $_SERVER['REDIRECT_AVEREO_CONFIG_FILE'] ?? '');
    }
    if ($explicit !== '') {
        return $explicit;
    }
    $home = getenv('HOME');
    $candidates = vision_config_candidates($_SERVER, is_string($home) ? $home : '', __DIR__);
    foreach ($candidates as $candidate) {
        if (is_file($candidate)) {
            return $candidate;
        }
    }
    return $candidates[0] ?? null;
}

/**
 * Contrôle une configuration. Lève VisionConfigException (message sans secret) si elle est dangereuse :
 *  - environnement ou mode inconnu ;
 *  - mode « token » hors environnement « local » (le jeton statique est un outil de développement) ;
 *  - mode « connect » sans secret d'au moins 32 caractères ni dossier de nonces.
 */
function vision_config_validate(array $config): void
{
    if (!in_array($config['environment'] ?? null, VISION_ENVIRONMENTS, true)) {
        throw new VisionConfigException('Environnement inconnu.');
    }
    if (!in_array($config['auth_mode'] ?? null, VISION_AUTH_MODES, true)) {
        throw new VisionConfigException("Mode d'authentification inconnu.");
    }
    if ($config['auth_mode'] === 'token') {
        if ($config['environment'] !== 'local') {
            throw new VisionConfigException("Le jeton local est interdit hors de l'environnement local.");
        }
        if (strlen((string) $config['api_token']) < 32) {
            throw new VisionConfigException('Le jeton local doit faire au moins 32 caractères.');
        }
    } else {
        if (strlen((string) $config['connect_launch_secret']) < 32) {
            throw new VisionConfigException('Le secret CONNECT doit faire au moins 32 caractères.');
        }
        if (trim((string) $config['connect_launch_nonce_directory']) === '') {
            throw new VisionConfigException('Le dossier des nonces CONNECT est obligatoire.');
        }
    }
    foreach ((array) ($config['admin_user_ids'] ?? []) as $id) {
        if (!is_string($id)) {
            throw new VisionConfigException('admin_user_ids doit contenir des chaînes.');
        }
    }
}

/**
 * Fusionne les valeurs par défaut et le fichier de configuration, puis valide.
 * @param array|null $override configuration déjà chargée (tests) ; sinon lecture du fichier
 */
function vision_config(?array $override = null): array
{
    static $cache = null;
    if ($override !== null) {
        $config = array_replace_recursive(vision_default_config(), $override);
        vision_config_validate($config);
        return $config;
    }
    if ($cache !== null) {
        return $cache;
    }
    $path = vision_config_path();
    $fromFile = [];
    if ($path !== null && is_file($path)) {
        $loaded = require $path;
        if (!is_array($loaded)) {
            throw new VisionConfigException('Le fichier de configuration doit renvoyer un tableau.');
        }
        $fromFile = $loaded;
    }
    $cache = array_replace_recursive(vision_default_config(), $fromFile);
    vision_config_validate($cache);
    return $cache;
}
