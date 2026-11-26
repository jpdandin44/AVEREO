<?php
declare(strict_types=1);
require_once __DIR__ . '/../../deploiement/configuration-migration.php';
require_once __DIR__ . '/../../frontend/public/api/lib/portal.php';

vision_test('déploiement : configuration de migration CLI, entrée standard, conservation, silence et permissions', function (): void {
    $dir = sys_get_temp_dir() . '/vision-migration-' . bin2hex(random_bytes(8));
    mkdir($dir, 0700);
    $source = ['environment' => 'preproduction', 'db' => ['host' => 'localhost', 'user' => 'application', 'password' => 'fictif'], 'admin_user_ids' => ['123']];
    file_put_contents($dir . '/source.php', '<?php return ' . var_export($source, true) . ';');
    try {
        $script = __DIR__ . '/../../deploiement/configuration-migration.php';
        $process = proc_open([PHP_BINARY, $script, $dir . '/source.php', $dir . '/migration.php'], [['pipe', 'r'], ['pipe', 'w'], ['pipe', 'w']], $pipes);
        fwrite($pipes[0], json_encode(['user' => 'migration', 'password' => "fictif-'\"\n$\\"]));
        fclose($pipes[0]);
        $stdout = stream_get_contents($pipes[1]); fclose($pipes[1]);
        $stderr = stream_get_contents($pipes[2]); fclose($pipes[2]);
        vision_assert_same(0, proc_close($process));
        vision_assert_same('', $stdout);
        vision_assert_same('', $stderr);
        $expected = $source;
        $expected['db']['user'] = 'migration';
        $expected['db']['password'] = "fictif-'\"\n$\\";
        vision_assert_same($expected, require $dir . '/migration.php');
        // Windows ne représente pas les permissions POSIX ; ce contrôle est obligatoire sur le runner Linux.
        if (PHP_OS_FAMILY !== 'Windows') vision_assert_same(0600, fileperms($dir . '/migration.php') & 0777);
        vision_assert_throws(fn () => vision_write_migration_config($dir . '/source.php', $dir . '/absent.php', '{"user":"","password":""}'));
        vision_assert_false(is_file($dir . '/absent.php'));
    } finally {
        foreach (glob($dir . '/*') as $path) unlink($path);
        rmdir($dir);
    }
});

require_once __DIR__ . '/../../deploiement/verifier-prive.php';
vision_test('déploiement : portail requis dans la configuration privée des deux cibles', function (): void {
    foreach (['preproduction', 'production'] as $env) {
        vision_assert_throws(fn () => vision_verify_private_portal(['environment' => $env]));
        vision_assert_throws(fn () => vision_verify_private_portal(['environment' => $env, 'connect_portal_url' => 'http://evil.test']));
        vision_verify_private_portal(['environment' => $env, 'connect_portal_url' => 'https://connect-preprod.avereo.fr']);
    }
});

vision_test('déploiement : validation autonome identique à celle du portail publié', function (): void {
    foreach (['https://connect-preprod.avereo.fr', 'https://avereo.fr/path/', 'https://user@avereo.fr', 'https://avereo.fr?x', 'https://avereo.fr#', 'http://avereo.fr', 'https://avereo.fr.evil.test', "https://avereo.fr/\r\nX:x", 'https://avereo.fr/\\x', ''] as $url) {
        vision_assert_same(vision_portal_url_is_allowed(['environment' => 'production'], $url), vision_private_portal_is_allowed($url), $url);
    }
});
