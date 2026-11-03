<?php

declare(strict_types=1);

namespace Avereo\Connect\Identity;

interface AccountPasswordResetNotifier
{
    /** @return array{status: string, expiresInSeconds: int} */
    public function sendPasswordReset(int $connectUserId, string $drupalSubject, string $email, string $displayName, string $requestId): array;
}
