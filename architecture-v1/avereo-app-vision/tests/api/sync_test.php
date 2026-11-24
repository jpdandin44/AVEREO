<?php

declare(strict_types=1);

// Synchronisation (Lot 2B) : validation (sans base), puis API par HTTP dans le conteneur (R03, R05, R06, R08).
require_once __DIR__ . '/http_support.php';
require_once __DIR__ . '/../../frontend/public/api/lib/projects.php';
require_once __DIR__ . '/../../frontend/public/api/lib/sync.php';

const VISION_T_SALON = ['nom' => 'Salon', 'hauteurMm' => 2500, 'ordre' => 0, 'sommets' => [['x' => 0, 'y' => 0], ['x' => 4000, 'y' => 0], ['x' => 4000, 'y' => 3000], ['x' => 0, 'y' => 3000]]];
const VISION_T_PORTE = ['type' => 'porte', 'murIndex' => 0, 'positionMm' => 500, 'largeurMm' => 900, 'hauteurMm' => 2040, 'alleMm' => 0];

/** Changement valide de l'envoi (forme du contrat). */
function vision_t_change(string $id, string $kind, ?string $parent, ?array $data, int $baseRev = 0, bool $deleted = false): array
{
    $change = ['object_id' => $id, 'kind' => $kind, 'parent_id' => $parent, 'base_rev' => $baseRev, 'deleted' => $deleted];
    if (!$deleted) {
        $change['data'] = $data;
    }
    return $change;
}

/** Les quatre objets d'un relevé minimal : bâtiment, niveau, pièce, ouverture. */
function vision_t_releve(): array
{
    return [
        vision_t_change('batiment-1', 'batiment', null, ['nom' => 'Logement']),
        vision_t_change('niveau-1', 'niveau', 'batiment-1', ['nom' => 'Rez-de-chaussée', 'ordre' => 0]),
        vision_t_change('piece-1', 'piece', 'niveau-1', VISION_T_SALON),
        vision_t_change('ouv-1', 'ouverture', 'piece-1', VISION_T_PORTE),
    ];
}

function vision_t_validate(array $overrides = []): array
{
    return vision_sync_validate_request($overrides + ['device_id' => 'appareil-test-1', 'since' => 0, 'changes' => vision_t_releve()]);
}

// ---------------------------------------------------------------------------------------------------- validation

vision_test('sync : un envoi conforme au contrat est accepté tel quel', function () {
    $request = vision_t_validate();
    vision_assert_same([], $request['errors']);
    vision_assert_same(4, count($request['changes']));
    vision_assert_same('appareil-test-1', $request['device_id']);
    vision_assert_same(0, $request['since']);
});

vision_test('sync : un envoi vide (réception seule) est accepté', function () {
    vision_assert_same([], vision_t_validate(['changes' => []])['errors']);
});

vision_test('sync : validation de l\'enveloppe (appareil, curseur, liste, champs inconnus)', function () {
    $cases = [
        'device_id absent' => [['device_id' => null], 'device_id'],
        'device_id trop court' => [['device_id' => 'abc'], 'device_id'],
        'device_id avec espace' => [['device_id' => 'appareil test 1'], 'device_id'],
        'since négatif' => [['since' => -1], 'since'],
        'since flottant' => [['since' => 1.5], 'since'],
        'changes non liste' => [['changes' => ['a' => 1]], 'changes'],
        'trop de changements' => [['changes' => array_fill(0, 101, vision_t_change('batiment-1', 'batiment', null, ['nom' => 'L']))], 'changes'],
        'champ inconnu' => [['evil' => 1], 'evil'],
    ];
    foreach ($cases as $label => [$override, $field]) {
        $errors = vision_t_validate($override)['errors'];
        vision_assert_true(isset($errors[$field]), "$label : erreur attendue sur « $field », reçu " . json_encode(array_keys($errors)));
    }
});

