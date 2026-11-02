---
project: avereo-app-saisie-unique
document_type: agent-instructions
title: Instructions AVEREO Saisie unique
status: active
version: git
created: 2026-10-21
updated: 2026-10-21
owner: jpdandin
tags: [avereo, documentation, local]
---

# Instructions AVEREO Saisie unique

## Rôle
Application de saisie unique pour le partenaire : le propriétaire et son logement sont
renseignés une seule fois, les documents se pré-remplissent et suivent chaque
modification. Le nom du partenaire n'apparaît dans aucun fichier du dépôt. Le chantier est en cadrage ; aucun code applicatif n'existe avant
le démarrage de la phase 1 par le responsable dans AVEREO Projet.

## Règles
- Ne jamais commiter de secrets, de données personnelles ni de pièces des dossiers
  réels (captures, formulaires remplis), `.local/`, `node_modules/` ou `dist/`.
- Garder la V1 statique ; aucun backend ni MySQL avant un lot autorisé.
- Lire README, documentation et suivi avant toute reprise : `docs/suivi-chantier.json`
  porte l'avancement, `docs/00-cadrage.md` le cadrage.
- Documenter chaque écart ou limite dans `docs/source-audit.md`.
- Ne pas modifier les instructions ou les autres applications.
- Ne pas écrire de décision ou d'événement humain dans le suivi : seul le responsable
  les enregistre, par AVEREO Projet.
- Suivre la politique documentaire globale et les règles racine de développement/PR
  (`AGENTS.md` à la racine du dépôt, qui prime).
- Les exemples et les jeux d'essai sont fictifs.

## Workflow
Avant modification :
1. Inspecter le dossier du sous-projet.
2. Lire `docs/suivi-chantier.json` et le livrable de la phase en cours.
3. Travailler seulement sur la phase dont le statut est `in_progress` (phase 1 : seulement
   après un événement `start` du responsable).
4. Après chaque écriture du suivi, lancer `python docs/actualiser-tableau-de-bord.py`
   puis la même commande avec `--check`.
5. Résumer les changements et les points à vérifier.
