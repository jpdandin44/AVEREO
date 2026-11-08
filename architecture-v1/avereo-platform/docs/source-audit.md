---
project: avereo-platform
document_type: source-audit
title: Audit source du socle
status: active
version: git
created: 2026-11-04
updated: 2026-11-08
owner: jpdandin
tags: [avereo, acces, documentation]
---

## 8 novembre 2026 — Outils complémentaires

La version livrée de #127 présentait Missions dans Coupe, RGA et Passeport Immo. Dans le candidat local, ces surfaces ne chargent ni le formulaire ni les modèles de mission. Rapport conserve son générateur sur le domaine partagé avec RGA. [Suivi et étendue des essais](../data/recette-missions/outils-complementaires.json).

## 2026-11-06 — Qualification hébergée du correctif RGA

PR #122 est fusionnée et son fichier RGA identique au candidat testé est installé. Le [reçu](livraison-mon-espace.md) confirme la navigation depuis la carte intégrée et la conservation de tous les autres fichiers, configurations et plannings. Les constats de correction locale ci-dessous deviennent historiques.


# Audit source

## 6 novembre 2026 — Livraison et recette hébergée

Les 40 fichiers PR #121 sont installés après accord explicite et contrôle de leur
empreinte. Le [reçu de livraison](livraison-mon-espace.md) sépare conservation,
résultats du navigateur et réserves RGA/Coupe. Le correctif RGA est limité au
déclenchement de la liste de projets ; il est testé localement, non installé.
Le composant partagé ne change pas, deux tests de navigation complètent sa suite.

Le lot du 4 novembre conserve le sas partagé et son mécanisme de génération. Le cookie conserve désormais l’identité signée ; le paramètre `connect_trial_access_file` active le contrôle de période, révocation et applications. Les tests ciblent le code réellement copié, avec transport HTTP local. Les modèles d’application et l’infrastructure locale restent inchangés. [Périmètre](../../avereo-app-connect/docs/acces-temporaires-applications.md).

## 6 novembre 2026 — Composant de compte

Le premier composant #119 ne lit aucune identité et ne stocke aucune donnée. Les actions natives sont raccordées par emplacements ; son style reste indépendant des feuilles applicatives. Les liens CONNECT utilisent la métadonnée publique après contrôle d’accès. [Intégration, tests et limites](qualification-mon-espace.md).

La [préparation après fusion](preparation-mon-espace.md) compare les cibles réelles
au build. Les traitements de connexion Coupe, le sas Passeport et le classement
Projet installés sont préservés. Les outils ne travaillent que dans les copies
privées ; le manifeste réduit trace les 37 fichiers proposés.

## Extension PR #121

Le composant conserve désormais uniquement des préférences par application, dans des clés localStorage séparées. Les catalogues restent métier ; Thermo et RGA possèdent leurs listes locales distinctes. Les 37 fichiers de la préparation #119 sont historiques. La [règle révisée](fonctionnalites-communes.md) et la [qualification](qualification-mon-espace.md) décrivent le candidat courant, ses limites et ses contrôles.

## 2026-11-06 — Source partagée des livrables

Le logo historique de Rapport est déplacé sans transformation vers la source
commune ; son export initial reste compatible. Les raccordements ne modifient ni
calcul, ni données, ni habilitations. [Audit et qualification](identite-livrables.md).

## 7 novembre 2026 — Source du module Missions

Le nouveau module commun produit des copies de travail à partir du dossier ouvert. Les modèles Word restent privés, le catalogue porte leur empreinte et les intégrations métier restent explicites. [Périmètre et preuves](preparation-missions.md).

Les ordres Projet et Coupe de la livraison #125 comportaient la fiche d’intervention et aucune tâche métier. La version #127 installée en préproduction a livré les étapes des quatre offres et les coordonnées du client depuis les deux cadres. [Constat et suivi](../data/recette-missions/ordres-prestations.json) · [Preuve hébergée](../data/recette-missions/livraison-ordres-preproduction.json).

## 2026-11-08 — Affichage partagé

Le composant participe à la construction des neuf applications et du module RGA. [Comportements et limites du candidat](modele-affichage.md).
