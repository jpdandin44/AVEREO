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

## 2026-09-19 — Séparer fiches de référence et suivi local

**Contexte.** Les lots doivent expliquer les actions attendues et permettre de
consigner leur vérification sans effacer le suivi commencé.

**Décision.** Conserver les fiches structurées dans la source JSON du pilote et
leurs références documentaires ; générer leurs représentations et stocker les
modifications et preuves dans le projet local. Ajouter les fiches absentes d'un
pilote reconnu et compléter uniquement les préqualifications restées dans leur
état initial, selon les conditions du contrôleur.

**Raisons.** Donner un point de départ documenté et conserver les saisies humaines.

**Conséquences.** Une fiche partiellement remplie n'est pas écrasée. Le JSON de
sauvegarde conserve tous les détails ; le CSV reste au format neuf colonnes.

## 2026-09-19 — Garder des états de suivi distincts

**Contexte.** Réaliser une action, vérifier son résultat et traiter un risque
ne constituent pas la même opération.

**Décision.** Séparer réalisation, validation documentée, avancement du lot et
qualification du risque. Une validation ou clôture exige les informations
explicites prévues par le modèle, sans transition automatique entre ces états.

**Raisons.** Éviter qu'un préchargement ou un calcul de score atteste un travail
ou une décision qui n'a pas été consigné.

**Conséquences.** Les risques initiaux restent à qualifier ; le suivi et sa
validation restent humains, sans authentification propre du vérificateur.
