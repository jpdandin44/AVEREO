---
project: avereo-platform
document_type: reference
title: README
status: active
version: git
created: 2026-11-04
updated: 2026-11-08
owner: jpdandin
tags: [avereo, acces, documentation]
---


## Références actuelles

[Architecture](architecture.md) · [Exigences](requirements.md) · [Feuille de route](roadmap.md) · [Décisions](decisions.md) · [Historique](changelog.md).

Le lot des [accès temporaires](../avereo-app-connect/docs/acces-temporaires-applications.md) est un candidat local. PHP 8.3 et Node 22 sont utilisés en CI. Depuis la racine du monorepo, les tests `architecture-v1/avereo-platform/tests/temporary-access.php APPLICATION` et `temporary-access-http.py` qualifient la politique et les cookies. Générer d’abord le sas Passeport avec son script `workflows/prepare-connect-gate.mjs`. La présence du code ne prouve pas une installation hébergée.

﻿# avereo-platform

Socle partage du monorepo AVEREO.

Il porte les templates, la documentation commune, les scripts de generation et les fragments d'infrastructure. Il ne contient pas le code metier vivant des applications.

## Gateway HTTP local

Le gateway Traefik dans `infra/local-gateway/` reserve le port HTTP local et charge des routes declaratives sans acces au socket Docker. Il permet a plusieurs applications d'utiliser simultanement leurs sous-domaines `*.avereo.localhost` sans exposer leurs ports techniques dans les URLs.

Chaque application peut s'assurer que le gateway est actif, mais sa commande `down` ne doit pas l'arreter. L'arret explicite du gateway s'effectue avec son propre script.

## Menu commun Mon espace

La [règle des fonctionnalités communes](docs/fonctionnalites-communes.md) définit le composant et son intégration. [Qualification](docs/qualification-mon-espace.md), [préparation des sept cibles](docs/preparation-mon-espace.md) et [suivi canonique](data/suivi-fonctions-communes.json).

Le candidat PR #121 complète les rubriques propres aux applications ; les [adaptations et limites de stockage](docs/fonctionnalites-communes.md#adaptations-métier-du-candidat-pr-121) sont définies dans la règle commune. Son paquet de 40 fichiers est installé sur les sept cibles après fusion et accord du responsable. La [recette hébergée](docs/livraison-mon-espace.md) confirme la correction RGA livrée avec PR #122 ; seule la réserve sur l’ancien service de projets Coupe reste ouverte. La préparation #119 de 37 fichiers reste historique.

## Identité des livrables

Le [contrat d’organisation](docs/identite-livrables.md) décrit la présentation AVEREO
préparée localement avec les informations provisoires d’entreprise, ses contrôles
et la configuration administrative encore prévue. Les coordonnées et champs
futurs ont une [source JSON unique](data/report-organization.json).
[Suivi canonique](data/suivi-identite-livrables.json).

## Missions et rapports

Ouvrir **Mon espace → Missions** depuis un dossier de Rapport, Drone, Thermo ou Projet. La lettre et l’ordre Word utilisent les coordonnées du formulaire. Le candidat du 8 novembre retire la génération dans Coupe, RGA et Passeport Immo. [Périmètre et recette](docs/protocole-missions.md#applications-qui-génèrent-des-missions).

Pour préparer un ordre, choisir la prestation, vérifier l’adresse postale et le site d’intervention, puis ouvrir **Étapes de l’ordre de mission**. Le document reprend les tâches de l’offre et les options retenues. En préproduction, les huit ordres issus de Projet et Coupe ont été contrôlés dans Word. [Mode d’emploi](docs/protocole-missions.md#préparer-lordre-de-chaque-prestation) · [Résultats](docs/preparation-missions.md#ordres-détaillés-de-la-pr-127-en-préproduction).

[Tester les cases facultatives et comparer les ordres Word dans Projet et Coupe](docs/recette-options-ordres.md).
