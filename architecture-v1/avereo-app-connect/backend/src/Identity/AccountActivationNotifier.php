<?php

declare(strict_types=1);

namespace Avereo\Connect\Identity;

interface AccountActivationNotifier
{
    /** @return array{status: string, expiresInSeconds: int} */
    public function send(
        int $connectUserId,
        string $drupalSubject,
        string $email,
        string $displayName,
        string $requestId,
    ): array;
}
