ALTER TABLE users
  ADD COLUMN archived_from_status VARCHAR(16) NULL,
  ADD COLUMN deletion_keep_reports TINYINT UNSIGNED NULL,
  ADD COLUMN sessions_revoked_at BIGINT UNSIGNED NULL;
