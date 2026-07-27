-- AVEREO CONNECT — retour complet du schéma initial C7.
ALTER TABLE organizations DROP FOREIGN KEY fk_organizations_owner_membership;
DROP TABLE audit_events;
DROP TABLE invitations;
DROP TABLE entitlements;
DROP TABLE applications;
DROP TABLE memberships;
DROP TABLE organizations;
DROP TABLE users;
