<?php

declare(strict_types=1);

// Tests d'intégration de l'API des projets, par HTTP, contre le serveur local (dans le conteneur : http://127.0.0.1).
// Ignorés si le serveur ou la configuration locale sont absents (par exemple en exécutant les tests hors du conteneur).
require_once __DIR__ . '/http_support.php';

vision_test('api : santé et en-têtes de sécurité', function () {
    $r = vision_http('GET', '/api/health.php');
    vision_assert_same(200, $r['status']);
    vision_assert_same('up', $r['json']['database']);
    vision_assert_false(array_key_exists('environment', $r['json']), 'la santé ne révèle ni l\'environnement…');
    vision_assert_false(array_key_exists('auth_mode', $r['json']), '… ni le mode d\'authentification');
    vision_assert_same('nosniff', $r['headers']['x-content-type-options']);
    vision_assert_same('no-store', $r['headers']['cache-control']);
});

vision_test('api : bibliothèques et bootstrap jamais servis directement', function () {
    vision_assert_same(403, vision_http('GET', '/api/lib/config.php')['status']);
    vision_assert_same(403, vision_http('GET', '/api/lib/droits.php')['status']);
    vision_assert_same(403, vision_http('GET', '/api/bootstrap.php')['status']);
    foreach (['//api/lib/config.php', '/API/lib/config.php', '/api//lib/droits.php', '/api/%6Cib/config.php', '/api/lib/../lib/auth.php', '/API/BOOTSTRAP.PHP'] as $variante) {
        vision_assert_same(403, vision_http('GET', $variante)['status'], $variante);
    }
});

vision_test('R08 : 401 sans session, avec un mauvais jeton, avec une identité non numérique ou un hôte public', function () {
    vision_assert_same(401, vision_http('GET', '/api/projects.php')['status']);
    vision_assert_same(401, vision_http('GET', '/api/auth.php')['status']);
    vision_assert_same(401, vision_http('GET', '/api/projects.php', ['Authorization' => 'Bearer ' . str_repeat('x', 40)])['status']);
    vision_assert_same(401, vision_api('GET', '/api/projects.php', 'abc')['status']);
    $config = vision_api_test_config();
    $r = vision_http('GET', '/api/projects.php', ['Authorization' => 'Bearer ' . $config['api_token'], 'Host' => 'vision.avereo.fr']);
    vision_assert_same(401, $r['status'], 'le jeton local n\'est jamais accepté depuis un hôte public');
    vision_assert_same('unauthenticated', vision_http('GET', '/api/projects.php')['json']['error']);
});

vision_test('R02 : le rôle vient de la configuration (conseiller par défaut, fondateur listé)', function () {
    $conseiller = vision_api('GET', '/api/auth.php', vision_api_user());
    vision_assert_same('conseiller', $conseiller['json']['role']);
    vision_assert_false(in_array('project.read_any', $conseiller['json']['droits'], true));
    $fondateur = vision_api('GET', '/api/auth.php', vision_api_admin_id());
    vision_assert_same('fondateur', $fondateur['json']['role']);
    vision_assert_true(in_array('project.read_any', $fondateur['json']['droits'], true));
});

