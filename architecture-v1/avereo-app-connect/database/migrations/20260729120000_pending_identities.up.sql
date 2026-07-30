CREATE TABLE pending_identities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  drupal_subject VARCHAR(191) NOT NULL,
  email_normalized VARCHAR(254) NULL,
  display_name VARCHAR(191) NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  approved_user_id BIGINT UNSIGNED NULL,
  approved_by_user_id BIGINT UNSIGNED NULL,
  first_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  approved_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pending_identities_drupal_subject (drupal_subject),
  KEY idx_pending_identities_email_status (email_normalized, status),
  CONSTRAINT fk_pending_identities_user FOREIGN KEY (approved_user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_pending_identities_actor FOREIGN KEY (approved_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_pending_identities_status CHECK (status IN ('pending', 'approved', 'rejected'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
