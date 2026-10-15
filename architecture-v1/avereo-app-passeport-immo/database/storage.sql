-- Dedicated Passeport Immo database, never run against CONNECT.
CREATE TABLE IF NOT EXISTS pi_workspaces (
 owner_id VARCHAR(64) PRIMARY KEY,
 revision BIGINT UNSIGNED NOT NULL DEFAULT 0,
 settings LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS pi_clients (
 id CHAR(32) PRIMARY KEY,
 owner_id VARCHAR(64) NOT NULL,
 name VARCHAR(200) NOT NULL,
 created_at VARCHAR(32) NOT NULL,
 INDEX(owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS pi_biens (
 owner_id VARCHAR(64) NOT NULL,
 bien_id VARCHAR(64) NOT NULL,
 model LONGTEXT NOT NULL,
 client_id CHAR(32) NULL,
 deleted_at VARCHAR(32) NULL,
 PRIMARY KEY(owner_id, bien_id),
 FOREIGN KEY(client_id) REFERENCES pi_clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS pi_documents (
 id CHAR(32) PRIMARY KEY,
 owner_id VARCHAR(64) NOT NULL,
 bien_id VARCHAR(64) NOT NULL,
 client_id CHAR(32) NOT NULL,
 name VARCHAR(255) NOT NULL,
 title VARCHAR(255) NOT NULL,
 category VARCHAR(32) NOT NULL,
 mime VARCHAR(128) NOT NULL,
 size BIGINT UNSIGNED NOT NULL,
 sha256 CHAR(64) NOT NULL,
 added_at VARCHAR(32) NOT NULL,
 updated_at VARCHAR(32) NOT NULL,
 archived_at VARCHAR(32) NULL,
 UNIQUE(owner_id, bien_id, sha256),
 FOREIGN KEY(owner_id, bien_id) REFERENCES pi_biens(owner_id, bien_id),
 FOREIGN KEY(client_id) REFERENCES pi_clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
