---
project: avereo-app-rapport
document_type: data-provenance
title: Sources figées des cartes RGA
status: active
version: git
created: 2026-10-24
updated: 2026-10-24
owner: jpdandin
tags: [rga, sources, cartographie]
---

# Sources figées des cartes RGA

Ces deux exports sont des copies exactes du kit de l’application AVEREO RGA située dans `C:/Users/examg/OneDrive/Documents/AVEREO_2/public/kit/` :

- `05_carte_RGA_France_2026_interactive.html` → `france.html` ;
- `05b_carte_RGA_31_2026_interactive.html` → `haute-garonne.html`.

Le manifeste `sources.json` conserve leurs SHA-256. Ce sont des exports générés à conserver intacts, et non une seconde application à maintenir manuellement. Pour une actualisation, réimporter les exports validés de l’application source et mettre à jour le manifeste. Leur intégration et leur état de qualification sont décrits dans le [point de reprise](../../docs/reprise-demo-philippe.md).

Le build les contrôle et les enveloppe dans des pages PHP protégées par CONNECT. Ne jamais copier les HTML bruts sous le répertoire public. Les cartes restent des données territoriales de préqualification ; aucune conclusion parcellaire n’en est déduite.
