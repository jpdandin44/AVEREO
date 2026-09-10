---
project: avereo-app-rapport
document_type: requirements
title: Exigences de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-09-10
owner: jpdandin
tags:
  - rapport
  - exigences
  - habitologie
---

# Exigences de Rapport AVEREO

## Exigences fonctionnelles durables

- Le moteur de rapport technique, ses brouillons, photos, dictee, signature et
  exports restent disponibles sans regression volontaire.
- Le Rapport d'habitologie est une sous-categorie choisie dans l'etape
  `Dossier`, et non un second parcours applicatif.
- Tous les rapports utilisent le meme assistant : `Dossier`, `Site`,
  `Protocoles`, `Observations` et `Export`.
- Les brouillons historiques conservent leur categorie et leur sous-categorie.
- Un ancien brouillon du prototype Habitologie separe est converti vers la
  sous-categorie sans ouvrir un second moteur.

## Exigences techniques et securite

- La classification repose sur les champs existants `categorie` et
  `sous_categorie`.
- Les secrets et donnees d'authentification restent hors du navigateur et du
  depot.
- En environnement heberge, AVEREO CONNECT reste le point d'acces unique.
- Les sources externes futures doivent afficher leur origine et leur date, et
  disposer d'une saisie manuelle de secours lorsque le parcours l'exige.
- Les evolutions sont developpees par tranches testables selon le cycle TDD.

## Limites du lot 1

Le lot 1 ajoute la sous-categorie et sa normalisation. Les champs et sources
metier specifiques restent planifies dans
[`docs/habitologie-light-plan.md`](docs/habitologie-light-plan.md). La
sauvegarde et l'export existants sont deja reutilises.
