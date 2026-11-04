<?php

declare(strict_types=1);

namespace Avereo\Connect\Administration;

use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Identity\IdentityAccountDeletionClient;
use PDO;

final class AccountLifecycle
{
    public function __construct(
        private readonly PDO $db,
        private readonly AccountAdministration $administration,
        private readonly TrialPolicyStore $policy,
        private readonly ?IdentityAccountDeletionClient $identity = null,
        private readonly ?\Closure $reportDatabase = null,
    ) {
    }

    public function describe(int $actor, array $snapshot): array
    {
        $organization = (int) $snapshot['organization']['id'];
        foreach ($snapshot['users'] as &$user) {
            try {
                $target = $this->target($actor, $organization, (int) $user['id']);
            } catch (ApiException) {
                continue;
            }
            $user['archived'] = $target['archived_from_status'] !== null;
            $user['canArchive'] = !$user['archived'];
            $user['canRestore'] = $user['archived'] && $target['deletion_keep_reports'] === null;
            $user['canDelete'] = $this->identity !== null && ctype_digit((string) $target['drupal_subject']);
            $user['canDeleteReports'] = $this->reportDatabase !== null;
            $user['pendingDeletionKeepsReports'] = $target['deletion_keep_reports'] === null
                ? null : (bool) $target['deletion_keep_reports'];
            if ($user['archived']) {
                foreach (['canChangeStatus', 'canManageApplications', 'canSendActivationEmail',
                    'canSendPasswordResetEmail', 'canChangePeriod'] as $flag) {
                    $user[$flag] = false;
                }
            }
        }
        unset($user);
        return $snapshot;
    }

    public function setArchived(int $actor, int $organization, int $id, bool $archive, string $requestId): array
    {
        return $this->administration->synchronize(
            $id,
            function () use ($actor, $organization, $id, $archive, $requestId): array {
                $target = $this->target($actor, $organization, $id);
                if ($target['deletion_keep_reports'] !== null) {
                    throw new ApiException(409, 'ACCOUNT_DELETION_PENDING', 'La suppression est en cours.');
                }
                $this->transaction(function () use ($actor, $organization, $id, $archive, $requestId, $target): void {
                    if (($target['archived_from_status'] !== null) === $archive) {
                        return;
                    }
                    if ($archive) {
                        $this->execute('UPDATE users SET archived_from_status=?, status=?, sessions_revoked_at=? WHERE id=?',
                            [$target['status'], 'disabled', time(), $id]);
                    } else {
                        $this->execute('UPDATE users SET status=?, archived_from_status=NULL, sessions_revoked_at=? WHERE id=?',
                            [$target['archived_from_status'], time(), $id]);
                    }
                    $this->audit($actor, $organization, $id, $archive ? 'user.archive' : 'user.restore', $requestId);
                });
                return ['id' => $id, 'archived' => $archive];
            },
            function () use ($actor, $organization, $id): void {
                $this->target($actor, $organization, $id);
            },
        );
    }

