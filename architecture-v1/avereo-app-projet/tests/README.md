---
project: avereo-app-projet
document_type: test-index
title: Recette du planning local Projet
status: active
version: git
created: 2026-09-19
updated: 2026-11-07
owner: jpdandin
tags:
  - projet
  - tests
---

## CI dédiée et checkout neuf

Le [workflow de qualification privé](../workflows/ci-developpements.md) référence les commandes exactes, fixtures, sorties et limites. Le sas natif est généré avant les tests ; `development-ci.test.mjs` refuse SHA différent, source non committée et prétention de livraison. Le contrôleur CI construit séparément le paquet, compare ses empreintes et vérifie que données et public ne sont pas modifiés. Aucun compte ni suivi réel utilisé.

## Reprise — session Projet et préparation de préproduction

Les tests `development-session.test.mjs` exercent cookie natif, broker/fournisseur, politique de période/révocation, HTTPS/Host, configurations/clé et copie PHP. `development-hosted-package.test.mjs` vérifie paquet/empreintes/défaut fermé, parcours HTTP et révocation des assets/pièces, ainsi que l'absence de menu sans capacité positive. Identités et données fictives uniquement ; pas de kernel Drupal/recette hébergée. Les suites restent incluses dans `test:developments` et `build`. [Guide](../docs/preproduction-developpements.md).

## 7 novembre — pont et stockage, état local courant

Depuis `frontend/` : `npm.cmd run test:developments` (**64 tests**) puis `npm.cmd run build` (**260**, 21 fichiers publics). Tests ajoutés : rôle/interopérabilité PHP, refus avant données, intégrité/séquence/restauration/quotas/preuves, ACL persistantes Windows réelles et isolation des cookies entre ports locaux. Chaque test de dossier possède sa fixture avec retrait sous garde de chemin ; aucun stockage réel supprimé. Côté CONNECT : suites 41/14/40, contrat et limites dans le [guide](../docs/pont-stockage-local.md). Aucun résultat hébergé ou humain déduit.

# Recette du planning local Projet

## Raccordement Recherche/RGA et fraîcheur locale

`development-freshness.test.mjs` couvre isolation du sous-suivi RGA, refus d'écriture et de sélecteurs dangereux, phase française Missions, qualification documentaire sans candidat inventé, dates avec fuseaux, changement immédiat d'empreinte après modification et tableau/liste cohérents. Les tests modifient seulement leurs fixtures ; les vrais suivis restent consultatifs. Recette navigateur : Recherche, RGA, preuves déclarées, source exacte et retour après rechargement. La vérification des hôtes et de GitHub n'est pas réalisée.

## Portefeuille du 7 novembre après reprise

Les tests `development-portfolio.test.mjs` couvrent sources partagées, absence de suivi, Git local/dirty, environnement de livraison explicite, dates, mappings et base confinée des pièces. `development-private-directory.test.mjs` couvre la restriction Windows et le refus sans identité qualifiée ; `development-ui.test.mjs` reproduit la concurrence des effets du premier chargement. Le test HTTP supplémentaire refuse toute revue sur une source consultative. Les anciennes preuves restent distinctes.

Recette sur vrais suivis autorisée en lecture seule : douze entrées, recherche, lecture de preuve, quatre phases, décisions désactivées et reprise après rechargement. Aucun vrai critère approuvé. [Guide du portefeuille](../docs/cockpit-portefeuille.md).

## Relecture documentaire du 7 novembre — pas de nouvelle recette

