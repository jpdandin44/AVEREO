<?php
declare(strict_types=1);

$options = Drupal::database()->getConnectionOptions();
if (PHP_SAPI !== 'cli' || getenv('AVEREO_IDENTITY_LOCAL_FIXTURE') !== '1'
    || $options['driver'] !== 'sqlite' || $options['database'] !== '/tmp/identity-fixture.sqlite') {
    throw new RuntimeException('Disposable local SQLite recipe required.');
}
$tag = bin2hex(random_bytes(4));
$storage = Drupal::entityTypeManager()->getStorage('user');
$account = $storage->create(['name' => 'rename-old-' . $tag, 'mail' => 'rename-' . $tag . '@example.invalid',
    'status' => 1, 'langcode' => 'en', 'preferred_langcode' => 'en']);
$account->setPassword('fixture-reconcile-initial-only');
$account->save();
$uid = (int) $account->id();
$plan = ['drupalRoot' => realpath(DRUPAL_ROOT), 'siteUuid' => Drupal::config('system.site')->get('uuid'),
    'uid' => $uid, 'uuid' => $account->uuid(), 'email' => $account->getEmail(),
    'oldName' => $account->getAccountName(), 'newName' => 'rename-new-' . $tag,
    'backupPath' => '/tmp/login-reconcile-' . $tag . '-backup.json'];
$planPath = '/tmp/login-reconcile-' . $tag . '-plan.json';
$checks = [];
$run = static function (string $mode, array $plan) use ($planPath): array {
    file_put_contents($planPath, json_encode($plan, JSON_THROW_ON_ERROR));
    putenv('AVEREO_LOGIN_RECONCILE_PLAN=' . $planPath);
    putenv('AVEREO_LOGIN_RECONCILE_MODE=' . $mode);
    ob_start();
    try {
        include '/tmp/reconcile-login.php';
        return json_decode(ob_get_clean(), true, 16, JSON_THROW_ON_ERROR);
    } catch (Throwable $exception) {
        ob_end_clean();
        throw $exception;
    }
};
$rejects = static function (array $badPlan) use ($run): bool {
    try { $run('check', $badPlan); } catch (RuntimeException) { return true; }
    return false;
};
$checks['wrong_uuid_refused'] = $rejects(array_replace($plan, ['uuid' => 'not-the-reviewed-identity']));
$checks['wrong_site_refused'] = $rejects(array_replace($plan, ['siteUuid' => 'another-site']));
$checks['wrong_drupal_root_refused'] = $rejects(array_replace($plan, ['drupalRoot' => '/another/root']));
$checks['wrong_email_refused'] = $rejects(array_replace($plan, ['email' => 'another@example.invalid']));
$checks['unexpected_current_name_refused'] = $rejects(array_replace($plan, ['oldName' => 'unexpected-name']));
$checks['other_account_name_collision_refused'] = $rejects(array_replace($plan, ['newName' => 'client-test']));
$checks['other_account_email_collision_refused'] = $rejects(array_replace($plan, ['newName' => 'client@example.invalid']));
$checks['dry_run_does_not_change_identity'] = ($run('check', $plan)['changed'] ?? true) === false;
$applied = $run('apply', $plan);
$checks['rename_preserves_uid_uuid_password_and_attributes'] = ($applied['passwordAndProtectedAttributesUnchanged'] ?? false) === true;
$storage->resetCache([$uid]);
$current = $storage->load($uid);
$current->setPassword('fixture-reconcile-later-only');
$current->save();
$rolledBack = $run('rollback', $plan);
$storage->resetCache([$uid]);
$restored = $storage->load($uid);
$checks['rollback_preserves_password_changed_since_deployment'] = ($rolledBack['passwordAndProtectedAttributesUnchanged'] ?? false) === true
    && $restored->getAccountName() === $plan['oldName']
    && Drupal::service('user.auth')->authenticateAccount($restored, 'fixture-reconcile-later-only');
$checks['backup_private_and_contains_no_password'] = (fileperms($plan['backupPath']) & 0777) === 0600
    && array_keys(json_decode(file_get_contents($plan['backupPath']), true)) === ['drupalRoot', 'siteUuid', 'uid', 'uuid', 'email', 'oldName', 'newName', 'observedAt'];
if (in_array(false, $checks, true)) {
    throw new RuntimeException(json_encode($checks));
}
echo json_encode(['passed' => count($checks), 'checks' => $checks, 'scope' => 'real local Drupal entities and transactional reconciliation/rollback; no hosted accounts']), PHP_EOL;