vision_test('sync : validation de chaque changement (identifiants, type, parent, base_rev, supprimé)', function () {
    $good = vision_t_change('niveau-1', 'niveau', 'batiment-1', ['nom' => 'RDC', 'ordre' => 0]);
    $cases = [
        'object_id avec guillemet' => [['object_id' => "x'; DROP TABLE a;--"], 'changes.0.object_id'],
        'object_id vide' => [['object_id' => ''], 'changes.0.object_id'],
        'object_id de 65 caractères' => [['object_id' => str_repeat('a', 65)], 'changes.0.object_id'],
        'type inconnu' => [['kind' => 'mur'], 'changes.0.kind'],
        'parent absent' => [['parent_id' => null], 'changes.0.parent_id'],
        'parent invalide' => [['parent_id' => 'a b'], 'changes.0.parent_id'],
        'base_rev flottant' => [['base_rev' => 1.0], 'changes.0.base_rev'],
        'base_rev négatif' => [['base_rev' => -1], 'changes.0.base_rev'],
        'deleted non booléen' => [['deleted' => 'oui'], 'changes.0.deleted'],
        'clé inconnue' => [['seq' => 4], 'changes.0.seq'],
    ];
    foreach ($cases as $label => [$override, $field]) {
        $errors = vision_t_validate(['changes' => [$override + $good]])['errors'];
        vision_assert_true(isset($errors[$field]), "$label : erreur attendue sur « $field », reçu " . json_encode($errors));
    }
    $batimentAvecParent = vision_t_validate(['changes' => [vision_t_change('batiment-1', 'batiment', 'x', ['nom' => 'L'])]])['errors'];
    vision_assert_true(isset($batimentAvecParent['changes.0.parent_id']), 'un bâtiment n\'a pas de parent');
    $suppression = vision_t_validate(['changes' => [vision_t_change('piece-1', 'piece', 'niveau-1', null, 2, true)]]);
    vision_assert_same([], $suppression['errors'], 'une suppression n\'a pas de data');
    vision_assert_same(true, $suppression['changes'][0]['deleted']);
});

vision_test('sync : validation du contenu des objets (types, bornes, entiers stricts, sommets)', function () {
    $salon = VISION_T_SALON;
    $cases = [
        ['piece', ['nom' => ''] + $salon, 'nom'],
        ['piece', ['nom' => "Sal\x00on"] + $salon, 'nom'],
        ['piece', ['nom' => str_repeat('é', 161)] + $salon, 'nom'],
        ['piece', ['nom' => null] + $salon, 'nom'],
        ['piece', ['hauteurMm' => 2500.0] + $salon, 'hauteurMm'],
        ['piece', ['hauteurMm' => 0] + $salon, 'hauteurMm'],
        ['piece', ['ordre' => 10000] + $salon, 'ordre'],
        ['piece', ['sommets' => [['x' => 0, 'y' => 0], ['x' => 1, 'y' => 0]]] + $salon, 'sommets'],
        ['piece', ['sommets' => array_fill(0, 65, ['x' => 0, 'y' => 0])] + $salon, 'sommets'],
        ['piece', ['sommets' => [['x' => 0.5, 'y' => 0], ['x' => 1, 'y' => 0], ['x' => 1, 'y' => 1]]] + $salon, 'sommets'],
        ['piece', ['sommets' => [['x' => 0, 'y' => 0], ['x' => 1, 'y' => 0], ['x' => 1, 'y' => 1, 'z' => 2]]] + $salon, 'sommets'],
        ['piece', ['sommets' => [['x' => 200000000, 'y' => 0], ['x' => 1, 'y' => 0], ['x' => 1, 'y' => 1]]] + $salon, 'sommets'],
        ['piece', $salon + ['couleur' => 'rouge'], 'couleur'],
        ['ouverture', ['type' => 'mur'] + VISION_T_PORTE, 'type'],
        ['ouverture', ['murIndex' => 64] + VISION_T_PORTE, 'murIndex'],
        ['ouverture', ['largeurMm' => 0] + VISION_T_PORTE, 'largeurMm'],
        ['ouverture', ['alleMm' => -1] + VISION_T_PORTE, 'alleMm'],
        ['ouverture', ['positionMm' => '500'] + VISION_T_PORTE, 'positionMm'],
        ['niveau', ['nom' => 'RDC'], 'ordre'],
        ['batiment', ['nom' => 'L', 'ordre' => 0], 'ordre'],
    ];
    foreach ($cases as $index => [$kind, $data, $field]) {
        $parent = $kind === 'batiment' ? null : 'parent-1';
        $errors = vision_t_validate(['changes' => [vision_t_change('objet-1', $kind, $parent, $data)]])['errors'];
        vision_assert_true(isset($errors["changes.0.data.$field"]), "cas $index ($kind/$field) : erreur attendue, reçu " . json_encode($errors));
    }
});

