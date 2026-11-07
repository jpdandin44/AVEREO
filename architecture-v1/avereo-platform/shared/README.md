---
project: avereo-platform
document_type: reference
title: README
status: active
version: git
created: 2026-11-04
updated: 2026-11-07
owner: jpdandin
tags: [avereo, acces, documentation]
---


## Sources actives

`connect-gate.php` est le sas PHP copié par les scripts de génération. `connect-gate.config.example.php` documente sa configuration privée. Le contrôle des comptes temporaires est qualifié par les tests du socle. La phrase initiale ci-dessous décrit le cadrage d’origine. [Architecture courante](../architecture.md).

﻿# Shared

Espace reserve aux standards partages AVEREO. Aucun code applicatif vivant en V1.

## Menu de compte

`account-menu.js` est la source commune vivante du menu. Ses copies publiques sont générées et contrôlées. [Règle](../docs/fonctionnalites-communes.md).

## Identité des restitutions

`data/report-organization.json` est la source des informations provisoires AVEREO
fournies par le responsable. `report-identity.js` y associe le logo officiel et
formate les lignes non vides pour les quatre générateurs existants. Les champs
d’immatriculation, TVA, assurance et mentions complémentaires sont préparés et
restent masqués quand ils sont vides. Aucune écriture par utilisateur n’est exposée.
[Contrat d’organisation et portée locale](../docs/identite-livrables.md).

## Sources de Mon espace → Missions

Le composant mission-workspace.js produit les Word et mission-dossier.js relie les applications à leur dossier courant. Le module chargé à la demande embarque JSZip 3.10.1, déjà utilisé par le générateur Word Rapport. La distribution et la licence sont conservées dans [vendor/jszip](vendor/jszip). Saisie unique embarque le module à la compilation pour fonctionner hors ligne. [Protocole](../docs/protocole-missions.md).
