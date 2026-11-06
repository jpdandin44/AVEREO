---
project: avereo-app-saisie-unique
document_type: decisions
title: Décisions de Saisie unique
status: active
version: git
created: 2026-11-06
updated: 2026-11-06
owner: jpdandin
tags: [avereo, saisie-unique, documentation]
---

# Décisions de Saisie unique

Les choix antérieurs restent décrits dans le [cadrage](docs/00-cadrage.md) et le [développement local](docs/01-developpement-local.md).

## 2026-11-06 — Menu partagé dans le fichier autonome

La demande porte sur toutes les applications AVEREO. Le même composant est donc inclus dans le bundle statique, avec Mes dossiers locaux et Préférences. Cela garde le fonctionnement sans réseau et évite une copie divergente ou un compte en ligne fictif.
