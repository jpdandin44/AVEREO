---
project: avereo-app-projet
document_type: changelog
title: Changelog de Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-25
owner: jpdandin
tags:
  - projet
  - changelog
---

# Changelog de Projet

## 2026-09-25 — Revues complémentaires dans leur phase

- Les PR documentaires des observations de suivi sont affichées dans la phase
  concernée avec le libellé « Revue complémentaire » et leur portée.
- La PR principale et sa preuve sont conservées ; filtrage strict de la phase,
  mêmes contrôles URL/date/empreinte et dédoublonnage des références.
- Présentation en lecture seule, sans modification du journal, des statuts ou
  des transitions. Contrat et parcours utilisateur documentés.
- Dix tests ciblés PR et build complet réussis : 144 tests, contrôle du planning,
  compilation et vérification de l'artefact sans données ni API de revue.

## 2026-09-25 — PR associée à une phase

- Carte facultative dans la phase sélectionnée : lien GitHub validé, état
  consigné, date du constat, révision et preuves de fusion disponibles.
- Normalisation des URL, dépôt, numéro, état, dates et empreintes ; absence
  de carte pour les anciens suivis ou des références essentielles invalides.
- Lecture des seules métadonnées du chantier, sans requête GitHub, écriture,
  approbation ni transition automatique.
- Contrat facultatif documenté dans [l’API locale](api/revue-locale.md#pull-request-de-phase).

## 2026-09-24 — Livrables attendus et actualisation du suivi

- Fiches de livrables avec titre, description et preuves attendues facultatifs.
- Distinction entre document à produire, document de travail et disponibilité
  pour revue, sans changement automatique des jalons du chantier.
- Lecture automatique du suivi à cadence limitée et au retour à la page ;
  saisies et sélections conservées, attestations invalidées de façon ciblée.
- Protection contre une ancienne lecture qui remplacerait une décision venant
  d'être enregistrée ; tests des changements de document sans modification du JSON.
- Résultats et limites consignés dans la
  [recette de l'actualisation](docs/recette-revue-locale.md#complément-du-24-septembre--livrables-attendus-et-actualisation).

## 2026-09-24 — Progression des phases et accords antérieurs

- Vue de progression sélectionnable, jalons, disponibilité et prochaines actions par phase.
- Compteurs distincts de validations, remises historiques et phases actuellement à valider.
- Affichage des accords antérieurs fournis par le chantier avec provenance, commentaires et nature de preuve.
- Calculs de présentation testés sans modifier les journaux ni les transitions du service.
- Guide utilisateur et sources structurantes actualisés ; accès toujours local.

## 2026-09-24 — Guide utilisateur du suivi

- Guide commun des revues, décisions, planning, risques et sauvegardes.
- Parcours utilisateur centralisé ; liens depuis le README et le workflow technique.
- Distinction entre JSON du chantier sur disque et planning conservé par origine navigateur.

## 2026-09-24 — Revue et approbation locales

- Espace intégré : lecture mise en forme/source, critères explicites et journal.
- Décisions dans le JSON existant, preuves SHA-256 et sauvegarde préalable.
- Approbation, autorisation et démarrage distincts ; corrections et nouvelle remise.
- Refus des révisions périmées, écritures concurrentes et accès hors du dossier.
- Lanceur Windows, démonstration isolée, tests et contrôle de l'artefact.
- Documentation du contrat, de la recette et du workflow de développement.

Résultats et limites dans [la recette](docs/recette-revue-locale.md).
Cette livraison ne valide aucune phase du chantier réel et ne publie aucun site.


## 2026-09-19 — Planning implémenté localement

- Dates/capacité configurables et charges décimales, calcul séquentiel par défaut.
- Validation des imports et dépendances, reprise navigateur et JSON/CSV.
- Source unique du pilote et diffusion réservée au développement local.
- Tests moteur, interactions et contrôleur ; recette navigateur du pilote,
  modification, reprise après rechargement et import CSV confirmé.
- Socle documentaire applicatif ; distinction local, sas et publication.

Les résultats exécutés et les limites restantes sont dans
[l'audit source](docs/source-audit.md). L'évolution est proposée pour revue
dans une PR brouillon dédiée.
Cette entrée n'atteste aucune publication ni qualification préproduction/production.

## 2026-09-19 — Fiches d'actions, checklists et risques détaillés

- Descriptions, actions, résultats attendus et sources ajoutés aux lots du pilote.
- Réalisation et validation humaine distinctes, preuves et vérificateur conservés
  dans le JSON ; aucun avancement de lot déduit automatiquement.
- Registre des risques avec causes, conséquences, qualification, mesures et suivi ;
  préqualification indicative argumentée, statut initial À qualifier maintenu,
  clôture ou acceptation justifiée.
- Enrichissement des fiches absentes compatible avec les anciens brouillons,
  complément des préqualifications encore vierges, conservation des détails
  d'une même tâche lors d'un réimport tabulaire.
- Consultation locale du document généré en texte brut et contrôles des limites
  de sauvegarde, y compris le volume UTF-8.

Extension préparée localement dans le périmètre de la PR #64. Sa recette ciblée
et ses limites sont détaillées dans l'audit : tests/build réussis et parcours
locaux constatés, sans publication hébergée.
