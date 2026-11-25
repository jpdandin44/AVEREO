<?php

declare(strict_types=1);

// Projets : validation des entrées (aucune base de données).
require_once __DIR__ . '/../../frontend/public/api/lib/http.php';
require_once __DIR__ . '/../../frontend/public/api/lib/projects.php';

vision_test('projets : création minimale, texte nettoyé', function () {
    $r = vision_project_validate(['name' => '  Maison Dupont  '], true);
    vision_assert_same([], $r['errors']);
    vision_assert_same(['name' => 'Maison Dupont'], $r['clean']);
});

vision_test('projets : création complète', function () {
    $r = vision_project_validate(['name' => 'T3 Lille', 'address' => '12 rue des Fleurs, 59000 Lille', 'client_label' => 'M. et Mme Martin'], true);
    vision_assert_same([], $r['errors']);
    vision_assert_same('M. et Mme Martin', $r['clean']['client_label']);
});

vision_test('projets : nom obligatoire à la création, non vide, 160 caractères au plus', function () {
    vision_assert_same(['name' => 'Champ obligatoire.'], vision_project_validate([], true)['errors']);
    vision_assert_same(['name' => 'Ne peut pas être vide.'], vision_project_validate(['name' => '   '], true)['errors']);
    vision_assert_same([], vision_project_validate(['name' => str_repeat('é', 160)], true)['errors']);
    vision_assert_same(['name' => 'Au plus 160 caractères.'], vision_project_validate(['name' => str_repeat('é', 161)], true)['errors']);
});

vision_test('projets : en modification, un nom fourni ne peut pas être vide (les autres champs le peuvent)', function () {
    vision_assert_same(['name' => 'Ne peut pas être vide.'], vision_project_validate(['name' => '   '], false)['errors']);
    vision_assert_same(['name' => 'Ne peut pas être vide.'], vision_project_validate(['name' => ''], false)['errors']);
    vision_assert_same([], vision_project_validate(['address' => ''], false)['errors'], 'une adresse peut être effacée');
    vision_assert_same([], vision_project_validate(['client_label' => '   '], false)['errors']);
    vision_assert_same(['name' => 'Nouveau'], vision_project_validate(['name' => ' Nouveau '], false)['clean']);
});

vision_test('projets : types stricts (pas de nombre, de tableau, de null)', function () {
    foreach ([12, 1.5, true, null, ['a'], ['x' => 1]] as $value) {
        $r = vision_project_validate(['name' => $value], true);
        vision_assert_same(['name' => 'Texte attendu.'], $r['errors'], var_export($value, true));
    }
});

vision_test('projets : caractères de contrôle et UTF-8 invalide refusés', function () {
    vision_assert_same(['name' => 'Caractères non autorisés.'], vision_project_validate(['name' => "Maison\x00"], true)['errors']);
    vision_assert_same(['name' => 'Caractères non autorisés.'], vision_project_validate(['name' => "a\x07b"], true)['errors']);
    vision_assert_same(['name' => 'Caractères non autorisés.'], vision_project_validate(['name' => "\xC3\x28"], true)['errors']);
    vision_assert_same([], vision_project_validate(['name' => 'A', 'address' => "Rue de l'Église\nBâtiment B"], true)['errors'], 'un retour à la ligne est admis dans une adresse');
});

vision_test('projets : champs inconnus refusés ; « status » interdit à la création', function () {
    vision_assert_same(['owner_id' => 'Champ inconnu ou non modifiable.'], vision_project_validate(['name' => 'A', 'owner_id' => '5'], true)['errors']);
    vision_assert_same(['public_id' => 'Champ inconnu ou non modifiable.'], vision_project_validate(['name' => 'A', 'public_id' => 'x'], true)['errors']);
    // « id » (identifiant choisi par le navigateur) n'est admis qu'à la création, et seulement s'il a la bonne forme.
    vision_assert_same(['id' => '32 caractères hexadécimaux minuscules attendus.'], vision_project_validate(['name' => 'A', 'id' => 'x'], true)['errors']);
    vision_assert_same([], vision_project_validate(['name' => 'A', 'id' => str_repeat('a', 32)], true)['errors']);
    vision_assert_same(['id' => 'Champ inconnu ou non modifiable.'], vision_project_validate(['id' => str_repeat('a', 32)], false)['errors']);
    vision_assert_same(['status' => 'Champ inconnu ou non modifiable.'], vision_project_validate(['name' => 'A', 'status' => 'archived'], true)['errors']);
});

vision_test('projets : modification — au moins un champ, status limité à active ou archived', function () {
    vision_assert_same(['_' => 'Aucun champ à modifier.'], vision_project_validate([], false)['errors']);
    vision_assert_same([], vision_project_validate(['status' => 'archived'], false)['errors']);
    vision_assert_same([], vision_project_validate(['status' => 'active', 'name' => 'Nouveau nom'], false)['errors']);
    $r = vision_project_validate(['status' => 'deleted'], false);
    vision_assert_true(isset($r['errors']['status']));
    vision_assert_true(isset(vision_project_validate(['status' => 1], false)['errors']['status']));
});

vision_test('projets : identifiant public = 32 caractères hexadécimaux minuscules', function () {
    vision_assert_true(vision_project_id_is_valid(str_repeat('a', 32)));
    vision_assert_true(vision_project_id_is_valid('0123456789abcdef0123456789abcdef'));
    foreach ([str_repeat('A', 32), str_repeat('a', 31), str_repeat('a', 33), '1; DROP TABLE x', 12, null, ''] as $bad) {
        vision_assert_false(vision_project_id_is_valid($bad), var_export($bad, true));
    }
});

vision_test('projets : la forme publique n\'expose pas l\'identifiant interne', function () {
    $public = vision_project_public([
        'id' => 7, 'public_id' => str_repeat('a', 32), 'name' => 'N', 'address' => '', 'client_label' => '', 'status' => 'active',
        'owner_provider' => 'local', 'owner_id' => '3', 'owner_email' => 'secret@example.test', 'created_by_id' => '3', 'updated_by_id' => '3',
        'created_at' => '2026-11-24 08:00:00.123', 'updated_at' => '2026-11-24 09:00:00.000', 'archived_at' => null,
    ]);
    vision_assert_same(str_repeat('a', 32), $public['id']);
    vision_assert_same('2026-11-24T08:00:00.123Z', $public['created_at']);
    vision_assert_same(null, $public['archived_at']);
    $json = json_encode($public);
    vision_assert_false(str_contains($json, 'secret@example.test'));
    vision_assert_false(array_key_exists('owner_email', $public));
});

vision_test('http : corps JSON limité, typé et objet', function () {
    vision_assert_same(['a' => 1], vision_read_json_body(1000, '{"a":1}', 'application/json'));
    vision_assert_same(['a' => 1], vision_read_json_body(1000, '{"a":1}', 'application/json; charset=utf-8'));
    foreach ([['{"a":1}', 'text/plain', 415], ['{"a":1}', '', 415], ['{', 'application/json', 400], ['[1,2]', 'application/json', 400], ['"x"', 'application/json', 400]] as [$raw, $type, $status]) {
        try {
            vision_read_json_body(1000, $raw, $type);
            vision_fail("exception attendue pour $raw / $type");
        } catch (VisionHttpException $exception) {
            vision_assert_same($status, $exception->status, "$raw / $type");
        }
    }
    try {
        vision_read_json_body(10, str_repeat('x', 11), 'application/json');
        vision_fail('413 attendu');
    } catch (VisionHttpException $exception) {
        vision_assert_same(413, $exception->status);
    }
});
