---
project: avereo-app-saisie-unique
document_type: changelog
title: Évolutions de Saisie unique
status: active
version: git
created: 2026-11-06
updated: 2026-11-23
owner: jpdandin
tags: [avereo, saisie-unique, documentation]
---

# Évolutions de Saisie unique

## 2026-11-23

Un brouillon de [plan d'installation en préproduction](docs/plan-installation-preproduction.md) est ajouté. Il n'est pas exécuté et ne vaut pas accord d'installation. Il part d'une hypothèse corrigée le jour même : UNI est déjà présent en préproduction, version à confirmer. Les 46 tests unitaires et le build ont été relancés localement sans changement de code.

## 2026-11-22

La PR #179 est fusionnée : tableau de bord, recherche, alertes, programmes et territoires, préremplissage des modèles PDF/Word privés, entrée UNI dans CONNECT et candidat PHP protégé. [Candidat de démonstration](docs/demo-2026-11-23.md). La mention « publication en préproduction non effectuée » de ce candidat date du 21 novembre ; le 23 novembre, la cible `uni-preprod.avereo.fr` répond derrière CONNECT (version installée à confirmer).

## 2026-11-06

Le code local de la PR #113 est présent ; [livrable de développement](docs/01-developpement-local.md). Le lot transversal ajoute le menu Mon espace et le socle documentaire de navigation, sans modifier les données ni les événements humains du chantier.
