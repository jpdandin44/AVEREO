<?php
declare(strict_types=1);

// Drush-only fixture: real Drupal entities/form/mail collector, CONNECT temporary MariaDB tables.
// It cannot run on either hosted target. Never use this with a person's identity.
if (PHP_SAPI !== 'cli' || getenv('AVEREO_SUBJECT_NATIVE_TEST') !== '1'
    || getenv('ACCOUNT_ADMIN_MYSQL_TEMPORARY') !== 'true'
    || !defined('DRUPAL_ROOT') || realpath(DRUPAL_ROOT) !== '/opt/drupal/web') {
    throw new RuntimeException('Explicit isolated Drupal fixture required.');
}
$backend = (string) getenv('AVEREO_CONNECT_TEST_ROOT');
if (!is_dir($backend) || !str_starts_with(realpath($backend), '/tmp/')) {
    throw new RuntimeException('Private local CONNECT fixture required.');
}
require $backend . '/src/autoload.php';
require $backend . '/tests/account-administration-fixture.php';

use Avereo\Connect\Administration\AccountAdministration;
use Avereo\Connect\Administration\TrialPolicyStore;
use Avereo\Connect\Identity\IdentityAccountProvisioningClient;
use Avereo\Connect\Identity\IdentityAccountActivationClient;
use Avereo\Connect\Repository\PdoConnectRepository;
use Avereo\Connect\Security\IdentityAccountActivationCompletionVerifier;
use Drupal\avereo_identity_bridge\Controller\AccountProvisioningController;
use Drupal\avereo_identity_bridge\Controller\AccountActivationController;
use Drupal\avereo_identity_bridge\Form\ActivationPasswordForm;
use Drupal\avereo_identity_bridge\Authentication\LoginIdentifierResolver;
use Drupal\Core\Form\FormState;
use Drupal\Core\Site\Settings;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;