vision_test('sync : comparaison canonique indépendante de l\'ordre des clés', function () {
    vision_assert_same(
        vision_sync_canonical(['b' => 1, 'a' => ['y' => 2, 'x' => 1]]),
        vision_sync_canonical(['a' => ['x' => 1, 'y' => 2], 'b' => 1])
    );
    vision_assert_true(vision_sync_canonical([1, 2]) !== vision_sync_canonical([2, 1]), 'l\'ordre d\'une liste compte');
});

// ------------------------------------------------------------------------------------------------ API par HTTP

/** @return array{id: string, user: string} un projet neuf appartenant à un utilisateur de test neuf */
function vision_t_projet(?string $user = null): array
{
    $user ??= vision_api_user();
    $response = vision_api('POST', '/api/projects.php', $user, ['name' => 'Projet de synchronisation']);
    vision_assert_same(201, $response['status']);
    return ['id' => $response['json']['project']['id'], 'user' => $user];
}

function vision_t_sync(array $projet, string $device, int $since, array $changes, ?string $user = null): array
{
    return vision_api('POST', '/api/sync.php?project=' . $projet['id'], $user ?? $projet['user'], ['device_id' => $device, 'since' => $since, 'changes' => $changes]);
}

vision_test('R03/R05 : un relevé envoyé par un appareil est reçu tel quel par un autre, dans l\'ordre des seq', function () {
    $projet = vision_t_projet();
    $envoi = vision_t_sync($projet, 'telephone-0001', 0, vision_t_releve());
    vision_assert_same(200, $envoi['status']);
    vision_assert_same(['applied', 'applied', 'applied', 'applied'], array_column($envoi['json']['applied'], 'status'));
    vision_assert_same([1, 1, 1, 1], array_column($envoi['json']['applied'], 'rev'));
    vision_assert_same([1, 2, 3, 4], array_column($envoi['json']['applied'], 'seq'));
    vision_assert_same(4, $envoi['json']['seq']);
    vision_assert_false($envoi['json']['has_more']);

    $pc = vision_api('GET', '/api/sync.php?project=' . $projet['id'] . '&since=0', $projet['user']);
    vision_assert_same(200, $pc['status']);
    vision_assert_same(['batiment-1', 'niveau-1', 'piece-1', 'ouv-1'], array_column($pc['json']['changes'], 'object_id'));
    vision_assert_same(vision_sync_canonical(VISION_T_SALON), vision_sync_canonical($pc['json']['changes'][2]['data']));
    vision_assert_same('niveau-1', $pc['json']['changes'][2]['parent_id']);
    vision_assert_same(vision_sync_canonical(VISION_T_PORTE), vision_sync_canonical($pc['json']['changes'][3]['data']));
    vision_assert_false(array_key_exists('applied', $pc['json']), 'la réception seule n\'a pas de « applied »');

    $depuis = vision_api('GET', '/api/sync.php?project=' . $projet['id'] . '&since=3', $projet['user']);
    vision_assert_same(['ouv-1'], array_column($depuis['json']['changes'], 'object_id'), 'seuls les objets plus récents que le curseur');
    $rien = vision_api('GET', '/api/sync.php?project=' . $projet['id'] . '&since=4', $projet['user']);
    vision_assert_same([], $rien['json']['changes']);
    vision_assert_same(4, $rien['json']['seq']);
});

vision_test('sync : une modification incrémente rev et seq ; le rejeu d\'un envoi n\'écrit rien', function () {
    $projet = vision_t_projet();
    vision_t_sync($projet, 'telephone-0001', 0, vision_t_releve());
    $renomme = vision_t_change('piece-1', 'piece', 'niveau-1', ['nom' => 'Séjour'] + VISION_T_SALON, 1);
    $premier = vision_t_sync($projet, 'telephone-0001', 4, [$renomme]);
    vision_assert_same([['object_id' => 'piece-1', 'rev' => 2, 'seq' => 5, 'status' => 'applied']], $premier['json']['applied']);
    vision_assert_same(['piece-1'], array_column($premier['json']['changes'], 'object_id'), 'l\'appareil reçoit aussi son propre changement');

    $rejeu = vision_t_sync($projet, 'telephone-0001', 4, [$renomme]);
    vision_assert_same([['object_id' => 'piece-1', 'rev' => 2, 'seq' => 5, 'status' => 'unchanged']], $rejeu['json']['applied']);
    vision_assert_same(5, $rejeu['json']['seq'], 'aucun seq n\'est consommé par un rejeu');
    // L'ordre des clés du contenu n'a pas d'importance :
    $autreOrdre = vision_t_change('piece-1', 'piece', 'niveau-1', array_reverse(['nom' => 'Séjour'] + VISION_T_SALON, true), 2);
    vision_assert_same('unchanged', vision_t_sync($projet, 'telephone-0001', 5, [$autreOrdre])['json']['applied'][0]['status']);
});

