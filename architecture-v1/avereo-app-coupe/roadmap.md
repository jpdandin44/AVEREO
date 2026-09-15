---
project: avereo-app-coupe
document_type: roadmap
title: Avancement de l'intégration Coupe locale
status: active
version: git
created: 2026-09-09
updated: 2026-09-09
owner: jpdandin
tags: [coupe, roadmap, local]
---

# Avancement

## Existant

- Interface métier historique intégrée à Vite/React.
- Contrôle d'accès par tickets CONNECT et identité signée côté PHP.
- Rapport réel intégré au CONNECT local dans la PR #53 fusionnée.

## Lot actuel

Intégration Docker de Coupe réelle à côté de Rapport : lanceur, adaptation HTTP
locale, retour de déconnexion hors iframe, tests et documentation. Les résultats
techniques sont consignés dans [la procédure locale](docs/local-development.md).
La validation humaine de l'interface et le merge restent distincts des tests.

## Suite

1. Recette humaine du parcours et des fonctions métier utilisées dans Coupe.
2. Validation de la PR avec la checklist existante, puis merge humain.
3. Appliquer le GO / NO-GO décrit dans
   [la procédure de production](docs/deployment.md), notamment la décision sur
   le stockage en ligne actuellement non configuré.
4. Après merge, déclencher manuellement le seul workflow Coupe depuis `main`,
   puis exécuter la recette et consigner l'artefact de sauvegarde. Aucun
   déploiement automatique n'est prévu par ce lot.

Le stockage Coupe local en base et l'intégration réelle des autres applications
ne sont pas engagés. Les alertes de dépendances de développement détectées
doivent faire l'objet d'un correctif ciblé distinct.
