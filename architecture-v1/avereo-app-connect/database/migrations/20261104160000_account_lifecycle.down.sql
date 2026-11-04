-- Restoring the former UI does not reactivate archived accounts.
ALTER TABLE users
  DROP COLUMN sessions_revoked_at,
  DROP COLUMN deletion_keep_reports,
  DROP COLUMN archived_from_status;
