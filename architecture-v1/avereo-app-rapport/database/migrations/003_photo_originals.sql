-- Métadonnées des photos originales privées. Migration ADDITIVE : aucune colonne de
-- rapport_reports n'est modifiée et aucune clé étrangère ne lie cette table au rapport,
-- afin de ne pas empêcher la suppression existante d'un rapport ni d'effacer des fichiers
-- en cascade. Après suppression du rapport, les lignes restent comptées dans le quota du
-- propriétaire jusqu'à la future procédure d'effacement (à décider). Les octets des
-- originaux vivent dans le répertoire privé configuré, jamais dans cette table.
CREATE TABLE IF NOT EXISTS rapport_photo_originals (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    report_public_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    owner_provider VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    owner_id VARCHAR(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    sha256 CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    bytes BIGINT UNSIGNED NOT NULL,
    mime VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    width INT UNSIGNED NOT NULL,
    height INT UNSIGNED NOT NULL,
    original_name VARCHAR(190) NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_photo_originals_public_id (public_id),
    UNIQUE KEY uq_photo_originals_report_sha (report_public_id, sha256),
    KEY idx_photo_originals_owner (owner_provider, owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
