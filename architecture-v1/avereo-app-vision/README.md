---
project: avereo-app-vision
document_type: readme
title: AVEREO Vision
status: active
version: git
created: 2026-11-26
updated: 2026-11-26
owner: jpdandin
tags: [vision, terrain]
---

# AVEREO Vision

Application de relevé de logements : saisie manuelle, plan 2D, métrés et interface terrain. Les fonctions futures et leurs réserves sont dans le [plan des lots](docs/plan-lots.md). T-11 ajoute localement les cotes laser, photos et commentaires ; les essais physiques restent à réaliser.

## Installation et utilisation

Prérequis : Node 20.19+ ou 22.12+, npm ; pour la pile API locale, Docker Desktop et PowerShell. Depuis `frontend/` : `npm ci` (installation), `npm run dev` (Vite), `npm test`, `npm run build -- --configLoader runner` (construction adaptée à ce poste). Ne pas réinstaller pour une simple reprise si les dépendances sont déjà présentes.

Configuration privée, API PHP et MySQL : [développement local](docs/local-development.md), [authentification](docs/authentication.md). Les valeurs secrètes restent hors du dossier public. La [recette locale](docs/revue-locale.md) décrit le lancement avec des comptes fictifs ; aucun serveur ni déploiement n'est lancé par T-11.

## Sources documentaires et structure

Les fichiers existants ci-dessous remplissent les rôles du socle documentaire, sans seconde copie de leur contenu :

- Architecture : [docs/architecture.md](docs/architecture.md).
- Requirements : [docs/exigences.md](docs/exigences.md).
- Roadmap : [docs/plan-lots.md](docs/plan-lots.md).
- Décisions : [docs/adr/](docs/adr/) et décisions humaines dans [data/suivi-vision.json](data/suivi-vision.json).
- Évolutions : [changelog.md](changelog.md).
- Suivi canonique du cockpit : [data/suivi-vision.json](data/suivi-vision.json).
- Briefs Codex : [docs/codex/briefs/](docs/codex/briefs/).
- Procédures : [déploiement](docs/deploiement-mutualise.md), [recette locale](docs/revue-locale.md) ; contrats : [synchronisation](docs/synchronisation.md), [authentification](docs/authentication.md).

`frontend/src/domain/` conserve la logique pure ; `features/` les écrans ; `sync/` l'enregistrement et les fichiers locaux. `frontend/public/api/` contient le serveur PHP ; `database/migrations/` les migrations. Tests Node dans `frontend/tests/`, PHP et déploiement dans `tests/`. Documents humains dans `docs/`, suivi structuré dans `data/`.

## Vérification T-11

[Rapport local et limites](docs/terrain-interface-verification.md). Le brief n'autorise ni accès serveur, ni livraison, ni modification d'autres applications.
