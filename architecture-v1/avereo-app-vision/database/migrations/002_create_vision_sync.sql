-- AVEREO Vision — migration 002 : contenu des projets et synchronisation (Lot 2B).
-- Nouvelles tables seulement : aucune table livrée (vision_projects) n'est modifiée. Voir docs/synchronisation.md.
-- Les dates sont en UTC. Un objet = bâtiment, niveau, pièce ou ouverture ; les murs sont déduits du contour des pièces.

CREATE TABLE IF NOT EXISTS vision_project_counters (
    project_id BIGINT UNSIGNED NOT NULL,
    last_seq BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (project_id),
    CONSTRAINT fk_vision_counters_project FOREIGN KEY (project_id) REFERENCES vision_projects (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vision_objects (
    project_id BIGINT UNSIGNED NOT NULL,
    object_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    kind ENUM('batiment', 'niveau', 'piece', 'ouverture') NOT NULL,
    parent_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
    data JSON NOT NULL,
    rev INT UNSIGNED NOT NULL DEFAULT 1,
    seq BIGINT UNSIGNED NOT NULL,
    deleted TINYINT(1) NOT NULL DEFAULT 0,
    device_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    updated_by VARCHAR(64) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (project_id, object_id),
    KEY idx_vision_objects_seq (project_id, seq),
    CONSTRAINT fk_vision_objects_project FOREIGN KEY (project_id) REFERENCES vision_projects (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vision_sync_log (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    project_id BIGINT UNSIGNED NOT NULL,
    seq BIGINT UNSIGNED NOT NULL,
    object_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    kind ENUM('batiment', 'niveau', 'piece', 'ouverture') NOT NULL,
    lost_rev INT UNSIGNED NOT NULL,
    lost_data JSON NOT NULL,
    lost_deleted TINYINT(1) NOT NULL DEFAULT 0,
    lost_device_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    lost_by VARCHAR(64) NOT NULL,
    won_rev INT UNSIGNED NOT NULL,
    won_device_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    won_by VARCHAR(64) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_vision_sync_log_project (project_id, id),
    CONSTRAINT fk_vision_sync_log_project FOREIGN KEY (project_id) REFERENCES vision_projects (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
