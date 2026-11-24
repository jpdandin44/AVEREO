<?php

declare(strict_types=1);

// Durcissements issus de la relecture de sécurité du Lot 2A : clé et nom du cookie, hôtes locaux, durées.
require_once __DIR__ . '/../../frontend/public/api/lib/config.php';
require_once __DIR__ . '/../../frontend/public/api/lib/auth.php';
require_once __DIR__ . '/../../frontend/public/api/lib/connect_gate.php';

vision_test('sécurité : la clé du cookie dépend de l\'environnement et diffère du secret des tickets', function () {
    $secret = str_repeat('s', 40);
    $preprod = vision_gate_cookie_key($secret, 'preproduction');
    $prod = vision_gate_cookie_key($secret, 'production');
    vision_assert_same(64, strlen($preprod));
    vision_assert_true($preprod !== $prod, 'une clé par environnement');
    vision_assert_true($preprod !== $secret && $prod !== $secret, 'distincte du secret des tickets');
    vision_assert_same($prod, vision_gate_cookie_key($secret, 'production'), 'déterministe');
});

vision_test('sécurité M1 : un cookie de préproduction n\'est pas valable en production, même avec un secret partagé', function () {
    $secret = str_repeat('s', 40);
    $now = 1_800_000_000;
    $cookie = vision_gate_build_cookie_value(['provider' => 'avereo_connect', 'id' => '7'], false, vision_gate_cookie_key($secret, 'preproduction'), $now, 1800);
    $lu = vision_gate_read_cookie_value($cookie, vision_gate_cookie_key($secret, 'preproduction'), $now + 10);
    vision_assert_same('7', $lu['id']);
    vision_assert_throws(
        fn () => vision_gate_read_cookie_value($cookie, vision_gate_cookie_key($secret, 'production'), $now + 10),
        InvalidArgumentException::class,
        '',
        'cookie transféré vers la production'
    );
    vision_assert_throws(fn () => vision_gate_read_cookie_value($cookie, $secret, $now + 10), InvalidArgumentException::class, '', 'signé avec la clé des tickets : refusé');
});

vision_test('sécurité : nom du cookie préfixé __Host- hors local, sans doublon', function () {
    vision_assert_same('AVEREO_VISION_GATE', vision_gate_cookie_name(['environment' => 'local', 'connect_gate_cookie' => 'AVEREO_VISION_GATE']));
    vision_assert_same('__Host-AVEREO_VISION_GATE', vision_gate_cookie_name(['environment' => 'production', 'connect_gate_cookie' => 'AVEREO_VISION_GATE']));
    vision_assert_same('__Host-AVEREO_VISION_GATE', vision_gate_cookie_name(['environment' => 'preproduction', 'connect_gate_cookie' => '__Host-AVEREO_VISION_GATE']));
    $options = vision_gate_cookie_options(['environment' => 'production'], 100);
    vision_assert_true($options['secure'] === true && $options['path'] === '/' && !array_key_exists('domain', $options), 'exigences du préfixe __Host-');
});

vision_test('sécurité : durée du cookie bornée de 300 s à 12 h selon la configuration', function () {
    vision_assert_same(1800, vision_gate_cookie_lifetime([]));
    vision_assert_same(300, vision_gate_cookie_lifetime(['connect_gate_session_seconds' => 5]));
    vision_assert_same(43200, vision_gate_cookie_lifetime(['connect_gate_session_seconds' => 999999]));
    vision_assert_same(900, vision_gate_cookie_lifetime(['connect_gate_session_seconds' => 900]));
});

vision_test('sécurité m1 : hôtes locaux — forme stricte, rien après le crochet ou le nom', function () {
    foreach (['localhost', 'LOCALHOST:5173', '127.0.0.1:8110', '[::1]', '[::1]:80', 'a.b.localhost', 'vision.avereo.localhost:8443'] as $host) {
        vision_assert_true(vision_host_is_local($host), $host);
    }
    foreach (['[::1]evil.com', '[::1]x', 'localhost.evil.com', 'evil.com/localhost', 'localhost:80:80', 'localhost@evil.com', '127.0.0.1.evil.com', '::1', '.localhost', ' evil.com', 'localhost:abc', 'localhost:123456', "localhost\n"] as $host) {
        vision_assert_false(vision_host_is_local($host), $host);
    }
});
