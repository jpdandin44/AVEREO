<?php

declare(strict_types=1);

namespace Avereo\Connect\Repository;

use Avereo\Connect\Http\ApiException;

final class PdoConnectRepository implements ConnectRepository
{
    public function __construct(private readonly \PDO $pdo)
    {
    }

    public function databaseStatus(): string
    {
        try {
            $this->pdo->query(
                'SELECT '
                . '(SELECT COUNT(*) FROM users) AS users_count, '
                . '(SELECT COUNT(*) FROM pending_identities) AS pending_count, '
                . '(SELECT COUNT(*) FROM organizations) AS organizations_count, '
                . '(SELECT COUNT(*) FROM applications) AS applications_count',
            );
            return 'ok';
        } catch (\PDOException) {
            return 'unavailable';
        }
    }

    public function findUserIdByDrupalSubject(string $drupalSubject): ?int
    {
        $statement = $this->pdo->prepare(
            'SELECT id FROM users WHERE drupal_subject = :drupal_subject',
        );
        $statement->execute(['drupal_subject' => $drupalSubject]);
        $userId = $statement->fetchColumn();
        return $userId === false ? null : (int) $userId;
    }

    public function findIdentityStatusByDrupalSubject(string $drupalSubject): ?string
    {
        $userStatement = $this->pdo->prepare(
            'SELECT status FROM users WHERE drupal_subject = :drupal_subject',
        );
        $userStatement->execute(['drupal_subject' => $drupalSubject]);
        $userStatus = $userStatement->fetchColumn();
        if (is_string($userStatus)) {
            return $userStatus;
        }

        $pendingStatement = $this->pdo->prepare(
            'SELECT status FROM pending_identities WHERE drupal_subject = :drupal_subject',
        );
        $pendingStatement->execute(['drupal_subject' => $drupalSubject]);
        $pendingStatus = $pendingStatement->fetchColumn();
        return is_string($pendingStatus) ? $pendingStatus : null;
    }

    public function registerPendingIdentity(
        string $drupalSubject,
        ?string $email,
        ?string $displayName,
    ): void {
        $statement = $this->pdo->prepare(
            'INSERT INTO pending_identities '
            . '(drupal_subject, email_normalized, display_name, status) '
            . 'VALUES (:drupal_subject, :email, :display_name, \'pending\') '
            . 'ON DUPLICATE KEY UPDATE '
            . 'email_normalized = VALUES(email_normalized), '
            . 'display_name = VALUES(display_name), '
            . 'last_seen_at = UTC_TIMESTAMP(6)',
        );
        $statement->execute([
            'drupal_subject' => $drupalSubject,
            'email' => $email,
            'display_name' => $displayName,
        ]);
    }

    public function canLaunchApplication(int $userId, string $applicationCode): bool
    {
        $statement = $this->pdo->prepare(
            'SELECT 1 '
            . 'FROM users u '
            . 'INNER JOIN memberships m ON m.user_id = u.id AND m.status = \'active\' '
            . 'INNER JOIN organizations o ON o.id = m.organization_id AND o.status = \'active\' '
            . 'INNER JOIN entitlements e ON e.organization_id = o.id AND e.status = \'active\' '
            . 'INNER JOIN applications a ON a.id = e.application_id AND a.status = \'active\' '
            . 'WHERE u.id = :user_id AND u.status = \'active\' AND a.code = :application_code '
            . 'AND (e.valid_from IS NULL OR e.valid_from <= UTC_TIMESTAMP(6)) '
            . 'AND (e.valid_to IS NULL OR e.valid_to > UTC_TIMESTAMP(6)) '
            . 'LIMIT 1',
        );
        $statement->execute([
            'user_id' => $userId,
            'application_code' => $applicationCode,
        ]);
        return $statement->fetchColumn() !== false;
    }

