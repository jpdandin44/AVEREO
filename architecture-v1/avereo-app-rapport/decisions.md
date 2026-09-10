---
project: avereo-app-rapport
document_type: decisions
title: Decisions structurantes de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-09-10
owner: jpdandin
tags:
  - rapport
  - decisions
  - architecture
---

# Decisions structurantes de Rapport AVEREO

## 2026-09-10 - Ajouter Habitologie dans l'application existante

### Contexte

Le demonstrateur technique doit rester utilisable tandis qu'un parcours client
plus simple est developpe progressivement.

### Decision

Conserver une seule application Rapport et proposer deux parcours au demarrage.
Identifier les dossiers par `report_type` et `schema_version` dans la charge
JSON existante. Ne pas ajouter de colonne MySQL tant qu'aucun filtrage serveur
par type n'est requis.

### Raisons principales

- eviter une nouvelle application, une nouvelle authentification et une nouvelle base ;
- preserver le moteur technique gele comme demonstrateur ;
- permettre des lots fonctionnels courts et reversibles.

### Consequences

Les brouillons historiques sont interpretes comme techniques. Les composants
Habitologie peuvent evoluer separement, mais reutiliseront progressivement les
services existants de brouillon, photo, dictee, sauvegarde et export.
