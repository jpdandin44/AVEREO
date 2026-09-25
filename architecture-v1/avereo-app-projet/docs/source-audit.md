---
project: avereo-app-projet
document_type: source-audit
title: Audit et recette du planning Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-25
owner: jpdandin
tags:
  - projet
  - audit
  - recette
---

# Audit et recette du planning Projet

## Revues complémentaires d'une phase — 25 septembre 2026

L'interface lisait uniquement `phase.pullRequest`, ce qui masquait une PR
documentaire conservée dans `reviewFollowUps[].documentationPullRequest`.
Le frontend présente désormais ces compléments dans la phase exacte avec
leur contexte, sans remplacer la carte principale. Il réutilise le normaliseur
PR et dédoublonne les références par dépôt et numéro. Le service d'écriture,
les décisions, leurs preuves et les transitions ne changent pas.

Les trois tests ajoutés couvrent le filtrage strict de la phase, les champs
invalides, le contexte, le dédoublonnage et l'absence de mutation de la source.
Les dix tests PR passent. `npm.cmd run build` réussit avec **144 tests sur 144**,
la cohérence des dérivés du planning, Vite et la vérification des douze fichiers
de l'artefact, sans données ou API de revue. Ces contrôles utilisent des fixtures ;
ils ne valident aucune phase ni aucune PR réelle. L'état GitHub reste un constat
fourni par le chantier connecté et cette correction n'est pas publiée en production.

## Carte de PR par phase — 25 septembre 2026

L’espace de revue affiche facultativement `phase.pullRequest` dans la phase
sélectionnée. Le normaliseur accepte uniquement une URL HTTPS GitHub
cohérente avec le dépôt et le numéro, un état admis, une révision complète
et une date valide. Les éléments de fusion sont facultatifs. L’affichage
signale qu’il s’agit d’un constat du suivi local et ne contacte pas GitHub.
Le journal, les décisions et les transitions du service restent inchangés.

Les sept tests de [review-pull-request.test.mjs](../tests/review-pull-request.test.mjs)
vérifient absence et rétrocompatibilité, préservation de la source, liens
hostiles ou incohérents, champs obligatoires et états de fusion. Ils ne
prouvent pas l’état actuel d’une PR réelle ni sa validation humaine.

`npm.cmd run build` a réussi après cet ajout : **141 tests sur 141**, contrôle
des dérivés du planning, compilation Vite et contrôle de release sur douze
fichiers. L’artefact reste sans données ni API de revue et conserve sas et
planning. Aucun journal réel n’a été utilisé pour les tests automatisés.

