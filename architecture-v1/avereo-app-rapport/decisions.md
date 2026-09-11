---
project: avereo-app-rapport
document_type: decisions
title: Decisions structurantes de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-09-11
owner: jpdandin
tags:
  - rapport
  - decisions
  - architecture
---

# Decisions structurantes de Rapport AVEREO

## 2026-09-11 - Privilegier le prototype fonctionnel avant le TDD

### Contexte

Le produit doit d'abord permettre de valider rapidement les parcours metier et
l'utilite des fonctions Rapport. La strategie de tests destinee a un produit
commercialisable n'est pas encore definie.

### Decision

Pendant la phase de prototype, prioriser les evolutions fonctionnelles courtes
et demonstrables. Ne pas imposer le TDD comme condition de demarrage. Continuer
les controles existants et les validations manuelles proportionnees au risque.

Etudier le TDD, la couverture automatisee et les controles d'industrialisation
au moment de preparer la commercialisation.

### Raisons principales

- valider l'usage et le besoin avant d'investir dans un dispositif complet ;
- eviter de ralentir les iterations fonctionnelles du prototype ;
- ne pas figer trop tot une strategie ou un outillage de test ;
- conserver un niveau de verification coherent avec les risques actuels.

### Consequences

Les prochaines tranches sont pilotees par un resultat fonctionnel observable.
Les tests deja presents ne sont ni supprimes ni contournes. La strategie TDD
reste un sujet explicite de la future phase d'industrialisation.

## 2026-09-11 - Limiter le catalogue visible a deux parcours

### Contexte

La coexistence de plusieurs categories rend le demarrage du rapport moins
lisible alors que les travaux portent maintenant sur l'expertise technique et
la visite globale d'habitologie.

### Decision

Afficher uniquement `Expertise & Visite technique` et `Visite Globale` pour
une nouvelle creation. Conserver les autres definitions dans le catalogue du
code avec `selectable: false`, afin qu'elles restent compatibles avec les
anciens dossiers et reactivables comme modules complementaires.

La denomination `Visite Globale` remplace la denomination visible
`Rapport Habitologue`. Son futur workflow est documente comme proposition en
etude ; il n'est pas presente comme implemente.

### Raisons principales

- reduire les choix au perimetre fonctionnel actuellement prioritaire ;
- conserver un seul moteur de rapport et une seule structure de donnees ;
- ne pas supprimer les modules ni casser les brouillons historiques ;
- separer clairement l'interface actuelle du workflow encore a valider.

### Consequences

Les nouveaux rapports techniques utilisent quatre sous-categories et les
visites globales les quatre elements. Les anciennes classifications sont
normalisees de maniere defensive, sans reclassement arbitraire. La decision du
10 septembre ci-dessous est conservee comme historique et remplacee uniquement
sur la denomination et le catalogue visible.

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
