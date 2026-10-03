---
project: avereo-app-passeport-immo
document_type: agent-instructions
title: Instructions Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [avereo, documentation, local]
---

# Instructions Passeport Immo

## Rôle
Application statique issue du frontend historique CONNECT ; préserver son comportement.

## Règles
- Ne pas commiter secrets, données personnelles, `.local/`, `node_modules/` ou `dist/`.
- Garder la V1 statique ; aucun backend ni MySQL avant un lot autorisé.
- Lire README, documentation et suivi avant toute reprise.
- Documenter chaque écart dans `docs/source-audit.md` et la matrice de parité.
- Ne pas modifier les instructions ou les autres applications.
- Ne pas écrire de décision ou d'événement humain dans le suivi.
- Suivre la politique documentaire globale et les règles racine de développement/PR.
