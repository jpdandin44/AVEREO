<?php

declare(strict_types=1);

// Authentification de l'API. Deux modes (configuration `auth_mode`) :
//  - « connect » : cookie de passerelle signé, obtenu en échangeant un ticket CONNECT (voir connect/entry.php) ;
//  - « token » : jeton statique pour le développement local uniquement (refusé hors environnement « local »
//    et hors hôtes locaux). L'en-tête X-Vision-Local-User choisit l'identité de test (chiffres), « 1 » par défaut.
// Le résultat est toujours une identité {provider, id}. Aucune fonction n'envoie de réponse : l'appelant décide.

/** Hôte local de développement : localhost, 127.0.0.1, ::1 ou *.localhost (port ignoré). */
function vision_host_is_local(string $hostHeader): bool
{
    $host = strtolower(trim($hostHeader));
    if (str_starts_with($host, '[')) {
        $end = strpos($host, ']');
        $host = $end === false ? $host : substr($host, 1, $end - 1);
    } elseif (substr_count($host, ':') === 1) {
        $host = explode(':', $host, 2)[0];
    }
    return $host === 'localhost' || $host === '127.0.0.1' || $host === '::1' || str_ends_with($host, '.localhost');
}

/** Valeur du jeton « Bearer » de la requête, ou null. */
function vision_bearer_token(array $server): ?string
{
    $header = (string) ($server['HTTP_AUTHORIZATION'] ?? $server['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if (preg_match('/^Bearer\s+(\S+)$/i', trim($header), $matches) === 1) {
        return $matches[1];
    }
    return null;
}

/**
 * Identité du mode « token » (développement local) ou null.
 * @return array{provider: string, id: string}|null
 */
function vision_authenticate_token(array $config, array $server): ?array
{
    if (($config['environment'] ?? '') !== 'local' || !vision_host_is_local((string) ($server['HTTP_HOST'] ?? ''))) {
        return null;
    }
    $expected = (string) ($config['api_token'] ?? '');
    $given = vision_bearer_token($server);
    if ($given === null || strlen($expected) < 32 || !hash_equals($expected, $given)) {
        return null;
    }
    $user = trim((string) ($server['HTTP_X_VISION_LOCAL_USER'] ?? '1'));
    if (preg_match('/^[0-9]{1,20}$/', $user) !== 1) {
        return null;
    }
    return ['provider' => 'local', 'id' => $user];
}

/**
 * Identité du mode « connect » (cookie de passerelle) ou null.
 * @return array{provider: string, id: string}|null
 */
function vision_authenticate_connect(array $config, array $cookies, ?int $now = null): ?array
{
    require_once __DIR__ . '/connect_gate.php';
    $value = (string) ($cookies[(string) $config['connect_gate_cookie']] ?? '');
    if ($value === '') {
        return null;
    }
    try {
        $gate = vision_gate_read_cookie_value($value, (string) $config['connect_launch_secret'], $now ?? time());
    } catch (InvalidArgumentException) {
        return null;
    }
    return ['provider' => (string) $gate['provider'], 'id' => (string) $gate['id']];
}

/**
 * Authentifie la requête selon le mode configuré.
 * @return array{provider: string, id: string}|null null si non authentifié
 */
function vision_authenticate(array $config, array $server, array $cookies, ?int $now = null): ?array
{
    return $config['auth_mode'] === 'token'
        ? vision_authenticate_token($config, $server)
        : vision_authenticate_connect($config, $cookies, $now);
}

/** Identité obligatoire : 401 JSON sinon. */
function vision_require_identity(array $config): array
{
    $identity = vision_authenticate($config, $_SERVER, $_COOKIE);
    if ($identity === null) {
        vision_error(401, 'unauthenticated', 'Authentification requise.');
    }
    return $identity;
}
