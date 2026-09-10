---
project: avereo-app-rapport
document_type: database-reference
title: Base MySQL Rapport
status: active
version: git
created: 2026-07-08
updated: 2026-09-09
owner: jpdandin
tags:
  - rapport
  - mysql
  - production
---

# Base MySQL Rapport

La base est strictement dediee a Rapport.

- Production : `CPANEL_USERNAME_rapport`.
- Utilisateur de production : `CPANEL_USERNAME_rptprod`.
- Local : valeurs generees dans `local/.env`.
- Moteur : InnoDB.
- Encodage : `utf8mb4`, collation `utf8mb4_unicode_ci` conforme au modele Coupe.

`migrations/001_create_rapport_reports.sql` cree la table de payloads JSON, les colonnes de propriete et les index de recherche/tri. Le script est reexecutable grace a `CREATE TABLE IF NOT EXISTS`.

Les photos et signatures incluses dans le JSON peuvent rendre les payloads volumineux. La limite API par defaut est de 50 Mio et doit etre ajustee avec les limites PHP/cPanel de facon coherente.

Ne jamais partager cette base ou son utilisateur avec une autre application AVEREO.

## Etat de production verifie le 2026-09-09

- La base dediee `CPANEL_USERNAME_rapport` existe.
- L'utilisateur `CPANEL_USERNAME_rptprod` est rattache uniquement a cette base.
- La migration `001_create_rapport_reports.sql` est appliquee avec toutes les colonnes et tous les index attendus.
- La table `rapport_reports` est vide au terme de l'initialisation.
- La configuration privee est stockee hors document root et son fichier est en mode `0600`.
- Le healthcheck public retourne HTTP 200 avec `databaseConfigured=true`, `authConfigured=true` et `authMode=connect_gateway`.

Aucun mot de passe, secret de lancement ou autre valeur sensible ne doit etre ajoute a ce document.
