---
project: avereo-app-thermo
document_type: reference
title: README
status: active
version: git
created: 2026-11-06
updated: 2026-11-06
owner: jpdandin
tags: [avereo, interface, fonctions-communes]
---

# Thermo AVEREO Pro

- Depot : avereo-app-thermo
- Slug : thermo
- Sous-domaine : thermo.avereo.fr
- API eventuelle V2 : api-thermo.avereo.fr
- Type : React SPA
- Source attendue : Thermo_AVEREO_Pro.txt

## Architecture

Cette application appartient au monorepo AVEREO. Il contient un frontend Vite, des dossiers backend/ et database/ documentaires, la documentation de deploiement et les workflows GitHub Actions.

## Commandes locales

cd frontend
npm install
npm run dev
npm run build

## Deploiement O2Switch

Le workflow .github/workflows/deploy-o2switch.yml construit frontend/dist/ puis publie uniquement son contenu vers le dossier public du sous-domaine.

Secrets GitHub requis :

- O2SWITCH_SSH_KEY
- O2SWITCH_USER
- O2SWITCH_HOST
- O2SWITCH_PORT
- O2SWITCH_TARGET_PATH

## Statuts V1

- Backend : desactive en V1.
- MySQL : desactive en V1.
- APIs : reportees en V2 uniquement si un besoin metier reel le justifie.

## Mon espace — candidat commun du 6 novembre 2026

Le menu est dans l’en-tête du parcours de rapport et au pied de la barre latérale du référentiel. Le bouton de déconnexion flottant est retiré ; le brouillon conserve son stockage existant.

[Règle commune](../avereo-platform/docs/fonctionnalites-communes.md) · [Qualification et suivi](../avereo-platform/docs/qualification-mon-espace.md). Ce candidat local ne prouve pas une installation hébergée.

[Architecture](architecture.md) · [Exigences](requirements.md) · [Feuille de route](roadmap.md) · [Décisions](decisions.md) · [Historique](changelog.md).

## Espaces applicatifs — candidat PR #121

Mes projets conserve plusieurs rapports dans IndexedDB, en plus du brouillon historique. La sauvegarde et le retour à la liste préservent les données complètes ; un échec garde le rapport ouvert. Les préférences règlent le tri et le nom des étapes. Ces données sont locales au navigateur, sans synchronisation en ligne.

[Règle et portée](../avereo-platform/docs/fonctionnalites-communes.md) · [Qualification](../avereo-platform/docs/qualification-mon-espace.md).
