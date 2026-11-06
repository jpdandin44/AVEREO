---
project: avereo-platform
document_type: source-audit
title: Audit source du socle
status: active
version: git
created: 2026-11-04
updated: 2026-11-06
owner: jpdandin
tags: [avereo, acces, documentation]
---

# Audit source

Le lot du 4 novembre conserve le sas partagé et son mécanisme de génération. Le cookie conserve désormais l’identité signée ; le paramètre `connect_trial_access_file` active le contrôle de période, révocation et applications. Les tests ciblent le code réellement copié, avec transport HTTP local. Les modèles d’application et l’infrastructure locale restent inchangés. [Périmètre](../../avereo-app-connect/docs/acces-temporaires-applications.md).

## 6 novembre 2026 — Composant de compte

Le premier composant #119 ne lit aucune identité et ne stocke aucune donnée. Les actions natives sont raccordées par emplacements ; son style reste indépendant des feuilles applicatives. Les liens CONNECT utilisent la métadonnée publique après contrôle d’accès. [Intégration, tests et limites](qualification-mon-espace.md).

La [préparation après fusion](preparation-mon-espace.md) compare les cibles réelles
au build. Les traitements de connexion Coupe, le sas Passeport et le classement
Projet installés sont préservés. Les outils ne travaillent que dans les copies
privées ; le manifeste réduit trace les 37 fichiers proposés.

## Extension PR #121

Le composant conserve désormais uniquement des préférences par application, dans des clés localStorage séparées. Les catalogues restent métier ; Thermo et RGA possèdent leurs listes locales distinctes. Les 37 fichiers de la préparation #119 sont historiques. La [règle révisée](fonctionnalites-communes.md) et la [qualification](qualification-mon-espace.md) décrivent le candidat courant, ses limites et ses contrôles.
