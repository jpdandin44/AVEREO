<?php
declare(strict_types=1);
try {
    $directory = $argv[1];
    $path = $directory . '/config.php';
    if (!is_file($path) || (fileperms($path) & 0777) !== 0600 || !is_dir($directory . '/nonces')) throw new RuntimeException();
    ob_start();
    $config = require $path;
    ob_end_clean();
    if (!is_array($config) || ($config['environment'] ?? '') !== $argv[2]) throw new RuntimeException();
} catch (Throwable) {
    while (ob_get_level()) ob_end_clean();
    fwrite(STDERR, "Configuration privée absente ou invalide, voir étape 2 de la procédure.\n");
    exit(1);
}
