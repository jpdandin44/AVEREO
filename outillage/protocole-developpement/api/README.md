---
project: protocole-developpement
document_type: integration
title: Intégration du cockpit
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [developpement, github, cockpit]
---

# Intégration du cockpit

Le [contrat de fiche](../skills/developpement-github-cockpit/references/cockpit.md) est indépendant du fournisseur. Le raccordement local utilise les routes existantes du moteur de revue Projet : lecture de l'état et des documents, actions humaines protégées par sa session locale.

Aucune API distante, authentification ou synchronisation GitHub continue n'est ajoutée. Les preuves GitHub sont rafraîchies par l'agent ou l'opérateur lors des passages.
