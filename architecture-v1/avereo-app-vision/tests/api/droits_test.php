<?php

declare(strict_types=1);

require_once __DIR__ . '/../../frontend/public/api/lib/droits.php';

vision_test('droits : seuls conseiller et fondateur sont définis par défaut', function () {
    vision_assert_same(['conseiller', 'fondateur'], array_keys(vision_droits()));
    vision_assert_same([
        'project.create',
        'project.read_own',
        'project.update_own',
        'project.archive_own',
    ], vision_droits()['conseiller']);
    vision_assert_same([
        ...vision_droits()['conseiller'],
        'project.read_any',
        'project.update_any',
        'project.archive_any',
    ], vision_droits()['fondateur']);
});

vision_test('droits : le conseiller crée et accède seulement à ses projets', function () {
    vision_assert_true(vision_can('conseiller', 'project.create'));
    foreach (['read', 'update', 'archive'] as $action) {
        vision_assert_true(vision_can('conseiller', 'project.' . $action . '_own'), $action);
        vision_assert_false(vision_can('conseiller', 'project.' . $action . '_any'), $action);
    }
});

vision_test('droits : le fondateur possède les droits own et any', function () {
    vision_assert_true(vision_can('fondateur', 'project.create'));
    foreach (['read', 'update', 'archive'] as $action) {
        vision_assert_true(vision_can('fondateur', 'project.' . $action . '_own'), $action);
        vision_assert_true(vision_can('fondateur', 'project.' . $action . '_any'), $action);
    }
});

vision_test('droits : les rôles et actions inconnus sont refusés', function () {
    foreach (['artisan', ''] as $role) {
        foreach (vision_droits()['fondateur'] as $action) {
            vision_assert_false(vision_can($role, $action), $role . ' / ' . $action);
        }
    }
    foreach (['conseiller', 'fondateur', 'artisan', ''] as $role) {
        vision_assert_false(vision_can($role, 'project.delete'), $role);
        vision_assert_false(vision_can($role, ''), $role);
    }
});

vision_test('droits R02 : un rôle supplémentaire ne modifie que le tableau', function () {
    $tableau = vision_droits();
    $tableau['artisan'] = ['project.read_own'];

    vision_assert_true(vision_can('artisan', 'project.read_own', $tableau));
    vision_assert_false(vision_can('artisan', 'project.create', $tableau));
    vision_assert_false(vision_can('artisan', 'project.read_any', $tableau));
    vision_assert_false(vision_can('artisan', 'project.read_own'));
});

vision_test('droits : un tableau vide ne rétablit pas les droits par défaut', function () {
    vision_assert_false(vision_can('fondateur', 'project.create', []));
});

vision_test('droits : une identité Connect listée est fondateur', function () {
    $config = ['admin_user_ids' => ['12', '40'], 'environment' => 'production'];

    foreach (['12', '40'] as $id) {
        vision_assert_same('fondateur', vision_role_for_identity([
            'provider' => 'avereo_connect', 'id' => $id,
        ], $config));
    }
    vision_assert_same('conseiller', vision_role_for_identity([
        'provider' => 'avereo_connect', 'id' => '41',
    ], $config));
});

vision_test('droits : les identifiants administrateurs sont comparés strictement', function () {
    vision_assert_same('conseiller', vision_role_for_identity([
        'provider' => 'avereo_connect', 'id' => 12,
    ], ['admin_user_ids' => ['12']]));
    vision_assert_same('conseiller', vision_role_for_identity([
        'provider' => 'avereo_connect', 'id' => '12',
    ], ['admin_user_ids' => [12]]));
    vision_assert_same('conseiller', vision_role_for_identity([
        'provider' => 'avereo_connect', 'id' => '012',
    ], ['admin_user_ids' => ['12']]));
});

vision_test('droits : un administrateur local est fondateur uniquement en local', function () {
    $identity = ['provider' => 'local', 'id' => '12'];

    vision_assert_same('fondateur', vision_role_for_identity($identity, [
        'admin_user_ids' => ['12'], 'environment' => 'local',
    ]));
    vision_assert_same('conseiller', vision_role_for_identity($identity, [
        'admin_user_ids' => ['12'], 'environment' => 'production',
    ]));
    vision_assert_same('conseiller', vision_role_for_identity($identity, [
        'admin_user_ids' => ['12'],
    ]));
    vision_assert_same('conseiller', vision_role_for_identity($identity, [
        'admin_user_ids' => ['40'], 'environment' => 'local',
    ]));
});

vision_test('droits : un autre fournisseur ne peut pas devenir fondateur', function () {
    foreach (['autre', 'AVEREO_CONNECT', ''] as $provider) {
        vision_assert_same('conseiller', vision_role_for_identity([
            'provider' => $provider, 'id' => '12',
        ], ['admin_user_ids' => ['12'], 'environment' => 'local']));
    }
});

vision_test('droits : une configuration sans administrateur donne conseiller', function () {
    vision_assert_same('conseiller', vision_role_for_identity([
        'provider' => 'avereo_connect', 'id' => '12',
    ], []));
});

