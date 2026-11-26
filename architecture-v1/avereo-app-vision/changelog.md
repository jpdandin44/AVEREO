---
project: avereo-app-vision
document_type: changelog
title: Évolutions de Vision
status: active
version: git
created: 2026-11-26
updated: 2026-11-26
owner: jpdandin
tags: [vision, deploiement]
---

# Évolutions de Vision

## 2026-11-26 — T-08, préparation locale

Ajout du workflow de déploiement manuel préproduction/production, avec vérification sans secret pour les PR. Scripts de validation du paquet et de son empreinte, contrôle de promotion du même SHA, transmission privée des migrations, vérifications HTTPS et tests associés. Procédure manuelle conservée comme secours. Aucun déploiement exécuté.

Les [preuves et limites](docs/deploiement-automatise-verification.md) distinguent les contrôles locaux réussis, la qualification PHP 8.3/MySQL 8.4 restante et le commit bloqué par les permissions Git de la session. Le [suivi canonique](data/suivi-vision.json) conserve les validations et décisions antérieures.

## 2026-11-26 — T-09, compte et reconnexion

Portail CONNECT validé et public dans auth 200/401 ; bouton et bandeau de reconnexion, menu commun sans missions/préférences, déconnexion GET vers CONNECT. Copie exacte du composant et du logo. Configuration et recette locales adaptées, contrôle privé renforcé, tests ajoutés. Session inchangée (1800 s), aucune donnée locale supprimée. Voir R49 et la recette locale pour les réserves mobiles.
