---
project: avereo-app-passeport-immo
document_type: workflow
title: Revue locale Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [avereo, documentation, local]
---

# Revue locale Passeport Immo

## Objectif et entrées
Examiner les livrables déclarés dans le JSON canonique avec AVEREO Projet existant.
Node.js et dépendances npm de Projet ; Python et générateur mutualisé requis.

## Sorties et étapes
1. Lire les livrables, leurs preuves et les questions ouvertes.
2. Générer les vues avec `python docs/actualiser-tableau-de-bord.py`, puis `--check`.
3. Le responsable lance `start-review.cmd` et ouvre Revues & approbations.
4. Il soumet/valide/autorise/démarre les phases par actions explicites.
5. Reprendre depuis JSON et tableau de bord ; contrôler le verrou avant écriture.

Le protocole fait foi dans [le contrat Projet](../../avereo-app-projet/api/revue-locale.md).
L'autorisation locale de cette session est décrite dans [le cadre](../decisions.md).
Les clés du poste sont dans `.local/review-settings.json` ; aucun secret requis.
