<?php

declare(strict_types=1);

namespace Drupal\avereo_identity_bridge\Controller;

use Drupal\Core\Site\Settings;
use Drupal\user\UserInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/** Signed private integration; never accepts browser or administrative sessions as authorization. */
final class AccountDeletionController
{
    public function handle(Request $request): JsonResponse
    {
        $raw = $request->getContent();
        $at = $request->headers->get('X-AVEREO-Issued-At', '');
        $signature = $request->headers->get('X-AVEREO-Signature', '');
        $config = Settings::get('avereo_identity_bridge', []);
        $secret = (string) ($config['account_lifecycle_secret'] ?? '');
        if (strlen($secret) < 32 || strlen($raw) > 1024 || preg_match('/^\d{10}$/D', $at) !== 1
            || abs(time() - (int) $at) > 120
            || !hash_equals(hash_hmac('sha256', "account-lifecycle\n" . $at . "\n" . hash('sha256', $raw), $secret), $signature)) {
            return $this->respond('forbidden', 403);
        }

        $input = json_decode($raw, true);
        $action = $input['action'] ?? null;
        $subject = $input['subject'] ?? null;
        $email = $input['email'] ?? null;
        if (!is_array($input) || count($input) !== 3 || !in_array($action, ['check', 'delete'], true)
            || !is_string($subject) || preg_match('/^[1-9][0-9]{0,18}$/D', $subject) !== 1 || $subject === '1'
            || !is_string($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->respond('protected', 409);
        }

        $lock = \Drupal::lock();
        $lockName = 'avereo_identity_bridge:delete:' . $subject;
        if (!$lock->acquire($lockName, 30)) {
            return $this->respond('busy', 503);
        }
        try {
            $manager = \Drupal::entityTypeManager();
            $storage = $manager->getStorage('user');
            $account = $storage->load($subject);
            if ($account === null && $action === 'delete') {
                // Retry the same deletion by immutable UID. Never delete a
                // different identity which may now have this email address.
                return $this->respond('deleted', 200);
            }
            if (!$account instanceof UserInterface
                || !hash_equals($email, strtolower((string) $account->getEmail()))
                || count($storage->loadByProperties(['mail' => $email])) !== 1
                || array_diff($account->getRoles(), ['authenticated']) !== []
                || !in_array(\Drupal::service('user.data')->get('avereo_identity_bridge', $subject, 'created_by_connect'), [true, 1, '1'], true)) {
                return $this->respond('protected', 409);
            }
            if ($action === 'check') {
                return $this->respond('eligible', 200);
            }

            $db = \Drupal::database();
            $transaction = $db->startTransaction();
            try {
                if ($manager->hasDefinition('oauth2_token')) {
                    $tokens = $manager->getStorage('oauth2_token');
                    $ids = $tokens->getQuery()->accessCheck(false)->condition('auth_user_id', $subject)->execute();
                    if ($ids !== []) {
                        $tokens->delete($tokens->loadMultiple($ids));
                    }
                }
                $db->delete('sessions')->condition('uid', $subject)->execute();
                $cache = \Drupal::cache('data');
                $pointer = $cache->get('avereo_identity_bridge:activation_account:' . $subject);
                if ($pointer !== false && is_string($pointer->data)) {
                    $cache->delete('avereo_identity_bridge:activation_token:' . $pointer->data);
                }
                $cache->delete('avereo_identity_bridge:activation_account:' . $subject);
                $cache->delete('avereo_identity_bridge:activation_rate:' . $subject);
                $account->delete();
            } catch (\Throwable $error) {
                $transaction->rollBack();
                throw $error;
            }
            unset($transaction);
            return $this->respond('deleted', 200);
        } finally {
            $lock->release($lockName);
        }
    }

    private function respond(string $status, int $httpStatus): JsonResponse
    {
        return new JsonResponse(['status' => $status], $httpStatus, ['Cache-Control' => 'no-store']);
    }
}
