<?php
declare(strict_types=1);
require __DIR__ . '/../frontend/public/api/observation-plans-validation.php';
$plan = ['id' => 'p1', 'title' => 'RDC', 'kind' => 'niveau', 'source' => 'Recette', 'width' => 1, 'height' => 1,
    'src' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='];
$valid = ['plans' => [$plan], 'observations' => [['id' => 'o1', 'reperes' => [['planId' => 'p1', 'x' => 0, 'y' => 1]]]]];
$cases = [[[], true], [$valid, true]];
foreach (['url', 'fake', 'dimensions', 'duplicate_plan', 'missing_view', 'outside', 'string', 'duplicate_point', 'duplicate_observation', 'object'] as $case) {
    $value = $valid;
    switch ($case) {
        case 'url': $value['plans'][0]['src'] = 'https://example.com/p.png'; break;
        case 'fake': $value['plans'][0]['src'] = 'data:image/png;base64,AAAA'; break;
        case 'dimensions': $value['plans'][0]['width'] = 100; break;
        case 'duplicate_plan': $value['plans'][] = $plan; break;
        case 'missing_view': $value['observations'][0]['reperes'][0]['planId'] = 'absent'; break;
        case 'outside': $value['observations'][0]['reperes'][0]['y'] = 2; break;
        case 'string': $value['observations'][0]['reperes'][0]['x'] = '0.1'; break;
        case 'duplicate_point': $value['observations'][0]['reperes'][] = $value['observations'][0]['reperes'][0]; break;
        case 'duplicate_observation': $value['observations'][] = $value['observations'][0]; break;
        case 'object': $value['plans'] = ['unexpected' => $plan]; break;
    }
    $cases[] = [$value, false];
}
foreach ($cases as $index => [$value, $expected]) {
    if ((api_observation_plans_error($value) === null) !== $expected) { fwrite(STDERR, "Échec cas {$index}\n"); exit(1); }
}
echo count($cases) . " contrôles plans et repères : PASS\n";