vision_test('R01 : créer, lister, lire, renommer et archiver un projet', function () {
    $user = vision_api_user();
    $created = vision_api('POST', '/api/projects.php', $user, ['name' => '  Maison Lefèvre  ', 'address' => '3 allée des Tilleuls', 'client_label' => 'Mme Lefèvre']);
    vision_assert_same(201, $created['status']);
    $project = $created['json']['project'];
    vision_assert_true(preg_match('/^[0-9a-f]{32}$/', $project['id']) === 1);
    vision_assert_same('Maison Lefèvre', $project['name']);
    vision_assert_same('active', $project['status']);
    vision_assert_same(['provider' => 'local', 'id' => $user], $project['owner']);
    vision_assert_false(array_key_exists('owner_email', $project));

    $list = vision_api('GET', '/api/projects.php', $user);
    vision_assert_same(200, $list['status']);
    vision_assert_same([$project['id']], array_column($list['json']['projects'], 'id'));

    $read = vision_api('GET', '/api/projects.php?id=' . $project['id'], $user);
    vision_assert_same('Mme Lefèvre', $read['json']['project']['client_label']);

    $renamed = vision_api('PATCH', '/api/projects.php?id=' . $project['id'], $user, ['name' => 'Maison Lefèvre — rénovation']);
    vision_assert_same(200, $renamed['status']);
    vision_assert_same('Maison Lefèvre — rénovation', $renamed['json']['project']['name']);
    vision_assert_same('3 allée des Tilleuls', $renamed['json']['project']['address'], 'les autres champs sont conservés');

    $archived = vision_api('PATCH', '/api/projects.php?id=' . $project['id'], $user, ['status' => 'archived']);
    vision_assert_same('archived', $archived['json']['project']['status']);
    vision_assert_true($archived['json']['project']['archived_at'] !== null);
    vision_assert_same([], vision_api('GET', '/api/projects.php', $user)['json']['projects'], 'un projet archivé sort de la liste par défaut');
    vision_assert_same([$project['id']], array_column(vision_api('GET', '/api/projects.php?status=archived', $user)['json']['projects'], 'id'));

    $restored = vision_api('PATCH', '/api/projects.php?id=' . $project['id'], $user, ['status' => 'active']);
    vision_assert_same(null, $restored['json']['project']['archived_at']);
});

vision_test('R08 : un utilisateur ne voit ni ne modifie les projets d\'un autre (404, pas 403)', function () {
    $alice = vision_api_user();
    $bob = vision_api_user();
    $id = vision_api('POST', '/api/projects.php', $alice, ['name' => 'Projet privé d\'Alice'])['json']['project']['id'];

    vision_assert_same([], vision_api('GET', '/api/projects.php', $bob)['json']['projects']);
    $read = vision_api('GET', '/api/projects.php?id=' . $id, $bob);
    vision_assert_same(404, $read['status']);
    vision_assert_same(404, vision_api('PATCH', '/api/projects.php?id=' . $id, $bob, ['name' => 'Piraté'])['status']);
    vision_assert_same(404, vision_api('PATCH', '/api/projects.php?id=' . $id, $bob, ['status' => 'archived'])['status']);
    // L'autre identité n'a rien changé :
    $after = vision_api('GET', '/api/projects.php?id=' . $id, $alice)['json']['project'];
    vision_assert_same('Projet privé d\'Alice', $after['name']);
    vision_assert_same('active', $after['status']);
});

vision_test('R02 : le fondateur voit et modifie tous les projets', function () {
    $user = vision_api_user();
    $id = vision_api('POST', '/api/projects.php', $user, ['name' => 'Projet d\'un conseiller'])['json']['project']['id'];
    $admin = vision_api_admin_id();
    $ids = array_column(vision_api('GET', '/api/projects.php?limit=200', $admin)['json']['projects'], 'id');
    vision_assert_true(in_array($id, $ids, true));
    vision_assert_same(200, vision_api('GET', '/api/projects.php?id=' . $id, $admin)['status']);
    $r = vision_api('PATCH', '/api/projects.php?id=' . $id, $admin, ['name' => 'Renommé par le fondateur']);
    vision_assert_same(200, $r['status']);
    vision_assert_same('Renommé par le fondateur', vision_api('GET', '/api/projects.php?id=' . $id, $user)['json']['project']['name']);
    vision_assert_same($user, $r['json']['project']['owner']['id'], 'le propriétaire ne change pas');
});

