<?php
declare(strict_types=1);
const AVEREO_GATE_APP = 'rga';
require __DIR__ . '/connect-gate.php';

/** RGA never reads Rapport's private configuration or its cookie. */
function rga_config(): array
{
    $explicit = trim((string) (getenv('AVEREO_RGA_CONFIG_FILE') ?: ''));
    $paths = $explicit === '' ? [] : [$explicit];
    $name = str_contains(strtolower((string) ($_SERVER['DOCUMENT_ROOT'] ?? '')), 'preprod') ? 'rga-preprod' : 'rga';
    if ($explicit === '') {
        foreach ([getenv('HOME') ?: '', $_SERVER['DOCUMENT_ROOT'] ?? '', __DIR__] as $path) {
            $home = avereo_gate_home_from_path((string) $path);
            if ($home !== '') $paths[] = $home . '/.avereo/' . $name . '/config.php';
        }
    }
    $values = [];
    foreach (array_unique($paths) as $path) {
        if (is_file($path)) { $loaded = require $path; if (is_array($loaded)) $values = $loaded; break; }
    }
    return array_replace([
        'environment' => 'production', 'connect_portal_url' => '', 'connect_launch_secret' => '',
        'connect_launch_nonce_directory' => '', 'connect_launch_max_seconds' => 300,
        'connect_gate_session_seconds' => 1800,
    ], $values, ['connect_gate_cookie' => 'AVEREO_RGA_GATE']);
}
