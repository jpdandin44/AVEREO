---
project: avereo-app-rapport
document_type: data-index
title: Donnees de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-09-11
owner: jpdandin
tags:
  - rapport
  - donnees
  - mysql
---

# Donnees de Rapport AVEREO

Le schema MySQL et ses migrations restent dans `database/`, qui constitue la
source de verite executable. Voir [`../database/README.md`](../database/README.md).

La classification reutilise les champs `categorie` et `sous_categorie` de la
charge JSON, sans migration de base. Les nouvelles creations utilisent
`Expertise & Visite technique` ou `Visite Globale`. Les anciennes valeurs
`Expertise & visite technique`, `Rapport Habitologue` et
`Reception de travaux` restent acceptees et sont relues sans reclassement
metier arbitraire.
