---
project: avereo-app-passeport-immo
document_type: data-index
title: Données de démonstration
status: active
version: git
created: 2026-10-03
updated: 2026-10-14
owner: jpdandin
tags: [avereo, documentation, local]
---

# Données de démonstration

Les deux biens et le catalogue sont conservés dans le code du prototype pour
la parité. Aucun fichier de données tiers n'est importé dans l'application.
Les fixtures ajoutées pour la recette sont fictives et utilisent `example.test`
lorsqu'un contact est nécessaire. Les pièces jointes réelles restent hors Git.

## Progression et documents

`progression-examin.json` est la source structurée du comparatif des 14 fonctions.
`workflows/generer-progression-examin.mjs` en produit la vue Markdown avec `--check`.
Les exemples de tests restent fictifs. Le cas réel fourni est conservé exclusivement
dans le navigateur du poste et les répertoires privés hors Git.
