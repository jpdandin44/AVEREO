# Database - AVEREO CONNECT

Schéma MariaDB/MySQL versionné pour la gate C7.

## Convention

- chaque migration possède un fichier `.up.sql` et un fichier `.down.sql` ;
- `backend/bin/migrate.php` applique les migrations sous verrou consultatif ;
- les dates sont stockées en UTC avec une précision à la microseconde ;
- les identités Drupal sont référencées, jamais dupliquées avec un mot de passe ;
- les suppressions fonctionnelles utilisent des statuts ; les événements d'audit sont immuables.

## Données

Le schéma couvre utilisateurs, organisations, adhésions, applications, habilitations, invitations et événements d'audit. Aucun jeu de données de production n'est versionné. Le dossier `seeds/` reste vide hors documentation.

Les migrations doivent d'abord être testées sur la base éphémère définie dans `compose.c7.yaml`. Toute base hébergée demeure hors périmètre sans autorisation distincte.
