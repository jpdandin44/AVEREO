<?php

declare(strict_types=1);

use Avereo\Connect\Administration\AccountAdministration;
use Avereo\Connect\Administration\AccountLifecycle;
use Avereo\Connect\Administration\TrialPolicyStore;
use Avereo\Connect\Application;
use Avereo\Connect\Config;
use Avereo\Connect\Http\Request;
use Avereo\Connect\Identity\AccountIdentityProvisioner;
use Avereo\Connect\Identity\IdentityAccountDeletionClient;
use Avereo\Connect\Repository\PdoConnectRepository;
use Avereo\Connect\Security\AuthContext;

require dirname(__DIR__) . '/src/autoload.php';
require __DIR__ . '/account-administration-fixture.php';

$db = accountTestDatabase();
$reports = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$reports->exec('CREATE TABLE rapport_reports (owner_provider TEXT, owner_id TEXT, title TEXT)');
$file = tempnam(sys_get_temp_dir(), 'connect-lifecycle-');
file_put_contents($file, '{"version":1,"accounts":{}}');

$checks = [];
function expect(bool $condition, string $label): void
{
    global $checks;
    if (!$condition) {
        throw new RuntimeException($label);
    }
    $checks[] = $label;
}

try {
    $policy = new TrialPolicyStore($file);
    $provision = new class implements AccountIdentityProvisioner {
        private int $uid = 40;
        public function provision(string $email, string $displayName, string $requestId): string
        {
            return (string) ++$this->uid;
        }
    };
    $admin = new AccountAdministration($db, $provision, $policy);
    $repo = new PdoConnectRepository($db);
    $deletions = [];
    $fail = false;
    $identity = new IdentityAccountDeletionClient('https://id.example.invalid/avereo/account/deletion', str_repeat('a', 32),
        static function ($body, $headers) use (&$deletions, &$fail): array {
            $input = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
            if ($input['action'] === 'check') {
                return [200, '{"status":"eligible"}'];
            }
            $deletions[] = $input['subject'];
            return $fail ? [503, '{}'] : [200, '{"status":"deleted"}'];
        });
    $service = new AccountLifecycle($db, $admin, $policy, $identity, static fn() => $reports);
    $app = new Application(new Config('test', false, null, '', '', 'TEST', 1800, 43200), $repo,
        accountAdministration: $admin, accountLifecycle: $service);
    $auth = new AuthContext(1, time(), 'owner');
    $call = static function (string $method, string $path, array $body = [], bool $csrf = true, ?AuthContext $who = null) use ($app, $auth) {
        $request = new Request($method, $path, $csrf ? ['x-csrf-token' => 'local'] : [], [], $body, 'test-lifecycle');
        return $app->handle($request, $who ?? $auth, 'local', static fn() => null);
    };
    $prepare = static function (string $name, array $apps = ['rapport','rga']) use ($admin, $repo, $db): array {
        $email = $name . '@example.invalid';
        $record = $admin->create(1, 7, ['email' => $email, 'displayName' => $name, 'applications' => $apps],
            'test-lifecycle-create');
        $id = $record['id'];
        $admin->synchronize($id, fn() => $db->prepare("UPDATE users SET onboarding_status='completed' WHERE id=?")->execute([$id]));
        $q = $db->prepare('SELECT drupal_subject FROM users WHERE id=?');
        $q->execute([$id]);
        return [$id, $email, (string) $q->fetchColumn()];
    };
    $route = static fn(int $id) => '/api/v1/admin/organizations/7/users/' . $id . '/lifecycle';
    [$first, $email, $subject] = $prepare('keep');
    [$second, $otherEmail] = $prepare('purge');
    [$outside] = $prepare('other-app', ['coupe']);
    $row = $reports->prepare('INSERT INTO rapport_reports VALUES (?,?,?)');
    $row->execute(['avereo_connect', (string) $first, 'Preserved']);
    $row->execute(['avereo_connect', (string) $second, 'Removed']);
    $row->execute(['other_provider', (string) $second, 'Unrelated']);

    expect($call('PATCH', $route($first), ['archived' => true], false)->status === 403, 'CSRF required');
    expect($call('PATCH', $route($first), ['archived' => true], who: new AuthContext(2, time(), 'member'))->status === 403, 'Member refused');
    expect($call('PATCH', $route(1), ['archived' => true])->status === 403, 'Owner protected');
    expect($call('PATCH', $route($outside), ['archived' => true])->status === 403, 'Account with another application protected');
    $now = time();
    expect($call('PATCH', $route($first), ['archived' => true])->status === 200, 'Archive succeeds');
    expect(!$repo->canLaunchApplication($first, 'rapport') && $repo->listCatalog($first) === [], 'Archived catalog and launch denied');
    $snapshot = $call('GET','/api/v1/admin/organizations/7/accounts')->payload['data'];
    $archived = array_values(array_filter($snapshot['users'], static fn($u) => (int) $u['id'] === $first))[0];
    expect($archived['canRestore'] && !$archived['canManageApplications'] && !$archived['canSendPasswordResetEmail'], 'Archived actions limited to restore or delete');
    expect($call('PATCH', str_replace('/lifecycle', '/status', $route($first)), ['status' => 'active'])->status === 409, 'Status route cannot bypass archive');
    expect($call('PATCH', $route($first), ['archived' => false])->status === 200 && $repo->canLaunchApplication($first, 'rga'), 'Restoring reinstates previous access');
    expect($repo->isAccountSessionRevoked($first, $now) && !$repo->isAccountSessionRevoked($first, time() + 1), 'Restore does not revive old CONNECT sessions');
    expect($call('GET', '/api/v1/session', who: new AuthContext($first, $now, $subject))->payload['data']['authenticated'] === false, 'Old CONNECT session rejected at API entry');
    $rule = json_decode(file_get_contents($file), true)['accounts'][(string) $first];
    expect($rule['sessions_revoked_at'] >= $now, 'Gateway projection retains revocation time');

    expect($call('DELETE', $route($first), ['confirmationEmail' => 'wrong@example.invalid', 'keepReports' => true])->status === 422 && $deletions === [], 'Incorrect confirmation has no destructive effect');
    expect($call('DELETE', $route($first), ['confirmationEmail' => $email, 'keepReports' => true])->status === 200, 'Confirmed deletion succeeds');
    expect($repo->findUserIdByDrupalSubject($subject) === null && $reports->query("SELECT COUNT(*) FROM rapport_reports WHERE title='Preserved'")->fetchColumn() === 1, 'Identity removed and dossier preserved');
    expect($prepare('keep')[0] !== $first, 'Email can be reused with a new CONNECT ID');

    $fail = true;
    expect($call('DELETE', $route($second), ['confirmationEmail' => $otherEmail, 'keepReports' => false])->status === 503, 'Downstream failure reported as resumable');
    expect(!$repo->canLaunchApplication($second, 'rapport') && $reports->query("SELECT COUNT(*) FROM rapport_reports WHERE title='Removed'")->fetchColumn() === 1, 'Partial failure blocks access without deleting dossiers');
    expect($call('PATCH', $route($second), ['archived' => false])->status === 409, 'Pending deletion cannot be restored');
    expect($call('DELETE', $route($second), ['confirmationEmail' => $otherEmail, 'keepReports' => true])->status === 409, 'Pending deletion cannot change the recorded choice');
    $fail = false;
    expect($call('DELETE', $route($second), ['confirmationEmail' => $otherEmail, 'keepReports' => false])->status === 200, 'Identical deletion request resumes');
    expect($reports->query("SELECT title FROM rapport_reports ORDER BY title")->fetchAll(PDO::FETCH_COLUMN) === ['Preserved','Unrelated'], 'Only the matching CONNECT owner dossiers were purged');
    expect((int) $db->query("SELECT COUNT(*) FROM audit_events WHERE action='user.delete'")->fetchColumn() === 2, 'Both completed deletions are audited');
    echo json_encode(['passed' => count($checks), 'checks' => $checks], JSON_THROW_ON_ERROR), PHP_EOL;
} finally {
    foreach ([$file, $file . '.lock'] as $path) {
        if (is_file($path)) unlink($path);
    }
}
