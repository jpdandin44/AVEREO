<?php
declare(strict_types=1);

// Drush fixture for the dedicated disposable container, never a hosted site.
if (PHP_SAPI !== 'cli' || getenv('AVEREO_FIRST_LOGIN_LOCAL') !== '1'
    || !defined('DRUPAL_ROOT') || realpath(DRUPAL_ROOT) !== '/opt/drupal/web') {
    throw new RuntimeException('Isolated first-login fixture required.');
}
$options = Drupal::database()->getConnectionOptions();
if (($options['driver'] ?? '') !== 'sqlite' || ($options['database'] ?? '') !== '/tmp/identity-fixture.sqlite') {
    throw new RuntimeException('Disposable SQLite fixture required.');
}
$action = getenv('AVEREO_FIRST_LOGIN_ACTION') ?: 'prepare';
$storage = Drupal::entityTypeManager()->getStorage('user');
if ($action === 'prepare') {
    $secret = str_repeat('first-login-local-fixture-', 2);
    if (!is_dir('/opt/drupal/private')) mkdir('/opt/drupal/private', 0700, true);
    file_put_contents('/opt/drupal/private/avereo-identity-bridge.php', '<?php return ' . var_export([
        'account_activation_secret' => $secret,
        'logout_secret' => $secret,
        'connect_activation_complete_url' => 'https://connect.example.invalid/api/v1/identity/account-activation-complete',
        'allowed_return_urls' => ['https://connect.example.invalid/?logout=1'],
        'support_email' => 'support@example.invalid',
    ], true) . ';');
    chmod('/opt/drupal/private', 0755);
    chmod('/opt/drupal/private/avereo-identity-bridge.php', 0644);
    Drupal::configFactory()->getEditable('system.mail')->set('interface.default', 'test_mail_collector')->save();
    Drupal::configFactory()->getEditable('user.settings')->set('notify.status_activated', true)->save();
    Drupal::configFactory()->getEditable('user.flood')->set('user_limit', 5)->save();
    Drupal::state()->set('system.test_mail_collector', []);
    $accounts = [];
    foreach (['fresh', 'previous-session', 'old-identity'] as $case) {
        $name = 'first-login-' . $case . '-' . bin2hex(random_bytes(5));
        $account = $storage->create(['name' => $name, 'mail' => $name . '@example.invalid',
            'status' => $case === 'old-identity' ? 1 : 0,
            'pass' => $case === 'old-identity' ? 'Fixture-Previous-2026-Only' : '',
            'langcode' => Drupal::languageManager()->getDefaultLanguage()->getId(),
            'preferred_langcode' => Drupal::languageManager()->getDefaultLanguage()->getId()]);
        $account->save();
        Drupal::service('user.data')->set('avereo_identity_bridge', (int) $account->id(), 'created_by_connect', true);
        if ($case === 'old-identity') Drupal::service('user.data')->set('avereo_identity_bridge', (int) $account->id(), 'password_initialized', true);
        $accounts[$case] = ['uid' => (int) $account->id(), 'name' => $name, 'email' => $name . '@example.invalid'];
    }
    echo json_encode(['drupal' => Drupal::VERSION, 'accounts' => $accounts], JSON_THROW_ON_ERROR);
} elseif ($action === 'mail') {
    $mail = Drupal::state()->get('system.test_mail_collector', []);
    echo json_encode(['count' => count($mail), 'lastActivationLink' => end($mail)['params']['activation_link'] ?? null], JSON_THROW_ON_ERROR);
} else {
    throw new RuntimeException('Unknown fixture action.');
}
