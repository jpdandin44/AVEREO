---
project: avereo-platform
document_type: requirements
title: Exigences
status: active
version: git
created: 2026-11-04
updated: 2026-11-06
owner: jpdandin
tags: [avereo, acces, documentation]
---

# Exigences

Les accès applicatifs exigent un ticket CONNECT signé, lié à l’application, court et à usage unique. La session conserve l’identité. Une politique privée configurée contrôle compte, dates et application à chaque requête protégée ; une politique indisponible refuse l’accès. Le cas sans politique reste compatible avec les anciennes installations.

La qualification hébergée et les accords de livraison sont distincts des tests locaux. [Contrat fonctionnel et installation coordonnée](../avereo-app-connect/docs/acces-temporaires-applications.md).

## Fonctions de compte communes

Appliquer les libellés, comportements accessibles et conditions d’affichage de la [règle commune](docs/fonctionnalites-communes.md). Préserver les données, les droits et le mécanisme de déconnexion de chaque application. Vérifier la parité de la source dans chaque livrable.

## Espaces propres aux applications

Le responsable demande des entrées « Mes projets » et « Préférences » adaptées à chaque application avant fusion de #121. Seuls le profil et le catalogue CONNECT sont communs. La [matrice métier](docs/fonctionnalites-communes.md#adaptations-métier-du-candidat-pr-121) constitue la référence ; les listes locales doivent être annoncées comme telles. CONNECT reste le portail sans rubrique de projets, décision explicitement confirmée. Les erreurs d’enregistrement ne doivent pas entraîner la fermeture du travail courant.
