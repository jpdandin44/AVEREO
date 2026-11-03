<?php
declare(strict_types=1);
namespace Avereo\Connect\Identity;

interface AccountIdentityProvisioner
{
    public function provision(string $email, string $displayName, string $requestId): string;
}
