<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$config = vision_bootstrap();
vision_require_method(['GET']);

$database = 'up';
try {
    vision_pdo($config)->query('SELECT 1')->fetchColumn();
} catch (VisionHttpException) {
    $database = 'down';
}

vision_json_response($database === 'up' ? 200 : 503, [
    'ok' => $database === 'up',
    'app' => 'vision',
    'database' => $database,
]);
