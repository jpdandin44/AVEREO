---
project: avereo-platform
document_type: architecture
title: Architecture du socle AVEREO
status: active
version: git
created: 2026-11-04
updated: 2026-11-06
owner: jpdandin
tags: [avereo, acces, documentation]
---

# Architecture du socle AVEREO

Le dossier appartient au monorepo AVEREO. Il porte des modèles, l’infrastructure locale et le sas PHP partagé. `.github/scripts/prepare-connect-gate.mjs` copie `shared/connect-gate.php` dans Projet, Thermo, Drone et Recherche ; Passeport Immo dispose de son propre script de copie.

CONNECT émet un ticket signé. Le sas valide signature, application, durée et nonce ; il émet un cookie conservant l’identité CONNECT. Avec `connect_trial_access_file`, il relit la projection privée avant ouverture et à chaque requête protégée. Il ne crée ni compte ni base. La configuration et le stockage anti-rejeu sont privés.

Le [document initial](docs/architecture.md) conserve le cadrage historique des dépôts séparés ; il ne décrit pas l’organisation actuelle du monorepo. Les [sources partagées](shared/README.md) et le [contrat du lot](../avereo-app-connect/docs/acces-temporaires-applications.md) décrivent le périmètre observé.

## 6 novembre 2026 — Présentation commune

Le Web Component `shared/account-menu.js` porte la présentation isolée et les interactions de Mon espace. Les applications lui fournissent leurs actions natives ; le portail vient de la page protégée. La génération copie la même source dans les livrables HTML/React. [Contrat complet](docs/fonctionnalites-communes.md).
