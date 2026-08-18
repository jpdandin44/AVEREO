-- Suivi de l'initialisation du mot de passe gérée par le fournisseur d'identité.
SET NAMES utf8mb4;

ALTER TABLE users
  ADD COLUMN onboarding_status VARCHAR(16) NOT NULL DEFAULT 'completed' AFTER status,
  ADD COLUMN activation_email_sent_at DATETIME(6) NULL AFTER onboarding_status,
  ADD CONSTRAINT chk_users_onboarding_status
    CHECK (onboarding_status IN ('required', 'sent', 'completed'));
