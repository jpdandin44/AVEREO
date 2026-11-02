---
project: avereo-connect
document_type: test-index
title: Contrôles CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-11-02
owner: jpdandin
tags: [connect, documentation, preproduction]
---

## Droits RGA

`php backend/tests/rga-registration.php` nécessite PDO SQLite et vérifie copie exacte, refus, indépendance après création et restauration ciblée. `backend/tests/integration.php` exerce également cette opération sur MariaDB en CI. `backend/tests/local-web.php` ouvre le catalogue et échange les tickets RGA par HTTP. Les données sont fictives ; ces tests ne modifient pas les comptes hébergés.


# Contrôles CONNECT

Les tests exécutables existants restent dans `backend/tests/` et
`integrations/drupal/avereo_identity_bridge/tests/`. La commande
`php backend/tests/run.php` vérifie le backend sur fixtures, sans base réelle.
La recette du sas Passeport Immo utilise le vrai émetteur depuis le
[sous-projet dédié](../../avereo-app-passeport-immo/docs/02-integration-connect.md).
