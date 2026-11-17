<?php
declare(strict_types=1);

namespace Avereo\Connect\Administration;

use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Repository\PdoConnectRepository;
use Closure;
use PDO;

final class ReportTransfers
{
    private const PROVIDER = 'avereo_connect';
    private const VERIFIED = " FROM rapport_reports r JOIN rapport_export_scopes s ON s.report_id=r.id
        AND HEX(s.owner_provider)=HEX(r.owner_provider) AND HEX(s.owner_id)=HEX(r.owner_id)
        WHERE s.organization_id=? AND TRIM(s.verification_reference)<>'' AND HEX(r.owner_provider)=HEX(?)";

    public function __construct(
        private readonly PDO $connect,
        private readonly PdoConnectRepository $repository,
        private readonly Closure $reportDatabase,
        private readonly array $administrators,
    ) {}

    public function enabledFor(int $actor, int $organization, string $role): bool
    {
        $allowed = $this->administrators[$organization] ?? [];
        return in_array($role, ['owner','admin'], true) && is_array($allowed) && in_array($actor, $allowed, true);
    }

    private static function query(PDO $db, string $sql, array $args): \PDOStatement
    {
        $query = $db->prepare($sql);
        $query->execute($args);
        return $query;
    }

    private static function lock(PDO $db): string
    {
        return $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' FOR UPDATE' : '';
    }

