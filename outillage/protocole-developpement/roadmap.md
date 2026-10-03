---
project: protocole-developpement
document_type: roadmap
title: Avancement du protocole commun
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [developpement, github, cockpit]
---

# Roadmap

## Réalisé dans ce lot

Protocole commun, skill utilisateur installé, fiche d'itération, contrôleur de passage et raccordement au moteur de revue local réalisés. Socle documentaire créé. Les douze tests du contrôleur, la validation du skill et la compatibilité du cockpit sont vérifiés ; preuves dans `data/verification.json`.

## En cours

Revue humaine du lot local. Les validations de préproduction et de production restent non commencées.

## Suite

Le responsable a choisi AVEREO pour la source commune. Préparer sa PR et examiner le
lot local ; confirmer le cockpit cible. Adopter le protocole dans chaque dépôt au fil des
tâches autorisées : mapper le suivi existant, vérifier les environnements GitHub et
hébergeur, puis qualifier les commandes de préproduction et production. Aucun déploiement
massif ni migration des décisions historiques n'est engagé.
