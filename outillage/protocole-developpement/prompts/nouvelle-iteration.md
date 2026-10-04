---
project: protocole-developpement
document_type: prompt
title: Démarrer une itération avec GitHub et le cockpit
status: active
version: git
created: 2026-10-03
updated: 2026-10-04
owner: jpdandin
tags: [developpement, github, cockpit]
---

# Nouvelle itération

## Objectif

Conduire le périmètre demandé avec le protocole commun.

## Entrées

Projet, objectif, dépôt GitHub, cockpit, budget et cibles connus. Conserver les inconnues comme telles.

## Instructions

Appel court : `DEV : [objectif du lot dans ce projet]` ou `$dev [objectif du lot dans ce projet]`. Le nom `$developpement-github-cockpit` reste utilisable.

Inspecte les règles et sources existantes. Présente exactement quatre phases : Cadrage, Développement local, Préproduction et Mise en production. Regroupe les tâches détaillées et conserve le mapping, les décisions et les brouillons d’un ancien suivi. Développe et ajuste localement, prépare la PR et ses preuves, puis réalise seulement les passages distants autorisés. Mets le cockpit à jour avant et après les actions. Préserve les décisions historiques.

## Contraintes et sources

Instructions humaines, AGENTS.md applicables, code, suivi canonique, preuves GitHub et reçus réellement observés. Ne pas déduire une autorisation de production d'un merge ou d'un test.

## Sortie et tests

Résultat, PR/version, contrôles réalisés, limites, documents et prochaine action. Vérifier les passages à l'aide du contrôleur du skill.

## Historique

Git conserve les évolutions.
