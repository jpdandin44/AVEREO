---
project: avereo-app-recherche
document_type: architecture
title: Architecture
status: active
version: git
created: 2026-11-06
updated: 2026-11-06
owner: jpdandin
tags: [avereo, interface, fonctions-communes]
---

# Architecture

Application du monorepo AVEREO : React, Vite, Zustand et MiniSearch. La recherche, l’import, le panier de citations, la validation et la sauvegarde/restauration existent. Aucun corpus privé n’est livré avec le frontend.

Stockage actuel : IndexedDB. L’entrée PHP et le sas CONNECT protègent le frontend hébergé ; le menu de compte utilise le portail configuré. Les répertoires backend/database historiques ne constituent pas un service métier actif.

[Audit source](docs/source-audit.md) · [Composant commun](../avereo-platform/docs/fonctionnalites-communes.md).
