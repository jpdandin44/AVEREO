-- AVEREO Vision — migration 001 : projets de relevé (un projet = un logement).
-- Les dates sont en UTC. L'identifiant public (32 caractères hexadécimaux) est le seul identifiant montré au navigateur.
-- Le contenu d'un projet (bâtiments, niveaux, pièces, ouvertures) vient avec les migrations du Lot 2B.

CREATE TABLE IF NOT EXISTS vision_projects (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(32) NOT NULL,
    name VARCHAR(160) NOT NULL,
    address VARCHAR(500) NOT NULL DEFAULT '',
    client_label VARCHAR(200) NOT NULL DEFAULT '',
    status ENUM('active', 'archived') NOT NULL DEFAULT 'active',
    owner_provider VARCHAR(40) NOT NULL,
    owner_id VARCHAR(64) NOT NULL,
    owner_email VARCHAR(190) NULL,
    created_by_id VARCHAR(64) NOT NULL,
    updated_by_id VARCHAR(64) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    archived_at DATETIME(3) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vision_projects_public_id (public_id),
    KEY idx_vision_projects_owner (owner_provider, owner_id, status, updated_at),
    KEY idx_vision_projects_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