vision_test('R06 : deux appareils modifient le même objet : le plus récent gagne, l\'écrasé est au journal', function () {
    $projet = vision_t_projet();
    vision_t_sync($projet, 'telephone-0001', 0, vision_t_releve());
    // Les deux appareils connaissent la pièce au rev 1 ; A envoie d'abord, B ensuite.
    $parA = vision_t_change('piece-1', 'piece', 'niveau-1', ['nom' => 'Salon (A)'] + VISION_T_SALON, 1);
    $parB = vision_t_change('piece-1', 'piece', 'niveau-1', ['nom' => 'Salon (B)'] + VISION_T_SALON, 1);
    $a = vision_t_sync($projet, 'telephone-0001', 4, [$parA]);
    vision_assert_same('applied', $a['json']['applied'][0]['status']);
    $b = vision_t_sync($projet, 'ordinateur-0002', 4, [$parB]);
    vision_assert_same('conflict', $b['json']['applied'][0]['status']);
    vision_assert_same(3, $b['json']['applied'][0]['rev']);
    $courant = array_values(array_filter($b['json']['changes'], static fn (array $o): bool => $o['object_id'] === 'piece-1'))[0];
    vision_assert_same('Salon (B)', $courant['data']['nom'], 'la plus récente est conservée');

    $journal = vision_api('GET', '/api/sync.php?project=' . $projet['id'] . '&journal=1', $projet['user']);
    vision_assert_same(200, $journal['status']);
    vision_assert_same(1, count($journal['json']['entries']));
    $entree = $journal['json']['entries'][0];
    vision_assert_same('piece-1', $entree['object_id']);
    vision_assert_same('Salon (A)', $entree['lost']['data']['nom'], 'la valeur écrasée n\'est pas perdue');
    vision_assert_same('telephone-0001', $entree['lost']['device_id']);
    vision_assert_same('ordinateur-0002', $entree['won']['device_id']);
    vision_assert_same(2, $entree['lost']['rev']);
    vision_assert_same(3, $entree['won']['rev']);
    vision_assert_false($entree['lost']['deleted']);
    vision_assert_true(preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/', $entree['created_at']) === 1);

    $apres = vision_api('GET', '/api/sync.php?project=' . $projet['id'] . '&journal=1&after=' . $entree['id'], $projet['user']);
    vision_assert_same([], $apres['json']['entries'], 'le curseur « after » saute les entrées déjà lues');
});

vision_test('R06 : une modification écrasée par une suppression, et inversement, est journalisée', function () {
    $projet = vision_t_projet();
    vision_t_sync($projet, 'telephone-0001', 0, vision_t_releve());
    $suppression = vision_t_change('ouv-1', 'ouverture', 'piece-1', null, 1, true);
    $modification = vision_t_change('ouv-1', 'ouverture', 'piece-1', ['largeurMm' => 1000] + VISION_T_PORTE, 1);
    vision_assert_same('applied', vision_t_sync($projet, 'telephone-0001', 4, [$suppression])['json']['applied'][0]['status']);
    $apres = vision_t_sync($projet, 'ordinateur-0002', 5, [$modification]);
    vision_assert_same('conflict', $apres['json']['applied'][0]['status']);
    $objet = $apres['json']['changes'][0];
    vision_assert_false($objet['deleted'], 'la modification la plus récente ressuscite l\'objet');
    vision_assert_same(1000, $objet['data']['largeurMm']);
    $entree = vision_api('GET', '/api/sync.php?project=' . $projet['id'] . '&journal=1', $projet['user'])['json']['entries'][0];
    vision_assert_true($entree['lost']['deleted'], 'l\'état écrasé était une suppression');
    vision_assert_same('telephone-0001', $entree['lost']['device_id']);
});

vision_test('sync : un appareil qui ré-envoie avec un rev périmé n\'écrase pas « un autre » : pas de conflit', function () {
    $projet = vision_t_projet();
    vision_t_sync($projet, 'telephone-0001', 0, vision_t_releve());
    $premier = vision_t_change('piece-1', 'piece', 'niveau-1', ['nom' => 'V2'] + VISION_T_SALON, 1);
    $second = vision_t_change('piece-1', 'piece', 'niveau-1', ['nom' => 'V3'] + VISION_T_SALON, 1); // base périmée : la réponse précédente a été perdue
    vision_t_sync($projet, 'telephone-0001', 4, [$premier]);
    $reponse = vision_t_sync($projet, 'telephone-0001', 5, [$second]);
    vision_assert_same('applied', $reponse['json']['applied'][0]['status']);
    vision_assert_same([], vision_api('GET', '/api/sync.php?project=' . $projet['id'] . '&journal=1', $projet['user'])['json']['entries']);
});

vision_test('sync : suppression logique propagée, suppression d\'un objet inconnu sans effet', function () {
    $projet = vision_t_projet();
    vision_t_sync($projet, 'telephone-0001', 0, vision_t_releve());
    $reponse = vision_t_sync($projet, 'telephone-0001', 4, [
        vision_t_change('piece-1', 'piece', 'niveau-1', null, 1, true),
        vision_t_change('fantome', 'piece', 'niveau-1', null, 0, true),
    ]);
    vision_assert_same(['applied', 'unchanged'], array_column($reponse['json']['applied'], 'status'));
    $piece = $reponse['json']['changes'][0];
    vision_assert_same('piece-1', $piece['object_id']);
    vision_assert_true($piece['deleted']);
    vision_assert_same(null, $piece['data']);
    vision_assert_same(2, $piece['rev']);
    vision_assert_same(5, $reponse['json']['seq'], 'l\'objet inconnu ne consomme aucun seq');
});

vision_test('sync : tout ou rien — un changement invalide annule tout l\'envoi (422) ; changement de type refusé', function () {
    $projet = vision_t_projet();
    $mauvais = vision_t_releve();
    $mauvais[2]['data']['hauteurMm'] = 'haute';
    $reponse = vision_t_sync($projet, 'telephone-0001', 0, $mauvais);
    vision_assert_same(422, $reponse['status']);
    vision_assert_true(isset($reponse['json']['fields']['changes.2.data.hauteurMm']));
    vision_assert_same([], vision_api('GET', '/api/sync.php?project=' . $projet['id'] . '&since=0', $projet['user'])['json']['changes'], 'rien n\'a été écrit');

    vision_t_sync($projet, 'telephone-0001', 0, vision_t_releve());
    $type = vision_t_sync($projet, 'telephone-0001', 4, [vision_t_change('piece-1', 'niveau', 'batiment-1', ['nom' => 'X', 'ordre' => 0], 1)]);
    vision_assert_same(422, $type['status']);
    vision_assert_same('kind_mismatch', $type['json']['error']);
});

vision_test('R08 : un projet d\'autrui est invisible (404) pour l\'envoi, la réception et le journal ; le fondateur y accède', function () {
    $alice = vision_t_projet();
    vision_t_sync($alice, 'telephone-0001', 0, vision_t_releve());
    $bob = vision_api_user();
    vision_assert_same(404, vision_t_sync($alice, 'telephone-0009', 0, vision_t_releve(), $bob)['status']);
    vision_assert_same(404, vision_api('GET', '/api/sync.php?project=' . $alice['id'] . '&since=0', $bob)['status']);
    vision_assert_same(404, vision_api('GET', '/api/sync.php?project=' . $alice['id'] . '&journal=1', $bob)['status']);
    vision_assert_same(404, vision_api('GET', '/api/sync.php?project=' . str_repeat('0', 32) . '&since=0', $bob)['status'], 'projet inexistant : même réponse');
    vision_assert_same(404, vision_api('GET', '/api/sync.php?project=abc&since=0', $bob)['status']);
    vision_assert_same(404, vision_api('GET', '/api/sync.php', $bob)['status']);
    // Rien n'a fuité ni changé :
    vision_assert_same(4, count(vision_api('GET', '/api/sync.php?project=' . $alice['id'] . '&since=0', $alice['user'])['json']['changes']));
    // Le fondateur voit et peut envoyer :
    $admin = vision_api_admin_id();
    vision_assert_same(4, count(vision_api('GET', '/api/sync.php?project=' . $alice['id'] . '&since=0', $admin)['json']['changes']));
    $parAdmin = vision_t_sync($alice, 'ordinateur-0002', 4, [vision_t_change('piece-1', 'piece', 'niveau-1', ['nom' => 'Corrigé'] + VISION_T_SALON, 1)], $admin);
    vision_assert_same(200, $parAdmin['status']);
    vision_assert_same($admin, $parAdmin['json']['changes'][0]['updated_by'], 'l\'auteur du changement est tracé');
});

vision_test('sync : un projet archivé reste lisible mais refuse l\'envoi (409) ; réactivé, il accepte à nouveau', function () {
    $projet = vision_t_projet();
    vision_t_sync($projet, 'telephone-0001', 0, vision_t_releve());
    vision_api('PATCH', '/api/projects.php?id=' . $projet['id'], $projet['user'], ['status' => 'archived']);
    $refus = vision_t_sync($projet, 'telephone-0001', 4, [vision_t_change('piece-1', 'piece', 'niveau-1', ['nom' => 'X'] + VISION_T_SALON, 1)]);
    vision_assert_same(409, $refus['status']);
    vision_assert_same('project_archived', $refus['json']['error']);
    vision_assert_same(4, count(vision_api('GET', '/api/sync.php?project=' . $projet['id'] . '&since=0', $projet['user'])['json']['changes']));
    vision_api('PATCH', '/api/projects.php?id=' . $projet['id'], $projet['user'], ['status' => 'active']);
    vision_assert_same(200, vision_t_sync($projet, 'telephone-0001', 4, [vision_t_change('piece-1', 'piece', 'niveau-1', ['nom' => 'X'] + VISION_T_SALON, 1)])['status']);
});

vision_test('sync : réception paginée (500 par page, has_more) et plafond de 5 000 objets par projet', function () {
    $projet = vision_t_projet();
    $lot = static function (int $debut, int $nombre): array {
        $changes = [];
        for ($i = $debut; $i < $debut + $nombre; $i++) {
            $changes[] = vision_t_change("piece-$i", 'piece', 'niveau-1', ['nom' => "Pièce $i", 'ordre' => $i % 10000] + VISION_T_SALON, 0);
        }
        return $changes;
    };
    for ($debut = 0; $debut < 5000; $debut += 100) {
        $reponse = vision_t_sync($projet, 'telephone-0001', $debut, $lot($debut, 100));
        vision_assert_same(200, $reponse['status'], "lot $debut");
    }
    $page1 = vision_api('GET', '/api/sync.php?project=' . $projet['id'] . '&since=0', $projet['user']);
    vision_assert_same(500, count($page1['json']['changes']));
    vision_assert_true($page1['json']['has_more']);
    vision_assert_same(500, $page1['json']['seq'], 'le curseur est le seq du dernier objet de la page');
    $page2 = vision_api('GET', '/api/sync.php?project=' . $projet['id'] . '&since=' . $page1['json']['seq'], $projet['user']);
    vision_assert_same(501, $page2['json']['changes'][0]['seq']);
    $derniere = vision_api('GET', '/api/sync.php?project=' . $projet['id'] . '&since=4500', $projet['user']);
    vision_assert_same(500, count($derniere['json']['changes']));
    vision_assert_false($derniere['json']['has_more']);
    vision_assert_same(5000, $derniere['json']['seq']);
    $trop = vision_t_sync($projet, 'telephone-0001', 5000, $lot(5000, 1));
    vision_assert_same(413, $trop['status']);
    vision_assert_same('project_too_large', $trop['json']['error']);
    // Modifier un objet existant reste permis au plafond :
    vision_assert_same(200, vision_t_sync($projet, 'telephone-0001', 5000, [vision_t_change('piece-0', 'piece', 'niveau-1', ['nom' => 'Renommée'] + VISION_T_SALON, 1)])['status']);
});

vision_test('sync : requêtes mal formées (401, 415, 413, 400, 405, injection)', function () {
    $projet = vision_t_projet();
    $url = '/api/sync.php?project=' . $projet['id'];
    vision_assert_same(401, vision_http('GET', $url . '&since=0')['status'], 'sans session');
    vision_assert_same(401, vision_http('POST', $url, ['Content-Type' => 'application/json'], '{}')['status']);
    $config = vision_api_test_config();
    $entetes = ['Authorization' => 'Bearer ' . $config['api_token'], 'X-Vision-Local-User' => $projet['user']];
    vision_assert_same(415, vision_http('POST', $url, $entetes + ['Content-Type' => 'text/plain'], '{}')['status']);
    vision_assert_same(400, vision_http('POST', $url, $entetes + ['Content-Type' => 'application/json'], '{pas du json')['status']);
    $gros = json_encode(['device_id' => 'telephone-0001', 'changes' => [], 'pad' => str_repeat('x', VISION_SYNC_MAX_BODY_BYTES)]);
    vision_assert_same(413, vision_http('POST', $url, $entetes + ['Content-Type' => 'application/json'], $gros)['status']);
    vision_assert_same(405, vision_api('DELETE', $url, $projet['user'])['status']);
    vision_assert_same(400, vision_api('GET', $url . '&since=1%20OR%201%3D1', $projet['user'])['status']);
    vision_assert_same(400, vision_api('GET', $url . '&since[]=1', $projet['user'])['status']);
    vision_assert_same(400, vision_api('GET', $url . '&journal=1&after=-1', $projet['user'])['status']);
    vision_assert_same(404, vision_api('GET', '/api/sync.php?project=' . urlencode("x' OR '1'='1"), $projet['user'])['status']);
    $injection = vision_t_sync($projet, 'telephone-0001', 0, [vision_t_change("x'); DROP TABLE vision_objects;--", 'batiment', null, ['nom' => 'L'])]);
    vision_assert_same(422, $injection['status']);
    vision_assert_same(200, vision_api('GET', $url . '&since=0', $projet['user'])['status'], 'la table existe toujours');
});

vision_test('R01 : création de projet avec un identifiant choisi par le navigateur (hors ligne), rejeu sans doublon', function () {
    $user = vision_api_user();
    $id = bin2hex(random_bytes(16));
    $creation = vision_api('POST', '/api/projects.php', $user, ['id' => $id, 'name' => 'Créé hors ligne', 'address' => '12 rue du Test']);
    vision_assert_same(201, $creation['status']);
    vision_assert_same($id, $creation['json']['project']['id']);
    vision_assert_same('Créé hors ligne', $creation['json']['project']['name']);

    $rejeu = vision_api('POST', '/api/projects.php', $user, ['id' => $id, 'name' => 'Créé hors ligne', 'address' => '12 rue du Test']);
    vision_assert_same(200, $rejeu['status'], 'rejeu par le même propriétaire : 200');
    vision_assert_same($id, $rejeu['json']['project']['id']);
    $rejeuModifie = vision_api('POST', '/api/projects.php', $user, ['id' => $id, 'name' => 'Autre nom']);
    vision_assert_same(200, $rejeuModifie['status']);
    vision_assert_same('Créé hors ligne', $rejeuModifie['json']['project']['name'], 'le rejeu ne modifie jamais un projet existant');
    vision_assert_same(1, count(vision_api('GET', '/api/projects.php', $user)['json']['projects']), 'aucun doublon');

    $autre = vision_api('POST', '/api/projects.php', vision_api_user(), ['id' => $id, 'name' => 'Vol d\'identifiant']);
    vision_assert_same(409, $autre['status']);
    vision_assert_same('id_conflict', $autre['json']['error']);
    vision_assert_same('Créé hors ligne', vision_api('GET', '/api/projects.php?id=' . $id, $user)['json']['project']['name']);

    foreach (['', 'ABC', str_repeat('g', 32), str_repeat('a', 31), 12345, null] as $mauvais) {
        $reponse = vision_api('POST', '/api/projects.php', $user, ['id' => $mauvais, 'name' => 'X']);
        vision_assert_same(422, $reponse['status'], 'id ' . json_encode($mauvais));
        vision_assert_true(isset($reponse['json']['fields']['id']));
    }
    $modification = vision_api('PATCH', '/api/projects.php?id=' . $id, $user, ['id' => bin2hex(random_bytes(16))]);
    vision_assert_same(422, $modification['status'], 'l\'identifiant ne se modifie jamais');
    // Un projet créé hors ligne se synchronise comme les autres :
    vision_assert_same(200, vision_api('POST', '/api/sync.php?project=' . $id, $user, ['device_id' => 'telephone-0001', 'since' => 0, 'changes' => vision_t_releve()])['status']);
});