vision_test('droits : une identité sans fournisseur ou identifiant lève une exception', function () {
    foreach ([[], ['id' => '12'], ['provider' => 'avereo_connect'],
        ['provider' => null, 'id' => '12'], ['provider' => 'avereo_connect', 'id' => null]] as $identity) {
        vision_assert_throws(function () use ($identity) {
            vision_role_for_identity($identity, ['admin_user_ids' => ['12']]);
        }, InvalidArgumentException::class);
    }
});

vision_test('droits : le conseiller propriétaire lit, modifie et archive', function () {
    $identity = ['provider' => 'avereo_connect', 'id' => '12'];
    $project = ['owner_provider' => 'avereo_connect', 'owner_id' => '12'];

    foreach (['read', 'update', 'archive'] as $action) {
        vision_assert_true(vision_can_on_project('conseiller', $action, $identity, $project), $action);
    }
});

vision_test('droits : un conseiller ne peut pas accéder au projet d’autrui', function () {
    $identity = ['provider' => 'avereo_connect', 'id' => '12'];
    $project = ['owner_provider' => 'avereo_connect', 'owner_id' => '40'];

    foreach (['read', 'update', 'archive'] as $action) {
        vision_assert_false(vision_can_on_project('conseiller', $action, $identity, $project), $action);
    }
});

vision_test('droits : le fondateur peut accéder au projet d’autrui', function () {
    $identity = ['provider' => 'avereo_connect', 'id' => '12'];
    $project = ['owner_provider' => 'avereo_connect', 'owner_id' => '40'];

    foreach (['read', 'update', 'archive'] as $action) {
        vision_assert_true(vision_can_on_project('fondateur', $action, $identity, $project), $action);
    }
});

vision_test('droits : le même identifiant chez un autre fournisseur n’est pas propriétaire', function () {
    $identity = ['provider' => 'local', 'id' => '12'];
    $project = ['owner_provider' => 'avereo_connect', 'owner_id' => '12'];

    foreach (['read', 'update', 'archive'] as $action) {
        vision_assert_false(vision_can_on_project('conseiller', $action, $identity, $project), $action);
    }
});

vision_test('droits : la propriété compare strictement les identifiants', function () {
    $identity = ['provider' => 'avereo_connect', 'id' => 12];
    $project = ['owner_provider' => 'avereo_connect', 'owner_id' => '12'];

    foreach (['read', 'update', 'archive'] as $action) {
        vision_assert_false(vision_can_on_project('conseiller', $action, $identity, $project), $action);
    }
});

vision_test('droits : des champs de propriété manquants ne donnent aucun accès own', function () {
    $identity = ['provider' => 'avereo_connect', 'id' => '12'];
    $project = ['owner_provider' => 'avereo_connect', 'owner_id' => '12'];

    foreach (['read', 'update', 'archive'] as $action) {
        vision_assert_false(vision_can_on_project('conseiller', $action, [], []), $action);
        vision_assert_false(vision_can_on_project('conseiller', $action, $identity, []), $action);
        vision_assert_false(vision_can_on_project('conseiller', $action, [], $project), $action);
    }
});

vision_test('droits : un rôle ou une action de projet inconnus sont refusés', function () {
    $identity = ['provider' => 'avereo_connect', 'id' => '12'];
    $project = ['owner_provider' => 'avereo_connect', 'owner_id' => '12'];

    foreach (['artisan', ''] as $role) {
        foreach (['read', 'update', 'archive'] as $action) {
            vision_assert_false(vision_can_on_project($role, $action, $identity, $project), $role . ' / ' . $action);
        }
    }
    foreach (['conseiller', 'fondateur'] as $role) {
        foreach (['', 'delete', 'create', 'project.read', 'read_any'] as $action) {
            vision_assert_false(vision_can_on_project($role, $action, $identity, $project), $role . ' / ' . $action);
        }
    }
});

vision_test('droits R02 : les actions sur projet utilisent aussi le tableau injecté', function () {
    $tableau = ['artisan' => ['project.read_own'], 'auditeur' => ['project.read_any']];
    $identity = ['provider' => 'avereo_connect', 'id' => '12'];
    $project = ['owner_provider' => 'avereo_connect', 'owner_id' => '12'];
    $autreProject = ['owner_provider' => 'avereo_connect', 'owner_id' => '40'];

    vision_assert_true(vision_can_on_project('artisan', 'read', $identity, $project, $tableau));
    vision_assert_false(vision_can_on_project('artisan', 'read', $identity, $autreProject, $tableau));
    vision_assert_false(vision_can_on_project('artisan', 'update', $identity, $project, $tableau));
    vision_assert_false(vision_can_on_project('artisan', 'archive', $identity, $project, $tableau));
    vision_assert_true(vision_can_on_project('auditeur', 'read', $identity, $autreProject, $tableau));
    vision_assert_false(vision_can_on_project('auditeur', 'update', $identity, $autreProject, $tableau));
    vision_assert_false(vision_can_on_project('fondateur', 'read', $identity, $autreProject, []));
});
