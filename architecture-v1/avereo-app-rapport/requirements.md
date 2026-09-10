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
- L'accueil permet de choisir explicitement le parcours technique ou le
  Rapport d'habitologie.
- Le parcours Habitologie suit au maximum six etapes : client, bien immobilier,
  risques, analyse, aides et synthese.
- Les brouillons historiques sans type explicite restent des rapports
  techniques.
- Un brouillon Habitologie doit etre repris dans le parcours Habitologie.

## Exigences techniques et securite

- Chaque nouveau rapport porte `report_type` et `schema_version`.
- Les secrets et donnees d'authentification restent hors du navigateur et du
  depot.
- En environnement heberge, AVEREO CONNECT reste le point d'acces unique.
- Les sources externes futures doivent afficher leur origine et leur date, et
  disposer d'une saisie manuelle de secours lorsque le parcours l'exige.
- Les evolutions sont developpees par tranches testables selon le cycle TDD.

## Limites du lot 1

Le lot 1 ne fournit ni champs metier Habitologie, ni appel externe, ni
sauvegarde serveur, ni export Habitologie. Ces fonctions restent planifiees
dans [`docs/habitologie-light-plan.md`](docs/habitologie-light-plan.md).