Constat navigateur transmis par l’agent principal le 25 septembre : après
**Actualiser** sur le suivi local `127.0.0.1:5192`, la phase Homepage apparaît
« À valider » et sa carte affiche la [PR site #6](https://github.com/jpdandin44/avereo-site-drupal/pull/6)
« Ouverte », le constat du 25 septembre à 09:47 et la révision
`78d0108ff729`. Le lien canonique et les mentions d’absence de synchronisation
GitHub et de validation automatique sont visibles. Les compteurs restent à
trois remises sur sept et deux phases validées sur sept. Ce relevé transmis
consigne le contrôle de l’interface ; aucune image n’a été inspectée pour
cette mise à jour documentaire et aucun test supplémentaire n’est revendiqué.

## Extension locale de revue — 24 septembre 2026

Le wrapper accueille l'espace de revue et le planning existant. Le middleware
Vite de développement peut enregistrer des décisions dans le JSON d'un chantier
connecté. Ce changement reste local, sans API hébergée, MySQL ou qualification
du sas. Résultats et limites dans [recette-revue-locale.md](recette-revue-locale.md).

L'évolution suivante du 24 septembre ajoute les descriptions de livrables
prévus et l'actualisation du snapshot avec conservation des brouillons de revue.
Les attestations sont remises à vérifier seulement si les preuves pertinentes
ou leurs dépendances changent. Le service et les données du planning ne sont
pas modifiés. Les tests, le build et les limites de cette extension sont
consignés dans le [complément de recette](recette-revue-locale.md#complément-du-24-septembre--livrables-attendus-et-actualisation).
Aucune publication ni décision humaine n'est produite par ces tests.

Les sections du 19 septembre ci-dessous restent les preuves historiques
du planning ; elles ne constituent pas la recette de la nouvelle interface.


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
| Lots sans fiche d'exécution | Description, actions, critères et checklist avec réalisation/validation distinctes |
| Qualification globale du lot seulement | Registre de risques détaillés, score explicite et clôture documentée |

Les vues tableau/Gantt/lots/risques restent présentes. Aucune API métier,
base, compte ou secret nouveau. Le lot est implémenté localement et proposé
pour revue dans la [PR #64](https://github.com/jpdandin44/AVEREO/pull/64).
Les contrôles ci-dessous délimitent
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
`data/generated/`, hors de `frontend/public/`. Le build initial inspecté contient dix
fichiers PHP/assets/JavaScript, sans fichier CSV ou JSON du pilote ; le contrôle
du build enrichi à onze fichiers est consigné plus bas. Le code et
les tests limitent aussi le chargement automatique aux hôtes locaux autorisés,
sans remplacer un brouillon existant.

## Résultats du 19 septembre 2026

Contrôles locaux dans le checkout dédié. Les tests automatisés s'exécutent
avec Node.js ; la recette visuelle utilise le navigateur intégré Codex (IAB)
à `http://127.0.0.1:5186/`. Les tests de contrôleur utilisent un environnement
navigateur simulé en VM et ne constituent pas une recette sur tous les navigateurs.

### Planning initial — avant l'extension des fiches

Les résultats de ce tableau qualifient le premier lot de planning local. Les
nouveaux parcours de fiches et risques ont un état de qualification séparé
ci-dessous ; ils ne sont pas couverts implicitement par le build à 34 tests.

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

### Extension descriptions, checklists et risques — contrôles ciblés réalisés

Le schéma de sauvegarde reste en version 1. Les détails absents d'un ancien JSON
deviennent des valeurs vides, sans réinitialisation du suivi. Le contrôleur
complète les fiches absentes et les préqualifications de risques restées dans
leur état initial pour un pilote reconnu ; les conditions exactes sont
dans [data/README.md](../data/README.md). Il conserve les fiches partielles,
relit les modifications effectuées pendant un chargement et refuse l'écrasement
d'une écriture concurrente. Le réimport tabulaire ne conserve les détails déjà
présents que pour le même ID, nom et lot.

La validation humaine et la clôture des risques ont des conditions vérifiées
par le moteur. Elles n'authentifient pas l'identité saisie, ne prouvent pas la
réalité des éléments décrits et ne modifient pas automatiquement la progression
du lot. La source commence avec des étapes non réalisées/non validées et des
risques dont le statut reste À qualifier ; les champs de preuve sont vierges.
La préqualification probabilité/impact ajoutée au pilote est proposée et
argumentée dans le suivi. Elle n'est pas une mesure de probabilité ; le score
proposé ne confirme pas la qualification humaine.

| Contrôle de l'extension | Résultat réellement disponible |
|---|---|
| Tests du moteur seul | 31 tests réussis : rétrocompatibilité, normalisation des détails, preuves et horodatages, matrice 3 × 3 des risques, conditions de clôture, copies indépendantes et limites de volume/caractères/UTF-8, avec calendrier antérieur conservé |
| `generer-planning-pilote.mjs --check` | Réussi après ajout des fiches : six lots, 29,4 jours-personne, 46 étapes et 20 risques ; CSV, manifeste et document Markdown alignés |
| Métadonnées du pilote | Six entrées `taskDetails`, 46 étapes et 20 risques constatés ; probabilité/impact proposés avec justification, statut À qualifier, preuve et date de revue vides. `--check` réussi après régénération de ces propositions |
| Build final et suites intégrées | `npm.cmd run build` réussi après le correctif de concurrence : contrôle des trois dérivés, **99 tests réussis sur 99**, zéro échec, préparation du sas et compilation Vite de 30 modules. `npm.cmd test` exécuté séparément confirme aussi les 99 réussites |
| Contrôles racine et whitespace | `npm.cmd run check` à la racine et `git diff --check` réussis |
| Première fiche dans IAB | L0 affiche 12 étapes et 5 risques ; actions et résultats attendus inspectés visuellement |
| Validation d'étape dans IAB | Une tentative sans preuve est refusée avec message dans la fiche. Une étape réalisée avec preuve temporaire est enregistrée et retrouvée après rechargement, puis remise à son état initial |
| Risque dans IAB | Qualification Moyenne/Majeur et statut Sous surveillance enregistrés puis retrouvés après rechargement ; registre de 20 risques dont 19 à qualifier, score 4 constaté. Données de recette ensuite restaurées |
| Document dans la fiche | Bouton exécuté et contenu Markdown accessible comme texte ; lecture constatée avant la dernière régénération des propositions |
| Affichage des préqualifications proposées dans IAB | Registre de 20 risques ouverts, 20 à qualifier/confirmer et aucun clos ; badge Critique 6/9 proposé et santé À qualifier constatés. Six lots, 29,4 jours-personne et fin au 30 octobre conservés |
| Dernier rechargement de la version corrigée dans IAB | Fiche L0 à 0/12 validations, preuve DA-01 vide et aucune case cochée ; risques affichés à 6/9 proposé. Aucune erreur console constatée ; fiche laissée ouverte pour consultation |
| Fiche ouverte pendant l'enrichissement | Risque d'écrasement détecté en revue puis corrigé : état à l'ouverture mémorisé, nouvelles étapes/risques préservés lors de la sauvegarde sans écraser les saisies de la fiche. Tests de non-régression inclus dans les 99 réussites |
| Inspection de `frontend/dist` | Onze fichiers, aucun CSV/JSON/Markdown du pilote ; `planning-core.js`, `planning-local.js`, `task-details.js` et `legacy-app.html` identiques aux sources par empreinte SHA-256 |
| Documentation de l'extension | Onze documents structurants vérifiés, 44 liens locaux existants, métadonnées présentes, pas de BOM, titres non dupliqués et blocs de code équilibrés |

Un essai intermédiaire du runner avait échoué au niveau fichier sans détail de
sous-test. Cet échec n'a pas été reproduit lors de l'exécution TAP, du test npm
séparé ou du build final ; aucun test n'a été désactivé pour obtenir ces résultats.

Le document [pilotage-etapes.md](pilotage-etapes.md) est généré depuis le JSON
applicatif. Il est servi en `text/plain` et affecté à `textContent` par
`task-details.js`. La route et ce rendu ont été vérifiés par lecture, puis le
bouton a été utilisé dans IAB sur la version du document précisée dans le tableau.

## Limites

Le clic d'export non observé par l'instrumentation ne démontre pas un échec du
téléchargement ; il ne permet pas non plus de l'attester. Le JSON est le format
de reprise complète : paramètres, dates manuelles, descriptions, checklists,
preuves et risques détaillés. Ces détails sont absents du CSV neuf colonnes,
même lorsqu'un réimport conserve ceux déjà présents dans le navigateur.
Les contrôles manuels ouverts restent donc nécessaires avant
de considérer tous les échanges de fichiers qualifiés.

Le local ne prouve ni le sas PHP hébergé, ni DNS/HTTPS, ni la réalisation des
EV métier planifiées. Préproduction et production ne sont pas qualifiées.
Les CDN historiques restent une dépendance réseau ; le fonctionnement
entièrement hors connexion n'est pas établi.

Le déclenchement d'un futur déploiement est expliqué dans
[deployment.md](deployment.md). Aucun déploiement ni migration de données hébergées n'est attesté ici.
