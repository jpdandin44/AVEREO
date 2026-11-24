<?php

declare(strict_types=1);

// php tests/api/run.php [filtre]   — exécute les fichiers tests/api/*_test.php dont le nom contient le filtre.
require __DIR__ . '/support.php';

$filter = $argv[1] ?? '';
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
exit(vision_run_all());
