---
project: avereo-app-projet
document_type: api-index
title: API et frontières de Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-19
owner: jpdandin
tags:
  - projet
  - api
---

# API et frontières de Projet

Aucune API métier ni connexion MySQL de planning n'est active en V1.
Imports, calculs, brouillons et exports relèvent du navigateur.

Les fichiers PHP `index.php`, `connect/entry.php` et `connect/logout.php`
concernent le sas CONNECT hébergé, pas une sauvegarde de planning.

Les routes `/local-planning/` servent les fichiers du pilote uniquement via
le middleware Vite de développement. Elles ne constituent pas un nouveau
service métier de production. Voir [l'architecture](../architecture.md).
