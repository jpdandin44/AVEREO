-- Droits applicatifs explicites par compte CONNECT.
SET NAMES utf8mb4;

CREATE TABLE user_application_access (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  application_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  granted_by_user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_application_access (organization_id, user_id, application_id),
  KEY idx_user_application_access_user_status (user_id, status),
  CONSTRAINT fk_user_application_access_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id),
  CONSTRAINT fk_user_application_access_user
    FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_user_application_access_application
    FOREIGN KEY (application_id) REFERENCES applications (id),
  CONSTRAINT fk_user_application_access_granted_by
    FOREIGN KEY (granted_by_user_id) REFERENCES users (id),
  CONSTRAINT chk_user_application_access_status CHECK (status IN ('active', 'revoked'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
