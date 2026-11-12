CREATE TABLE application_access_delegations (
    membership_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    decision_reference VARCHAR(190) NOT NULL,
    expires_at DATETIME NULL,
    CONSTRAINT fk_app_access_delegate_membership FOREIGN KEY (membership_id)
        REFERENCES memberships(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
