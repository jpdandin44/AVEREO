-- Le catalogue CONNECT est la source d'autorite des applications publiees.
ALTER TABLE applications
  ADD COLUMN description VARCHAR(500) NOT NULL DEFAULT '' AFTER name,
  ADD COLUMN display_order SMALLINT UNSIGNED NOT NULL DEFAULT 100 AFTER required_scope,
  ADD KEY idx_applications_catalog (status, display_order, name);

