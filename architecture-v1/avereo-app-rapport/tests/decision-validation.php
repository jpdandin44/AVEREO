<?php
declare(strict_types=1);
require __DIR__ . '/../frontend/public/api/decision-validation.php';
$cases = [
    [[], true],
    [['schema_version' => 1, 'projet' => ['budget' => 'Non communiqué']], true],
    [['attentes' => [['id' => 'w1', 'libelle' => 'Confort']]], true],
    [['option_a' => ['action_ids' => ['a1'], 'criteres' => ['energie' => 'À évaluer']]], true],
    ['invalid', false], [null, false], [['schema_version' => 2], false],
    [['projet' => ['budget' => 35000]], false],
    [['option_b' => ['criteres' => ['budget' => ['unexpected']]]], false],
    [['liens' => [['attente_ids' => ['']]]], false],
    [['attentes' => array_fill(0, 101, [])], false],
    [['actions' => [['incontournable' => 'true']]], false],
    [['habitants' => ['sensibilites' => str_repeat('x', 32001)]], false],
    [['projet' => ['not-an-object']], false],
    [['actions' => [['id' => str_repeat('x', 191)]]], false],
];
foreach ($cases as $i => [$value, $valid]) {
    if ((api_decision_payload_error($value) === null) !== $valid) {
        fwrite(STDERR, "Échec cas {$i}\n"); exit(1);
    }
}
echo count($cases) . " contrôles aide à la décision : PASS\n";
