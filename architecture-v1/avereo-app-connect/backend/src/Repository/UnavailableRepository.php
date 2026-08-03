<?php

declare(strict_types=1);

namespace Avereo\Connect\Repository;

use Avereo\Connect\Http\ApiException;

final class UnavailableRepository implements ConnectRepository
{
    public function __construct(private readonly string $status = 'not_configured')
    {
    }

    public function databaseStatus(): string
    {
        return $this->status;
    }

    public function findUserIdByDrupalSubject(string $drupalSubject): ?int
    {
        return null;
    }

    public function findIdentityStatusByDrupalSubject(string $drupalSubject): ?string
    {
        return null;
    }

    public function registerPendingIdentity(
        string $drupalSubject,
        ?string $email,
        ?string $displayName,
    ): void {
    }

    public function canLaunchApplication(int $userId, string $applicationCode): bool
    {
        return false;
    }

    public function listCatalog(int $userId): array
    {
        $this->fail();
    }

    public function findUserProfile(int $userId): array
    {
        $this->fail();
    }

    public function listOrganizations(int $userId): array
    {
        $this->fail();
    }

    public function listApplications(int $userId, int $organizationId): array
    {
        $this->fail();
    }

    public function listEntitlements(int $userId, int $organizationId): array
    {
        $this->fail();
    }

    public function upsertEntitlement(
        int $actorUserId,
        int $organizationId,
        string $applicationCode,
        string $status,
        ?string $validFrom,
        ?string $validTo,
        string $requestId,
    ): array {
        $this->fail();
    }

    public function getAccountAdministration(int $actorUserId, int $organizationId): array
    {
        $this->fail();
    }

    public function approvePendingIdentity(
        int $actorUserId,
        int $organizationId,
        int $pendingIdentityId,
        string $role,
        string $requestId,
    ): array {
        $this->fail();
    }

    public function rejectPendingIdentity(
        int $actorUserId,
        int $organizationId,
        int $pendingIdentityId,
        string $requestId,
    ): array {
        $this->fail();
    }

    public function updateUserStatus(
        int $actorUserId,
        int $organizationId,
        int $targetUserId,
        string $status,
        string $requestId,
    ): array {
        $this->fail();
    }

    public function updateUserApplicationAccess(
        int $actorUserId,
        int $organizationId,
        int $targetUserId,
        string $applicationCode,
        string $status,
        string $requestId,
    ): array {
        $this->fail();
    }

    private function fail(): never
    {
        throw new ApiException(503, 'DATABASE_UNAVAILABLE', 'La base CONNECT n’est pas disponible.');
    }
}
