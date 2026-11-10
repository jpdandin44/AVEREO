---
project: avereo-platform
document_type: requirements
title: Exigences
status: active
version: git
created: 2026-11-04
updated: 2026-11-09
owner: jpdandin
tags: [avereo, acces, documentation]
---

# Exigences

Les accès applicatifs exigent un ticket CONNECT signé, lié à l’application, court et à usage unique. La session conserve l’identité. Une politique privée configurée contrôle compte, dates et application à chaque requête protégée ; une politique indisponible refuse l’accès. Le cas sans politique reste compatible avec les anciennes installations.

La qualification hébergée et les accords de livraison sont distincts des tests locaux. [Contrat fonctionnel et installation coordonnée](../avereo-app-connect/docs/acces-temporaires-applications.md).

## Fonctions de compte communes

Appliquer les libellés, comportements accessibles et conditions d’affichage de la [règle commune](docs/fonctionnalites-communes.md). Préserver les données, les droits et le mécanisme de déconnexion de chaque application. Vérifier la parité de la source dans chaque livrable.

Le texte du médaillon « Mon compte » doit être configurable pour toutes les applications d’un même environnement. Les valeurs acceptées et la compatibilité des modèles existants sont décrites dans le [guide d’administration](docs/modele-affichage.md#administration-connect).

## Espaces propres aux applications

Le responsable demande des entrées « Mes projets » et « Préférences » adaptées à chaque application avant fusion de #121. Seuls le profil et le catalogue CONNECT sont communs. La [matrice métier](docs/fonctionnalites-communes.md#adaptations-métier-du-candidat-pr-121) constitue la référence ; les listes locales doivent être annoncées comme telles. CONNECT reste le portail sans rubrique de projets, décision explicitement confirmée. Les erreurs d’enregistrement ne doivent pas entraîner la fermeture du travail courant.

## Identité des livrables

Priorité demandée le 6 novembre : présenter les rapports au nom d’AVEREO. La
configuration future du logo, des coordonnées et des mentions appartient à
l’organisation ; seul son administrateur peut la modifier, avec contrôle serveur.
Les préférences de travail restent individuelles et propres aux applications.
[Contrat, inventaire et critères](docs/identite-livrables.md).

Le 7 novembre, le responsable fournit l’identité provisoire de la société en
formation et demande de préparer l’immatriculation pour plus tard. Les valeurs
de [la source structurée](data/report-organization.json) doivent apparaître sous
le logo dans les quatre livrables. Un champ vide ne doit produire aucun libellé
ni valeur de remplacement. L’identité reste fixe jusqu’au service administratif.

## Coordonnées réutilisées dans les livrables

Conserver séparément le client, son adresse postale, le site d’intervention, la référence du dossier et celle de la mission. Choisir explicitement l’offre. Réserver au seul administrateur de l’organisation la future publication des mentions et modèles communs. Coupe, RGA et Passeport Immo doivent rester disponibles comme outils complémentaires et ne doivent pas produire de lettres ou d’ordres de mission. [Protocole des missions](docs/protocole-missions.md#applications-qui-génèrent-des-missions).

L’ordre doit fournir pour chacune des quatre prestations un déroulé exploitable, une consigne et une trace à consigner par étape. Y reprendre le nom, l’adresse postale, l’e-mail et le téléphone depuis le dossier ou la saisie de l’intervenant. Signaler les coordonnées manquantes et distinguer les options à sélectionner des tâches comprises dans l’offre. [Critères et périmètre](docs/protocole-missions.md#préparer-lordre-de-chaque-prestation).
