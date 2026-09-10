---
project: avereo-app-rapport
document_type: data-index
title: Donnees de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-09-10
owner: jpdandin
tags:
  - rapport
  - donnees
  - mysql
---

# Donnees de Rapport AVEREO

Le schema MySQL et ses migrations restent dans `database/`, qui constitue la
source de verite executable. Voir [`../database/README.md`](../database/README.md).

Le premier lot Habitologie reutilise le champ `categorie` de la charge JSON
existante avec la valeur `Rapport Habitologue` et n'introduit aucune migration
de base. La valeur historique `Reception de travaux` reste acceptee en lecture.