La [matrice de confidentialité préparatoire](../docs/raccordement-developpements-local.md#6-matrice-de-confidentialité-à-recetter-avant-les-données-réelles) relie les refus attendus aux contrôles du code et aux scénarios fictifs existants. Les 32/228 résultats ci-dessous datent du 6 novembre ; ils ne sont pas rejoués pour la clôture documentaire. Aucun compte réel ou profil CONNECT n'est recetté. Le code, les tests et la configuration restent inchangés ; les modifications de documentation sont vérifiées séparément. L'identité/rôle global réel est un blocage avant les sources réelles.

## Module Développements local privé

`npm.cmd run test:developments` depuis `frontend` exécute 32 tests : configuration fermée, propriétaire unique, autre administrateur global et autres profils refusés, données/ressources privées inaccessibles anonymement, origine, session, CSRF, deux adaptateurs, mappings historiques, critères et preuves, conflits, fraîcheur, écritures sur fixtures et sauvegarde/restauration octet pour octet.

`npm.cmd run build` exécute 228 tests et le contrôle de l'artefact public (21 fichiers, absence des routes et données de développement). Les anciennes régressions du Gantt restent incluses. Une recette navigateur locale a ouvert les quatre phases, une preuve, enregistré une décision fictive puis retrouvé cette décision après rechargement ; une preuve en échec ne permet pas de valider et la seconde source reste consultative. Le redémarrage du lanceur refuse l'ancien cookie. Cela ne qualifie pas l'identité réelle CONNECT, le mobile, la CI distante ni un hébergement. [Guide et limites](../docs/developpements-local.md).

## Interface simple et vues longues

`task-details.test.mjs` vérifie section simple/statut distincts, preuve historique et date masquée conservées, invalidation d’une vérification après édition, résultats multiples et abandon de brouillon. `planning-groups.test.mjs` vérifie recherche descriptive sans accents, filtre de statut, données inchangées, alignement des densités et périodes réelles (février 2028, années de 365/366 jours, rendu borné). Les tests historiques de gestes restent exécutés.

`python tests/planning-http.py` couvre aussi les nouvelles préférences via `workspace_http.py` : persistance, ancien client, ancien catalogue non réécrit, valeurs invalides et planning inchangé. Les [observations locales](../docs/source-audit.md) distinguent cette preuve des futurs contrôles hébergés.


## Sujets, priorités et colonnes

`planning-core.test.mjs` vérifie les champs optionnels et leurs échanges JSON/CSV, les propositions non persistées et les jalons. `planning-groups.test.mjs` vérifie les filtres sans décalage des dates, les groupes non initiaux, les dépendances masquées et les largeurs hors données projet. `planning-http.py` vérifie la conservation serveur et les refus sans écriture. La recette visuelle et ses limites figurent dans [l’audit](../docs/source-audit.md).


## Préparation d’un import privé

`node --test tests/private-import.test.mjs` depuis la racine applicative vérifie la copie exacte, le manifeste, l’absence d’écrasement, le refus des champs perdus et dépendances invalides, et les destinations Git/publiques ou masquées par une jonction. Les fixtures sont fictives et supprimées après test. L’import réel et sa relecture suivent la [procédure](../workflows/import-prive.md).


## Sauvegarde privée du Gantt

`node --test tests/planning-online.test.mjs` exerce le contrôleur réel avec deux
stockages indépendants et deux onglets, concurrence, réseau interrompu, quota,
reprise et absence de fuite du brouillon lors d'un refus d'accès.
`python tests/planning-http.py` lance PHP sur boucle locale avec identités et
secret fictifs : droits, CSRF, JSON, taille, révision, récupération, corruption.
`online-delivery.test.mjs` répète installation et restauration de fichiers fictifs
et refuse l'ajout d'un sas au paquet. Ces tests sont intégrés à la CI Projet.


## Gantt préproduction — 28 octobre 2026

Les suites `planning-groups.test.mjs` et `planning-moves.test.mjs` exercent le
rendu réel, les synthèses/replis, le repère du jour, les candidats de dates/ordre,
leurs refus et annulations, les dépendances et la conservation JSON.
`preprod-delivery.test.mjs` teste l'installateur sur des fichiers fictifs :
validation d'archive, installation/restauration, accès conservés et refus de dérive.
La création de nouveaux fichiers avec modes POSIX est vérifiée en CI Linux ;
sur Windows, la fixture garde les fichiers préexistants et leurs modes natifs.
Les preuves de livraison et de recette réelle restent distinctes de ces tests.

Recette ciblée du 28 octobre dans Chrome connecté : référence de 45 tâches
importée dans un brouillon vide, repli avec synthèses et repère du jour constatés,
export et reprise après rechargement contrôlés. Les fichiers avant/après sont
strictement identiques ; détails et limites dans le
[reçu navigateur](../data/preprod-gantt/browser-recipe.json).
Les scénarios futurs clients/projets et stockage serveur sont proposés dans les
exigences ; aucune suite ne prouve encore leur implémentation.

## Revue des phases

[review-workflow.test.mjs](review-workflow.test.mjs) couvre les transitions,
preuves, critères, conflits, sauvegardes, reprise, accès fichiers et journal.
[review-http.test.mjs](review-http.test.mjs) vérifie le service sur boucle
locale : lecture/écriture, export, origine, Host, jeton, type et taille du corps.
Toutes les mutations utilisent des fixtures temporaires, sans le suivi réel.

`npm.cmd run test:review` exécute ces suites ; elles sont aussi incluses dans
le build et la CI existante. `npm.cmd run check:release` inspecte le build :
données et routes de revue exclues, assets du planning et sas conservés.
Résultats et recette navigateur :
[recette-revue-locale.md](../docs/recette-revue-locale.md).


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

## Progression des phases

[review-progress.test.mjs](review-progress.test.mjs) vérifie les compteurs,
livraisons historiques, autorisations issues du service, disponibilité par
livrable, blocages, dates, accords antérieurs et activité. La suite couvre aussi
les titres, descriptions et preuves des documents prévus, les erreurs de lecture
et les messages de préparation. Ses douze tests sont inclus dans le build ;
ils n'écrivent aucun journal. La recette de l'affichage
est consignée dans les compléments du 24 septembre de
[recette-revue-locale.md](../docs/recette-revue-locale.md).

## Actualisation du suivi

[review-refresh.test.mjs](review-refresh.test.mjs) couvre la conservation des
brouillons et sélections, l'invalidation ciblée des attestations par changement
de preuves/critères/dépendances, la détection d'un fichier modifié sans toucher
au JSON et la protection contre un GET périmé après POST. Les sept tests utilisent
des snapshots et un dossier temporaire ; ils ne modifient pas les journaux réels.
La cadence et les comportements de l'interface restent à vérifier séparément
dans le navigateur selon [la recette](../docs/recette-revue-locale.md#complément-du-24-septembre--livrables-attendus-et-actualisation).
