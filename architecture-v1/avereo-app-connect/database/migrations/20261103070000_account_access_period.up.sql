ALTER TABLE users
  ADD COLUMN access_starts_at DATETIME(6) NULL,
  ADD COLUMN access_ends_at DATETIME(6) NULL,
  ADD COLUMN application_access_mode VARCHAR(16) NOT NULL DEFAULT 'inherit',
  ADD CONSTRAINT chk_users_access_mode CHECK (application_access_mode IN ('inherit','explicit')),
  ADD CONSTRAINT chk_users_access_period CHECK (
    (access_starts_at IS NULL AND access_ends_at IS NULL)
    OR (access_starts_at IS NOT NULL AND access_ends_at IS NOT NULL AND access_ends_at > access_starts_at)
  );
