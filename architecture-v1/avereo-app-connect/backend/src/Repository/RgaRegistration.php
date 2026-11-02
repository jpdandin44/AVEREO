<?php
declare(strict_types=1);
namespace Avereo\Connect\Repository;

/** One-time, transactional registration. Never synchronizes permissions after creation. */
final class RgaRegistration
{
    public function __construct(private readonly \PDO $pdo) {}

    public function snapshot(string $code, bool $lock = false): array
    {
        $suffix = $lock && $this->pdo->getAttribute(\PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' FOR UPDATE' : '';
        $q = $this->pdo->prepare('SELECT * FROM applications WHERE code = ?' . $suffix);
        $q->execute([$code]);
        $app = $q->fetch(\PDO::FETCH_ASSOC);
        if (!$app) return ['application' => null, 'entitlements' => [], 'access' => []];
        $q = $this->pdo->prepare('SELECT organization_id, status, valid_from, valid_to, granted_by_user_id FROM entitlements WHERE application_id = ? ORDER BY organization_id' . $suffix);
        $q->execute([$app['id']]);
        $entitlements = $q->fetchAll(\PDO::FETCH_ASSOC);
        $q = $this->pdo->prepare('SELECT organization_id, user_id, status, granted_by_user_id FROM user_application_access WHERE application_id = ? ORDER BY organization_id, user_id' . $suffix);
        $q->execute([$app['id']]);
        return ['application' => $app, 'entitlements' => $entitlements, 'access' => $q->fetchAll(\PDO::FETCH_ASSOC)];
    }

    public static function fingerprint(array $snapshot): string
    {
        return hash('sha256', json_encode($snapshot, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES));
    }

    public function plan(bool $lock = false): array
    {
        $source = $this->snapshot('rapport', $lock);
        if ($source['application'] === null) throw new \RuntimeException('Application Rapport absente.');
        return ['sourceFingerprint' => self::fingerprint($source), 'source' => $source,
            'existingRga' => $this->snapshot('rga', $lock), 'policy' => 'copy_once_then_independent'];
    }

    private function assertOperator(int $actor, array $source): void
    {
        // Older hosted CONNECT schemas predate onboarding_status; keep their active-account rule.
        $q = $this->pdo->prepare("SELECT * FROM users WHERE id = ? AND status = 'active'");
        $q->execute([$actor]);
        $user = $q->fetch(\PDO::FETCH_ASSOC);
        if (!$user || (array_key_exists('onboarding_status', $user) && $user['onboarding_status'] !== 'completed')) {
            throw new \RuntimeException('Opérateur actif requis.');
        }
        $organizations = array_unique(array_merge(array_column($source['entitlements'], 'organization_id'), array_column($source['access'], 'organization_id')));
        if (!$organizations) throw new \RuntimeException('Aucune habilitation Rapport à reprendre.');
        $q = $this->pdo->prepare("SELECT 1 FROM memberships WHERE user_id = ? AND organization_id = ? AND status = 'active' AND role = 'owner'");
        foreach ($organizations as $id) {
            $q->execute([$actor, $id]);
            if (!$q->fetchColumn()) throw new \RuntimeException('Le propriétaire de chaque organisation concernée est requis.');
        }
    }

    public function register(int $actor, string $url, string $expectedFingerprint): array
    {
        $parts = parse_url($url);
        $host = strtolower((string) ($parts['host'] ?? ''));
        if (!is_array($parts) || ($parts['scheme'] ?? '') !== 'https'
            || !str_ends_with($host, '.avereo.fr') || ($parts['path'] ?? '') !== '/rga/'
            || isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])
            || (isset($parts['port']) && $parts['port'] !== 443)) {
            throw new \InvalidArgumentException('URL RGA HTTPS AVEREO attendue, chemin /rga/.');
        }
        $this->pdo->beginTransaction();
        try {
            $plan = $this->plan(true);
            $this->assertOperator($actor, $plan['source']);
            if ($plan['existingRga']['application'] !== null) {
                $this->pdo->rollBack();
                return ['status' => 'already_registered', 'permissionsChanged' => false];
            }
            if (!hash_equals($expectedFingerprint, $plan['sourceFingerprint'])) throw new \RuntimeException('Les droits Rapport ont changé depuis la préparation.');
            $source = $plan['source'];
            $q = $this->pdo->prepare('INSERT INTO applications (code, name, description, launch_url, required_scope, display_order, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $q->execute(['rga', 'RGA', 'Rechercher un bien et consulter la carte de retrait-gonflement des argiles.', $url,
                'rga:use', min(65535, (int) $source['application']['display_order'] + 1), $source['application']['status']]);
            $id = (int) $this->pdo->lastInsertId();
            $q = $this->pdo->prepare('INSERT INTO entitlements (organization_id, application_id, status, valid_from, valid_to, granted_by_user_id) VALUES (?, ?, ?, ?, ?, ?)');
            foreach ($source['entitlements'] as $row) $q->execute([$row['organization_id'], $id, $row['status'], $row['valid_from'], $row['valid_to'], $row['granted_by_user_id']]);
            $q = $this->pdo->prepare('INSERT INTO user_application_access (organization_id, user_id, application_id, status, granted_by_user_id) VALUES (?, ?, ?, ?, ?)');
            foreach ($source['access'] as $row) $q->execute([$row['organization_id'], $row['user_id'], $id, $row['status'], $row['granted_by_user_id']]);
            $created = $this->snapshot('rga');
            $this->audit($actor, $id, 'rga.register', ['policy' => $plan['policy'], 'sourceFingerprint' => $expectedFingerprint]);
            $this->pdo->commit();
            return ['status' => 'registered', 'applicationId' => $id, 'sourceFingerprint' => $expectedFingerprint,
                'createdFingerprint' => self::fingerprint($created), 'created' => $created];
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $e;
        }
    }

    /** Narrow rollback only while the newly created RGA rows are unchanged. */
    public function rollback(int $actor, array $receipt): void
    {
        $this->pdo->beginTransaction();
        try {
            $current = $this->snapshot('rga', true);
            $this->assertOperator($actor, $current);
            if (($receipt['status'] ?? '') !== 'registered'
                || (int) ($current['application']['id'] ?? 0) !== ($receipt['applicationId'] ?? null)
                || !hash_equals($receipt['createdFingerprint'] ?? '', self::fingerprint($current))) {
                throw new \RuntimeException('RGA a changé : retour arrière automatique refusé.');
            }
            $id = $receipt['applicationId'];
            foreach (['user_application_access', 'entitlements', 'applications'] as $table) {
                $column = $table === 'applications' ? 'id' : 'application_id';
                $q = $this->pdo->prepare("DELETE FROM $table WHERE $column = ?");
                $q->execute([$id]);
            }
            $this->audit($actor, $id, 'rga.registration.rollback', []);
            $this->pdo->commit();
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $e;
        }
    }

    private function audit(int $actor, int $id, string $action, array $metadata): void
    {
        $q = $this->pdo->prepare('INSERT INTO audit_events (actor_user_id, action, target_type, target_id, outcome, request_id, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $q->execute([$actor, $action, 'application', (string) $id, 'success', bin2hex(random_bytes(16)), json_encode($metadata, JSON_THROW_ON_ERROR)]);
    }
}
