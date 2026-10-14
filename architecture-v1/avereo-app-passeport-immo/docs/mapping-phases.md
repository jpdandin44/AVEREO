---
project: avereo-app-passeport-immo
document_type: phase-mapping
title: Correspondance des phases du cockpit
status: active
version: git
created: 2026-10-14
updated: 2026-10-14
owner: jpdandin
tags: [passeport-immo, documents, local]
---

# Correspondance des phases du cockpit

Le modèle commun impose exactement quatre phases. Le regroupement conserve
l’instantané antérieur dans `legacyTracking` du JSON canonique, avec ses six phases,
les décisions D01 à D04, le journal, les preuves et la fiche d’itération précédente.
Ce bloc historique est immuable. Les projections actives gardent les identifiants
des décisions et leur scope initial ; aucune nouvelle approbation n’est créée.

| Ancien découpage | Phase commune | Portée conservée |
|---|---|---|
| 0 — Reprise et état des lieux | 0 — Cadrage | D01 couvre uniquement les trois documents initiaux approuvés |
| 1 — Reprise à l’identique | 1 — Développement local | Sous-lot approuvé historique, conservé séparément ; il ne valide pas le lot documents |
| 2 — Intégration CONNECT | 1 — Développement local | Travaux autorisés et démarrés, encore en cours ; lot documents demandé le 14 octobre |
| 3 — Préproduction | 2 — Préproduction | Pas de livraison ni de nouvelle autorisation |
| 4 — Mise en production | 3 — Mise en production | Pas de livraison ; contrôles après livraison et prochaine itération intégrés |
| 5 — Spécification du passeport client | Tâches de Cadrage/Développement local et prochaine itération | Backlog conservé, pas de cinquième phase |

L’approbation historique de reprise reste typée `historical_approval` dans la
projection active, pour que le moteur ne la réutilise pas comme validation de
l’ensemble du développement local. Le démarrage actif vient de l’autorisation
historique d’intégration, avec son périmètre affiché. Les objets originaux sont
dans l’instantané ; les projections se distinguent par `legacyPhaseId`.

## Périmètre de la revue de PR nº78

Le 14 octobre, le responsable précise que la revue actuelle porte sur le lot
documents et coupes, et que CONNECT doit rester un prérequis de préproduction.
La phase active Développement local est donc remise à la revue avec cinq
livrables et trois critères : dossier documentaire, comparaison ExamIn et coupes.
Cette remise technique ne constitue aucune approbation humaine.

Le livrable CONNECT absent et ses deux critères sont conservés dans les attentes
de Préproduction comme prérequis à réaliser localement avant toute installation
distante. CONNECT reste non livré ; son autorisation historique D04 et les
preuves originales gardent leur portée. La clarification et le périmètre initial
de la revue sont conservés dans `developmentWorkflow.documentsLot.reviewScope`.
Le tableau ci-dessus décrit le regroupement initial ; ce paragraphe explique
l’ajustement actif. Les quatre phases et l’instantané historique restent inchangés.
