<?php
declare(strict_types=1);

/** Export grants are independent from editing permissions and the applicant cannot issue them here. */
final class RapportOrganizationExports
{
    private const SCOPE = " FROM rapport_reports r
        JOIN rapport_export_scopes s ON s.report_id=r.id
        AND HEX(s.owner_provider)=HEX(r.owner_provider) AND HEX(s.owner_id)=HEX(r.owner_id)
        JOIN rapport_export_grants g ON g.organization_id=s.organization_id
        WHERE g.connect_user_id=? AND s.verification_reference<>'' AND g.decision_reference<>''
        AND (g.expires_at IS NULL OR g.expires_at>UTC_TIMESTAMP())";

    public function __construct(private readonly PDO $pdo) {}

    public function hasGrant(int $actor): bool
    {
        $query = $this->pdo->prepare("SELECT 1 FROM rapport_export_grants WHERE connect_user_id=?
            AND decision_reference<>'' AND (expires_at IS NULL OR expires_at>UTC_TIMESTAMP()) LIMIT 1");
        $query->execute([$actor]);
        return $query->fetchColumn() !== false;
    }

    public function listing(int $actor, string $reference): array
    {
        $sql = 'SELECT r.public_id AS id,r.reference_code AS reference,r.title,s.organization_id AS organizationId' . self::SCOPE;
        $params = [$actor];
        if ($reference !== '') {
            $sql .= ' AND r.reference_code=?';
            $params[] = $reference;
        }
        $query = $this->pdo->prepare($sql.' ORDER BY r.updated_at DESC,r.id DESC LIMIT 50');
        $query->execute($params);
        return $query->fetchAll(PDO::FETCH_ASSOC);
    }

    public function download(int $actor, string $id, string $purpose): ?string
    {
        if (!preg_match('/^[0-9a-f]{32}$/D',$id) || !in_array($purpose,['assistance','continuite','test_autorise'],true)) {
            throw new InvalidArgumentException('Sélection ou motif invalide.');
        }
        $this->pdo->beginTransaction();
        try {
            $sql = 'SELECT r.payload_json,s.organization_id,g.decision_reference'.self::SCOPE.' AND r.public_id=?';
            // Serialize selection and audit with concurrent grant withdrawal on the hosted MySQL database.
            if ($this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql') $sql .= ' FOR UPDATE';
            $query = $this->pdo->prepare($sql);
            $query->execute([$actor,$id]);
            $row = $query->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                $this->pdo->rollBack();
                return null;
            }
            $record = $this->pdo->prepare('INSERT INTO rapport_export_events
                (organization_id,connect_user_id,report_public_id,decision_reference,purpose) VALUES (?,?,?,?,?)');
            $record->execute([$row['organization_id'],$actor,$id,$row['decision_reference'],$purpose]);
            $this->pdo->commit();
            return $row['payload_json'];
        } catch (Throwable $failure) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $failure;
        }
    }
}
