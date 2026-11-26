<?php

declare(strict_types=1);
require_once __DIR__ . '/../../frontend/public/api/lib/config.php';
require_once __DIR__ . '/../../frontend/public/api/lib/connect_gate.php';

vision_test('R49 : auth public 401, auth 200 et déconnexion GET avec cookie expiré', function (): void {
    $dir = sys_get_temp_dir() . '/vision-compte-' . bin2hex(random_bytes(8));
    mkdir($dir, 0700);
    $socket = stream_socket_server('tcp://127.0.0.1:0');
    $address = stream_socket_get_name($socket, false);
    fclose($socket);
    $base = 'http://' . $address;
    $config = ['environment' => 'local', 'auth_mode' => 'connect', 'connect_portal_url' => $base . '/revue/', 'connect_launch_secret' => str_repeat('f', 40), 'connect_launch_nonce_directory' => $dir . '/nonces'];
    file_put_contents($dir . '/config.php', '<?php return ' . var_export($config, true) . ';');
    $process = null;
    try {
        $process = proc_open([PHP_BINARY, '-S', $address, '-t', __DIR__ . '/../../frontend/public'], [0 => ['pipe', 'r'], 1 => ['file', $dir . '/server.log', 'a'], 2 => ['file', $dir . '/server.log', 'a']], $pipes, null, ['AVEREO_CONFIG_FILE' => $dir . '/config.php', 'PATH' => (string) getenv('PATH'), 'SystemRoot' => (string) getenv('SystemRoot')]);
        fclose($pipes[0]);
        for ($i = 0; $i < 40; $i++) {
            $connection = @fsockopen('127.0.0.1', (int) substr(strrchr($address, ':'), 1));
            if ($connection) { fclose($connection); break; }
            usleep(100000);
        }
        $request = static function (string $path, string $method = 'GET', string $cookie = '') use ($base): array {
            $context = stream_context_create(['http' => ['method' => $method, 'header' => 'Cookie: ' . $cookie, 'ignore_errors' => true, 'follow_location' => 0]]);
            $body = file_get_contents($base . $path, false, $context);
            return [$body, $http_response_header];
        };
        [$body, $headers] = $request('/api/auth.php');
        vision_assert_true(str_contains($headers[0], '401'));
        vision_assert_same(['ok' => false, 'error' => 'unauthenticated', 'message' => 'Authentification requise.', 'connect_portal' => $base . '/revue'], json_decode($body, true));
        $key = vision_gate_cookie_key($config['connect_launch_secret'], 'local');
        $cookie = vision_gate_cookie_name($config) . '=' . vision_gate_build_cookie_value(['provider' => 'avereo_connect', 'id' => '900001'], false, $key, time(), 1800);
        [$body, $headers] = $request('/api/auth.php', 'GET', $cookie);
        vision_assert_true(str_contains($headers[0], '200'));
        vision_assert_same($base . '/revue', json_decode($body, true)['connect_portal']);
        [$body, $headers] = $request('/connect/logout.php', 'GET', $cookie);
        vision_assert_true(str_contains($headers[0], '303'));
        vision_assert_true(in_array('Location: ' . $base . '/revue/?logout=1', $headers, true));
        $cookies = array_values(array_filter($headers, static fn ($h) => str_starts_with($h, 'Set-Cookie:')));
        vision_assert_same(1, count($cookies));
        vision_assert_true(str_contains($cookies[0], 'Max-Age=0'));
        [$body, $headers] = $request('/connect/logout.php', 'POST');
        vision_assert_true(str_contains($headers[0], '405'));
    } finally {
        if (is_resource($process)) { proc_terminate($process); proc_close($process); }
        foreach (glob($dir . '/*') as $file) unlink($file);
        rmdir($dir);
    }
});