    private function authorize(int $actor, int $organization, int $source, bool $lock): void
    {
        $suffix = $lock ? self::lock($this->connect) : '';
        $role = self::query($this->connect, "SELECT m.role FROM memberships m JOIN organizations o ON o.id=m.organization_id
            JOIN users u ON u.id=m.user_id WHERE o.id=? AND u.id=? AND o.status='active' AND m.status='active'
            AND u.status='active' AND u.onboarding_status='completed'
            AND (u.access_starts_at IS NULL OR u.access_starts_at<=UTC_TIMESTAMP(6))
            AND (u.access_ends_at IS NULL OR u.access_ends_at>UTC_TIMESTAMP(6))" . $suffix, [$organization,$actor])->fetchColumn();
        if (!$this->enabledFor($actor, $organization, (string)$role)) {
            throw new ApiException(403, 'TRANSFER_FORBIDDEN', 'Habilitation de transfert requise dans cette organisation.');
        }
        if (!self::query($this->connect, "SELECT u.id FROM users u JOIN memberships m ON m.user_id=u.id
            WHERE m.organization_id=? AND m.status='active' AND u.id=? AND u.deletion_keep_reports IS NULL" . $suffix, [$organization,$source])->fetchColumn()) {
            throw new ApiException(409, 'SOURCE_UNAVAILABLE', 'Compte source indisponible ou en cours de suppression.');
        }
    }

    public function listing(int $actor, int $organization, int $source): array
    {
        $this->authorize($actor, $organization, $source, false);
        $reports = ($this->reportDatabase)();
        $items = self::query($reports, 'SELECT r.public_id AS id,r.reference_code AS reference,r.title' . self::VERIFIED
            . ' AND HEX(r.owner_id)=HEX(?) ORDER BY r.reference_code,r.public_id', [$organization,self::PROVIDER,(string)$source])->fetchAll(PDO::FETCH_ASSOC);
        $targets = self::query($this->connect, "SELECT u.id,u.display_name AS name,u.email_normalized AS email
            FROM users u JOIN memberships m ON m.user_id=u.id WHERE m.organization_id=? AND m.status='active'
            AND u.status='active' AND u.id<>? ORDER BY u.display_name,u.id", [$organization,$source])->fetchAll(PDO::FETCH_ASSOC);
        $targets = array_values(array_filter($targets, fn(array $user): bool =>
            $this->repository->hasApplicationAccess((int)$user['id'], 'rapport', $organization)));
        return ['reports'=>$items,'recipients'=>$targets,'remaining'=>count($items)];
    }

    public function transfer(int $actor, int $organization, int $source, array $input): array
    {
        $id = $input['reportId'] ?? null;
        $operation = $input['operationId'] ?? null;
        $destination = $input['recipientId'] ?? null;
        $reason = $input['reason'] ?? null;
        if (!is_string($id) || !preg_match('/^[0-9a-f]{32}$/D', $id)
            || !is_string($operation) || !preg_match('/^[0-9a-f]{32}$/D', $operation)
            || !is_int($destination) || $destination < 1 || $source === $destination
            || !is_string($reason) || !preg_match('/^[^\p{C}]{1,190}$/uD', trim($reason))) {
            throw new ApiException(422, 'TRANSFER_INPUT_INVALID', 'Choisissez un dossier, un autre titulaire et un motif de 1 à 190 caractères.');
        }
        $reason = trim($reason);
        $this->connect->beginTransaction();
        $reports = null;
        try {
            $this->authorize($actor, $organization, $source, true);
            if (!$this->repository->hasApplicationAccess($destination, 'rapport', $organization, true)) {
                throw new ApiException(409, 'RECIPIENT_UNAVAILABLE', 'Le destinataire doit disposer de Rapport dans cette organisation.');
            }
            $email = self::query($this->connect, 'SELECT email_normalized FROM users WHERE id=?', [$destination])->fetchColumn();
            $reports = ($this->reportDatabase)();
            $reports->beginTransaction();
            $report = self::query($reports, 'SELECT r.id,r.owner_id' . self::VERIFIED . ' AND r.public_id=?' . self::lock($reports),
                [$organization,self::PROVIDER,$id])->fetch(PDO::FETCH_ASSOC);
            if (!$report) throw new ApiException(409, 'REPORT_SCOPE_CHANGED', 'Le rattachement du dossier doit être vérifié.');
            $prior = self::query($reports, 'SELECT * FROM rapport_transfer_events WHERE operation_id=?' . self::lock($reports), [$operation])->fetch(PDO::FETCH_ASSOC);
            if ($prior) {
                if ((int)$prior['actor_id'] !== $actor || (int)$prior['organization_id'] !== $organization
                    || $prior['report_public_id'] !== $id || (int)$prior['source_id'] !== $source
                    || (int)$prior['destination_id'] !== $destination || $prior['reason'] !== $reason) {
                    throw new ApiException(409, 'TRANSFER_REQUEST_CONFLICT', 'Cette confirmation correspond à une autre opération.');
                }
            } else {
                if ((string)$report['owner_id'] !== (string)$source) {
                    throw new ApiException(409, 'REPORT_OWNER_CHANGED', 'Le titulaire a changé. Actualisez la liste.');
                }
                $originals = self::query($reports, 'SELECT owner_provider,owner_id FROM rapport_photo_originals WHERE report_public_id=?'
                    . self::lock($reports), [$id]);
                foreach ($originals->fetchAll(PDO::FETCH_ASSOC) as $photo) {
                    if ($photo['owner_provider'] !== self::PROVIDER || (string)$photo['owner_id'] !== (string)$source) {
                        throw new ApiException(409, 'PHOTO_OWNER_MISMATCH', 'Le rattachement des originaux doit être vérifié.');
                    }
                }
                $storageKey = hash('sha256', self::PROVIDER . "\0" . $source);
                self::query($reports, 'UPDATE rapport_photo_originals SET storage_owner_key=COALESCE(storage_owner_key,?),owner_id=? WHERE report_public_id=?',
                    [$storageKey,(string)$destination,$id]);
                self::query($reports, 'UPDATE rapport_reports SET owner_id=?,owner_email=?,updated_at=updated_at WHERE id=?',
                    [(string)$destination,$email,$report['id']]);
                self::query($reports, 'UPDATE rapport_export_scopes SET owner_id=? WHERE report_id=?', [(string)$destination,$report['id']]);
                self::query($reports, 'INSERT INTO rapport_transfer_events
                    (operation_id,organization_id,actor_id,report_public_id,source_id,destination_id,reason) VALUES (?,?,?,?,?,?,?)',
                    [$operation,$organization,$actor,$id,$source,$destination,$reason]);
            }
            $reports->commit();
            $this->connect->commit();
            return ['operationId'=>$operation,'reportId'=>$id,'recipientId'=>$destination,'alreadyProcessed'=>(bool)$prior];
        } catch (\Throwable $failure) {
            if ($reports?->inTransaction()) $reports->rollBack();
            if ($this->connect->inTransaction()) $this->connect->rollBack();
            throw $failure;
        }
    }
}
