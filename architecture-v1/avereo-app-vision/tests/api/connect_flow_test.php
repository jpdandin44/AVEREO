<?php

declare(strict_types=1);

// Parcours CONNECT de bout en bout : ticket forgé avec le même secret que CONNECT → connect/entry.php → cookie de passerelle
// → API. Un second serveur PHP, en mode « connect », est lancé pour la durée du test (dans le conteneur).
// Les tickets sont des tickets d'essai : l'essai avec un vrai ticket CONNECT suppose l'application enregistrée dans CONNECT.
require_once __DIR__ . '/../../frontend/public/api/lib/config.php';
require_once __DIR__ . '/http_support.php';

function vision_connect_b64(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

/** Ticket au format CONNECT (réécrit ici, indépendamment du code testé). */
function vision_connect_ticket(string $secret, array $override = [], ?string $userId = '12'): string
{
    $now = time();
    $payload = array_replace_recursive([
        'v' => 1,
        'app' => 'vision',
        'iat' => $now,
        'exp' => $now + 300,
        'nonce' => vision_connect_b64(random_bytes(24)),
        'remembered' => false,
        'identity' => ['provider' => 'avereo_connect', 'id' => $userId],
    ], $override);
    $encoded = vision_connect_b64(json_encode($payload, JSON_UNESCAPED_SLASHES));
    return $encoded . '.' . vision_connect_b64(hash_hmac('sha256', $encoded, $secret, true));
}

/** Lance un serveur PHP en mode « connect » ; renvoie [process, base URL, secret, dossier temporaire]. */
function vision_connect_start_server(): array
{
    if (!function_exists('proc_open')) {
        vision_skip('proc_open indisponible');
    }
    try {
        $local = vision_config();
    } catch (Throwable) {
        vision_skip('configuration locale absente');
    }
    $secret = bin2hex(random_bytes(24));
    $dir = sys_get_temp_dir() . '/vision-connect-' . bin2hex(random_bytes(4));
    mkdir($dir . '/nonces', 0700, true);
    $config = [
        'environment' => 'local',
        'auth_mode' => 'connect',
        'db' => $local['db'],
        'connect_launch_secret' => $secret,
        'connect_launch_nonce_directory' => $dir . '/nonces',
        'admin_user_ids' => ['12'],
    ];
    file_put_contents($dir . '/config.php', '<?php return ' . var_export($config, true) . ';');
    $port = random_int(18100, 18900);
    $root = realpath(__DIR__ . '/../..');
    $process = proc_open(
        ['php', '-S', "127.0.0.1:$port", '-t', $root . '/frontend/public', $root . '/local/router.php'],
        [0 => ['pipe', 'r'], 1 => ['file', $dir . '/serveur.log', 'a'], 2 => ['file', $dir . '/serveur.log', 'a']],
        $pipes,
        $root,
        ['AVEREO_CONFIG_FILE' => $dir . '/config.php', 'PATH' => (string) getenv('PATH')]
    );
    for ($i = 0; $i < 40; $i++) {
        usleep(100_000);
        if (@fsockopen('127.0.0.1', $port, $errno, $errstr, 0.2)) {
            return [$process, "http://127.0.0.1:$port", $secret, $dir];
        }
    }
    proc_terminate($process);
    vision_skip('serveur de test « connect » non démarré');
}

function vision_connect_stop_server(array $server): void
{
    [$process, , , $dir] = $server;
    proc_terminate($process);
    foreach (glob($dir . '/nonces/*') ?: [] as $file) {
        unlink($file);
    }
    @rmdir($dir . '/nonces');
    foreach (glob($dir . '/*') ?: [] as $file) {
        unlink($file);
    }
    @rmdir($dir);
}

/** Appelle entry.php sans suivre la redirection et renvoie [statut, cookie « nom=valeur » ou null, en-têtes]. */
function vision_connect_enter(string $base, string $ticket): array
{
    $context = stream_context_create(['http' => ['method' => 'GET', 'ignore_errors' => true, 'follow_location' => 0, 'timeout' => 10]]);
    @file_get_contents($base . '/connect/entry.php?ticket=' . rawurlencode($ticket), false, $context);
    $headers = $http_response_header ?? [];
    $status = (int) (preg_match('#HTTP/\S+\s+(\d{3})#', $headers[0] ?? '', $m) ? $m[1] : 0);
    $cookie = null;
    foreach ($headers as $line) {
        if (stripos($line, 'Set-Cookie:') === 0) {
            $cookie = trim(explode(';', substr($line, 11), 2)[0]);
        }
    }
    return [$status, $cookie, $headers];
}

vision_test('R08 connect : ticket valide → cookie de passerelle → accès à l\'API, rôle fondateur pour un administrateur', function () {
    $server = vision_connect_start_server();
    try {
        [, $base, $secret] = $server;
        [$status, $cookie, $headers] = vision_connect_enter($base, vision_connect_ticket($secret));
        vision_assert_same(303, $status);
        vision_assert_true($cookie !== null && str_starts_with($cookie, 'AVEREO_VISION_GATE='));
        $flags = implode(' ', $headers);
        vision_assert_true(stripos($flags, 'HttpOnly') !== false, 'cookie HttpOnly');
        vision_assert_true(stripos($flags, 'SameSite=Lax') !== false, 'cookie SameSite=Lax');
        $me = vision_http('GET', '/api/auth.php', ['Cookie' => $cookie], null, $base);
        vision_assert_same(200, $me['status']);
        vision_assert_same(['provider' => 'avereo_connect', 'id' => '12'], $me['json']['identity']);
        vision_assert_same('fondateur', $me['json']['role']);
        vision_assert_same(401, vision_http('GET', '/api/auth.php', [], null, $base)['status'], 'sans cookie : 401');
    } finally {
        vision_connect_stop_server($server);
    }
});

vision_test('R08 connect : un utilisateur non administrateur est conseiller et reste cloisonné', function () {
    $server = vision_connect_start_server();
    try {
        [, $base, $secret] = $server;
        [, $cookieA] = vision_connect_enter($base, vision_connect_ticket($secret, [], '77'));
        [, $cookieB] = vision_connect_enter($base, vision_connect_ticket($secret, [], '78'));
        $json = static fn (string $cookie, string $method, string $path, ?array $body = null) => vision_http(
            $method,
            $path,
            ['Cookie' => $cookie] + ($body !== null ? ['Content-Type' => 'application/json'] : []),
            $body !== null ? json_encode($body) : null,
            $base
        );
        vision_assert_same('conseiller', $json($cookieA, 'GET', '/api/auth.php')['json']['role']);
        $id = $json($cookieA, 'POST', '/api/projects.php', ['name' => 'Projet connecté'])['json']['project']['id'];
        vision_assert_same(404, $json($cookieB, 'GET', '/api/projects.php?id=' . $id)['status']);
        vision_assert_same([], $json($cookieB, 'GET', '/api/projects.php')['json']['projects']);
    } finally {
        vision_connect_stop_server($server);
    }
});

vision_test('R08 connect : ticket rejoué, expiré, mal signé, d\'une autre application ou sans ticket : 403 sans cookie', function () {
    $server = vision_connect_start_server();
    try {
        [, $base, $secret] = $server;
        $valide = vision_connect_ticket($secret);
        vision_assert_same(303, vision_connect_enter($base, $valide)[0]);
        [$rejeu, $cookieRejeu] = vision_connect_enter($base, $valide);
        vision_assert_same(403, $rejeu, 'un ticket ne sert qu\'une fois');
        vision_assert_same(null, $cookieRejeu);
        $now = time();
        $refuses = [
            'expiré' => vision_connect_ticket($secret, ['iat' => $now - 700, 'exp' => $now - 400]),
            'autre secret' => vision_connect_ticket(str_repeat('z', 48)),
            'autre application' => vision_connect_ticket($secret, ['app' => 'rapport']),
            'durée excessive' => vision_connect_ticket($secret, ['exp' => $now + 5000]),
            'identité non CONNECT' => vision_connect_ticket($secret, ['identity' => ['provider' => 'local']]),
            'identité non numérique' => vision_connect_ticket($secret, [], 'admin'),
            'vide' => '',
            'charge non signée' => 'e30.AAAA',
        ];
        foreach ($refuses as $nom => $ticket) {
            [$status, $cookie] = vision_connect_enter($base, $ticket);
            vision_assert_same(403, $status, $nom);
            vision_assert_same(null, $cookie, $nom);
        }
    } finally {
        vision_connect_stop_server($server);
    }
});

vision_test('R08 connect : cookie falsifié ou jeton local refusés en mode connect', function () {
    $server = vision_connect_start_server();
    try {
        [, $base, $secret] = $server;
        [, $cookie] = vision_connect_enter($base, vision_connect_ticket($secret));
        $forge = substr($cookie, 0, -3) . 'AAA';
        vision_assert_same(401, vision_http('GET', '/api/auth.php', ['Cookie' => $forge], null, $base)['status']);
        vision_assert_same(401, vision_http('GET', '/api/auth.php', ['Cookie' => 'AVEREO_VISION_GATE=n-importe-quoi'], null, $base)['status']);
        vision_assert_same(401, vision_http('GET', '/api/auth.php', ['Authorization' => 'Bearer ' . $secret], null, $base)['status']);
        // le ticket lui-même n'est pas un cookie valide
        vision_assert_same(401, vision_http('GET', '/api/auth.php', ['Cookie' => 'AVEREO_VISION_GATE=' . vision_connect_ticket($secret, [], '5')], null, $base)['status']);
    } finally {
        vision_connect_stop_server($server);
    }
});

vision_test('R08 connect : entry.php est introuvable en mode « token » (développement)', function () {
    $r = vision_http('GET', '/connect/entry.php?ticket=x');
    vision_assert_same(404, $r['status']);
});
