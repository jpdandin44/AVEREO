---
project: avereo-app-passeport-immo
document_type: test-guide
title: Vérification de la reprise
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [passeport-immo, local]
---

# Vérification de la reprise

## Commandes
Depuis `frontend/`, `npm.cmd test` exécute quatorze tests :
- T01 : deux biens × trois gammes, calcul manuel commenté ; totaux PDF.
- T02/T03 : m², unité, forfait, unités non prises en charge, tarif absent, pièce vide.
- T04 : import CSV fictif via l'écran Admin et PapaParse, puis sauvegarde locale.
- T05 : quatre exports depuis l'écran : arrondi blanc, pixel final de contenu, deux
  et trois pages ; dimensions canvas et jsPDF simulés, téléchargement appelé.

Depuis le sous-projet, `node tests/check-parity.mjs` isole le correctif d autorisé puis inverse les transformations a/b/c
et compare la copie à la source historique, corps des calculs et classes compris.
Le test nécessite le monorepo ; les tests Vitest lisent les fixtures intégrées à la copie.
`npm.cmd run build` construit les assets. La configuration Docker est vérifiable avec
`docker compose -f compose.local.yaml config --quiet` ; image non construite à cette date.

## Preuves et limites
Résultats du 2026-10-03 et recette humaine R01…R13 dans
[le livrable](../docs/01-reprise-identique.md). Les captures locales sont hors Git.
Les cases de résultat humain restent à remplir par le responsable ; un test réussi
ne constitue ni validation de phase ni autorisation de publication.

T05 a reproduit le défaut avant correction (un échec, trois réussites), puis les
quatre cas ont réussi. Le PDF court réel a aussi été téléchargé et rendu :
une page A4 complète. Les scénarios longs sont vérifiés automatiquement avec
canvas/jsPDF simulés ; leur recette humaine reste ouverte.

## Préparation de la préproduction

Depuis le sous-projet, `python -m unittest discover -s tests -p test_preproduction.py`
vérifie six cas fictifs : archive reproductible et candidat conservé, source différente,
asset modifié, chemin hors du lot, fichier non déclaré et lien symbolique. Le cas nominal
répète une restauration locale ; aucune cible ni sauvegarde distante n'est authentifiée.

## Raccordement du cockpit

Depuis le sous-projet, `node tests/check-cockpit.mjs` applique le normaliseur du
moteur Projet au suivi réel. Il vérifie la carte de la PR nº72 en phase 0, son état
observé, la disponibilité initiale de la fiche d'itération et la distinction entre
étape réelle et phase formelle. Ce contrôle est exécuté dans la CI Passeport Immo.
