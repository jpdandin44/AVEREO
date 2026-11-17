-- Run once, after 003. The storage key is private and records the original directory.
ALTER TABLE rapport_photo_originals ADD COLUMN storage_owner_key CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL;

CREATE TABLE rapport_transfer_events (
    operation_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
    organization_id BIGINT UNSIGNED NOT NULL,
    actor_id BIGINT UNSIGNED NOT NULL,
    report_public_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    source_id BIGINT UNSIGNED NOT NULL,
    destination_id BIGINT UNSIGNED NOT NULL,
    reason VARCHAR(190) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_transfer_report (report_public_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
