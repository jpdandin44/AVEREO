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

## Trois suites automatisées

| Suite | Périmètre |
|---|---|
| [planning-core.test.mjs](planning-core.test.mjs) | 15 tests : charges décimales, jalons, capacité, modes de calendrier, week-ends et changement d'heure, validation IDs/dépendances/nombres/dates, CSV, JSON complet, protection des formules et limites de volume/horizon |
| [planning-interactions.test.mjs](planning-interactions.test.mjs) | 4 tests : redimensionnement selon la capacité, exclusion du week-end, déplacement court d'une tâche fractionnaire et déplacement d'un jalon au zoom semaine |
| [planning-local.test.mjs](planning-local.test.mjs) | 15 tests comptés avec les sous-tests : import invalide sans écrasement, quota, modification concurrente, brouillon corrompu, reprise JSON complète, copie précédente, préchargement local du pilote, reprise utilisateur et hostname distant |

Depuis `frontend/`, lancer `npm.cmd test`. Le build appelle aussi
`check:planning` puis les trois suites, donc la CI existante les exécute.
Le contrôleur est testé dans une VM avec environnement navigateur simulé.
Les interactions exercent le code de déplacement et de redimensionnement avec
des événements simulés ; elles ne remplacent pas une recette tactile.

La commande `npm.cmd run check:planning` vérifie séparément l'alignement de la
source du pilote et de ses dérivés. Les résultats datés sont centralisés dans
[l'audit](../docs/source-audit.md).

## Recette navigateur effectuée

Dans le navigateur intégré Codex (IAB), `http://127.0.0.1:5186/` :

- Vérification du préchargement des six lots et du total de 29,4 jours-personne,
  avec fin au 30 octobre 2026 ; inspection des vues Gantt jours et semaines.
- Modification de durée et d'avancement, puis rechargement conservant le brouillon.
- Import du CSV pilote réel par le sélecteur de fichiers et confirmation du
  remplacement, rétablissant le planning initial.

## Compléments de recette ouverts

Le bouton d'export JSON a été cliqué, mais le téléchargement n'a pas été observé
par l'instrumentation IAB dans le délai de cinq secondes. Vérifier manuellement
la récupération du fichier et sa reprise dans l'interface ; l'aller-retour
JSON complet est déjà couvert automatiquement.

L'import XLSX n'a pas été exécuté dans l'interface. Compléter aussi la recette
d'annulation d'un remplacement, le rendu de texte HTML hostile et les
interactions tactiles. Les erreurs de quota, stockage corrompu et concurrence
sont couvertes automatiquement, sans simulation manuelle dans IAB.

Cette recette ne qualifie pas l'authentification ni la publication hébergées.
