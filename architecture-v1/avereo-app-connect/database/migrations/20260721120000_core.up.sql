-- AVEREO CONNECT — schéma initial C7, cible MariaDB 11.4 / MySQL 8.
SET NAMES utf8mb4;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  drupal_subject VARCHAR(191) NOT NULL,
  email_normalized VARCHAR(254) NOT NULL,
  display_name VARCHAR(191) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_drupal_subject (drupal_subject),
  UNIQUE KEY uq_users_email_normalized (email_normalized),
  CONSTRAINT chk_users_status CHECK (status IN ('active', 'suspended', 'disabled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE organizations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(191) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  owner_membership_id BIGINT UNSIGNED NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_organizations_slug (slug),
  CONSTRAINT chk_organizations_status CHECK (status IN ('active', 'suspended', 'closed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE memberships (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role VARCHAR(16) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_memberships_organization_user (organization_id, user_id),
  KEY idx_memberships_user_status (user_id, status),
  CONSTRAINT fk_memberships_organization FOREIGN KEY (organization_id) REFERENCES organizations (id),
  CONSTRAINT fk_memberships_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT chk_memberships_role CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  CONSTRAINT chk_memberships_status CHECK (status IN ('active', 'suspended', 'revoked'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE organizations
  ADD CONSTRAINT fk_organizations_owner_membership
  FOREIGN KEY (owner_membership_id) REFERENCES memberships (id);

CREATE TABLE applications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(191) NOT NULL,
  launch_url VARCHAR(2048) NOT NULL,
  required_scope VARCHAR(191) NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_applications_code (code),
  CONSTRAINT chk_applications_status CHECK (status IN ('draft', 'active', 'suspended', 'retired'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE entitlements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  application_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  valid_from DATETIME(6) NULL,
  valid_to DATETIME(6) NULL,
  granted_by_user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_entitlements_organization_application (organization_id, application_id),
  KEY idx_entitlements_validity (status, valid_from, valid_to),
  CONSTRAINT fk_entitlements_organization FOREIGN KEY (organization_id) REFERENCES organizations (id),
  CONSTRAINT fk_entitlements_application FOREIGN KEY (application_id) REFERENCES applications (id),
  CONSTRAINT fk_entitlements_granted_by FOREIGN KEY (granted_by_user_id) REFERENCES users (id),
  CONSTRAINT chk_entitlements_status CHECK (status IN ('active', 'suspended', 'revoked')),
  CONSTRAINT chk_entitlements_dates CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to > valid_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invitations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  email_normalized VARCHAR(254) NOT NULL,
  email_hash BINARY(32) NOT NULL,
  role VARCHAR(16) NOT NULL,
  token_hash BINARY(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  expires_at DATETIME(6) NOT NULL,
  accepted_at DATETIME(6) NULL,
  revoked_at DATETIME(6) NULL,
  invited_by_user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_invitations_token_hash (token_hash),
  KEY idx_invitations_organization_status (organization_id, status, expires_at),
  KEY idx_invitations_email_hash (email_hash),
  CONSTRAINT fk_invitations_organization FOREIGN KEY (organization_id) REFERENCES organizations (id),
  CONSTRAINT fk_invitations_invited_by FOREIGN KEY (invited_by_user_id) REFERENCES users (id),
  CONSTRAINT chk_invitations_role CHECK (role IN ('admin', 'member', 'viewer')),
  CONSTRAINT chk_invitations_status CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NULL,
  organization_id BIGINT UNSIGNED NULL,
  action VARCHAR(96) NOT NULL,
  target_type VARCHAR(64) NULL,
  target_id VARCHAR(191) NULL,
  outcome VARCHAR(16) NOT NULL,
  request_id VARCHAR(64) NOT NULL,
  metadata_json JSON NULL,
  occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_audit_events_organization_time (organization_id, occurred_at),
  KEY idx_audit_events_actor_time (actor_user_id, occurred_at),
  KEY idx_audit_events_request_id (request_id),
  CONSTRAINT fk_audit_events_actor FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_events_organization FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL,
  CONSTRAINT chk_audit_events_outcome CHECK (outcome IN ('success', 'denied', 'failure'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
