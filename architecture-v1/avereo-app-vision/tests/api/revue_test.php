<?php

declare(strict_types=1);

require_once __DIR__ . '/../../local/revue/lib.php';
require_once __DIR__ . '/../../frontend/public/api/lib/connect_gate.php';

vision_test('revue : trois comptes fictifs distincts et numériques', function (): void {
    $comptes = vision_revue_comptes();
    vision_assert_same(['A', 'B', 'F'], array_keys($comptes));
    vision_assert_same(['900001', '900002', '900009'], array_column($comptes, 'id'));
    foreach ($comptes as $compte) {
        vision_assert_true(is_string($compte['id']) && preg_match('/^[0-9]+$/D', $compte['id']) === 1);
        vision_assert_true(is_string($compte['libelle']) && $compte['libelle'] !== '');
    }
    vision_assert_true($comptes['F']['id'] !== $comptes['A']['id'] && $comptes['F']['id'] !== $comptes['B']['id']);
});

vision_test('revue : ticket accepté par la vraie passerelle, rejeu et autre secret refusés', function (): void {
    $secret = str_repeat('s', 48);
    $now = 1000000000;
    $directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'vision-revue-' . bin2hex(random_bytes(12));
    $config = ['connect_launch_secret' => $secret, 'connect_launch_nonce_directory' => $directory];
    try {
        $ticket = vision_revue_ticket($secret, '900001', $now, str_repeat('n', 32));
        $payload = vision_gate_decode_signed($ticket, $secret);
        vision_assert_same('vision', $payload['app']);
        vision_assert_same(1, $payload['v']);
        vision_assert_same($now, $payload['iat']);
        vision_assert_same(300, $payload['exp'] - $payload['iat']);
        vision_assert_same(false, $payload['remembered']);
        vision_assert_same(str_repeat('n', 32), $payload['nonce']);
        // Le mauvais secret doit échouer AVANT la consommation du nonce.
        $autre = $config;
        $autre['connect_launch_secret'] = str_repeat('x', 48);
        vision_assert_throws(fn () => vision_gate_exchange_ticket($autre, $ticket, $now), InvalidArgumentException::class, 'Signature');
        vision_assert_false(is_dir($directory));
        vision_assert_same(['provider' => 'avereo_connect', 'id' => '900001', 'remembered' => false],
            vision_gate_exchange_ticket($config, $ticket, $now));
        vision_assert_throws(fn () => vision_gate_exchange_ticket($config, $ticket, $now), InvalidArgumentException::class, 'déjà utilisé');
    } finally {
        if (is_dir($directory)) {
            foreach (glob($directory . '/*.used') ?: [] as $file) {
                unlink($file);
            }
            rmdir($directory);
        }
    }
});

vision_test('revue : nonce par défaut aléatoire de 24 octets', function (): void {
    $secret = str_repeat('s', 48);
    $one = vision_gate_decode_signed(vision_revue_ticket($secret, '900001', 1000000000), $secret);
    $two = vision_gate_decode_signed(vision_revue_ticket($secret, '900001', 1000000000), $secret);
    vision_assert_same(24, strlen(vision_gate_b64url_decode($one['nonce'])));
    vision_assert_true($one['nonce'] !== $two['nonce']);
});

vision_test('revue : page autorisée seulement en CONNECT local avec secret suffisant', function (): void {
    $valid = ['environment' => 'local', 'auth_mode' => 'connect', 'connect_launch_secret' => str_repeat('s', 32)];
    vision_assert_true(vision_revue_autorise($valid));
    vision_assert_true(vision_revue_autorise(array_replace($valid, ['connect_launch_secret' => str_repeat('s', 48)])));
    foreach ([['environment' => 'production'], ['environment' => 'preproduction'], ['environment' => 'LOCAL'],
        ['auth_mode' => 'token'], ['connect_launch_secret' => str_repeat('s', 31)],
        ['connect_launch_secret' => ''], ['connect_launch_secret' => null], ['connect_launch_secret' => []]] as $override) {
        vision_assert_false(vision_revue_autorise(array_replace($valid, $override)));
    }
    vision_assert_false(vision_revue_autorise([]));
});

vision_test('revue : routeur interdit statiquement les bibliothèques et bootstrap', function (): void {
    $router = file_get_contents(__DIR__ . '/../../local/revue/router.php');
    vision_assert_true(is_string($router));
    vision_assert_true(str_contains($router, '#^/api/(lib/|bootstrap\\.php$)#'));
    vision_assert_true(str_contains($router, 'http_response_code(403)'));
    vision_assert_true(str_contains($router, 'rawurldecode'));
    vision_assert_true(str_contains($router, "explode('?', \$uri, 2)[0]"));
});
