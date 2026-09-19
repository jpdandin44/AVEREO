---
project: avereo-app-projet
document_type: source-audit
title: Audit et recette du planning Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-19
owner: jpdandin
tags:
  - projet
  - audit
  - recette
---

# Audit et recette du planning Projet

## Origine et état initial

`Projet_AVEREO_Pro.txt` a été trouvé dans le ZIP technique de l'intégration
historique. Le HTML est dans `frontend/public/legacy-app.html` et le wrapper
iframe dans `frontend/src/App.jsx`.

Au commit `c6319b9abc118d883802fea14d673d42d8a876a9`, l'audit a constaté :
dates au 6 mai/5 juin 2024 ; premier onglet CSV/XLSX importé avec mapping
approximatif ; durée `0.5` tronquée en jalon ; dates ignorées ; avancement
`1` interprété comme 100 % ; IDs/dépendances insuffisamment contrôlés ;
état seulement en mémoire et `simulateSync()` limité au recalcul.

L'ancienne note rapportait un échec d'exécution npm, absent du PATH à ce
moment-là. C'est un résultat historique, pas le résultat de ce lot.

## Évolutions implémentées localement

| État initial | Évolution |
|---|---|
| Dates figées | Dates début/cible configurables, référence courante réelle |
| Durées tronquées | Charges décimales et modèle séquentiel |
| Dépendances incohérentes tolérées | Validation IDs/références/cycles |
| Remplacement immédiat à l'import | Validation préalable et confirmation |
| État perdu au rechargement | Brouillon versionné, JSON de reprise |
| Exemple dans le HTML | Source unique du pilote et dérivés hors assets publics |

Les vues tableau/Gantt/lots/risques restent présentes. Aucune API métier,
base, compte ou secret nouveau. Le lot est implémenté localement et proposé
pour revue dans une PR brouillon dédiée. Les contrôles ci-dessous délimitent
la qualification obtenue.

## Sécurité et données

La validation précède la mutation : IDs vides/dupliqués, références absentes,
cycles, nombres non finis, durées négatives, dates impossibles et versions JSON
inconnues sont refusés. Les tests vérifient qu'un import invalide conserve
l'état courant et les octets stockés. Le contrôleur avertit en cas de quota,
préserve un brouillon illisible et bloque l'écrasement d'une modification
concurrente issue d'un autre onglet.

Le rendu échappe les textes importés et l'export CSV protège les cellules
pouvant être interprétées comme formules. Les tests CSV couvrent cette dernière
protection ; une recette navigateur avec contenu HTML hostile reste à effectuer.
Les contrôles n'exigent aucun secret.

Le pilote est servi par middleware Vite de développement depuis
`data/generated/`, hors de `frontend/public/`. Le build inspecté contient dix
fichiers PHP/assets/JavaScript, sans fichier CSV ou JSON du pilote. Le code et
les tests limitent aussi le chargement automatique aux hôtes locaux autorisés,
sans remplacer un brouillon existant.

## Résultats du 19 septembre 2026

Contrôles locaux dans le checkout dédié. Les tests automatisés s'exécutent
avec Node.js ; la recette visuelle utilise le navigateur intégré Codex (IAB)
à `http://127.0.0.1:5186/`. Les tests de contrôleur utilisent un environnement
navigateur simulé en VM et ne constituent pas une recette sur tous les navigateurs.

| Contrôle | Résultat constaté |
|---|---|
| `npm.cmd ci --ignore-scripts --prefer-offline` | Réussi : 62 paquets installés |
| `npm.cmd test` | Réussi : 34 tests comptés avec leurs sous-tests, répartis entre moteur (15), interactions (4) et contrôleur (15) ; périmètre dans [tests/README.md](../tests/README.md) |
| `npm.cmd run build` | Réussi après les corrections de glisser-déposer : vérification des dérivés, 34 tests réussis sans échec, préparation du sas puis compilation Vite de 30 modules. Un premier essai avait rencontré un refus d'accès esbuild dans le bac à sable ; le build a réussi hors de cette restriction |
| `npm.cmd run check` à la racine | Réussi |
| Pilote dans IAB | Six lots, charge totale 29,4 jours-personne, début 21/09 et fin calculée 30/10/2026 ; Gantt jours/semaines inspecté visuellement |
| Modification puis rechargement dans IAB | Durée L1 portée à 5,5 et avancement à 1 % : total 29,15 et avancement de la tâche 1 % ; le rechargement conserve la modification |
| Import CSV dans IAB | Fichier pilote réel sélectionné via le sélecteur de fichiers, remplacement confirmé : total rétabli à 29,4 et avancement à 0 % |
| Import XLSX premier onglet | Chemin de code conservé ; aucun import XLSX exécuté dans l'interface pendant cette recette |
| JSON export/reprise | Aller-retour complet testé automatiquement, paramètres et champs normalisés des tâches conservés. Bouton export cliqué dans IAB, mais événement de téléchargement non observé dans le délai de 5 secondes ; récupération manuelle du fichier encore à qualifier |
| Stockage absent, corrompu, quota et concurrence | Tests contrôleur réussis en VM ; reprise après rechargement également constatée dans IAB |
| Import invalide sans perte | Tests moteur et contrôleur réussis. Annulation d'un remplacement dans l'interface : non qualifiée par cette recette |
| Texte importé et export CSV | Échappement présent dans le rendu ; protection contre les formules vérifiée par tests CSV. Recette navigateur avec contenu HTML hostile : non exécutée |
| Routes dev et absence de pilote dans dist | Chargement local constaté ; dix fichiers inspectés dans dist, sans CSV/JSON du pilote ; refus de chargement sur hostname distant testé en VM |
| Front matter, liens et whitespace des Markdown du lot | Réussi : 13 documents, 33 liens locaux existants, métadonnées obligatoires présentes, pas de BOM ni de clôture de bloc manquante ; aucune erreur de whitespace détectée |
| Policy PR prépublication, cases décochées | Réussie avec `--allow-unchecked` et le titre `feat(projet): fiabiliser le planning local et intégrer le pilote` ; cette prévalidation ne remplace pas la validation humaine des cases |

## Limites

Le clic d'export non observé par l'instrumentation ne démontre pas un échec du
téléchargement ; il ne permet pas non plus de l'attester. Le JSON est le format
de reprise des paramètres, dates manuelles et états des risques, absents du CSV
neuf colonnes. Les contrôles manuels ouverts restent donc nécessaires avant
de considérer tous les échanges de fichiers qualifiés.

Le local ne prouve ni le sas PHP hébergé, ni DNS/HTTPS, ni la réalisation des
EV métier planifiées. Préproduction et production ne sont pas qualifiées.
Les CDN historiques restent une dépendance réseau ; le fonctionnement
entièrement hors connexion n'est pas établi.

Le déclenchement d'un futur déploiement est expliqué dans
[deployment.md](deployment.md). Aucun déploiement ou migration n'est attesté ici.
