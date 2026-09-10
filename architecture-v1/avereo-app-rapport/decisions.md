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

## 2026-09-10 - Ajouter Habitologie comme sous-categorie

### Contexte

Le demonstrateur technique doit rester utilisable tandis qu'un parcours client
plus simple est developpe progressivement.

### Decision

Conserver une seule application et un seul assistant. Ajouter
`Rapport d'habitologie` dans les sous-categories existantes de
`Expertise & visite technique`. Identifier ces dossiers avec le champ
`sous_categorie` deja sauvegarde dans la charge JSON.

### Raisons principales

- eviter une nouvelle application, une nouvelle authentification et une nouvelle base ;
- reutiliser directement la navigation, le brouillon, les photos, la dictee,
  la sauvegarde et l'export existants ;
- eviter la duplication d'un second moteur de formulaire ;
- permettre des lots fonctionnels courts et reversibles.

### Consequences

Les brouillons historiques restent compatibles. Le prototype de parcours
separe, non fusionne, est abandonne ; sa forme de brouillon peut toutefois etre
normalisee vers la sous-categorie. Les adaptations Habitologie sont ajoutees
progressivement dans les etapes existantes.
