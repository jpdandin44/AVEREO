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
    // Forme stricte : nom de domaine local, ou IPv4 locale, ou IPv6 locale entre crochets, puis un port facultatif.
    // Rien d'autre n'est toléré après l'hôte (« [::1]evil.com » est refusé). Ce contrôle ne remplace pas la
    // configuration (jeton refusé hors « local ») : l'en-tête Host peut être falsifié par un client distant.
    return preg_match('/^(localhost|127\.0\.0\.1|\[::1\]|[a-z0-9-]+(\.[a-z0-9-]+)*\.localhost)(:[0-9]{1,5})?\z/', strtolower($hostHeader)) === 1;
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
    $value = $cookies[vision_gate_cookie_name($config)] ?? '';
    if (!is_string($value) || $value === '') {
        return null;
    }
    try {
        $key = vision_gate_cookie_key((string) $config['connect_launch_secret'], (string) $config['environment']);
        $gate = vision_gate_read_cookie_value($value, $key, $now ?? time(), vision_gate_cookie_lifetime($config));
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
        vision_error(401, 'unauthenticated', 'Authentification requise.', ['connect_portal' => vision_connect_portal($config)]);
    }
    // Le client peut indiquer le compte auquel appartiennent ses données locales : si la session est devenue celle d'un autre
    // compte (autre onglet, reconnexion), rien n'est lu ni écrit, pour ne jamais mélanger les données de deux comptes.
    $expected = $_SERVER['HTTP_X_VISION_EXPECTED_IDENTITY'] ?? null;
    if (is_string($expected) && $expected !== $identity['provider'] . ':' . $identity['id']) {
        vision_error(409, 'identity_changed', 'Un autre compte est connecté : rechargez la page.');
    }
    return $identity;
}
