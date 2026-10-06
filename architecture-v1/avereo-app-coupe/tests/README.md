---
project: avereo-app-coupe
document_type: tests
title: Vérification de l'intégration locale Coupe
status: active
version: git
created: 2026-09-09
updated: 2026-09-09
owner: jpdandin
tags: [coupe, tests, securite]
---

# Tests

- [connect-gate.php](connect-gate.php) : tickets, identité, rôles, expiration,
  anti-rejeu et distinction local/hébergé. Exécutable avec PHP CLI sans base.
- [local-web.mjs](local-web.mjs) : parcours HTTP réel avec profils fictifs sur
  `127.0.0.1` uniquement. Vérifie les accès refusés, l'ouverture Coupe et Rapport,
  la séparation des tickets/cookies et le maintien des autres simulations.
- `local-web.mjs --coupe-placeholder` : après `down`, contrôle le retour à Coupe
  simulée et la disponibilité de Rapport réel.

Les tests HTTP créent des sessions locales. Ne pas les exécuter contre un
environnement hébergé et ne pas remplacer leurs URLs par des URLs de production.
Ils ne prouvent pas une recette métier complète ni un envoi d'email.

Les [commandes et résultats de recette](../docs/local-development.md) sont la
référence de validation. La checklist de merge reste réservée à l'utilisateur.
