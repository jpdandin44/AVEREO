<?php
declare(strict_types=1);

// Run through Drush php:script. Plan/backup stay outside the public directory.
if (PHP_SAPI !== 'cli' || !class_exists('Drupal')) {
    http_response_code(403);
    exit(1);
}
$mode = getenv('AVEREO_LOGIN_RECONCILE_MODE') ?: 'check';
$planPath = getenv('AVEREO_LOGIN_RECONCILE_PLAN') ?: '';
if (!in_array($mode, ['check', 'apply', 'rollback'], true) || !is_file($planPath)) {
    throw new RuntimeException('Explicit private plan and check/apply/rollback mode required.');
}
$plan = json_decode(file_get_contents($planPath), true, 16, JSON_THROW_ON_ERROR);
if (($plan['drupalRoot'] ?? null) !== realpath(DRUPAL_ROOT)
    || ($plan['siteUuid'] ?? null) !== Drupal::config('system.site')->get('uuid')) {
    throw new RuntimeException('Wrong Drupal root or site identity.');
}
$uid = (int) ($plan['uid'] ?? 0);
$backupPath = (string) ($plan['backupPath'] ?? '');
$drupalRoot = realpath(DRUPAL_ROOT);
$backupParent = realpath(dirname($backupPath));
if ($uid < 2 || !$backupParent || str_starts_with($backupParent . '/', $drupalRoot . '/') || is_link($backupPath)) {
    throw new RuntimeException('Non-admin identity and private backup destination required.');
}
$storage = Drupal::entityTypeManager()->getStorage('user');
$lock = Drupal::lock();
$lockName = 'avereo_identity_bridge.login_reconcile.' . $uid;
if (!$lock->acquire($lockName, 30)) {
    throw new RuntimeException('Another reconciliation is running.');
}
$transaction = Drupal::database()->startTransaction();
try {
    // Protect against a concurrent profile/password save while changing the name.
    Drupal::database()->select('users_field_data', 'u')->fields('u', ['uid'])
        ->condition('uid', $uid)->forUpdate()->execute()->fetchAll();
    $storage->resetCache([$uid]);
    $account = $storage->load($uid);
    if (!$account || !hash_equals((string) ($plan['uuid'] ?? ''), $account->uuid())
        || strcasecmp((string) ($plan['email'] ?? ''), $account->getEmail()) !== 0) {
        throw new RuntimeException('Identity does not match the exact plan.');
    }
    $oldName = (string) ($plan['oldName'] ?? '');
    $newName = (string) ($plan['newName'] ?? '');
    $expected = $mode === 'rollback' ? $newName : $oldName;
    $wanted = $mode === 'rollback' ? $oldName : $newName;
    if ($expected === '' || $wanted === '' || $account->getAccountName() !== $expected) {
        throw new RuntimeException('Current name differs from the reviewed plan; stop.');
    }
    foreach (['name', 'mail'] as $field) {
        $collisions = $storage->getQuery()->accessCheck(false)->condition($field, $wanted)
            ->condition('uid', $uid, '<>')->range(0, 1)->execute();
        if ($collisions !== []) {
            throw new RuntimeException('Target login collides with another identity.');
        }
    }
    $protected = static fn ($a): string => hash('sha256', serialize([
        $a->id(), $a->uuid(), $a->getEmail(), $a->getPassword(), $a->isActive(),
        $a->getRoles(), $a->getCreatedTime(), $a->getLastLoginTime(), $a->getLastAccessedTime(),
        $a->getTimeZone(), $a->get('langcode')->value, $a->get('preferred_langcode')->value,
    ]));
    $fingerprint = $protected($account);
    $account->setUsername($wanted);
    if (count($account->validate()) !== 0) {
        throw new RuntimeException('Identity validation failed; no save.');
    }
    if ($mode === 'check') {
        $transaction->rollBack();
        unset($transaction);
        echo json_encode(['mode' => 'check', 'identityMatched' => true, 'collision' => false, 'validation' => 'passed', 'changed' => false]), PHP_EOL;
    } else {
        if ($mode === 'apply') {
            if (file_exists($backupPath)) {
                throw new RuntimeException('Backup already exists; inspect before retrying.');
            }
            $backup = ['drupalRoot' => $plan['drupalRoot'], 'siteUuid' => $plan['siteUuid'],
                'uid' => $uid, 'uuid' => $account->uuid(), 'email' => $account->getEmail(),
                'oldName' => $oldName, 'newName' => $newName, 'observedAt' => gmdate('c')];
            if (file_put_contents($backupPath, json_encode($backup, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR), LOCK_EX) === false) {
                throw new RuntimeException('Backup failed.');
            }
            chmod($backupPath, 0600);
        } else {
            $backup = json_decode(file_get_contents($backupPath), true, 16, JSON_THROW_ON_ERROR);
            foreach (['drupalRoot', 'siteUuid', 'uid', 'uuid', 'email', 'oldName', 'newName'] as $key) {
                if (($backup[$key] ?? null) !== $plan[$key]) {
                    throw new RuntimeException('Backup does not match the reviewed plan.');
                }
            }
        }
        $account->save();
        $storage->resetCache([$uid]);
        $after = $storage->load($uid);
        if ($after->getAccountName() !== $wanted || !hash_equals($fingerprint, $protected($after))) {
            throw new RuntimeException('Protected account attributes changed; roll back.');
        }
        unset($transaction);
        echo json_encode(['mode' => $mode, 'changed' => true, 'sameUidAndUuid' => true,
            'passwordAndProtectedAttributesUnchanged' => true, 'noMailSent' => true]), PHP_EOL;
    }
} catch (Throwable $exception) {
    if (isset($transaction)) {
        $transaction->rollBack();
    }
    throw $exception;
} finally {
    $storage->resetCache([$uid]);
    $lock->release($lockName);
}
