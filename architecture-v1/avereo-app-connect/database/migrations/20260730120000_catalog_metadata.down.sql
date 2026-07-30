ALTER TABLE applications
  DROP KEY idx_applications_catalog,
  DROP COLUMN display_order,
  DROP COLUMN description;

