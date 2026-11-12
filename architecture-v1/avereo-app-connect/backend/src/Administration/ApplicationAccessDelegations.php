<?php
declare(strict_types=1);

namespace Avereo\Connect\Administration;

use PDO;

final class ApplicationAccessDelegations
{
    public function __construct(private readonly PDO $db) {}

    /** A decision is specific to one membership in this CONNECT database. */
    public function organizations(int $actor, ?int $lockOrganization = null): array
    {
        $sql = "SELECT m.organization_id
            FROM application_access_delegations d
            JOIN memberships m ON m.id=d.membership_id
            JOIN users u ON u.id=m.user_id
            JOIN organizations o ON o.id=m.organization_id
            WHERE u.id=? AND u.status='active' AND u.onboarding_status='completed'
              AND m.status='active' AND o.status='active' AND d.decision_reference<>''
              AND (u.access_starts_at IS NULL OR u.access_starts_at<=UTC_TIMESTAMP())
              AND (u.access_ends_at IS NULL OR u.access_ends_at>UTC_TIMESTAMP())
              AND (d.expires_at IS NULL OR d.expires_at>UTC_TIMESTAMP())";
        $values = [$actor];
        if ($lockOrganization !== null) {
            $sql .= ' AND m.organization_id=?';
            $values[] = $lockOrganization;
            if ($this->db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql') $sql .= ' FOR UPDATE';
        }
        $q = $this->db->prepare($sql);
        $q->execute($values);
        return array_map('intval', $q->fetchAll(PDO::FETCH_COLUMN));
    }

    public static function eligibleTarget(int $actor, int $target, array $user): bool
    {
        return $actor !== $target && in_array($user['role'], ['member','viewer'], true)
            && $user['membershipStatus'] === 'active' && $user['status'] === 'active';
    }
}
