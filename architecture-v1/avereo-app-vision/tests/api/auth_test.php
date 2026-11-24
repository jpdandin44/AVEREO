<?php

declare(strict_types=1);

// Authentification : hôtes locaux, jeton local, validation de l'identité de test.
require_once __DIR__ . '/../../frontend/public/api/lib/config.php';
require_once __DIR__ . '/../../frontend/public/api/lib/auth.php';

const VISION_TEST_TOKEN = 'abcdefghijklmnopqrstuvwxyz0123456789ABCD';

function vision_test_token_config(string $environment = 'local'): array
{
    return [
        'environment' => $environment,
        'auth_mode' => 'token',
        'api_token' => VISION_TEST_TOKEN,
    ];
}

function vision_test_server(array $extra = []): array
{
    return $extra + ['HTTP_HOST' => '127.0.0.1:8110', 'HTTP_AUTHORIZATION' => 'Bearer ' . VISION_TEST_TOKEN];
}

vision_test('auth : hôtes locaux reconnus, hôtes publics refusés', function () {
    foreach (['localhost', 'localhost:8110', '127.0.0.1', '127.0.0.1:8110', '[::1]:80', 'vision.avereo.localhost', 'app.localhost:5173'] as $host) {
        vision_assert_true(vision_host_is_local($host), $host);
    }
    foreach (['vision.avereo.fr', 'localhost.evil.com', 'evil-localhost', '10.0.0.5', '', 'localhost.attacker.fr:80'] as $host) {
        vision_assert_false(vision_host_is_local($host), $host);
    }
});

vision_test('auth : jeton local valide donne l\'identité de test, « 1 » par défaut', function () {
    vision_assert_same(['provider' => 'local', 'id' => '1'], vision_authenticate_token(vision_test_token_config(), vision_test_server()));
    vision_assert_same(['provider' => 'local', 'id' => '42'], vision_authenticate_token(vision_test_token_config(), vision_test_server(['HTTP_X_VISION_LOCAL_USER' => '42'])));
});

vision_test('auth : jeton absent, faux ou mal formé : pas d\'identité', function () {
    $config = vision_test_token_config();
    vision_assert_same(null, vision_authenticate_token($config, ['HTTP_HOST' => 'localhost']));
    vision_assert_same(null, vision_authenticate_token($config, vision_test_server(['HTTP_AUTHORIZATION' => 'Bearer ' . strrev(VISION_TEST_TOKEN)])));
    vision_assert_same(null, vision_authenticate_token($config, vision_test_server(['HTTP_AUTHORIZATION' => VISION_TEST_TOKEN])));
    vision_assert_same(null, vision_authenticate_token($config, vision_test_server(['HTTP_AUTHORIZATION' => 'Basic ' . VISION_TEST_TOKEN])));
    vision_assert_same(null, vision_authenticate_token($config, vision_test_server(['HTTP_AUTHORIZATION' => 'Bearer '])));
});

vision_test('auth : le jeton local est refusé hors environnement local et hors hôte local', function () {
    vision_assert_same(null, vision_authenticate_token(vision_test_token_config('production'), vision_test_server()));
    vision_assert_same(null, vision_authenticate_token(vision_test_token_config('preproduction'), vision_test_server()));
    vision_assert_same(null, vision_authenticate_token(vision_test_token_config(), vision_test_server(['HTTP_HOST' => 'vision.avereo.fr'])));
});

vision_test('auth : identité de test non numérique refusée (pas d\'injection d\'identité)', function () {
    foreach (['abc', '1 OR 1=1', '-1', '', '123456789012345678901', '1;2'] as $user) {
        vision_assert_same(null, vision_authenticate_token(vision_test_token_config(), vision_test_server(['HTTP_X_VISION_LOCAL_USER' => $user])), $user);
    }
});

vision_test('auth : le mode « token » ne s\'active jamais quand la configuration demande « connect »', function () {
    $config = vision_config([
        'environment' => 'production',
        'auth_mode' => 'connect',
        'connect_launch_secret' => str_repeat('s', 40),
        'connect_launch_nonce_directory' => sys_get_temp_dir(),
        'api_token' => VISION_TEST_TOKEN,
    ]);
    vision_assert_same(null, vision_authenticate($config, vision_test_server(), []));
});
