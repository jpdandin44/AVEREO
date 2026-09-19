---
project: avereo-app-projet
document_type: test-index
title: Recette du planning local Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-19
owner: jpdandin
tags:
  - projet
  - tests
---

# Recette du planning local Projet

Les résultats réels sont consignés dans
[docs/source-audit.md](../docs/source-audit.md). Une liste de scénarios ne
constitue pas une preuve d'exécution.

## Suites automatisées

| Suite | Périmètre |
|---|---|
| [planning-core.test.mjs](planning-core.test.mjs) | Charges décimales, jalons, capacité, calendrier, changement d'heure, IDs/dépendances/nombres/dates, CSV/JSON, limites ; rétrocompatibilité des fiches, preuves et validations, matrice des risques, clôture justifiée et volume UTF-8 |
| [planning-interactions.test.mjs](planning-interactions.test.mjs) | 4 tests : redimensionnement selon la capacité, exclusion du week-end, déplacement court d'une tâche fractionnaire et déplacement d'un jalon au zoom semaine |
| [planning-local.test.mjs](planning-local.test.mjs) | Import sans perte, quota, concurrence, brouillon corrompu, JSON et copie précédente ; enrichissement des fiches, conservation des modifications, source indisponible, réimport tabulaire et identification du pilote |
| [task-details.test.mjs](task-details.test.mjs) | Fiche modifiée/annulée, enrichissement reçu pendant son ouverture, sauvegarde des détails et preuves, réalisation distincte de validation, nouvelle validation après modification de preuve, qualification et clôture des risques, IDs et échappement des textes |

Depuis `frontend/`, lancer `npm.cmd test`. Le build appelle aussi
`check:planning` puis toutes les suites `tests/*.test.mjs`, donc la CI existante les exécute.
Le contrôleur est testé dans une VM avec environnement navigateur simulé.
Les interactions exercent le code de déplacement et de redimensionnement avec
des événements simulés ; elles ne remplacent pas une recette tactile.

La commande `npm.cmd run check:planning` vérifie séparément l'alignement de la
source du pilote et de ses trois dérivés, dont le document Markdown des étapes.
Les résultats datés sont centralisés dans
[l'audit](../docs/source-audit.md).

## Recette navigateur effectuée

Dans le navigateur intégré Codex (IAB), `http://127.0.0.1:5186/` :

- Vérification du préchargement des six lots et du total de 29,4 jours-personne,
  avec fin au 30 octobre 2026 ; inspection des vues Gantt jours et semaines.
- Modification de durée et d'avancement, puis rechargement conservant le brouillon.
- Import du CSV pilote réel par le sélecteur de fichiers et confirmation du
  remplacement, rétablissant le planning initial.
- Inspection de la première fiche L0, de ses actions, critères, étapes et risques,
  puis ouverture du document des étapes depuis son bouton.
- Refus d'une validation d'étape sans preuve avec message dans la fiche ;
  réalisation et preuve temporaire conservées après enregistrement/rechargement,
  puis données de recette remises à leur état initial.
- Qualification temporaire d'un risque et statut Sous surveillance conservés
  après rechargement ; score et compteur du registre observés, puis état initial restauré.

## Compléments de recette ouverts

Les parcours suivants restent à compléter dans le navigateur, indépendamment
de leur couverture automatisée. Les résultats détaillés et le dernier contrôle
des préqualifications proposées sont centralisés dans l'audit :

- Reprendre un brouillon du pilote déjà modifié et ajouter les fiches absentes
  sans changer son planning ni ses valeurs de suivi.
- Effectuer une validation d'étape complète avec vérificateur, modifier ensuite
  la preuve validée et constater qu'une nouvelle validation est requise.
- Refuser une clôture de risque non documentée, puis conserver une revue
  explicitement renseignée et vérifier les conditions de résolution/acceptation.
- Exporter/reprendre un JSON complet ; réimporter un CSV de même identité
  et vérifier la conservation locale des fiches, puis distinguer le cas d'un
  nom ou lot modifié.

Cette liste décrit les vérifications attendues, pas des résultats acquis.

Le bouton d'export JSON a été cliqué, mais le téléchargement n'a pas été observé
par l'instrumentation IAB dans le délai de cinq secondes. Vérifier manuellement
la récupération du fichier et sa reprise dans l'interface ; l'aller-retour
JSON complet est déjà couvert automatiquement.

L'import XLSX n'a pas été exécuté dans l'interface. Compléter aussi la recette
d'annulation d'un remplacement, le rendu de texte HTML hostile et les
interactions tactiles. Les erreurs de quota, stockage corrompu et concurrence
sont couvertes automatiquement, sans simulation manuelle dans IAB.

Cette recette ne qualifie pas l'authentification ni la publication hébergées.
