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
            'SELECT id FROM users WHERE drupal_subject = :drupal_subject AND status = \'active\'',
        );
        $statement->execute(['drupal_subject' => $drupalSubject]);
        $userId = $statement->fetchColumn();
        return $userId === false ? null : (int) $userId;
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
