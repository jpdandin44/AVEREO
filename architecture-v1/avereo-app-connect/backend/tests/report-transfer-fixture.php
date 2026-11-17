<?php
declare(strict_types=1);

// Shared by the isolated service test and the loopback-only review router.
function createReportTransferSqliteSchema(PDO $reports): void
{
    $reports->exec('CREATE TABLE rapport_reports (id INTEGER PRIMARY KEY,public_id TEXT,title TEXT,reference_code TEXT,payload_json TEXT,payload_bytes INT,
        owner_provider TEXT,owner_id TEXT,owner_email TEXT,created_by_id TEXT,updated_by_id TEXT,created_at TEXT,updated_at TEXT);
        CREATE TABLE rapport_export_scopes (report_id INTEGER PRIMARY KEY,organization_id INT,owner_provider TEXT,owner_id TEXT,verification_reference TEXT);
        CREATE TABLE rapport_export_grants (organization_id INT, connect_user_id INT,decision_reference TEXT,expires_at TEXT);
        CREATE TABLE rapport_export_events(id INTEGER PRIMARY KEY, organization_id INT,connect_user_id INT,report_public_id TEXT,decision_reference TEXT,purpose TEXT);
        CREATE TABLE rapport_photo_originals(id INTEGER PRIMARY KEY,public_id TEXT,report_public_id TEXT,owner_provider TEXT,owner_id TEXT,sha256 TEXT,bytes INT,
            mime TEXT,width INT,height INT,original_name TEXT,created_at TEXT,storage_owner_key TEXT, UNIQUE(report_public_id,sha256));
        CREATE TABLE rapport_transfer_events(operation_id TEXT PRIMARY KEY,organization_id INT,actor_id INT,report_public_id TEXT,source_id INT,
            destination_id INT,reason TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);');
}

function seedReportTransferFixture(PDO $reports): void
{
    $id=str_repeat('a',32);
    $other=str_repeat('b',32);
    $legacy=str_repeat('c',32);
    $payload='{"titre":"Mission fictive","observations":[{"photos":[{"src":"data:image/png;base64,AA=="}]}],"signature":"fictive","extension":9007199254740993}';
    $insert=$reports->prepare("INSERT INTO rapport_reports(id,public_id,title,reference_code,payload_json,payload_bytes,owner_provider,owner_id,owner_email,
        created_by_id,updated_by_id,created_at,updated_at) VALUES (?,?,?,?,?,?,'avereo_connect','2','member@example.invalid','2','2',?,?)");
    foreach ([1=>$id,2=>$other,3=>$legacy] as $number=>$public) {
        $insert->execute([$number,$public,'Test','TEST-'.$number,$payload,strlen($payload),'2026-01-01 12:00:00','2026-02-01 10:00:00']);
    }
    $reports->exec("INSERT INTO rapport_export_scopes VALUES(1,7,'avereo_connect','2','Mission fictive A'),(2,7,'avereo_connect','2','Mission fictive B');
        INSERT INTO rapport_export_grants(organization_id,connect_user_id,decision_reference) VALUES(7,2,'Export de recette');");
}
