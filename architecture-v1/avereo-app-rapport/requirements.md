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
- `Rapport Habitologue` remplace `Reception de travaux` parmi les types de
  dossier proposes pour une nouvelle creation.
- Tous les rapports utilisent le meme assistant : `Dossier`, `Site`,
  `Protocoles`, `Observations` et `Export`, avec des adaptations futures
  conditionnees par la categorie principale.
- Les brouillons historiques conservent leur categorie et leur sous-categorie.
- Un ancien dossier `Reception de travaux` reste lisible mais ce type n'est
  plus selectionnable pour un nouveau dossier.
- Un ancien brouillon du prototype Habitologie est converti vers le type
  `Rapport Habitologue` sans ouvrir un second moteur.

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

Le lot 1 remplace la tuile de type de dossier et ajoute sa normalisation. Les
champs et sources metier specifiques restent planifies dans
[`docs/habitologie-light-plan.md`](docs/habitologie-light-plan.md). La
sauvegarde et l'export existants sont deja reutilises.
