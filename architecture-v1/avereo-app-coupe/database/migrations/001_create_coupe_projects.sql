CREATE TABLE IF NOT EXISTS coupe_projects (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(32) NOT NULL,
    name VARCHAR(190) NOT NULL DEFAULT '',
    address VARCHAR(255) NOT NULL DEFAULT '',
    sources VARCHAR(255) NOT NULL DEFAULT '',
    payload_json LONGTEXT NOT NULL,
    payload_bytes INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_coupe_projects_public_id (public_id),
    KEY idx_coupe_projects_updated_at (updated_at),
    KEY idx_coupe_projects_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
