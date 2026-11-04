---
project: avereo-platform
document_type: source-audit
title: Audit source du socle
status: active
version: git
created: 2026-11-04
updated: 2026-11-04
owner: jpdandin
tags: [avereo, acces, documentation]
---

# Audit source

Le lot du 4 novembre conserve le sas partagé et son mécanisme de génération. Le cookie conserve désormais l’identité signée ; le paramètre `connect_trial_access_file` active le contrôle de période, révocation et applications. Les tests ciblent le code réellement copié, avec transport HTTP local. Les modèles d’application et l’infrastructure locale restent inchangés. [Périmètre](../../avereo-app-connect/docs/acces-temporaires-applications.md).
