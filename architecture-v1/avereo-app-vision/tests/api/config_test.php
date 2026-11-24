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

vision_test('config : jeton local trop court refusé', function () {
    vision_assert_throws(fn () => vision_test_config(['api_token' => 'court']), VisionConfigException::class, '32');
});

vision_test('config : valeurs par défaut sûres (production, ticket CONNECT) : refus sans secret', function () {
    vision_assert_same('production', vision_default_config()['environment']);
    vision_assert_same('connect', vision_default_config()['auth_mode']);
    vision_assert_throws(fn () => vision_config([]), VisionConfigException::class, 'CONNECT');
});

vision_test('config : mode connect exige un secret de 32 caractères et un dossier de nonces', function () {
    $base = ['environment' => 'production', 'auth_mode' => 'connect'];
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