    public function delete(int $actor, int $organization, int $id, string $confirmation, bool $keepReports, string $requestId): array
    {
        if ($this->identity === null || (!$keepReports && $this->reportDatabase === null)) {
            throw new ApiException(503, 'ACCOUNT_DELETION_NOT_CONFIGURED', 'La suppression demandée n’est pas configurée.');
        }

        return $this->policy->locked(function () use ($actor, $organization, $id, $confirmation, $keepReports, $requestId): array {
            $target = $this->target($actor, $organization, $id);
            if (!hash_equals($target['email_normalized'], strtolower(trim($confirmation)))) {
                throw new ApiException(422, 'ACCOUNT_DELETE_CONFIRMATION_INVALID', 'Ressaisissez l’adresse e-mail du compte.');
            }
            if ($target['deletion_keep_reports'] !== null && (bool) $target['deletion_keep_reports'] !== $keepReports) {
                throw new ApiException(409, 'ACCOUNT_DELETION_CHOICE_LOCKED', 'Reprenez la suppression avec le choix de dossiers déjà enregistré.');
            }
            $this->assertNoDependencies($id, $target);
            $reports = $keepReports ? null : ($this->reportDatabase)();
            if ($reports === $this->db || (!$keepReports && !$reports instanceof PDO)) {
                throw new \RuntimeException('Connexion Rapport non isolée.');
            }
            if ($reports !== null) {
                // Check availability before marking the account as being deleted.
                $reports->query('SELECT owner_id FROM rapport_reports WHERE 1=0');
            }
            if ($target['deletion_keep_reports'] === null) {
                $this->identity->check($target['drupal_subject'], $target['email_normalized']);
                $this->policy->deny($id);
                $this->transaction(function () use ($actor, $organization, $id, $keepReports, $requestId, $target): void {
                    $this->execute('UPDATE users SET archived_from_status=?, status=?, sessions_revoked_at=?, deletion_keep_reports=? WHERE id=?',
                        [$target['archived_from_status'] ?? $target['status'], 'disabled', time(), (int) $keepReports, $id]);
                    $this->audit($actor, $organization, $id, 'user.deletion_started', $requestId, ['keepReports' => $keepReports]);
                });
            }
            // Both operations are idempotent. A failed attempt leaves the account
            // disabled and the choice locked until the owner can resume it.
            try {
                $this->identity->delete($target['drupal_subject'], $target['email_normalized']);
                if ($reports !== null) {
                    $deleteReports = $reports->prepare('DELETE FROM rapport_reports WHERE owner_provider=? AND owner_id=?');
                    $deleteReports->execute(['avereo_connect', (string) $id]);
                }
                $this->transaction(function () use ($actor, $organization, $id, $keepReports, $requestId, $target): void {
                    $this->execute('DELETE FROM pending_identities WHERE drupal_subject=? AND (approved_user_id IS NULL OR approved_user_id=?)',
                        [$target['drupal_subject'], $id]);
                    $this->execute('DELETE FROM invitations WHERE email_normalized=? AND organization_id=?',
                        [$target['email_normalized'], $organization]);
                    $this->execute('DELETE FROM user_application_access WHERE user_id=?', [$id]);
                    $this->execute('DELETE FROM memberships WHERE user_id=?', [$id]);
                    $this->execute('DELETE FROM users WHERE id=?', [$id]);
                    $this->audit($actor, $organization, $id, 'user.delete', $requestId, ['keepReports' => $keepReports]);
                });
            } catch (\Throwable $error) {
                error_log(json_encode(['event' => 'account_deletion_pending', 'requestId' => $requestId, 'type' => $error::class]));
                throw new ApiException(503, 'ACCOUNT_DELETION_PENDING', 'Le compte reste bloqué. Reprenez la suppression avec le même choix.');
            }
            return ['id' => $id, 'deleted' => true, 'reportsPreserved' => $keepReports];
        });
    }

    private function target(int $actor, int $organization, int $id): array
    {
        $this->administration->authorize($actor, $organization, $id, true);
        $statement = $this->execute(
            "SELECT u.* FROM users u
             JOIN memberships m ON m.user_id=u.id AND m.organization_id=?
             JOIN memberships a ON a.organization_id=m.organization_id AND a.user_id=? AND a.role='owner' AND a.status='active'
             WHERE u.id=? AND m.role IN ('member','viewer')
             AND (SELECT COUNT(*) FROM memberships all_m WHERE all_m.user_id=u.id)=1
             AND NOT EXISTS (SELECT 1 FROM user_application_access x JOIN applications app ON app.id=x.application_id
                             WHERE x.user_id=u.id AND app.code NOT IN ('rapport','rga'))",
            [$organization, $actor, $id],
        );
        $target = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$target || $target['application_access_mode'] !== 'explicit') {
            throw new ApiException(403, 'ACCOUNT_LIFECYCLE_PROTECTED', 'Seuls les comptes membres dédiés à Rapport ou RGA sont éligibles.');
        }
        return $target;
    }

    private function assertNoDependencies(int $id, array $target): void
    {
        $queries = [
            ['SELECT 1 FROM organizations WHERE owner_membership_id IN (SELECT id FROM memberships WHERE user_id=?)', [$id]],
            ['SELECT 1 FROM entitlements WHERE granted_by_user_id=?', [$id]],
            ['SELECT 1 FROM invitations WHERE invited_by_user_id=?', [$id]],
            ['SELECT 1 FROM user_application_access WHERE granted_by_user_id=? AND user_id<>?', [$id, $id]],
            ['SELECT 1 FROM pending_identities WHERE approved_user_id=? AND drupal_subject<>?', [$id, $target['drupal_subject']]],
        ];
        foreach ($queries as [$sql, $args]) {
            if ($this->execute($sql, $args)->fetchColumn() !== false) {
                throw new ApiException(409, 'ACCOUNT_HAS_PROTECTED_DEPENDENCIES', 'Le compte est encore lié à une décision d’accès ou à une organisation.');
            }
        }
    }

    private function execute(string $sql, array $parameters): \PDOStatement
    {
        $statement = $this->db->prepare($sql);
        $statement->execute($parameters);
        return $statement;
    }

    private function transaction(callable $operation): void
    {
        $this->db->beginTransaction();
        try {
            $operation();
            $this->db->commit();
        } catch (\Throwable $error) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $error;
        }
    }

    private function audit(int $actor, int $organization, int $id, string $action, string $requestId, array $metadata = []): void
    {
        $this->execute("INSERT INTO audit_events (actor_user_id,organization_id,action,target_type,target_id,outcome,request_id,metadata_json)
            VALUES (?,?,?,'user',?,'success',?,?)",
            [$actor, $organization, $action, (string) $id, $requestId, json_encode($metadata, JSON_THROW_ON_ERROR)]);
    }
}

