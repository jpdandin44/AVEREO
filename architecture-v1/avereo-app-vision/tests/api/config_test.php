<?php

declare(strict_types=1);

// Configuration : valeurs par défaut sûres et refus des configurations dangereuses.
require_once __DIR__ . '/../../frontend/public/api/lib/config.php';

function vision_test_config(array $override = []): array
{
    return vision_config($override + [
        'environment' => 'local',
        'auth_mode' => 'token',
        'api_token' => str_repeat('t', 40),
    ]);
}

vision_test('config : un jeton local est accepté en environnement local', function () {
    $config = vision_test_config();
    vision_assert_same('local', $config['environment']);
    vision_assert_same('token', $config['auth_mode']);
});

vision_test('config : le jeton local est interdit en préproduction et en production', function () {
    foreach (['preproduction', 'production'] as $environment) {
        vision_assert_throws(
            fn () => vision_test_config(['environment' => $environment]),
            VisionConfigException::class,
            'interdit',
            $environment
        );
    }
});

vision_test('config : chemin du fichier de configuration sur un hébergement mutualisé sans $HOME', function () {
    $api = '/home/compte/vision-preprod.avereo.fr/api/lib';
    $server = ['DOCUMENT_ROOT' => '/home/compte/vision-preprod.avereo.fr'];
    vision_assert_same(['/home/compte/.avereo/vision-preprod/config.php'], vision_config_candidates($server, '', $api), 'préproduction');
    $production = ['DOCUMENT_ROOT' => '/home/compte/vision.avereo.fr'];
    vision_assert_same(['/home/compte/.avereo/vision/config.php'], vision_config_candidates($production, '', '/home/compte/vision.avereo.fr/api/lib'), 'production');
    vision_assert_same(['/home/autre/.avereo/vision/config.php', '/home/compte/.avereo/vision/config.php'], vision_config_candidates($production, '/home/autre/', '/home/compte/vision.avereo.fr/api/lib/..'), 'HOME prioritaire');
    vision_assert_same([], vision_config_candidates([], '', '/srv/app/api/lib'), 'aucun dossier personnel déductible');
});

vision_test('config : en ligne de commande (sans racine web), le dossier du code désigne la préproduction', function () {
    vision_assert_same(
        ['/home/compte/.avereo/vision-preprod/config.php'],
        vision_config_candidates([], '', '/home/compte/vision-preprod.avereo.fr/api/lib'),
        'migrations lancées depuis la préproduction'
    );
    vision_assert_same(
        ['/home/compte/.avereo/vision-preprod/config.php'],
        vision_config_candidates([], '', '/home/compte/.avereo/vision-preprod/outils/frontend/public/api/lib'),
        'dossier d\'outils de préproduction'
    );
});

vision_test('config : une préproduction ne lit jamais la configuration de production', function () {
    foreach (vision_config_candidates(['DOCUMENT_ROOT' => '/home/compte/vision-preprod.avereo.fr'], '/home/compte', '/home/compte/vision-preprod.avereo.fr/api/lib') as $chemin) {
        vision_assert_true(!str_ends_with($chemin, '/.avereo/vision/config.php'), $chemin);
    }
});

vision_test('config : jeton local trop court refusé', function () {
    vision_assert_throws(fn () => vision_test_config(['api_token' => 'court']), VisionConfigException::class, '32');
});

vision_test('config : valeurs par défaut sûres (production, ticket CONNECT) : refus sans secret', function () {
    vision_assert_same('production', vision_default_config()['environment']);
    vision_assert_same('connect', vision_default_config()['auth_mode']);
    vision_assert_throws(fn () => vision_config([]), VisionConfigException::class, 'CONNECT');
});

