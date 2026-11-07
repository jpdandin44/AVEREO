---
project: avereo-platform
document_type: architecture
title: Architecture du socle AVEREO
status: active
version: git
created: 2026-11-04
updated: 2026-11-07
owner: jpdandin
tags: [avereo, acces, documentation]
---

# Architecture du socle AVEREO

Le dossier appartient au monorepo AVEREO. Il porte des modèles, l’infrastructure locale et le sas PHP partagé. `.github/scripts/prepare-connect-gate.mjs` copie `shared/connect-gate.php` dans Projet, Thermo, Drone et Recherche ; Passeport Immo dispose de son propre script de copie.

CONNECT émet un ticket signé. Le sas valide signature, application, durée et nonce ; il émet un cookie conservant l’identité CONNECT. Avec `connect_trial_access_file`, il relit la projection privée avant ouverture et à chaque requête protégée. Il ne crée ni compte ni base. La configuration et le stockage anti-rejeu sont privés.

Le [document initial](docs/architecture.md) conserve le cadrage historique des dépôts séparés ; il ne décrit pas l’organisation actuelle du monorepo. Les [sources partagées](shared/README.md) et le [contrat du lot](../avereo-app-connect/docs/acces-temporaires-applications.md) décrivent le périmètre observé.

## 6 novembre 2026 — Présentation commune

Le Web Component `shared/account-menu.js` porte la présentation isolée et les interactions de Mon espace. Les applications lui fournissent leurs actions natives ; le portail vient de la page protégée. La génération copie la même source dans les livrables HTML/React. [Contrat complet](docs/fonctionnalites-communes.md).

## Préférences applicatives

Le composant commun rend un formulaire défini par chaque application, valide les valeurs lues et les conserve dans une clé localStorage distincte. Les adaptateurs appliquent uniquement leurs réglages. Les listes et leurs données restent dans les applications : aucune API transversale de projets n’est créée. [Matrice et contrat de stockage](docs/fonctionnalites-communes.md).

## Identité AVEREO des restitutions — candidat local

`data/report-organization.json` porte le nom, les informations provisoires
d’entreprise fournies par le responsable et les champs d’immatriculation vides.
`shared/report-identity.js` y associe le PNG déjà utilisé dans Rapport et formate
uniquement les valeurs non vides. Rapport, Thermo, Drone et Passeport l’importent
au build ; leurs restitutions échappent le texte (HTML/React/Word).
Il s’agit d’une identité fixe sans API ni stockage de réglages. Le futur service
d’identité par organisation doit s’appuyer sur les organisations et habilitations
CONNECT existantes ; il n’est pas fourni par ce candidat. [Contrat](docs/identite-livrables.md).

## Génération de mission dans l’application

Le menu charge le module à la demande. L’application fournit les champs de son dossier et, lorsqu’elle le permet, une action de reprise dans son formulaire métier. Le navigateur produit les Word à partir du profil commun. La sauvegarde des dossiers reste assurée par chaque application. [Protocole des missions](docs/protocole-missions.md).

La compilation intègre les consignes et les options autorisées du [catalogue](data/modeles-lettres-mission.json) dans le module Missions. Le formulaire affiche cette même liste. Le générateur combine le plan de la prestation avec les coordonnées du seul dossier ouvert. La sélection des options reste en mémoire pendant la préparation de cet ordre.
