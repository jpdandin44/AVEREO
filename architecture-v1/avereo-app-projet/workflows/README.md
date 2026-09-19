---
project: avereo-app-projet
document_type: workflow-index
title: Génération et reprise du planning Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-19
owner: jpdandin
tags:
  - projet
  - workflow
---

# Génération et reprise du planning Projet

## Génération du pilote

**Objectif.** Produire les fichiers du pilote depuis une seule référence.

**Entrée.** `data/planning-pilote.json`.

**Sorties.** `data/generated/planning-pilote.csv` et
`data/generated/planning-pilote.json`, hors du répertoire public.

**Exécution.** Depuis `frontend/` :

```powershell
npm.cmd run generate:planning
npm.cmd run check:planning
```

Le générateur est `workflows/generer-planning-pilote.mjs` ; `check:planning`
l'appelle avec `--check` pour comparer les fichiers sans les écrire. La commande
`npm.cmd run dev` génère également les données avant de préparer la garde
et démarrer Vite. Le générateur lit/valide la source, produit CSV et manifeste ;
la recette compare leurs tâches et paramètres. Le build vérifie les dérivés
puis exécute les tests avant de préparer la garde et compiler le frontend.

**Dépendances.** Node.js et les fichiers du lot ; aucun secret ou appel API
métier. Les dérivés ne sont jamais corrigés manuellement.

Le contrôle compare le contenu exact, y compris BOM et fins de ligne.
Le fichier `.gitattributes` applicatif préserve le CSV généré en UTF-8 avec
BOM/CRLF (`-text`) et fixe le JSON généré en LF. Conserver ces règles pour que
le contrôle donne le même résultat sur Windows et en CI Linux.

## Chargement et reprise

Vite expose les dérivés par middleware de développement sous
`/local-planning/`. L'application les charge au premier démarrage local
admissible, sans remplacer un brouillon. Aucun pilote n'est embarqué dans les
assets du build public.

L'utilisateur peut exporter un JSON complet. L'import est validé avant toute
mutation puis confirmé pour remplacer un planning existant. Le brouillon
sert la continuité locale ; le fichier assure une conservation indépendante.

La publication est décrite dans
[docs/deployment.md](../docs/deployment.md). Aucun workflow n8n n'est créé.
