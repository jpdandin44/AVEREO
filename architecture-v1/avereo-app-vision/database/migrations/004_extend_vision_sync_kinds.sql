-- Accord du responsable du 26/11/2026 : « Oui, étendre ».
-- Append only : les valeurs existantes gardent leur ordinal. Réexécutable à l'identique.
ALTER TABLE vision_objects MODIFY COLUMN kind ENUM('batiment', 'niveau', 'piece', 'ouverture', 'photo', 'commentaire') NOT NULL;
ALTER TABLE vision_sync_log MODIFY COLUMN kind ENUM('batiment', 'niveau', 'piece', 'ouverture', 'photo', 'commentaire') NOT NULL;
