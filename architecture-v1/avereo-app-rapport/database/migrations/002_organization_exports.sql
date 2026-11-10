CREATE TABLE rapport_export_scopes (
    report_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    organization_id BIGINT UNSIGNED NOT NULL,
    owner_provider VARCHAR(32) NOT NULL,
    owner_id VARCHAR(190) NOT NULL,
    verification_reference VARCHAR(190) NOT NULL,
    KEY idx_export_scope_org (organization_id),
    FOREIGN KEY (report_id) REFERENCES rapport_reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE rapport_export_grants (
    organization_id BIGINT UNSIGNED NOT NULL,
    connect_user_id BIGINT UNSIGNED NOT NULL,
    decision_reference VARCHAR(190) NOT NULL,
    expires_at DATETIME NULL,
    PRIMARY KEY (connect_user_id, organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE rapport_export_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    organization_id BIGINT UNSIGNED NOT NULL,
    connect_user_id BIGINT UNSIGNED NOT NULL,
    report_public_id CHAR(32) NOT NULL,
    decision_reference VARCHAR(190) NOT NULL,
    purpose VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
