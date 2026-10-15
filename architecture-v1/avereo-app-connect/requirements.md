---
project: avereo-connect
document_type: requirements
title: Exigences CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-10-14
owner: jpdandin
tags: [connect, documentation, preproduction]
---

# Exigences CONNECT

- Conserver identité Drupal/OAuth/PKCE, sessions, CSRF, rôles et refus par défaut.
- Lancement réservé aux comptes approuvés et aux droits applicatifs courants.
- Paramètres privés et dumps hors document root, Git et conversation.
- Migrations hébergées et déploiements distincts des PR de préparation.
- Reconnaître les clés URL/SECRET de Passeport Immo sans accorder de droit implicite.

Le [contrat OpenAPI](backend/api/openapi.yaml) et la
[qualification C7](docs/production-readiness-c7.md) portent les détails existants.
TBD : version et recette de la préproduction active dans ce lot.