    public function listCatalog(int $userId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT DISTINCT a.code, a.name, a.description, a.display_order AS displayOrder '
            . 'FROM users u '
            . 'INNER JOIN memberships m ON m.user_id = u.id AND m.status = \'active\' '
            . 'INNER JOIN organizations o ON o.id = m.organization_id AND o.status = \'active\' '
            . 'INNER JOIN entitlements e ON e.organization_id = o.id AND e.status = \'active\' '
            . 'INNER JOIN applications a ON a.id = e.application_id AND a.status = \'active\' '
            . 'WHERE u.id = :user_id AND u.status = \'active\' '
            . 'AND (e.valid_from IS NULL OR e.valid_from <= UTC_TIMESTAMP(6)) '
            . 'AND (e.valid_to IS NULL OR e.valid_to > UTC_TIMESTAMP(6)) '
            . 'ORDER BY a.display_order, a.name, a.code',
        );
        $statement->execute(['user_id' => $userId]);
        return $statement->fetchAll();
    }

    public function findUserProfile(int $userId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, drupal_subject AS drupalSubject, email_normalized AS email, '
            . 'display_name AS displayName, status FROM users WHERE id = :user_id AND status = \'active\'',
        );
        $statement->execute(['user_id' => $userId]);
        $user = $statement->fetch();
        if (!is_array($user)) {
            throw new ApiException(401, 'ACCOUNT_UNAVAILABLE', 'Le compte CONNECT est indisponible.');
        }

        return $user;
    }

    public function listOrganizations(int $userId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT o.id, o.name, o.slug, o.status, m.role '
            . 'FROM organizations o '
            . 'INNER JOIN memberships m ON m.organization_id = o.id '
            . 'WHERE m.user_id = :user_id AND m.status = \'active\' AND o.status = \'active\' '
            . 'ORDER BY o.name, o.id',
        );
        $statement->execute(['user_id' => $userId]);
        return $statement->fetchAll();
    }

    public function listApplications(int $userId, int $organizationId): array
    {
        $this->roleForOrganization($userId, $organizationId);
        $statement = $this->pdo->prepare(
            'SELECT a.code, a.name, a.launch_url AS launchUrl, a.required_scope AS requiredScope, '
            . 'e.status AS entitlementStatus, e.valid_from AS validFrom, e.valid_to AS validTo '
            . 'FROM entitlements e '
            . 'INNER JOIN applications a ON a.id = e.application_id '
            . 'WHERE e.organization_id = :organization_id '
            . 'AND e.status = \'active\' AND a.status = \'active\' '
            . 'AND (e.valid_from IS NULL OR e.valid_from <= UTC_TIMESTAMP(6)) '
            . 'AND (e.valid_to IS NULL OR e.valid_to > UTC_TIMESTAMP(6)) '
            . 'ORDER BY a.name, a.id',
        );
        $statement->execute(['organization_id' => $organizationId]);
        return $statement->fetchAll();
    }

    public function listEntitlements(int $userId, int $organizationId): array
    {
        $this->roleForOrganization($userId, $organizationId);
        $statement = $this->pdo->prepare(
            'SELECT a.code AS applicationCode, a.name AS applicationName, e.status, '
            . 'e.valid_from AS validFrom, e.valid_to AS validTo, e.updated_at AS updatedAt '
            . 'FROM entitlements e INNER JOIN applications a ON a.id = e.application_id '
            . 'WHERE e.organization_id = :organization_id ORDER BY a.name, a.id',
        );
        $statement->execute(['organization_id' => $organizationId]);
        return $statement->fetchAll();
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
        $role = $this->roleForOrganization($actorUserId, $organizationId);
        if (!in_array($role, ['owner', 'admin'], true)) {
            $this->recordAudit(
                $actorUserId,
                $organizationId,
                'entitlement.upsert',
                'application_code',
                $applicationCode,
                'denied',
                $requestId,
                ['reason' => 'role_insufficient', 'role' => $role],
            );
            throw new ApiException(403, 'FORBIDDEN', 'Le rôle ne permet pas de gérer les habilitations.');
        }

        $applicationStatement = $this->pdo->prepare(
            'SELECT id FROM applications WHERE code = :code AND status = \'active\'',
        );
        $applicationStatement->execute(['code' => $applicationCode]);
        $applicationId = $applicationStatement->fetchColumn();
        if ($applicationId === false) {
            throw new ApiException(404, 'APPLICATION_NOT_FOUND', 'L’application demandée est introuvable.');
        }

        try {
            $this->pdo->beginTransaction();
            $statement = $this->pdo->prepare(
                'INSERT INTO entitlements '
                . '(organization_id, application_id, status, valid_from, valid_to, granted_by_user_id) '
                . 'VALUES (:organization_id, :application_id, :status, :valid_from, :valid_to, :actor_id) '
                . 'ON DUPLICATE KEY UPDATE status = VALUES(status), valid_from = VALUES(valid_from), '
                . 'valid_to = VALUES(valid_to), granted_by_user_id = VALUES(granted_by_user_id), '
                . 'updated_at = UTC_TIMESTAMP(6)',
            );
            $statement->execute([
                'organization_id' => $organizationId,
                'application_id' => (int) $applicationId,
                'status' => $status,
                'valid_from' => $validFrom,
                'valid_to' => $validTo,
                'actor_id' => $actorUserId,
            ]);

            $this->recordAudit(
                $actorUserId,
                $organizationId,
                'entitlement.upsert',
                'application',
                (string) $applicationId,
                'success',
                $requestId,
                ['applicationCode' => $applicationCode, 'status' => $status],
            );
            $this->pdo->commit();
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $exception;
        }

        $statement = $this->pdo->prepare(
            'SELECT a.code AS applicationCode, e.status, e.valid_from AS validFrom, '
            . 'e.valid_to AS validTo, e.updated_at AS updatedAt '
            . 'FROM entitlements e INNER JOIN applications a ON a.id = e.application_id '
            . 'WHERE e.organization_id = :organization_id AND e.application_id = :application_id',
        );
        $statement->execute(['organization_id' => $organizationId, 'application_id' => (int) $applicationId]);
        $entitlement = $statement->fetch();
        if (!is_array($entitlement)) {
            throw new \RuntimeException('Habilitation introuvable après écriture.');
        }

        return $entitlement;
    }

    public function getAccountAdministration(int $actorUserId, int $organizationId): array
    {
        $actorRole = $this->administrationRole($actorUserId, $organizationId);
        $organizationStatement = $this->pdo->prepare(
            'SELECT id, name, slug, status FROM organizations '
            . 'WHERE id = :organization_id AND status = \'active\'',
        );
        $organizationStatement->execute(['organization_id' => $organizationId]);
        $organization = $organizationStatement->fetch();
        if (!is_array($organization)) {
            throw new ApiException(404, 'ORGANIZATION_NOT_FOUND', 'L organisation est introuvable.');
        }
        $organization['role'] = $actorRole;

        $pending = $this->pdo->query(
            'SELECT id, email_normalized AS email, display_name AS displayName, '
            . 'first_seen_at AS firstSeenAt, last_seen_at AS lastSeenAt '
            . 'FROM pending_identities WHERE status = \'pending\' '
            . 'ORDER BY first_seen_at, id LIMIT 200',
        )->fetchAll();

        $usersStatement = $this->pdo->prepare(
            'SELECT u.id, u.email_normalized AS email, u.display_name AS displayName, '
            . 'u.status, m.role, m.status AS membershipStatus, u.created_at AS createdAt '
            . 'FROM memberships m INNER JOIN users u ON u.id = m.user_id '
            . 'WHERE m.organization_id = :organization_id '
            . 'ORDER BY u.display_name, u.email_normalized, u.id',
        );
        $usersStatement->execute(['organization_id' => $organizationId]);
        $users = $usersStatement->fetchAll();

        $activeOwnerStatement = $this->pdo->prepare(
            'SELECT COUNT(*) FROM memberships m INNER JOIN users u ON u.id = m.user_id '
            . 'WHERE m.organization_id = :organization_id AND m.role = \'owner\' '
            . 'AND m.status = \'active\' AND u.status = \'active\'',
        );
        $activeOwnerStatement->execute(['organization_id' => $organizationId]);
        $activeOwnerCount = (int) $activeOwnerStatement->fetchColumn();
        foreach ($users as &$user) {
            $targetRole = (string) ($user['role'] ?? '');
            $targetUserId = (int) ($user['id'] ?? 0);
            $user['canChangeStatus'] = $actorRole === 'owner'
                && $targetUserId !== $actorUserId
                && ($targetRole !== 'owner' || $activeOwnerCount > 1);
        }
        unset($user);

        $applicationsStatement = $this->pdo->prepare(
            'SELECT a.code, a.name FROM entitlements e '
            . 'INNER JOIN applications a ON a.id = e.application_id '
            . 'WHERE e.organization_id = :organization_id '
            . 'AND e.status = \'active\' AND a.status = \'active\' '
            . 'AND (e.valid_from IS NULL OR e.valid_from <= UTC_TIMESTAMP(6)) '
            . 'AND (e.valid_to IS NULL OR e.valid_to > UTC_TIMESTAMP(6)) '
            . 'ORDER BY a.display_order, a.name, a.code',
        );
        $applicationsStatement->execute(['organization_id' => $organizationId]);

        return [
            'organization' => $organization,
            'actorRole' => $actorRole,
            'assignableRoles' => $actorRole === 'owner'
                ? ['owner', 'admin', 'member', 'viewer']
                : ['member', 'viewer'],
            'applications' => $applicationsStatement->fetchAll(),
            'pendingIdentities' => $pending,
            'users' => $users,
        ];
    }

    public function approvePendingIdentity(
        int $actorUserId,
        int $organizationId,
        int $pendingIdentityId,
        string $role,
        string $requestId,
    ): array {
        $actorRole = $this->administrationRole($actorUserId, $organizationId);
        if ($actorRole !== 'owner' && in_array($role, ['owner', 'admin'], true)) {
            $this->recordAudit(
                $actorUserId,
                $organizationId,
                'identity.approve',
                'pending_identity',
                (string) $pendingIdentityId,
                'denied',
                $requestId,
                ['reason' => 'role_insufficient', 'requestedRole' => $role],
            );
            throw new ApiException(403, 'FORBIDDEN', 'Seul un owner peut attribuer un role d administration.');
        }

        try {
            $this->pdo->beginTransaction();
            $pendingStatement = $this->pdo->prepare(
                'SELECT id, drupal_subject, email_normalized, display_name, status '
                . 'FROM pending_identities WHERE id = :pending_id FOR UPDATE',
            );
            $pendingStatement->execute(['pending_id' => $pendingIdentityId]);
            $pending = $pendingStatement->fetch();
            if (!is_array($pending)) {
                throw new ApiException(404, 'PENDING_IDENTITY_NOT_FOUND', 'La demande est introuvable.');
            }
            if (($pending['status'] ?? null) !== 'pending') {
                throw new ApiException(409, 'PENDING_IDENTITY_ALREADY_DECIDED', 'La demande a deja ete traitee.');
            }

            $email = strtolower(trim((string) ($pending['email_normalized'] ?? '')));
            if (filter_var($email, FILTER_VALIDATE_EMAIL) === false || strlen($email) > 254) {
                throw new ApiException(
                    409,
                    'PENDING_IDENTITY_EMAIL_INVALID',
                    'La demande ne contient pas une adresse e-mail exploitable.',
                );
            }
            $subject = trim((string) ($pending['drupal_subject'] ?? ''));
            $displayName = trim((string) ($pending['display_name'] ?? ''));
            if ($displayName === '') {
                $displayName = $email;
            }

            $conflictStatement = $this->pdo->prepare(
                'SELECT id, drupal_subject FROM users '
                . 'WHERE drupal_subject = :subject OR email_normalized = :email FOR UPDATE',
            );
            $conflictStatement->execute(['subject' => $subject, 'email' => $email]);
            foreach ($conflictStatement->fetchAll() as $existingUser) {
                if (($existingUser['drupal_subject'] ?? null) !== $subject) {
                    throw new ApiException(
                        409,
                        'IDENTITY_CONFLICT',
                        'Cette adresse e-mail est deja rattachee a une autre identite Drupal.',
                    );
                }
            }

            $userStatement = $this->pdo->prepare(
                'INSERT INTO users (drupal_subject, email_normalized, display_name, status) '
                . 'VALUES (:subject, :email, :display_name, \'active\') '
                . 'ON DUPLICATE KEY UPDATE email_normalized = VALUES(email_normalized), '
                . 'display_name = VALUES(display_name), status = \'active\', '
                . 'updated_at = UTC_TIMESTAMP(6)',
            );
            $userStatement->execute([
                'subject' => $subject,
                'email' => $email,
                'display_name' => substr($displayName, 0, 191),
            ]);
            $userLookup = $this->pdo->prepare(
                'SELECT id FROM users WHERE drupal_subject = :subject FOR UPDATE',
            );
            $userLookup->execute(['subject' => $subject]);
            $userId = $userLookup->fetchColumn();
            if ($userId === false) {
                throw new \RuntimeException('Le compte approuve est introuvable.');
            }

            $membership = $this->pdo->prepare(
                'INSERT INTO memberships (organization_id, user_id, role, status) '
                . 'VALUES (:organization_id, :user_id, :role, \'active\') '
                . 'ON DUPLICATE KEY UPDATE role = VALUES(role), status = \'active\', '
                . 'updated_at = UTC_TIMESTAMP(6)',
            );
            $membership->execute([
                'organization_id' => $organizationId,
                'user_id' => (int) $userId,
                'role' => $role,
            ]);
            if ($role === 'owner') {
                $ownerMembership = $this->pdo->prepare(
                    'SELECT id FROM memberships '
                    . 'WHERE organization_id = :organization_id AND user_id = :user_id',
                );
                $ownerMembership->execute([
                    'organization_id' => $organizationId,
                    'user_id' => (int) $userId,
                ]);
                $ownerMembershipId = $ownerMembership->fetchColumn();
                $assignOwner = $this->pdo->prepare(
                    'UPDATE organizations SET owner_membership_id = :membership_id '
                    . 'WHERE id = :organization_id AND owner_membership_id IS NULL',
                );
                $assignOwner->execute([
                    'membership_id' => (int) $ownerMembershipId,
                    'organization_id' => $organizationId,
                ]);
            }

            $approval = $this->pdo->prepare(
                'UPDATE pending_identities SET status = \'approved\', approved_user_id = :user_id, '
                . 'approved_by_user_id = :actor_id, approved_at = UTC_TIMESTAMP(6), '
                . 'last_seen_at = UTC_TIMESTAMP(6) '
                . 'WHERE id = :pending_id AND status = \'pending\'',
            );
            $approval->execute([
                'user_id' => (int) $userId,
                'actor_id' => $actorUserId,
                'pending_id' => $pendingIdentityId,
            ]);
            if ($approval->rowCount() !== 1) {
                throw new ApiException(409, 'PENDING_IDENTITY_ALREADY_DECIDED', 'La demande a deja ete traitee.');
            }

            $this->recordAudit(
                $actorUserId,
                $organizationId,
                'identity.approve',
                'user',
                (string) $userId,
                'success',
                $requestId,
                ['pendingIdentityId' => $pendingIdentityId, 'role' => $role],
            );
            $this->pdo->commit();
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $exception;
        }

        return [
            'id' => (int) $userId,
            'email' => $email,
            'displayName' => substr($displayName, 0, 191),
            'status' => 'active',
            'role' => $role,
        ];
    }

    public function rejectPendingIdentity(
        int $actorUserId,
        int $organizationId,
        int $pendingIdentityId,
        string $requestId,
    ): array {
        $this->administrationRole($actorUserId, $organizationId);
        try {
            $this->pdo->beginTransaction();
            $pendingStatement = $this->pdo->prepare(
                'SELECT id, email_normalized, display_name, status '
                . 'FROM pending_identities WHERE id = :pending_id FOR UPDATE',
            );
            $pendingStatement->execute(['pending_id' => $pendingIdentityId]);
            $pending = $pendingStatement->fetch();
            if (!is_array($pending)) {
                throw new ApiException(404, 'PENDING_IDENTITY_NOT_FOUND', 'La demande est introuvable.');
            }
            if (($pending['status'] ?? null) !== 'pending') {
                throw new ApiException(409, 'PENDING_IDENTITY_ALREADY_DECIDED', 'La demande a deja ete traitee.');
            }

            $rejection = $this->pdo->prepare(
                'UPDATE pending_identities SET status = \'rejected\', approved_by_user_id = :actor_id, '
                . 'approved_at = UTC_TIMESTAMP(6), last_seen_at = UTC_TIMESTAMP(6) '
                . 'WHERE id = :pending_id AND status = \'pending\'',
            );
            $rejection->execute(['actor_id' => $actorUserId, 'pending_id' => $pendingIdentityId]);
            if ($rejection->rowCount() !== 1) {
                throw new ApiException(409, 'PENDING_IDENTITY_ALREADY_DECIDED', 'La demande a deja ete traitee.');
            }
            $this->recordAudit(
                $actorUserId,
                $organizationId,
                'identity.reject',
                'pending_identity',
                (string) $pendingIdentityId,
                'success',
                $requestId,
                ['email' => $pending['email_normalized'] ?? null],
            );
            $this->pdo->commit();
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $exception;
        }

        return [
            'id' => $pendingIdentityId,
            'status' => 'rejected',
            'displayName' => (string) ($pending['display_name'] ?? ''),
        ];
    }

    public function updateUserStatus(
        int $actorUserId,
        int $organizationId,
        int $targetUserId,
        string $status,
        string $requestId,
    ): array {
        $actorRole = $this->administrationRole($actorUserId, $organizationId);
        if ($actorRole !== 'owner') {
            $this->recordAudit(
                $actorUserId,
                $organizationId,
                'user.status.update',
                'user',
                (string) $targetUserId,
                'denied',
                $requestId,
                ['reason' => 'role_insufficient', 'requestedStatus' => $status],
            );
            throw new ApiException(403, 'FORBIDDEN', 'Seul un owner peut modifier le statut d un compte.');
        }
        if ($actorUserId === $targetUserId) {
            throw new ApiException(409, 'SELF_STATUS_CHANGE_DENIED', 'Vous ne pouvez pas modifier votre propre statut.');
        }

        try {
            $this->pdo->beginTransaction();
            $targetStatement = $this->pdo->prepare(
                'SELECT u.id, u.email_normalized AS email, u.display_name AS displayName, '
                . 'u.status, m.role FROM memberships m INNER JOIN users u ON u.id = m.user_id '
                . 'WHERE m.organization_id = :organization_id AND u.id = :user_id FOR UPDATE',
            );
            $targetStatement->execute([
                'organization_id' => $organizationId,
                'user_id' => $targetUserId,
            ]);
            $target = $targetStatement->fetch();
            if (!is_array($target)) {
                throw new ApiException(404, 'USER_NOT_FOUND', 'Le compte est introuvable dans cette organisation.');
            }

            if (($target['role'] ?? null) === 'owner' && $status !== 'active') {
                $ownerCountStatement = $this->pdo->prepare(
                    'SELECT COUNT(*) FROM memberships m INNER JOIN users u ON u.id = m.user_id '
                    . 'WHERE m.organization_id = :organization_id AND m.role = \'owner\' '
                    . 'AND m.status = \'active\' AND u.status = \'active\'',
                );
                $ownerCountStatement->execute(['organization_id' => $organizationId]);
                if ((int) $ownerCountStatement->fetchColumn() <= 1) {
                    throw new ApiException(
                        409,
                        'LAST_OWNER_STATUS_CHANGE_DENIED',
                        'Le dernier owner actif ne peut pas etre suspendu ou desactive.',
                    );
                }
            }

            $update = $this->pdo->prepare(
                'UPDATE users SET status = :status, updated_at = UTC_TIMESTAMP(6) WHERE id = :user_id',
            );
            $update->execute(['status' => $status, 'user_id' => $targetUserId]);
            $this->recordAudit(
                $actorUserId,
                $organizationId,
                'user.status.update',
                'user',
                (string) $targetUserId,
                'success',
                $requestId,
                ['previousStatus' => $target['status'] ?? null, 'status' => $status],
            );
            $this->pdo->commit();
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $exception;
        }

        return [
            'id' => $targetUserId,
            'email' => (string) ($target['email'] ?? ''),
            'displayName' => (string) ($target['displayName'] ?? ''),
            'role' => (string) ($target['role'] ?? ''),
            'status' => $status,
        ];
    }

    private function administrationRole(int $userId, int $organizationId): string
    {
        $role = $this->roleForOrganization($userId, $organizationId);
        if (!in_array($role, ['owner', 'admin'], true)) {
            throw new ApiException(403, 'ACCOUNT_ADMINISTRATION_DENIED', 'La gestion des comptes est reservee aux administrateurs.');
        }
        return $role;
    }

    private function roleForOrganization(int $userId, int $organizationId): string
    {
        $statement = $this->pdo->prepare(
            'SELECT m.role FROM memberships m INNER JOIN organizations o ON o.id = m.organization_id '
            . 'INNER JOIN users u ON u.id = m.user_id '
            . 'WHERE m.user_id = :user_id AND m.organization_id = :organization_id '
            . 'AND m.status = \'active\' AND o.status = \'active\' AND u.status = \'active\'',
        );
        $statement->execute(['user_id' => $userId, 'organization_id' => $organizationId]);
        $role = $statement->fetchColumn();
        if (!is_string($role)) {
            throw new ApiException(403, 'ORGANIZATION_ACCESS_DENIED', 'Accès à l’Espace Pro refusé.');
        }

        return $role;
    }

    /** @param array<string, mixed> $metadata */
    private function recordAudit(
        int $actorUserId,
        int $organizationId,
        string $action,
        string $targetType,
        string $targetId,
        string $outcome,
        string $requestId,
        array $metadata,
    ): void {
        $audit = $this->pdo->prepare(
            'INSERT INTO audit_events '
            . '(actor_user_id, organization_id, action, target_type, target_id, outcome, request_id, metadata_json) '
            . 'VALUES (:actor_id, :organization_id, :action, :target_type, :target_id, :outcome, :request_id, :metadata)',
        );
        $audit->execute([
            'actor_id' => $actorUserId,
            'organization_id' => $organizationId,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'outcome' => $outcome,
            'request_id' => $requestId,
            'metadata' => json_encode($metadata, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
        ]);
    }
}
