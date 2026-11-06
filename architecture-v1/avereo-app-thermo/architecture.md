---
project: avereo-app-thermo
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

Application du monorepo AVEREO : React dans `frontend/src/App.jsx`, Vite et Tailwind. Le parcours de saisie, le référentiel et les restitutions existent. Les autorisations caméra/micro restent demandées au navigateur.

Stockage actuel : IndexedDB avec repli localStorage. L’entrée PHP et le sas CONNECT protègent le frontend hébergé ; le menu de compte utilise le portail configuré. Les répertoires backend/database historiques ne constituent pas un service métier actif.

[Audit source](docs/source-audit.md) · [Composant commun](../avereo-platform/docs/fonctionnalites-communes.md).

## Catalogue local de rapports

`frontend/src/thermo-projects.js` conserve les rapports complets dans IndexedDB,
clé `avereo.thermo.projects.v1` : identifiant stable, date de mise à jour et données.
La clé historique `draftReport` et son mécanisme existant sont conservés. Aucune
écriture au simple chargement : le brouillon reçoit un identifiant en mémoire,
puis entre dans le catalogue à la prochaine sauvegarde. Les écritures de rapport
et brouillon sont sérialisées pour qu’une sauvegarde ancienne ne remplace pas la
suivante. Avant un changement de rapport, la sauvegarde doit réussir ; un catalogue
illisible est conservé sans remplacement. Aucun service métier en ligne ajouté.
Les préférences utilisent une clé localStorage distincte, selon le contrat commun.
