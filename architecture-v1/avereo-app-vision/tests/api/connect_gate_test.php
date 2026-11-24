<?php

declare(strict_types=1);

require_once __DIR__ . '/../../frontend/public/api/lib/connect_gate.php';

const VISION_GATE_TEST_SECRET = '0123456789012345678901234567890123456789';
const VISION_GATE_TEST_NOW = 1000000100;

// Encodage et signature indépendants de l'implémentation à tester (format CONNECT).
function vision_gate_test_sign_json(string $json, string $secret = VISION_GATE_TEST_SECRET): string
{
    $encoded = rtrim(strtr(base64_encode($json), '+/', '-_'), '=');
    return $encoded . '.' . rtrim(strtr(base64_encode(hash_hmac('sha256', $encoded, $secret, true)), '+/', '-_'), '=');
}

function vision_gate_test_payload(): array
{
    return [
        'v' => 1, 'app' => 'vision', 'iat' => 1000000000, 'exp' => 1000000300,
        'nonce' => 'abcdefghijklmnopqrstuvwx', 'remembered' => true,
        'identity' => ['provider' => 'avereo_connect', 'id' => '12'],
    ];
}

function vision_gate_test_sign(array $payload): string
{
    return vision_gate_test_sign_json(json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
}

/** Le dossier est propre au test ; pas de nettoyage récursif d'un chemin partagé. */
function vision_gate_test_with_directory(callable $test): void
{
    $directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'vision-gate-' . bin2hex(random_bytes(12));
    try {
        $test($directory, ['connect_launch_secret' => VISION_GATE_TEST_SECRET, 'connect_launch_nonce_directory' => $directory]);
    } finally {
        if (is_dir($directory)) {
            foreach (new DirectoryIterator($directory) as $file) {
                if (!$file->isDot()) {
                    unlink($file->getPathname());
                }
            }
            rmdir($directory);
        } elseif (is_file($directory)) {
            unlink($directory);
        }
    }
}

vision_test('connect_gate : échange valide et remembered strict', function (): void {
    vision_gate_test_with_directory(function ($directory, $config): void {
        vision_assert_false(is_dir($directory));
        vision_assert_same(['provider' => 'avereo_connect', 'id' => '12', 'remembered' => true],
            vision_gate_exchange_ticket($config, vision_gate_test_sign(vision_gate_test_payload()), VISION_GATE_TEST_NOW));
        vision_assert_true(is_dir($directory));
        $payload = vision_gate_test_payload();
        $payload['nonce'] = str_repeat('Z', 24);
        $payload['remembered'] = false;
        vision_assert_same(false, vision_gate_exchange_ticket($config, vision_gate_test_sign($payload), VISION_GATE_TEST_NOW)['remembered']);
        vision_assert_same(2, count(glob($directory . '/*.used')));
    });
});

vision_test('connect_gate : vecteur figé compatible CONNECT', function (): void {
    $json = '{"v":1,"app":"vision","iat":1000000000,"exp":1000000300,"nonce":"abcdefghijklmnopqrstuvwx","remembered":true,"identity":{"provider":"avereo_connect","id":"12"}}';
    $encoded = rtrim(strtr(base64_encode($json), '+/', '-_'), '=');
    // Signature figée, jamais recalculée pour fabriquer la valeur attendue.
    $ticket = $encoded . '.wch_-e6Vm5-wynt5tALoCI-TJemJ-JXrehAWZq7X1bQ';
    vision_assert_same($ticket, vision_gate_test_sign_json($json));
    vision_gate_test_with_directory(function ($directory, $config) use ($ticket): void {
        vision_assert_same('12', vision_gate_exchange_ticket($config, $ticket, VISION_GATE_TEST_NOW)['id']);
    });
});

vision_test('connect_gate : base64url strict et canonique', function (): void {
    foreach (['', "\0\xff", 'hello'] as $raw) {
        vision_assert_same($raw, vision_gate_b64url_decode(vision_gate_b64url_encode($raw)));
    }
    foreach (['A', 'abc=', 'a+b/', "ab\n", 'Zh'] as $invalid) {
        vision_assert_throws(fn () => vision_gate_b64url_decode($invalid), InvalidArgumentException::class);
    }
});

vision_test('connect_gate : signatures, formes et JSON invalides', function (): void {
    $ticket = vision_gate_test_sign(vision_gate_test_payload());
    [$encoded, $signature] = explode('.', $ticket);
    $changedSignature = ($signature[0] === 'A' ? 'B' : 'A') . substr($signature, 1);
    foreach (['', 'abc', 'a.b.c', '.abc', 'abc.', '!.!', 'A.A', $encoded . '.' . $changedSignature,
        'A' . substr($encoded, 1) . '.' . $signature] as $invalid) {
        vision_assert_throws(fn () => vision_gate_decode_signed($invalid, VISION_GATE_TEST_SECRET), InvalidArgumentException::class);
    }
    foreach (['{', '"abc"', '[]', '[1]', 'null', '1'] as $json) {
        // Une liste JSON n'est jamais une charge, même vide.
        vision_assert_throws(fn () => vision_gate_decode_signed(vision_gate_test_sign_json($json), VISION_GATE_TEST_SECRET), InvalidArgumentException::class);
    }
    foreach ([str_repeat('x', 40), str_repeat('x', 31), ''] as $secret) {
        vision_assert_throws(fn () => vision_gate_decode_signed($ticket, $secret), InvalidArgumentException::class);
    }
    vision_assert_same([], vision_gate_decode_signed(vision_gate_test_sign_json('{}'), VISION_GATE_TEST_SECRET));
    // Même un JSON invalide doit d'abord échouer sur la signature.
    vision_assert_throws(fn () => vision_gate_decode_signed('ew.' . $signature, VISION_GATE_TEST_SECRET), InvalidArgumentException::class, 'Signature');
});

$invalidFields = [
    ['v', 2], ['v', '1'], ['app', 'rapport'], ['exp', VISION_GATE_TEST_NOW],
    ['exp', 1000000601], ['iat', VISION_GATE_TEST_NOW + 61], ['iat', '1000000000'],
    ['exp', '1000000300'], ['iat', -1], ['iat', 1000000300],
    ['nonce', str_repeat('a', 23)], ['nonce', str_repeat('a', 129)], ['nonce', str_repeat('a', 23) . '!'],
    ['nonce', str_repeat('a', 24) . "\n"], ['nonce', 123], ['remembered', null], ['remembered', 1],
    ['kind', null], ['kind', 'gate'], ['identity', null],
    ['identity', ['provider' => 'other', 'id' => '12']],
    ['identity', ['provider' => 'avereo_connect', 'id' => 12]],
];
foreach (['abc', '', str_repeat('1', 21), "12\n"] as $id) {
    $invalidFields[] = ['identity', ['provider' => 'avereo_connect', 'id' => $id]];
}
foreach ($invalidFields as $index => [$field, $value]) {
    vision_test('connect_gate : contenu invalide ' . $index . ' (' . $field . ')', function () use ($field, $value): void {
        $payload = vision_gate_test_payload();
        $payload[$field] = $value;
        vision_gate_test_with_directory(function ($directory, $config) use ($payload): void {
            vision_assert_throws(fn () => vision_gate_exchange_ticket($config, vision_gate_test_sign($payload), VISION_GATE_TEST_NOW), InvalidArgumentException::class);
            vision_assert_false(file_exists($directory));
        });
    });
}

vision_test('connect_gate : champs obligatoires et limites acceptées', function (): void {
    foreach (array_keys(vision_gate_test_payload()) as $field) {
        $payload = vision_gate_test_payload();
        unset($payload[$field]);
        vision_assert_throws(fn () => vision_gate_assert_ticket_payload($payload, VISION_GATE_TEST_NOW), InvalidArgumentException::class);
    }
    $payload = vision_gate_test_payload();
    $payload['iat'] = VISION_GATE_TEST_NOW + 60;
    $payload['exp'] = $payload['iat'] + 600;
    $payload['nonce'] = str_repeat('_', 128);
    $payload['identity']['id'] = str_repeat('0', 20);
    vision_gate_assert_ticket_payload($payload, VISION_GATE_TEST_NOW);
    vision_assert_same(str_repeat('0', 20), vision_gate_normalize_identity($payload['identity'])['id']);
});

vision_test('connect_gate : nonce atomique, nom haché et rejeu', function (): void {
    vision_gate_test_with_directory(function ($directory, $config): void {
        $ticket = vision_gate_test_sign(vision_gate_test_payload());
        vision_gate_exchange_ticket($config, $ticket, VISION_GATE_TEST_NOW);
        vision_assert_throws(fn () => vision_gate_exchange_ticket($config, $ticket, VISION_GATE_TEST_NOW), InvalidArgumentException::class, 'déjà utilisé');
        vision_assert_same([hash('sha256', vision_gate_test_payload()['nonce']) . '.used'], array_map('basename', glob($directory . '/*')));
        $nonce = '../escape/' . bin2hex(random_bytes(8));
        vision_gate_consume_nonce($directory, $nonce, 1000000300, VISION_GATE_TEST_NOW);
        vision_assert_true(is_file($directory . '/' . hash('sha256', $nonce) . '.used'));
        vision_assert_same(2, count(glob($directory . '/*')));
    });
});

vision_test('connect_gate : nettoyage borné à 50 expirations anciennes', function (): void {
    vision_gate_test_with_directory(function ($directory): void {
        mkdir($directory, 0700);
        for ($i = 0; $i < 55; $i++) {
            file_put_contents($directory . '/' . hash('sha256', (string) $i) . '.used', (string) (VISION_GATE_TEST_NOW - 3601));
        }
        $retained = $directory . '/' . hash('sha256', 'recent') . '.used';
        file_put_contents($retained, (string) (VISION_GATE_TEST_NOW - 3600));
        touch($retained, 1); // L'expiration stockée, et non le mtime, décide du nettoyage.
        file_put_contents($directory . '/unrelated.txt', 'preserved');
        vision_gate_consume_nonce($directory, 'fresh', 1000000300, VISION_GATE_TEST_NOW);
        vision_assert_same(7, count(glob($directory . '/*.used')));
        vision_assert_true(is_file($retained));
        vision_assert_true(is_file($directory . '/unrelated.txt'));
    });
});

vision_test('connect_gate : stockage impossible ferme la passerelle', function (): void {
    vision_gate_test_with_directory(function ($directory): void {
        file_put_contents($directory, 'not a directory');
        vision_assert_throws(fn () => vision_gate_consume_nonce($directory, 'nonce', 1000000300, VISION_GATE_TEST_NOW), RuntimeException::class);
    });
});

vision_test('connect_gate : configuration refusée avant consommation', function (): void {
    vision_gate_test_with_directory(function ($directory, $config): void {
        $variants = [$config, $config, $config, $config, $config];
        unset($variants[0]['connect_launch_secret'], $variants[2]['connect_launch_nonce_directory']);
        $variants[1]['connect_launch_secret'] = str_repeat('x', 31);
        $variants[3]['connect_launch_nonce_directory'] = '';
        $variants[4]['connect_launch_nonce_directory'] = '   ';
        foreach ($variants as $invalid) {
            vision_assert_throws(fn () => vision_gate_exchange_ticket($invalid, vision_gate_test_sign(vision_gate_test_payload()), VISION_GATE_TEST_NOW), InvalidArgumentException::class);
            vision_assert_false(file_exists($directory));
        }
    });
});

vision_test('connect_gate : cookie aller-retour, durée bornée et nonce aléatoire', function (): void {
    $identity = vision_gate_test_payload()['identity'];
    foreach ([10 => 300, 1800 => 1800, 999999 => 43200] as $requested => $expected) {
        $value = vision_gate_build_cookie_value($identity, false, VISION_GATE_TEST_SECRET, VISION_GATE_TEST_NOW, $requested);
        vision_assert_same($identity + ['remembered' => false, 'exp' => VISION_GATE_TEST_NOW + $expected],
            vision_gate_read_cookie_value($value, VISION_GATE_TEST_SECRET, VISION_GATE_TEST_NOW));
        $payload = vision_gate_decode_signed($value, VISION_GATE_TEST_SECRET);
        vision_assert_same($expected, $payload['exp'] - $payload['iat']);
        vision_assert_same(24, strlen(vision_gate_b64url_decode($payload['nonce'])));
        vision_assert_throws(fn () => vision_gate_assert_ticket_payload($payload, VISION_GATE_TEST_NOW), InvalidArgumentException::class);
    }
    $one = vision_gate_build_cookie_value($identity, true, VISION_GATE_TEST_SECRET, VISION_GATE_TEST_NOW, 300);
    $two = vision_gate_build_cookie_value($identity, true, VISION_GATE_TEST_SECRET, VISION_GATE_TEST_NOW, 300);
    vision_assert_true($one !== $two);
    vision_assert_same(true, vision_gate_read_cookie_value($one, VISION_GATE_TEST_SECRET, VISION_GATE_TEST_NOW)['remembered']);
    vision_assert_throws(fn () => vision_gate_read_cookie_value($one, VISION_GATE_TEST_SECRET, VISION_GATE_TEST_NOW + 300), InvalidArgumentException::class);
    vision_assert_throws(fn () => vision_gate_read_cookie_value($one, str_repeat('x', 40), VISION_GATE_TEST_NOW), InvalidArgumentException::class);
    vision_assert_throws(fn () => vision_gate_read_cookie_value(vision_gate_test_sign(vision_gate_test_payload()), VISION_GATE_TEST_SECRET, VISION_GATE_TEST_NOW), InvalidArgumentException::class);
    vision_assert_throws(fn () => vision_gate_build_cookie_value($identity, true, 'short', VISION_GATE_TEST_NOW, 300), InvalidArgumentException::class);
});

vision_test('connect_gate : validation stricte du contenu des cookies', function (): void {
    $valid = vision_gate_test_payload() + ['kind' => 'gate'];
    foreach ([['v', 2], ['app', 'rapport'], ['kind', null], ['iat', VISION_GATE_TEST_NOW + 61],
        ['iat', '1000000000'], ['exp', VISION_GATE_TEST_NOW], ['exp', 1000043201],
        ['remembered', null], ['identity', null], ['nonce', '!']] as [$field, $value]) {
        $payload = $valid;
        $payload[$field] = $value;
        vision_assert_throws(fn () => vision_gate_read_cookie_value(vision_gate_test_sign($payload), VISION_GATE_TEST_SECRET, VISION_GATE_TEST_NOW), InvalidArgumentException::class);
    }
    vision_assert_throws(fn () => vision_gate_read_cookie_value(vision_gate_test_sign($valid), VISION_GATE_TEST_SECRET, VISION_GATE_TEST_NOW, 299), InvalidArgumentException::class);
    vision_gate_test_with_directory(function ($directory, $config) use ($valid): void {
        vision_assert_throws(fn () => vision_gate_exchange_ticket($config, vision_gate_test_sign($valid), VISION_GATE_TEST_NOW), InvalidArgumentException::class);
        vision_assert_false(is_dir($directory));
    });
});

vision_test('connect_gate : options de cookie sécurisées par défaut', function (): void {
    foreach (['local' => false, 'production' => true, 'preproduction' => true, 'LOCAL' => true, '' => true] as $environment => $secure) {
        vision_assert_same(['path' => '/', 'httponly' => true, 'samesite' => 'Lax', 'secure' => $secure, 'expires' => 123],
            vision_gate_cookie_options(['environment' => $environment], 123));
    }
    vision_assert_same(true, vision_gate_cookie_options([], 0)['secure']);
});
