<?php
declare(strict_types=1);
use Avereo\Connect\Config;
use Avereo\Connect\Database;
use Avereo\Connect\Repository\RgaRegistration;
require dirname(__DIR__) . '/src/autoload.php';
$options = getopt('', ['config:', 'actor-id:', 'launch-url:', 'expected-fingerprint:', 'rollback-receipt:', 'confirm']);
try {
    $path = (string) ($options['config'] ?? getenv('AVEREO_PRIVATE_CONFIG') ?: '');
    if ($path === '' || !is_readable($path)) throw new RuntimeException('Configuration privée requise.');
    $values = require $path;
    foreach (['APP_ENV', 'DB_DSN', 'DB_USER', 'DB_PASSWORD'] as $key) {
        if (isset($values[$key]) && is_string($values[$key])) putenv($key . '=' . $values[$key]);
    }
    $pdo = Database::connect(Config::fromEnvironment());
    if (!$pdo) throw new RuntimeException('Base CONNECT non configurée.');
    $registration = new RgaRegistration($pdo);
    if (isset($options['rollback-receipt'])) {
        if (!array_key_exists('confirm', $options)) throw new RuntimeException('Confirmation explicite requise pour restaurer.');
        $receipt = json_decode(file_get_contents((string) $options['rollback-receipt']), true, 512, JSON_THROW_ON_ERROR);
        $registration->rollback((int) ($options['actor-id'] ?? 0), $receipt);
        $result = ['status' => 'rolled_back'];
    } elseif (!array_key_exists('confirm', $options)) $result = $registration->plan();
    else $result = $registration->register((int) ($options['actor-id'] ?? 0), (string) ($options['launch-url'] ?? ''), (string) ($options['expected-fingerprint'] ?? ''));
    // Redirect this receipt into private staging, never into the public document root.
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . PHP_EOL;
} catch (Throwable $exception) {
    fwrite(STDERR, 'Déclaration RGA refusée : ' . $exception->getMessage() . PHP_EOL);
    exit(1);
}
