---
project: avereo-app-rapport
document_type: functional-specification
title: Terrain et bâti dans Protocoles et Observations
status: active
version: git
created: 2026-11-14
updated: 2026-11-14
owner: jpdandin
tags: [rapport, terrain, cadastre, word, recette]
---

# Terrain et bâti

## Cadrage

Le responsable confirme le 14 novembre **T1, T2… pour le terrain, numéros du bâti conservés, fil conducteur horizontal**, et demande d'alléger Site. Cette révision remplace l'interface Site du premier candidat de la même [PR158](https://github.com/jpdandin44/AVEREO/pull/158). Le titre « Intervenant » reste inchangé.

### Retour de revue — organisation Protocoles et Observations

L'organisation est implémentée : bloc **0 · Le terrain de la propriété**, cadre vert extérieur, contenant un groupe **Bâti**, cadre rouge, avec les quatre phases en ligne. Numéros, noms et états complètent les couleurs. Sur écran étroit, le fil défile dans son cadre sans passer en colonne.

Source opérationnelle : bloc rapportV12CadrageProfils20261112.environnementTerrain20261114.horizontalRevision20261114 du [suivi canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>). Les critères T-01–04 et DC/W affectés restent issus du [cadrage Philippe](<C:/Users/examg/Documents local/Habitologue/Opportunité_Connect/docs/rapport-v1-2/cadrage-retours-philippe.md>). Revue humaine et accords de merge/livraison restent distincts des preuves techniques.

Le candidat précédent a9c8b8c, ses 194 tests et ses Word/PDF restent historiques dans [l'archive précédente](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-terrain-20261114>) ; ils ne qualifient pas cette révision horizontale.

## Développement local

### Parcours

1. Choisir le profil explicite **Habitologue** dans Dossier. Site conserve identification, localisation, cadastre, risques, relief et notes existants ; la rubrique ajoutée « Contexte Environnement / Terrain » en est retirée.
2. Dans **Protocoles**, suivre 0 Terrain puis Bâti : 1 Eau / 2 Air / 3 Terre / 4 Feu. Retenir les points de visite ; suspendre un bloc conserve sa saisie.
3. Dans **Observations**, ajouter les constats Terrain avant le groupe Bâti. Les fiches utilisent les mêmes champs, explications/liens, conseils habitologue, photos et éditeur que les observations existantes. Dictée et originaux privés restent liés aux accords/configurations existants.
4. Dans **Repérage sur plans et coupes → Préparer le fond cadastral du terrain**, confirmer le lieu dans Site, cadrer/zoomer la propriété puis choisir **Utiliser cette vue pour les observations du terrain**. Sélectionner la nouvelle vue et placer les repères. Sans carte, continuer la saisie et importer un fond PNG/JPEG.
5. Changer l'ordre par le numéro, Monter/Descendre ou glissement dans le même groupe. Terrain produit T1/T2… ; le bâti suit Eau/Air/Terre/Feu puis À classer sans compter le terrain. Identifiants et associations restent stables.
6. Sauver en ligne et rouvrir depuis la liste serveur dans une nouvelle session. Export permet jusqu'à **trois observations au total**, Terrain et Bâti confondus, pour la synthèse client. L'expert reprend les constats. Vérifier les deux Word.

Les anciennes notes ne sont pas converties : si le champ racine contexte_exterieur existe, le volet replié **Notes de terrain déjà saisies — conservées dans le dossier** dans Observations/Terrain permet de les relire/éditer. Restitution non numérotée et ancien choix client explicite conservés, distincts des trois constats. Un nouveau dossier ne crée pas cette ancienne rubrique.

### Données et composants

| Élément | Contrat |
| --- | --- |
| habitologieProtocol.js / VisitGuide.jsx | Bloc terrain facultatif avec quatre contrôles de catalogue, suspension sans suppression, disposition horizontale. Anciens états des quatre phases conservés. |
| observations[].phase_habitologie = terrain | Même tableau et identifiants que les constats existants ; aucun tableau parallèle ou numéro stocké. |
| observationOrder.js | Numéro dérivé partagé par fiches, choix client, aide à la décision, plans et Word : chaîne Tn pour Terrain, nombre pour Bâti. Déplacement limité au groupe. |
| ObservationPlans.jsx / CadastralCapture.jsx | Préparer une vue fixe puis repérer. Résultat tardif ignoré si dossier/référence/lieu changé ; sauvegarde bloquée pendant le transfert. |
| cadastralCapture.js | Seules tuiles publiques IGN/DGFiP, sans cookies ni données du dossier dans les URL. PNG avec attribution, date, nord et repérage indicatif. |
| plans[].kind = cadastre | Type admis côté client et PHP, en plus de niveau/coupe. cadrage conserve centre, zoom, emprise/date ; localisation rattache la capture au lieu du dossier. |
| observations[].reperes | Identifiant de vue et positions normalisées ; fonds/repères précédents conservés lors d'un nouveau cadrage. |
| EnvironmentContext.jsx / environmentContext.js | Compatibilité de l'ancien contexte, uniquement dans le volet de reprise d'Observations. Photo simple historique et compteur conservés. |
| reportHtml.js / reportDelivery.js | Labels Tn/bâti partagés ; filtre client et fond annoté cohérents avec les constats exportés. |
| testReportCopy.js | Structure expurgée : seuls choix de catalogue conservés, sans textes, photos, fonds cadastraux ou ancien contexte. |

L'affichage Terrain concerne le profil Habitologue explicite ou un dossier contenant déjà protocole/constats terrain. Les autres profils conservent le parcours existant ; changer de profil n'efface rien. Repérage indicatif : aucune limite juridique ou mesure de parcelle.

Une capture ajoute une **nouvelle vue fixe**, sans remplacer les anciennes. Le zoom de consultation ne change pas les positions. Bornes existantes : 20 vues, 4 Mio/image, 12 000 px/côté, 24 millions de pixels, dossier complet 50 Mio. Capture : 2000 × 1200 px maximum plus attribution, zoom 3–20 (tuiles natives au plus 19), 100 tuiles maximum, lots de quatre requêtes, délai 25 secondes. Erreur explicite et import manuel possible. Aucune nouvelle route, table, migration SQL, permission ou activation d'originaux privés.

### Qualification effectuée

Preuves : [archive de la révision](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-terrain-horizontal-20261114>) et [exports/lectures Word](<C:/Users/examg/Documents local/avereo-rapport-terrain-qa-20261114>). Données fictives ; capture sur une carte publique, sans dossier client réel.

| Vérification | Résultat et portée |
| --- | --- |
| Règles client | **202 tests Node réussis**, dont huit nouveaux : numéros, déplacement limité, Word/client, suspension, structure expurgée, géométrie des tuiles et rattachement tardif. |
| PHP et compilations | **13 contrôles plans/repères** et téléchargement complet réussis ; builds sync=false/true, 150 fichiers chacun. Avertissement existant sur le poids du module principal. |
| HTTP/PHP/MariaDB locaux | **38 contrôles réussis** : comptes fictifs séparés, octets exacts, nouvelle session signée, copie indépendante, refus croisés et propriétaire source conservé. CONNECT/OAuth hébergé non rejoué. |
| Navigateur | Site allégé, fil horizontal, Terrain T1/T2 et bâti 1–12 ; suspension, ajout/suppression ciblés et ordre contrôlés. Capture publique IGN réelle, troisième vue, placement/déplacement et sauvegarde réussis. |
| Reprise | 14 constats, 4 photos, 3 plans ; JSON complet identique après nouvelle session sans brouillon. Déplacement final de T2 sauvegardé puis rouvert du serveur. Source exacte inchangée ; brouillon initial restauré avec empreintes vérifiées. |
| Écran étroit | Largeur simulée 390 px : phases à la même hauteur, défilement interne, aucun débordement horizontal du document. Appareil physique non qualifié. |
| Word expert/client | Lecture d'ensemble native des **25 pages expert / 10 pages client**, sans réparation. Après écartement de T2 : expert équivalent en contenu/mise en page hors identifiants générés et image cadastrale remplacée, image finale inspectée séparément ; client final relu nativement. Textes/liens/photos/plan et signature expert conservés ; labels client **T1, 2, 9**, T2 exclu des constats/repères client. |

DOCX finaux conservés sans modification. Word les ouvre en lecture protégée, protection conservée. **Aucune nouvelle conversion PDF pour cette révision.** Le client existant n'a pas de signature. Lecture d'ensemble et contrôles XML/médias ne valent ni revue métier ni recette PDF hébergée.

### Revue à effectuer

[Revue locale](http://127.0.0.1:5191/fixture/) → compte fictif A → ouvrir **RECETTE-TERRAIN-HORIZONTAL-INTERFACE-20261114** dans la liste serveur. Utiliser la liste, non Reprendre : le brouillon antérieur est restauré. Tester Protocoles, Observations/cadastre, ordre, sauvegarde/reprise et les deux Word. Base temporaire ; JSON fictifs archivés pour reprise après arrêt.

Relance depuis la racine Rapport : python -X utf8 tests/report-files-http.py --fixture CHEMIN_JSON_FICTIF --receipt CHEMIN_RECU_JSON --serve --port 5191. PHP, Docker actif et image MariaDB 11.4 requis. [Préconditions](../tests/README.md).

## Préproduction

Non engagée et non autorisée pour cette révision. Après revue/accord applicable : qualifier paquet et retour arrière, rejouer sauvegarde/reprise dans une nouvelle session CONNECT, propriétaire source, capture et deux restitutions sur dossiers fictifs. Frontend et PHP du type cadastre doivent être installés ensemble. La recette photo PR156 conserve ses preuves propres.

## Mise en production

Non engagée et non autorisée. Revue, merge, livraison et ouverture restent distincts. Attentes issues de l'Écoute client, autres profils, interventions/planning Projet et activation des originaux privés restent dans leurs lots.
