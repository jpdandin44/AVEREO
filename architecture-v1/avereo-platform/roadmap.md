---
project: avereo-platform
document_type: roadmap
title: Feuille de route
status: active
version: git
created: 2026-11-04
updated: 2026-11-08
owner: jpdandin
tags: [avereo, acces, documentation]
---

# Feuille de route

- Existant : entrée CONNECT et cookies signés.
- En cours : qualification locale des périodes pour toutes les applications sélectionnées.
- Prochaine étape : revue de la PR, puis installation coordonnée en préproduction après accord.
- Production : accord distinct et qualification hébergée requis.

[Suivi du lot](../avereo-app-connect/docs/acces-temporaires-applications.md).

## Ordres de mission détaillés

Les ordres détaillés des quatre offres sont disponibles en préproduction. Les tâches et coordonnées ont été vérifiées dans les huit fichiers issus des cadres Projet et Coupe. [Suivi de cette évolution](data/recette-missions/ordres-prestations.json).

La vérification des options dans Chrome est terminée pour les deux applications. La relecture métier de chaque ordre reste à faire avant de le remettre à un client. [Résultats des quatre offres](docs/recette-options-ordres.md#vérification-dans-chrome-du-8-novembre-2026).

Le retrait de la génération dans Coupe, RGA et Passeport Immo est en Développement local. La prochaine vérification de préproduction porte sur l’absence de Missions dans les trois outils et sur sa présence dans Rapport. [Candidat et paquet](data/recette-missions/outils-complementaires.json).

## Itération Mon espace

PR #119 fusionnée ; sa préparation de 37 fichiers est conservée comme historique. PR #121 fusionnée et déployée sur les sept cibles : 40 fichiers vérifiés, conservation des configurations et des plannings prouvée. La [recette hébergée](docs/livraison-mon-espace.md) lève la réserve RGA après livraison PR #122. L’accès aux projets en ligne de Coupe reste à cadrer séparément. Recherche nécessite sa première cible ; Saisie unique reste autonome. [Suivi unique](data/suivi-fonctions-communes.json). Revue, préproduction autorisée puis production constituent des étapes distinctes.

## Identité des livrables

Nom, logo et informations provisoires fournis par le responsable intégrés localement
dans quatre exports. Word expert/client, Word Thermo et PDF Passeport téléchargés
et rendus ; en-tête Drone inspecté sur fixture. Le parcours d’impression Drone reste
à terminer avant livraison. Les champs d’immatriculation vides sont prêts pour une
mise à jour future. La configuration par administrateur d’organisation constitue
la suite demandée, sans formulaire opérationnel à ce stade. [Suivi canonique](data/suivi-identite-livrables.json).

## Missions et dossier client

Le module et les quatre offres sont installés en préproduction après la fusion de #125. Dans Chrome, les quatre lettres et un ordre ont été récupérés depuis le cadre de chacune des deux applications, Projet et Coupe. La relecture métier des lettres précède toute remise à un client. Le service privé de clients partagés et les préférences de l’organisation restent à cadrer. [Suivi de livraison](data/suivi-missions.json).
