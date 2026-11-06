---
project: avereo-app-saisie-unique
document_type: architecture
title: Architecture de Saisie unique
status: active
version: git
created: 2026-11-06
updated: 2026-11-06
owner: jpdandin
tags: [avereo, saisie-unique, documentation]
---

# Architecture de Saisie unique

Le frontal React consomme les configurations de `frontend/src/config`, les fonctions métier de `src/lib` et les écrans de `src/ui`. Le store utilise le stockage local du navigateur. esbuild assemble scripts et styles dans un HTML autonome ; aucun service réseau n’est raccordé.

Le composant Mon espace est importé de `../avereo-platform/shared/account-menu.js` et ses actions appellent la navigation existante. Il ne crée ni compte ni synchronisation. [Implémentation métier détaillée](docs/01-developpement-local.md).
