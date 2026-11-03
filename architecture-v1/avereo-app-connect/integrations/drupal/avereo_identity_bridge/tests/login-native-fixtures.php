<?php
declare(strict_types=1);

// Disposable Docker recipe only. Never creates fixtures on a hosted database.
$connection = Drupal::database()->getConnectionOptions();
if (PHP_SAPI !== 'cli' || getenv('AVEREO_IDENTITY_LOCAL_FIXTURE') !== '1'
    || $connection['driver'] !== 'sqlite' || $connection['database'] !== '/tmp/identity-fixture.sqlite') {
    throw new RuntimeException('This fixture requires the isolated local SQLite recipe.');
}
$storage = Drupal::entityTypeManager()->getStorage('user');
$accounts = [];
foreach ([['avereo-invite-fixture', 'client@example.invalid', 1], ['blocked-test', 'blocked@example.invalid', 0], ['rate-test', 'rate@example.invalid', 1]] as [$name, $email, $status]) {
    if ($storage->loadByProperties(['mail' => $email]) !== []) {
        throw new RuntimeException('Fixture already exists.');
    }
    $account = $storage->create(['name' => $name, 'mail' => $email, 'status' => $status,
        'langcode' => 'en', 'preferred_langcode' => 'en']);
    $account->setPassword('fixture-client-local-only');
    $account->save();
    $accounts[$email] = $account;
}
$client = $accounts['client@example.invalid'];
$plan = ['drupalRoot' => realpath(DRUPAL_ROOT), 'siteUuid' => Drupal::config('system.site')->get('uuid'),
    'uid' => (int) $client->id(), 'uuid' => $client->uuid(), 'email' => $client->getEmail(),
    'oldName' => $client->getAccountName(), 'newName' => 'client-test', 'backupPath' => '/tmp/identity-login-fixture-backup.json'];
file_put_contents('/tmp/identity-login-fixture-plan.json', json_encode($plan, JSON_THROW_ON_ERROR));
Drupal::configFactory()->getEditable('user.flood')->set('uid_only', true)->set('user_limit', 2)->set('ip_limit', 1000)->save();
echo json_encode(['fixtureAccounts' => count($accounts), 'clientUid' => (int) $client->id(), 'drupalVersion' => Drupal::VERSION, 'database' => 'isolated_sqlite', 'mailSent' => false]), PHP_EOL;
