---
project: avereo-platform
document_type: reference
title: README
status: active
version: git
created: 2026-11-04
updated: 2026-11-04
owner: jpdandin
tags: [avereo, acces, documentation]
---


## Références actuelles

[Architecture](architecture.md) · [Exigences](requirements.md) · [Feuille de route](roadmap.md) · [Décisions](decisions.md) · [Historique](changelog.md).

Le lot des [accès temporaires](../avereo-app-connect/docs/acces-temporaires-applications.md) est un candidat local. PHP 8.3 et Node 22 sont utilisés en CI. Depuis la racine du monorepo, les tests `architecture-v1/avereo-platform/tests/temporary-access.php APPLICATION` et `temporary-access-http.py` qualifient la politique et les cookies. Générer d’abord le sas Passeport avec son script `workflows/prepare-connect-gate.mjs`. La présence du code ne prouve pas une installation hébergée.

﻿# avereo-platform

Socle partage du monorepo AVEREO.

Il porte les templates, la documentation commune, les scripts de generation et les fragments d'infrastructure. Il ne contient pas le code metier vivant des applications.

## Gateway HTTP local

Le gateway Traefik dans `infra/local-gateway/` reserve le port HTTP local et charge des routes declaratives sans acces au socket Docker. Il permet a plusieurs applications d'utiliser simultanement leurs sous-domaines `*.avereo.localhost` sans exposer leurs ports techniques dans les URLs.

Chaque application peut s'assurer que le gateway est actif, mais sa commande `down` ne doit pas l'arreter. L'arret explicite du gateway s'effectue avec son propre script.
