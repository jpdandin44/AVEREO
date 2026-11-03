ALTER TABLE users DROP CONSTRAINT chk_users_access_period, DROP CONSTRAINT chk_users_access_mode,
  DROP COLUMN access_starts_at, DROP COLUMN access_ends_at, DROP COLUMN application_access_mode;