vision_test('api : validation des entrées (422) et identifiants (404)', function () {
    $user = vision_api_user();
    $r = vision_api('POST', '/api/projects.php', $user, ['address' => 'sans nom']);
    vision_assert_same(422, $r['status']);
    vision_assert_same('validation_failed', $r['json']['error']);
    vision_assert_true(isset($r['json']['fields']['name']));
    vision_assert_same(422, vision_api('POST', '/api/projects.php', $user, ['name' => 'A', 'owner_id' => '1'])['status'], 'champ inconnu');
    vision_assert_same(422, vision_api('POST', '/api/projects.php', $user, ['name' => str_repeat('x', 161)])['status']);
    vision_assert_same(422, vision_api('POST', '/api/projects.php', $user, ['name' => 'A', 'status' => 'archived'])['status']);
    foreach (['abc', str_repeat('A', 32), '1;DROP TABLE vision_projects', '../../etc/passwd'] as $badId) {
        vision_assert_same(404, vision_api('GET', '/api/projects.php?id=' . rawurlencode($badId), $user)['status'], $badId);
    }
    $id = vision_api('POST', '/api/projects.php', $user, ['name' => 'Valide'])['json']['project']['id'];
    vision_assert_same(422, vision_api('PATCH', '/api/projects.php?id=' . $id, $user, [])['status'], 'rien à modifier');
    vision_assert_same(422, vision_api('PATCH', '/api/projects.php?id=' . $id, $user, ['status' => 'deleted'])['status']);
});

vision_test('api : corps trop gros (413), mauvais type (415), JSON invalide (400), méthode non gérée (405)', function () {
    $user = vision_api_user();
    $config = vision_api_test_config();
    $headers = ['Authorization' => 'Bearer ' . $config['api_token'], 'X-Vision-Local-User' => $user];
    vision_assert_same(413, vision_http('POST', '/api/projects.php', $headers + ['Content-Type' => 'application/json'], json_encode(['name' => str_repeat('x', 70000)]))['status']);
    vision_assert_same(415, vision_http('POST', '/api/projects.php', $headers + ['Content-Type' => 'text/plain'], '{"name":"A"}')['status']);
    vision_assert_same(400, vision_http('POST', '/api/projects.php', $headers + ['Content-Type' => 'application/json'], '{"name":')['status']);
    $delete = vision_api('DELETE', '/api/projects.php', $user);
    vision_assert_same(405, $delete['status']);
    vision_assert_true(str_contains($delete['headers']['allow'] ?? '', 'PATCH'));
    vision_assert_same(405, vision_http('PUT', '/api/health.php')['status']);
});

vision_test('api : recherche, limites et injection SQL', function () {
    $user = vision_api_user();
    vision_api('POST', '/api/projects.php', $user, ['name' => 'Appartement Rivoli', 'address' => 'Paris']);
    vision_api('POST', '/api/projects.php', $user, ['name' => 'Pavillon', 'address' => '50% remise_x']);
    $names = static fn (string $query) => array_column(vision_api('GET', '/api/projects.php?' . $query, $user)['json']['projects'], 'name');
    vision_assert_same(['Appartement Rivoli'], $names('q=rivoli'));
    vision_assert_same(['Pavillon'], $names('q=' . rawurlencode('50%')), 'le caractère % est cherché tel quel');
    vision_assert_same(['Pavillon'], $names('q=' . rawurlencode('remise_x')), 'le caractère _ est cherché tel quel');
    $injection = vision_api('GET', '/api/projects.php?q=' . rawurlencode("' OR '1'='1"), $user);
    vision_assert_same(200, $injection['status'], 'la requête réussit (pas de plantage)');
    vision_assert_same([], $injection['json']['projects'], 'aucune injection SQL');
    vision_assert_same(1, count($names('limit=1')));
    vision_assert_same(2, count($names('limit=0')) + 1, 'une limite nulle est ramenée à 1');
    vision_assert_same(200, vision_api('GET', '/api/projects.php?status=all&offset=abc', $user)['status']);
    vision_assert_same(200, vision_api('GET', '/api/projects.php?offset=99999999999999999999', $user)['status'], 'offset borné');
    foreach (['q[]=x', 'status[]=active', 'limit[]=1', 'offset[a]=1'] as $tableau) {
        $r = vision_api('GET', '/api/projects.php?' . $tableau, $user);
        vision_assert_same(400, $r['status'], $tableau);
        vision_assert_same('invalid_parameter', $r['json']['error'], $tableau);
    }
});
