---
project: avereo-platform
document_type: changelog
title: Historique des changements
status: active
version: git
created: 2026-11-04
updated: 2026-11-06
owner: jpdandin
tags: [avereo, acces, documentation]
---

## 2026-11-06 — Livraison autorisée et recette hébergée

PR #121 installée sur les sept cibles ; conservation et protections vérifiées. Rubriques et préférences contrôlées, réserve RGA avec correctif local testé et réserve antérieure Coupe OAuth consignées dans le [reçu de livraison](docs/livraison-mon-espace.md). Aucun changement de production.


# Historique des changements

## 4 novembre 2026

Candidat local : contrôle de la période et des droits par la politique privée CONNECT, y compris pour une session déjà créée. Socle documentaire complété depuis les sources existantes ; aucune livraison hébergée par ce lot. [Qualification](../avereo-app-connect/docs/acces-temporaires-applications.md).

## 6 novembre 2026 — Mon espace

Candidat local du menu commun, adaptations applicatives, règle transverse et contrôles de parité/accessibilité. Les données et habilitations restent hors périmètre. [Qualification](docs/qualification-mon-espace.md).

Préparation après fusion : neuf compilations actualisées, sept cibles déclarées,
paquet réduit de 37 fichiers et retour arrière vérifié sur copies privées. Les
écarts antérieurs au menu restent hors du lot ; Coupe conserve sa connexion
historique. [Dossier de livraison](docs/preparation-mon-espace.md). Aucun fichier
applicatif actif remplacé.

## 2026-11-06 — Extension des espaces applicatifs dans PR #121

Menus métier « Mes projets » et « Préférences », profil/catalogue CONNECT communs, listes locales Thermo/RGA, préférences séparées et erreurs de stockage explicites. CONNECT conserve son rôle de portail. Contrat, contrôles et préparation révisés dans le [suivi canonique](data/suivi-fonctions-communes.json). Aucun déploiement induit par ces changements.

Nouveau paquet de 40 fichiers comparé aux sept cibles et restauré sur copies privées ;
sept configurations et treize fichiers de planning Projet préservés. Quatre contrôles
techniques GitHub réussis, validation humaine encore attendue. La préparation #119
reste attachée à son ancien candidat de 37 fichiers.