vision_test('config : mode connect exige un secret de 32 caractères et un dossier de nonces', function () {
    $base = ['environment' => 'production', 'auth_mode' => 'connect', 'connect_portal_url' => 'https://connect-preprod.avereo.fr'];
    vision_assert_throws(fn () => vision_config($base + ['connect_launch_secret' => str_repeat('s', 31), 'connect_launch_nonce_directory' => '/tmp/n']), VisionConfigException::class, '32');
    vision_assert_throws(fn () => vision_config($base + ['connect_launch_secret' => str_repeat('s', 32), 'connect_launch_nonce_directory' => '']), VisionConfigException::class, 'nonces');
    $config = vision_config($base + ['connect_launch_secret' => str_repeat('s', 32), 'connect_launch_nonce_directory' => '/tmp/n']);
    vision_assert_same('connect', $config['auth_mode']);
});

vision_test('config : environnement ou mode inconnu, admin_user_ids non textuels : refus', function () {
    vision_assert_throws(fn () => vision_test_config(['environment' => 'staging']), VisionConfigException::class, 'Environnement');
    vision_assert_throws(fn () => vision_test_config(['auth_mode' => 'password']), VisionConfigException::class, 'Mode');
    vision_assert_throws(fn () => vision_test_config(['admin_user_ids' => [12]]), VisionConfigException::class, 'chaînes');
});

vision_test('config : les messages d\'erreur ne contiennent jamais un secret', function () {
    $secret = 'SECRET-' . str_repeat('x', 40);
    try {
        vision_config(['environment' => 'production', 'auth_mode' => 'token', 'api_token' => $secret]);
        vision_fail('exception attendue');
    } catch (VisionConfigException $exception) {
        vision_assert_false(str_contains($exception->getMessage(), $secret));
    }
});

vision_test('config : portail obligatoire hors local et URL normalisée', function () {
    $base = ['environment' => 'preproduction', 'auth_mode' => 'connect', 'connect_launch_secret' => str_repeat('s', 40), 'connect_launch_nonce_directory' => '/tmp/n'];
    vision_assert_throws(fn () => vision_config($base), VisionConfigException::class, 'portail');
    $config = vision_config($base + ['connect_portal_url' => 'https://connect-preprod.avereo.fr/']);
    vision_assert_same('https://connect-preprod.avereo.fr', vision_connect_portal($config));
    vision_assert_same(1800, $config['connect_gate_session_seconds']);
    foreach (['http://avereo.fr', 'https://avereo.fr.evil.test', 'https://evil.test', 'https://user@avereo.fr', 'https://avereo.fr?app=x', 'https://avereo.fr#x', "https://avereo.fr/\r\nLocation:x", 'https://avereo.fr/?', 'https://avereo.fr/#'] as $url) {
        vision_assert_throws(fn () => vision_config($base + ['connect_portal_url' => $url]), VisionConfigException::class, 'portail');
    }
    foreach (['https://avereo.fr', 'https://connect.avereo.fr/path/'] as $url) vision_config($base + ['connect_portal_url' => $url]);
    vision_assert_same('', vision_connect_portal(vision_test_config()));
    vision_assert_same('http://127.0.0.1:5251/revue', vision_connect_portal(vision_test_config(['connect_portal_url' => 'http://127.0.0.1:5251/revue/'])));
    vision_assert_throws(fn () => vision_test_config(['connect_portal_url' => 'http://evil.test/revue']), VisionConfigException::class);
});

vision_test('config : une configuration invalide ne reste jamais en cache après un premier refus', function () {
    $path = tempnam(sys_get_temp_dir(), 'vision-invalid-');
    file_put_contents($path, '<?php return [];');
    try {
        $code = 'require ' . var_export(realpath(__DIR__ . '/../../frontend/public/api/lib/config.php'), true) . '; $refus = 0; for ($i=0; $i<2; $i++) { try { vision_config(); } catch (VisionConfigException) { $refus++; } } exit($refus === 2 ? 0 : 1);';
        $process = proc_open([PHP_BINARY, '-r', $code], [['pipe','r'], ['pipe','w'], ['pipe','w']], $pipes, null, ['AVEREO_CONFIG_FILE' => $path, 'SystemRoot' => (string) getenv('SystemRoot')]);
        foreach ($pipes as $pipe) fclose($pipe);
        vision_assert_same(0, proc_close($process));
    } finally { unlink($path); }
});
