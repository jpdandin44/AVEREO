---
project: avereo-app-coupe
document_type: decisions
title: Décisions d'intégration de Coupe
status: active
version: git
created: 2026-09-09
updated: 2026-09-09
owner: jpdandin
tags: [coupe, decisions, local]
---

# Décisions

## 2026-09-09 — Compléter le parcours local après Rapport

**Contexte :** Rapport dispose déjà d'un lanceur CONNECT local fusionné en PR #53.
La prochaine étape est de tester Coupe réelle dans le même portail.

**Décision :** conserver la stack Rapport et ajouter Apache/PHP Coupe sur `8200`,
pilotés par un lanceur dans le périmètre Coupe. Superposer deux configurations
de catalogue sans modifier les autres applications.

**Raison :** réutiliser le parcours testé sans créer un second portail ou changer
les workflows hébergés.

**Conséquences :** une seule stack locale active par machine ; lancer `up` depuis
Coupe pour avoir les deux applications. `down` retire uniquement Coupe du catalogue
réel. Les sessions CONNECT peuvent être renouvelées lors de la recréation du web.

## 2026-09-09 — Maintenir la sauvegarde Coupe par fichier dans ce lot

**Contexte :** les consignes applicatives limitent cette étape à l'interface
historique et interdisent une nouvelle activation de backend/MySQL.

**Décision :** utiliser le contrôle d'accès PHP déjà existant sans configurer
de base Coupe. Les projets sont exportés/importés en JSON.

**Raison :** tester l'intégration d'accès sans étendre le périmètre au stockage.

**Conséquences :** les commandes de sauvegarde en ligne ne sont pas opérationnelles
dans cette stack ; exporter son projet avant de fermer la page. La base hébergée
existante n'est ni modifiée ni copiée.
