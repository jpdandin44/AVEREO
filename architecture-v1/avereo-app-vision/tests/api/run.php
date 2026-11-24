<?php

declare(strict_types=1);

// php tests/api/run.php [filtre]   — exécute les fichiers tests/api/*_test.php dont le nom contient le filtre.
require __DIR__ . '/support.php';

// --strict : un test ignoré (base ou serveur absents) fait échouer l'exécution (utilisé dans le conteneur et en CI).
$strict = in_array('--strict', $argv, true);
$filter = (string) (array_values(array_filter(array_slice($argv, 1), static fn (string $a): bool => !str_starts_with($a, '--')))[0] ?? '');
$files = glob(__DIR__ . '/*_test.php') ?: [];
sort($files);
foreach ($files as $file) {
    if ($filter !== '' && !str_contains(basename($file), $filter)) {
        continue;
    }
    require $file;
}

if ($GLOBALS['vision_tests'] === []) {
    fwrite(STDERR, "Aucun test trouvé (filtre : « $filter »)." . PHP_EOL);
    exit(2);
}
exit(vision_run_all($strict));