$checks = [];
$expect = static function (bool $ok, string $label) use (&$checks): void {
    if (!$ok) throw new RuntimeException($label);
    $checks[] = $label;
};
$secret = str_repeat('local-subject-fixture-', 3);
$configuration = Settings::getAll();
$configuration['avereo_identity_bridge'] = [
    'account_provisioning_secret' => $secret, 'account_activation_secret' => $secret,
    'support_email' => 'support@example.invalid',
    'connect_activation_complete_url' => 'https://connect.example.invalid/complete',
];
new Settings($configuration);
$transaction = Drupal::database()->startTransaction();
$path = '/tmp/connect-subject-policy-' . bin2hex(random_bytes(8)) . '.json';
file_put_contents($path, '{"version":1,"accounts":{}}');
$_SERVER['DOCUMENT_ROOT'] = DRUPAL_ROOT;
$storage = Drupal::entityTypeManager()->getStorage('user');
$email = 'subject-' . bin2hex(random_bytes(8)) . '@example.invalid';
$uid = null;
$request = Request::create('http://127.0.0.1:8093/');
$request->setSession(new Session(new MockArraySessionStorage()));
$stack = Drupal::service('request_stack');
$stack->push($request);
try {
    Drupal::configFactory()->getEditable('system.mail')->set('interface.default', 'test_mail_collector')->save();
    $expect(Drupal::config('system.mail')->get('interface.default') === 'test_mail_collector', 'Native mail backend is collector before any fixture operation');
    Drupal::state()->set('system.test_mail_collector', []);
    $provision = AccountProvisioningController::create(Drupal::getContainer());
    $activate = AccountActivationController::create(Drupal::getContainer());
    $toRequest = static function (array $headers, string $body): Request {
        $r = Request::create('http://127.0.0.1:8093/avereo/account/provision', 'POST', [], [], [], [], $body);
        foreach ($headers as $key => $value) $r->headers->set($key, $value);
        return $r;
    };
    $identity = new IdentityAccountProvisioningClient('https://identity.example.invalid/avereo/account/provision', $secret,
        static function ($url, $headers, $body) use ($provision, $toRequest) {
            $r = $provision->provision($toRequest($headers, $body));
            return ['status' => $r->getStatusCode(), 'body' => $r->getContent()];
        });
    $pdo = accountTestDatabase();
    $repo = new PdoConnectRepository($pdo);
    $policy = new TrialPolicyStore($path);
    $service = new AccountAdministration($pdo, $identity, $policy);
    $created = $service->create(1, 7, ['email' => $email, 'displayName' => 'Subject fixture',
        'applications' => ['rapport', 'rga'], 'startsAt' => gmdate('Y-m-d\TH:i:s\Z', time() - 60),
        'endsAt' => gmdate('Y-m-d\TH:i:s\Z', time() + 3600)], 'native-subject-fixture');
    $id = $created['id'];
    $accounts = $storage->loadByProperties(['mail' => $email]);
    $expect(count($accounts) === 1, 'One native Drupal identity created');
    $account = reset($accounts); $uid = (int) $account->id();
    $expect($account->isBlocked() && trim((string) $account->getPassword()) === '', 'No password or activation on creation');
    $expect($repo->findUserIdByDrupalSubject((string) $uid) === $id, 'Provisioned subject already maps native OIDC UID to same CONNECT account');
    $expect($repo->findUserIdByDrupalSubject($account->uuid()) === null, 'UUID is not silently substituted for OIDC subject');
    $expect(Drupal::state()->get('system.test_mail_collector', []) === [], 'Creation sends no invitation');
    $expect(!$repo->canLaunchApplication($id, 'rapport'), 'Applications remain blocked before activation');
    $before = $pdo->query('SELECT * FROM users WHERE id=' . $id)->fetch(PDO::FETCH_ASSOC);
    $notifier = new IdentityAccountActivationClient('https://identity.example.invalid/avereo/account/activation', $secret, 'support@example.invalid',
        static function ($url, $headers, $body) use ($activate, $toRequest) {
            $r = $activate->issue($toRequest($headers, $body));
            return ['status' => $r->getStatusCode(), 'body' => $r->getContent()];
        });
    $notifier->send($id, (string) $uid, $email, 'Subject fixture', 'native-invite');
    $messages = Drupal::state()->get('system.test_mail_collector', []);
    $expect(count(array_filter($messages, static fn($m) => $m['to'] !== $email)) === 0, 'Every captured message targets only the local fixture');
    $invitations = array_values(array_filter($messages, static fn($m) => $m['id'] === 'avereo_identity_bridge_account_activation'));
    $expect(count($invitations) === 1, 'Exactly one invitation built and captured by native local mail collector');
    $messages = $invitations;
    $expect($messages[0]['params']['requires_password_initialization'] === true, 'Invitation requests first password');
    $token = basename(parse_url($messages[0]['params']['activation_link'], PHP_URL_PATH));
    $response = $activate->activate($request, $token);
    $expect($response->getStatusCode() === 303 && str_contains($response->getTargetUrl(), '/password'), 'Invitation opens password form');
    $expect($activate->activate($request, $token)->getStatusCode() === 410, 'Used invitation cannot be replayed');
    $form = ActivationPasswordForm::create(Drupal::getContainer());
    $password = 'Fixture123-' . bin2hex(random_bytes(12));
    $state = new FormState(); $state->setValues(['password' => ['pass1' => $password, 'pass2' => $password]]);
    $elements = []; $form->validateForm($elements, $state);
    $expect(!$state->hasAnyErrors(), 'Native initialization form accepts valid fixture password');
    $form->submitForm($elements, $state);
    $ready = $activate->ready($request);
    parse_str(parse_url($ready->getTargetUrl(), PHP_URL_QUERY), $completion);
    $verifiedId = (new IdentityAccountActivationCompletionVerifier($secret))->verify($completion);
    $expect($verifiedId === $id, 'Signed completion designates original CONNECT account');
    $service->synchronize($id, fn () => $repo->completeAccountActivation($verifiedId, 'native-complete'));
    $storage->resetCache([$uid]); $account = $storage->load($uid);
    $resolved = (new LoginIdentifierResolver($storage))->resolve($email);
    $authenticated = Drupal::service('user.auth')->authenticate($resolved, $password);
    $expect((int) $authenticated === $uid, 'Native authentication with resolved email returns same UID');
    $expect($repo->findUserIdByDrupalSubject((string) $authenticated) === $id, 'Post-invitation native UID resolves existing CONNECT account, not a new pending identity');
    $expect(array_column($repo->listCatalog($id), 'code') === ['rapport', 'rga'], 'Only Rapport and RGA after activation');
    $expect(!$repo->canLaunchApplication($id, 'coupe') && $repo->canLaunchApplication($id, 'rapport') && $repo->canLaunchApplication($id, 'rga'), 'Application authorization unchanged by linking');
    Drupal::cache('data')->delete('avereo_identity_bridge:activation_rate:' . $uid);
    $passwordHash = $account->getPassword();
    $notifier->send($id, $account->uuid(), $email, 'Subject fixture', 'legacy-uuid-invite');
    $captured = Drupal::state()->get('system.test_mail_collector', []);
    $legacy = array_values(array_filter($captured, static fn($m) => $m['id'] === 'avereo_identity_bridge_account_activation'));
    $expect(count($legacy) === 2 && end($legacy)['params']['requires_password_initialization'] === false, 'Legacy UUID invitation preserves initialized-password confirmation flow');
    Drupal::cache('data')->delete('avereo_identity_bridge:activation_rate:' . $uid);
    $notifier->sendPasswordReset($id, (string) $uid, $email, 'Subject fixture', 'numeric-reset');
    $captured = Drupal::state()->get('system.test_mail_collector', []);
    $expect(count(array_filter($captured, static fn($m) => $m['id'] === 'user_password_reset')) === 1, 'Native numeric subject can build native reset after linking');
    $storage->resetCache([$uid]);
    $expect($storage->load($uid)->getPassword() === $passwordHash, 'Invitation and reset preserve initialized password');
    $after = $pdo->query('SELECT * FROM users WHERE id=' . $id)->fetch(PDO::FETCH_ASSOC);
    foreach (['id','drupal_subject','email_normalized','application_access_mode','access_starts_at','access_ends_at'] as $key) {
        $expect($after[$key] === $before[$key], 'Activation preserves ' . $key);
    }
    $pdo->exec("UPDATE users SET access_starts_at='1999-01-01 00:00:00',access_ends_at='2000-01-01 00:00:00' WHERE id=" . $id);
    $expect(!$repo->canLaunchApplication($id, 'rapport') && !$repo->canLaunchApplication($id, 'rga'), 'Expired trial still refuses both applications');
    echo json_encode(['passed' => count($checks), 'checks' => $checks, 'nativeVersion' => Drupal::VERSION,
        'realMailSent' => false, 'scope' => 'Real Drupal controllers, entity, mail collector, activation form and native authentication; CONNECT temporary MariaDB tables. No browser HTTP or external OIDC provider claim.'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), PHP_EOL;
} finally {
    $stack->pop();
    $transaction->rollBack();
    unset($transaction);
    if ($uid !== null) $storage->resetCache([$uid]);
    foreach ([$path, $path . '.lock'] as $file) if (is_file($file)) unlink($file);
}
