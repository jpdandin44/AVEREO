<?php

declare(strict_types=1);

namespace Avereo\Connect\Repository;

interface ConnectRepository
{
    public function databaseStatus(): string;

    public function findUserIdByDrupalSubject(string $drupalSubject): ?int;

    public function registerPendingIdentity(
        string $drupalSubject,
        ?string $email,
        ?string $displayName,
    ): void;

    public function canLaunchApplication(int $userId, string $applicationCode): bool;

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
