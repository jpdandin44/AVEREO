---
project: avereo-app-projet
document_type: data-index
title: Données du planning pilote
status: active
version: git
created: 2026-09-19
updated: 2026-09-19
owner: jpdandin
tags:
  - projet
  - donnees
---

# Données du planning pilote

## Référence et dérivés

`data/planning-pilote.json` est la source de vérité. Le générateur produit
`data/generated/planning-pilote.csv` et
`data/generated/planning-pilote.json` ; ne pas corriger ces dérivés manuellement.
La procédure est dans [workflows/README.md](../workflows/README.md).

Les six lignes couvrent les lots, la réserve et les essais/pilote :
5 ; 5,75 ; 5,25 ; 7 ; 4,9 ; 1,5 jours-personne, soit 29,4 jours-personne.
Départ proposé au 21 septembre, cible au 30 octobre 2026 et capacité de
5 jours-personne par semaine. Ces données ne prouvent ni un démarrage effectif,
ni un avancement, ni une décision humaine déjà approuvée.

## Formats

Le CSV contient neuf colonnes : `ID`, `Nom`, `Lot`,
`Durée (jours ouvrés)`, `Dépendances`, `Responsable`, `Statut`,
`Avancement (%)`, `Criticité`. Les dépendances utilisent les IDs séparés par
virgules. Ce format ne conserve pas les paramètres du projet (dont les dates
début/cible), les dates fixées manuellement sur les tâches (`manualStart`), ni
l'état de leurs risques (`riskStatus`). Le JSON de reprise conserve ces champs.

Les colonnes `ID`, `Nom` et `Durée` sont obligatoires. Les IDs doivent être
uniques et les références existantes ; un cycle est refusé. Les fractions sont
conservées et l'avancement est exprimé de 0 à 100 : `1` signifie désormais
1 %, contrairement à l'ancien mapper. L'import accepte virgule, point-virgule
ou tabulation comme séparateur CSV ; le générateur utilise point-virgule avec
champs entre guillemets, BOM UTF-8 et fins de ligne CRLF, préservés par le
`.gitattributes` applicatif. Le JSON généré reste en LF. L'export CSV protège les cellules pouvant
être interprétées comme formules par un tableur.

L'import CSV/XLSX conserve les paramètres courants. Le JSON de sauvegarde
porte `schemaVersion: 1`, `name`, `startDate`, `targetDate`, `capacityPerWeek`,
`schedulingMode` et `tasks`. Il conserve les champs normalisés du planning,
pas les informations de provenance propres au fichier source du pilote.
Le manifeste généré du pilote contient ses paramètres et ses métadonnées
descriptives ; ses tâches viennent du CSV et ne sont pas dupliquées.

Une copie de travail exportée ne modifie pas la référence Git du pilote.
Tout changement durable de ce dernier commence dans sa source avant génération.

## Conservation

Le middleware Vite sert les dérivés sous `/local-planning/` en développement
seulement. Ils sont hors de `frontend/public/` et ne doivent pas être distribués
par le build statique. Le préchargement local n'écrase pas un brouillon existant.

Ne pas versionner de brouillon utilisateur, donnée personnelle sensible ou secret.
