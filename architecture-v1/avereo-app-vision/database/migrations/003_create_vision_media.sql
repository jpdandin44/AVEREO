-- Lot 3A : fichiers privés, aucune modification des tables livrées.
CREATE TABLE IF NOT EXISTS vision_media (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    project_id BIGINT UNSIGNED NOT NULL,
    kind ENUM('photo') NOT NULL,
    mime VARCHAR(32) NOT NULL,
    size_bytes INT UNSIGNED NOT NULL,
    sha256 CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    created_by VARCHAR(64) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,
    PRIMARY KEY (project_id, id),
    KEY idx_vision_media_deleted (deleted_at),
    CONSTRAINT fk_vision_media_project FOREIGN KEY (project_id) REFERENCES vision_projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
