<?php

declare(strict_types=1);

use Drupal\avereo_identity_bridge\Controller\AccountDeletionController;
use Drupal\Core\Site\Settings;
use Symfony\Component\HttpFoundation\Request;

// Drush only, with the local Drupal fixture. Never use a hosted identity site.
if (PHP_SAPI !== 'cli' || getenv('AVEREO_LIFECYCLE_NATIVE_TEST') !== '1'
    || !defined('DRUPAL_ROOT') || realpath(DRUPAL_ROOT) !== '/opt/drupal/web') {
    throw new RuntimeException('Isolated Drupal fixture required.');
}

$settings = Settings::getAll();
$secret = str_repeat('native-fixture-only-', 3);
$settings['avereo_identity_bridge']['account_lifecycle_secret'] = $secret;
new Settings($settings);
$db = Drupal::database();
$tx = $db->startTransaction();
$storage = Drupal::entityTypeManager()->getStorage('user');
$cache = Drupal::cache('data');
$checks = 0;
$verify = static function (bool $valid, string $label) use (&$checks): void {
    if (!$valid) {
        throw new RuntimeException($label);
    }
    $checks++;
};
$controller = new AccountDeletionController();
$send = static function (string $action, string $uid, string $email, int $age = 0, bool $signed = true) use ($secret, $controller) {
    $body = json_encode(['action' => $action, 'subject' => $uid, 'email' => $email], JSON_THROW_ON_ERROR);
    $at = (string) (time() - $age);
    $signature = hash_hmac('sha256', "account-lifecycle\n" . $at . "\n" . hash('sha256', $body), $secret);
    return $controller->handle(Request::create('/avereo/account/deletion', 'POST', [], [], [], [
        'HTTP_X_AVEREO_ISSUED_AT' => $at, 'HTTP_X_AVEREO_SIGNATURE' => $signed ? $signature : '',
    ], $body))->getStatusCode();
};
try {
    $email = 'delete-' . bin2hex(random_bytes(6)) . '@example.invalid';
    $account = $storage->create(['name' => $email, 'mail' => $email, 'status' => 0]);
    $account->save();
    $uid = (string) $account->id();
    $verify($send('delete', $uid, $email, signed: false) === 403, 'Unsigned deletion rejected');
    $verify($send('delete', $uid, $email, 121) === 403, 'Expired signature rejected');
    $verify($send('delete', '1', $email) === 409, 'Native administrator protected');
    $verify($send('delete', $uid, $email) === 409, 'Identity not provisioned by CONNECT protected');
    Drupal::service('user.data')->set('avereo_identity_bridge', $uid, 'created_by_connect', true);
    $verify($send('delete', $uid, 'other@example.invalid') === 409, 'Email mismatch rejected');
    $verify($send('check', $uid, $email) === 200 && $storage->load($uid) !== null, 'Eligibility check leaves identity intact');

    $cache->set('avereo_identity_bridge:activation_account:' . $uid, 'fixture-token-' . $uid);
    $cache->set('avereo_identity_bridge:activation_token:fixture-token-' . $uid, ['uid' => $uid]);
    $db->insert('sessions')->fields([
        'uid' => $uid, 'sid' => hash('sha256', $email), 'hostname' => '127.0.0.1', 'timestamp' => time(), 'session' => '',
    ])->execute();
    $verify($send('delete', $uid, $email) === 200, 'Native deletion confirmed');
    $verify($storage->load($uid) === null && $storage->loadByProperties(['mail' => $email]) === [], 'Identity gone and email released');
    $verify($cache->get('avereo_identity_bridge:activation_token:fixture-token-' . $uid) === false, 'Old activation token removed');
    $verify((int) $db->select('sessions', 's')->condition('uid', $uid)->countQuery()->execute()->fetchField() === 0, 'Native sessions removed');
    $replacement = $storage->create(['name' => $email, 'mail' => $email, 'status' => 0]);
    $replacement->save();
    $verify($send('delete', $uid, $email) === 200 && $storage->load($replacement->id()) !== null, 'Retry never removes an identity with a new UID');
    echo json_encode(['passed' => $checks, 'scope' => 'Native Drupal fixture; database transaction rolled back'], JSON_THROW_ON_ERROR) . PHP_EOL;
} finally {
    $tx->rollBack();
}

