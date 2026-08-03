<?php

declare(strict_types=1);

namespace Avereo\Connect\Repository;

interface ConnectRepository
{
    public function databaseStatus(): string;

    public function findUserIdByDrupalSubject(string $drupalSubject): ?int;

    public function findIdentityStatusByDrupalSubject(string $drupalSubject): ?string;

    public function registerPendingIdentity(
        string $drupalSubject,
        ?string $email,
        ?string $displayName,
    ): void;

    public function canLaunchApplication(int $userId, string $applicationCode): bool;

    /** @return list<array<string, mixed>> */
    public function listCatalog(int $userId): array;

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

    /** @return array<string, mixed> */
    public function getAccountAdministration(int $actorUserId, int $organizationId): array;

    /** @return array<string, mixed> */
    public function approvePendingIdentity(
        int $actorUserId,
        int $organizationId,
        int $pendingIdentityId,
        string $role,
        string $requestId,
    ): array;

    /** @return array<string, mixed> */
    public function rejectPendingIdentity(
        int $actorUserId,
        int $organizationId,
        int $pendingIdentityId,
        string $requestId,
    ): array;

    /** @return array<string, mixed> */
    public function updateUserStatus(
        int $actorUserId,
        int $organizationId,
        int $targetUserId,
        string $status,
        string $requestId,
    ): array;

    /** @return array<string, mixed> */
    public function updateUserApplicationAccess(
        int $actorUserId,
        int $organizationId,
        int $targetUserId,
        string $applicationCode,
        string $status,
        string $requestId,
    ): array;
}
