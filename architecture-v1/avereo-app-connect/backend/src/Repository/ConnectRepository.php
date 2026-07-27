<?php

declare(strict_types=1);

namespace Avereo\Connect\Repository;

interface ConnectRepository
{
    public function databaseStatus(): string;

    /** @return array<string, mixed> */
    public function findUserProfile(int $userId): array;

    /** @return list<array<string, mixed>> */
    public function listOrganizations(int $userId): array;

    /** @return list<array<string, mixed>> */
    public function listApplications(int $userId, int $organizationId): array;

    /** @return list<array<string, mixed>> */
    public function listEntitlements(int $userId, int $organizationId): array;

    /** @return array<string, mixed> */
    public function upsertEntitlement(
        int $actorUserId,
        int $organizationId,
        string $applicationCode,
        string $status,
        ?string $validFrom,
        ?string $validTo,
        string $requestId,
    ): array;
}
