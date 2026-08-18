ALTER TABLE users
  DROP CONSTRAINT chk_users_onboarding_status,
  DROP COLUMN activation_email_sent_at,
  DROP COLUMN onboarding_status;
