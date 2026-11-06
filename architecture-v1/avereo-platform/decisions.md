---
project: avereo-platform
document_type: decisions
title: Décisions
status: active
version: git
created: 2026-11-04
updated: 2026-11-06
owner: jpdandin
tags: [avereo, acces, documentation]
---

# Décisions

## 4 novembre 2026 — Réutiliser la politique privée CONNECT

Contexte : une durée temporaire doit s’appliquer aux applications choisies indépendamment du catalogue. Décision : relire la projection existante sur les tickets et les sessions déjà émises, en conservant l’identité signée. Ce mécanisme réutilise le stockage privé existant sans base ni service supplémentaire. Conséquence : raccorder chaque cible à la même politique avant d’activer la nouvelle administration. [Portée et limites](../avereo-app-connect/docs/acces-temporaires-applications.md).

## 6 novembre 2026 — Un menu natif pour HTML et React

Contexte : généralisation de Mon espace après PR #114. Décision : un Web Component sans dépendance nouvelle, des actions applicatives fournies par emplacements et une copie générée au build. Raisons : les applications utilisent React, des pages HTML intégrées et PHP. Conséquences : même présentation, contrôle de parité en CI et réutilisation des gestionnaires métier ; la copie publique CONNECT reste versionnée pour son paquet sans build Node. [Règle](docs/fonctionnalites-communes.md).
