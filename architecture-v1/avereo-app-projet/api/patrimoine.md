---
project: avereo-app-projet
document_type: data-contract
title: Métadonnées privées du patrimoine PQ-01
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [api, patrimoine, projection, lecture-seule]
---

# Champ optionnel de la réponse privée state

`patrimony` est `null` si non raccordé/indisponible, sinon un objet `schema: avereo-development-patrimony`, `version: 1`, `scope: AVEREO-reference`, `mode: metadata_only_read_only`. Ce numéro identifie le contrat machine, pas une version documentaire.

- `collectedAt` : date de collecte locale, distincte de la date des sources.
- `sources[]` : `id`, `label`, `status`, `asOf` (date ou null), `sha256` (empreinte ou null).
- `metrics[]` : `id`, `label`, `value` (entier non négatif ou null), `unit`, `status`, `sourceId`, `asOf`, `meaning`, `items[]`.
- `items[]` : `id`, `label`, `kind`, `applicationIds[]`. Aucun contenu de fichier, lien exécutable ou chemin absolu.
- `exclusions[]` et `limitations[]` : explications de périmètre.

Statuts : `observed`, `partial`, `unavailable`, `not_configured`. Un comptage observé correspond exactement au nombre de lignes justificatives ; un comptage partiel est un minimum observé, jamais un total complet. Une source indisponible/non raccordée donne `null`, pas zéro. Les listes sont bornées (20 sources, 30 indicateurs, 5 000 lignes maximum par indicateur), le fichier local à 2 Mio. Champs inconnus et identifiants dupliqués refusés. Les erreurs de lecture n'exposent pas de chemin ou valeur de source.

Le champ reste dans la réponse authentifiée existante, Node local ou projection signée PHP. Aucune query ne choisit une racine, un chemin ou un collecteur. La collecte est une commande opérateur locale, séparée de la lecture et d'une future publication privée. Aucun nouveau droit, jeton ou endpoint de mutation.

[Guide et limites](../docs/patrimoine-qualite.md).
