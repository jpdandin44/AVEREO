<?php

declare(strict_types=1);

namespace Avereo\Connect\Security;

final class AuthContext
{
    public function __construct(
        public readonly ?int $userId,
        public readonly ?int $authenticatedAt = null,
        public readonly ?string $drupalSubject = null,
        public readonly bool $remembered = false,
    ) {
    }

    public static function anonymous(): self
    {
        return new self(null, null, null);
    }

    public function isAuthenticated(): bool
    {
        return $this->drupalSubject !== null;
    }
}
