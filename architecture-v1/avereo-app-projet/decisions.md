---
project: avereo-app-projet
document_type: decisions
title: Décisions de Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-19
owner: jpdandin
tags:
  - projet
  - decisions
---

# Décisions de Projet

## 2026-09-19 — Maintenir le métier dans le navigateur

**Contexte.** Le frontend et les instructions locales maintiennent une V1 sans
backend métier.

**Décision.** Ajouter validation, calendrier, brouillon local et reprise JSON.

**Raisons.** Rendre le planning utilisable sans infrastructure ou compte nouveau.

**Conséquences.** Données propres à l'origine du navigateur, pas de partage
serveur ; conserver une copie indépendante par export.

## 2026-09-19 — Séparer charge et calendrier de démonstration

**Contexte.** Les dates historiques sont figées en 2024 et les durées importées
sont tronquées.

**Décision.** Dates/capacité configurables, fractions conservées, calcul
séquentiel par défaut.

**Raisons.** Respecter une capacité commune sans inventer de parallélisme.

**Conséquences.** Le mode dépendances représente une autre hypothèse ; ses
chevauchements ne garantissent pas la disponibilité des personnes.

## 2026-09-19 — Source unique et diffusion locale du pilote

**Contexte.** JSON, CSV et paramètres peuvent diverger s'ils sont maintenus à part.

**Décision.** Source `data/planning-pilote.json`, génération sous
`data/generated/`, endpoints Vite uniquement en développement.

**Raisons.** Garantir la cohérence et ne pas embarquer ce pilote dans le site publié.

**Conséquences.** Ne pas corriger manuellement les dérivés ; vérifier leur
absence dans `dist/` et le chargement initial sans écrasement de brouillon.

## 2026-09-19 — PR brouillon avant toute publication

**Contexte.** Un merge sur `main` peut déclencher le déploiement Projet.

**Décision.** Branche dédiée et PR brouillon pour la recette locale.

**Raisons.** Préserver la revue et l'autorisation humaines.

**Conséquences.** Aucun merge/déploiement dans cette intervention ; l'approbation
ultérieure doit tenir compte du déclencheur automatique existant.
