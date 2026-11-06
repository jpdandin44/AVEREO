---
project: avereo-app-saisie-unique
document_type: readme
title: AVEREO Saisie unique
status: active
version: git
created: 2026-11-06
updated: 2026-11-06
owner: jpdandin
tags: [avereo, saisie-unique, documentation]
---

# AVEREO Saisie unique

Application statique AVEREO UNI pour renseigner un dossier et préremplir ses documents. Le candidat existant de la PR #113 utilise React, esbuild et le stockage du navigateur ; les exemples sont fictifs. Aucun backend ni compte en ligne.

Prérequis : Node.js et npm. Dans `frontend/` : `npm install`, `npm test`, `npm run build`. Ouvrir ensuite `frontend/dist/index.html`. Les paramètres privés facultatifs `frontend/valeurs-locales.json` restent ignorés par Git.

Sources : [cadrage](docs/00-cadrage.md), [catalogue](docs/00-catalogue-champs.md), [développement local](docs/01-developpement-local.md), [suivi humain](docs/suivi-chantier.json). Le suivi humain conserve ses événements ; le versement du code ne les remplace pas.

Le menu **Mon espace** donne accès aux dossiers locaux et aux préférences. [Règle commune](../avereo-platform/docs/fonctionnalites-communes.md).

[Architecture](architecture.md) · [Exigences](requirements.md) · [Suite](roadmap.md) · [Décisions](decisions.md) · [Changelog](changelog.md).
