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

## 2026-09-10 - Ajouter Rapport Habitologue comme type de dossier

### Contexte

Le demonstrateur technique doit rester utilisable tandis qu'un parcours client
plus simple est developpe progressivement.

### Decision

Conserver une seule application et un seul assistant. Remplacer la tuile
`Reception de travaux` par `Rapport Habitologue` pour les nouvelles creations.
Identifier ces dossiers avec le champ `categorie` deja sauvegarde dans la
charge JSON afin de pouvoir conditionner progressivement le workflow.

### Raisons principales

- eviter une nouvelle application, une nouvelle authentification et une nouvelle base ;
- reutiliser directement la navigation, le brouillon, les photos, la dictee,
  la sauvegarde et l'export existants ;
- eviter la duplication d'un second moteur de formulaire ;
- permettre des lots fonctionnels courts et reversibles.

### Consequences

Les brouillons historiques restent compatibles. `Reception de travaux` reste
reconnu en lecture mais disparait des choix de creation. Les prototypes
Habitologie precedents sont normalises vers `Rapport Habitologue`. Les
adaptations Habitologie sont ajoutees progressivement dans les etapes
existantes en fonction de la categorie.
