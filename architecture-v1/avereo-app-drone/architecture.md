---
project: avereo-app-drone
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

Application du monorepo AVEREO : React/TypeScript dans `frontend/src/App.tsx`, Vite et Tailwind. Les écrans accueil, édition et impression existent. Les missions sont conservées dans le navigateur.

Stockage actuel : localStorage. L’entrée PHP et le sas CONNECT protègent le frontend hébergé ; le menu de compte utilise le portail configuré. Les répertoires backend/database historiques ne constituent pas un service métier actif.

[Audit source](docs/source-audit.md) · [Composant commun](../avereo-platform/docs/fonctionnalites-communes.md).

## Conservation des missions

`frontend/src/mission-storage.js` lit `avereo_missions` sans écriture au chargement. Les actions de sauvegarde, retour à Mes projets et suppression native mettent à jour l’affichage après écriture réussie. Une liste illisible est conservée. Les préférences utilisent une clé distincte selon le contrat commun.
