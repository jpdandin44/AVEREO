<?php

declare(strict_types=1);

namespace Drupal\avereo_identity_bridge\Authentication;

use Drupal\Core\Entity\EntityStorageInterface;

/** Resolves an email to a native username; core still authenticates the password. */
final class LoginIdentifierResolver
{
    public function __construct(private readonly EntityStorageInterface $users)
    {
    }

    /** Null means ambiguous input; unknown input is left for native rejection. */
    public function resolve(string $identifier): ?string
    {
        $identifier = trim($identifier);
        if (strlen($identifier) > 254) {
            return null;
        }
        if ($identifier === '') {
            return '';
        }

        $names = $this->find('name', $identifier);
        $emails = filter_var($identifier, FILTER_VALIDATE_EMAIL) !== false
            ? $this->find('mail', strtolower($identifier))
            : [];
        $ids = array_unique(array_merge(array_values($names), array_values($emails)));
        if (count($names) > 1 || count($emails) > 1 || count($ids) > 1) {
            return null;
        }
        if ($ids === []) {
            return $identifier;
        }
        $account = $this->users->load(reset($ids));
        return $account === null ? null : $account->getAccountName();
    }

    private function find(string $field, string $identifier): array
    {
        // Lookup is internal, just like core's username lookup. Status, flood
        // control, password verification and login remain in UserLoginForm.
        return $this->users->getQuery()
            ->accessCheck(false)
            ->condition($field, $identifier)
            ->range(0, 2)
            ->execute();
    }
}
