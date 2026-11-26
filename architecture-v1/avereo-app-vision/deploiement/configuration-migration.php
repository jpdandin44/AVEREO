<?php
declare(strict_types=1);

// Entrée standard JSON uniquement ; aucune valeur sensible dans argv ou la sortie.
function vision_write_migration_config(string $source, string $destination, string $input): void
{
    $credentials = json_decode($input, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($credentials) || !is_string($credentials['user'] ?? null) || $credentials['user'] === '' ||
        !is_string($credentials['password'] ?? null) || $credentials['password'] === '') {
        throw new RuntimeException('Secrets de migrations absents.');
    }
    $config = require $source;
    if (!is_array($config) || !is_array($config['db'] ?? null)) throw new RuntimeException('Configuration privée invalide.');
    $config['db']['user'] = $credentials['user'];
    $config['db']['password'] = $credentials['password'];
    $previous = umask(0077);
    try {
        $handle = fopen($destination, 'x');
        if ($handle === false) throw new RuntimeException('Création impossible.');
        try {
            if (!chmod($destination, 0600)) throw new RuntimeException('Permissions impossibles.');
            $content = "<?php\nreturn " . var_export($config, true) . ";\n";
            if (fwrite($handle, $content) !== strlen($content)) throw new RuntimeException('Écriture incomplète.');
        } finally { fclose($handle); }
    } finally { umask($previous); }
}

if (PHP_SAPI === 'cli' && realpath($argv[0]) === __FILE__) {
    try { vision_write_migration_config($argv[1], $argv[2], stream_get_contents(STDIN)); }
    catch (Throwable) { fwrite(STDERR, "Configuration de migration impossible (entrée ou fichier invalide).\n"); exit(1); }
}
