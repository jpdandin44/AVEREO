<?php
declare(strict_types=1);
require __DIR__ . '/../frontend/public/api/decision-validation.php';
$expectation = static fn ($provenance) => ['attentes' => [['id' => 'w2', 'provenance_ecoute' => $provenance]]];
$estimate = static fn ($value) => ['actions' => [['planning_projet' => $value]]];
$cases = [
    [[], true],
    [['schema_version' => 1, 'projet' => ['budget' => 'Non communiqué']], true],
    [['attentes' => [['id' => 'w1', 'libelle' => 'Confort']]], true],
    [['option_a' => ['action_ids' => ['a1'], 'criteres' => ['energie' => 'À évaluer']]], true],
    [['notes_attentes' => 'Notes dictées'], true],
    [['actions' => [['id' => 'a1', 'realisation' => 'Avec un professionnel', 'inclure_client' => true]]], true],
    [['actions' => [['realisation' => ['bad']]]], false],
    [['actions' => [['realisation' => str_repeat('é', 16001)]]], false],
    [['actions' => [['inclure_client' => 'true']]], false],
    [['actions' => [['inclure_client' => null]]], false],
    [$expectation(['champ' => 'attentes_client', 'texte_original' => 'Du calme']), true],
    [$expectation(['champ' => 'besoin_reformule', 'texte_original' => 'Mieux dormir']), true],
    [['notes_attentes' => ['bad']], false],
    [['notes_attentes' => str_repeat('é', 16001)], false],
    [$expectation(['champ' => 'attentes_client', 'texte_original' => []]), false],
    [$expectation(['champ' => 'attentes_client']), false],
    [$expectation(['champ' => 'inconnu', 'texte_original' => 'Texte']), false],
    [$expectation(null), false],
    ['invalid', false], [null, false], [['schema_version' => 2], false],
    [['projet' => ['budget' => 35000]], false],
    [['option_b' => ['criteres' => ['budget' => ['unexpected']]]], false],
    [['liens' => [['attente_ids' => ['']]]], false],
    [['attentes' => array_fill(0, 101, [])], false],
    [['actions' => [['incontournable' => 'true']]], false],
    [['habitants' => ['sensibilites' => str_repeat('x', 32001)]], false],
    [['projet' => ['not-an-object']], false],
    [['actions' => [['id' => str_repeat('x', 191)]]], false],
    [['planning_projet' => ['titre' => 'Projet fictif', 'date_debut' => '2026-11-16', 'date_cible' => '', 'capacite_semaine' => '2,5']], true],
    [['planning_projet' => ['date_debut' => '', 'capacite_semaine' => '']], true],
    [$estimate(['inclure' => true, 'charge' => '1.5', 'debut_minimal' => '', 'responsable' => 'Professionnel à confirmer']), true],
    [$estimate(['inclure' => false, 'charge' => '']), true],
    [['planning_projet' => null], false],
    [['planning_projet' => []], false],
    [$estimate([]), false],
    [['planning_projet' => ['date_debut' => '2026-02-30']], false],
    [['planning_projet' => ['date_debut' => '0000-01-01']], false],
    [['planning_projet' => ['date_debut' => '2026-11-16', 'date_cible' => '2026-11-15']], false],
    [['planning_projet' => ['capacite_semaine' => '0']], false],
    [['planning_projet' => ['capacite_semaine' => '1e2']], false],
    [$estimate(['inclure' => 'true']), false],
    [$estimate(['charge' => '-1']), false],
    [$estimate(['charge' => '3651']), false],
    [$estimate(['charge' => null]), false],
    [$estimate(['debut_minimal' => '2026-13-01']), false],
    [$estimate(['responsable' => ['bad']]), false],
];
foreach ($cases as $i => [$value, $valid]) {
    if ((api_decision_payload_error($value) === null) !== $valid) {
        fwrite(STDERR, "Échec cas {$i}\n"); exit(1);
    }
}
echo count($cases) . " contrôles aide à la décision : PASS\n";
