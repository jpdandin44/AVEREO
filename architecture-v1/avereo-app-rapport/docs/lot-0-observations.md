---
project: avereo-app-rapport
document_type: specification
title: Lot 0 — ordre et présentation des observations
status: active
version: git
created: 2026-11-12
updated: 2026-11-17
owner: jpdandin
tags: [rapport, observations, protocole, word]
---

# Lot 0 — ordre et présentation des observations

Le complément du 17 novembre à PR168 présente désormais le libellé partagé
**Conseils de l’expert**. [Décision et périmètre actuels](profils-professionnels.md#libellé-de-prestation--17-novembre).
Les critères et preuves ci-dessous conservent leur état du 12 novembre pour le
vocabulaire ; le contenu des conseils et les règles d’ordre restent conservés.

## Cadrage

Ce document est la source des critères et de la qualification du complément demandé après le premier candidat Habitologue. Il précise les évolutions de libellé et de catalogue par rapport au [candidat précédent](profil-habitologue.md), dont les preuves restent historiques. Le [suivi canonique du cockpit](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>) conserve les candidats, décisions et prochaines actions.

La branche locale est `feat/rapport-lot0-observations`, dans `C:/Users/examg/Documents local/avereo-rapport-v12-habitologue`, issue de `f48a3a9ed03984b101b313cb3f40ea626bb4a95e`. La PR #148 et son candidat restent distincts et inchangés. La PR complémentaire et l'empreinte du candidat présenté sont enregistrées dans le suivi canonique ; la revue de #148 ne s'étend pas à ce complément.

### Critères fonctionnels

- Le libellé exact est **Conseils habitologue** pour toutes les observations, quel que soit le profil. Les textes existants restent dans `actions` ; les champs Constat et Explications sont conservés.
- Une nouvelle création propose uniquement **Visite Globale** et commence dans cette catégorie. Le type technique est masqué dans le catalogue de création ; un ancien dossier technique conserve sa catégorie, ses sous-catégories et ses données à l'ouverture.
- Pour Visite Globale, les numéros suivent **Eau → Air → Terre → Feu → À classer**. Une phase désactivée garde ses observations et un constat non classé n'est jamais rattaché automatiquement. Les autres catégories gardent l'ordre de leur tableau.
- Dans une même phase, l'utilisateur réordonne les fiches avec la poignée de glissement, les boutons Monter/Descendre ou le sélecteur de numéro. Le glissement entre phases est refusé ; changer le rattachement métier reste une action distincte dans la fiche. Une vue compacte facilite le déplacement, sans supprimer les champs masqués.
- Les numéros globaux sont calculés depuis l'ordre d'affichage. Ils ne deviennent jamais des identifiants stockés : photos, textes, conseils, décisions, sélection client et repères restent liés aux identifiants existants.
- L'écran, les menus de repérage et de sélection client, les plans, les légendes et les Word expert/client utilisent le même ordre. Le client est filtré **après** ce tri global : les constats retenus gardent leurs numéros, avec des trous si nécessaire. Un constat exclu ne doit apparaître ni dans le texte, ni dans les plans, ni dans les légendes.
- Un déplacement suivi d'un export/import JSON doit conserver tous les champs, images, coordonnées et références ; seul l'ordre volontaire des observations de la phase concernée change.

Le traitement des photos est un lot parallèle confié à Claude Code, distinct de ce lot 0. La conservation d'un original privé dans CONNECT et un éditeur photo sont prévus, mais ne sont pas implémentés ici. Aucun PDF natif, planning Projet, changement d'organisation ou de droit ne fait partie de ce candidat.

## Développement local

### Composants et stockage

`observationOrder.js` centralise le tri non destructif pour l'affichage, la numérotation dérivée et le déplacement dans les emplacements du tableau appartenant à une même phase. `App.jsx` l'utilise pour les fiches, la vue compacte et la poignée fondée sur les événements de pointeur. `ObservationPlans.jsx`, `observationPlans.js`, `ReportDeliveryOptions.jsx`, `DecisionSupportPanel.jsx`, `reportHtml.js` et `reportDelivery.js` consomment le même ordre. `reportDocx.js` reprend les numéros via les fonctions de repérage existantes.

Le tri d'affichage ne réécrit pas le tableau importé. Un déplacement explicite change son ordre dans la phase ; les objets et identifiants sont conservés. Aucun champ de numéro, nouvelle route, table, migration SQL ou dépendance n'est ajouté. Le libellé est partagé dans `reportProfiles.js` ; le masquage du type technique relève du catalogue dans `reportClassification.js`, et la création Visite Globale est initialisée dans `App.jsx`.

La délégation des plans et restitutions est conservée dans le [compte rendu de Claude Code](delegation-ordre-resultat.md) et son [prompt borné](../prompts/delegation-ordre-observations.md). Les contrôles de délégation et ceux de l'intégration finale sont distingués ci-dessous.

### Qualification réalisée par Codex

État local vérifié après corrections :

- **135 tests Node réussis**, puis **build complet Vite réussi**. Les résultats de Claude dans son compte rendu restent une preuve d'exécution séparée.
- Dans le navigateur, déplacement réel par poignée, boutons et sélecteur exercés ; glissement entre phases refusé. La capture `ordre-eau-final.jpg` montre l'ordre final des fiches Eau. Nouveau dossier sans carte technique et réouverture d'un ancien dossier technique contrôlés séparément.
- Export JSON puis réimport : champs originaux de chaque observation conservés exactement ; décision et sélection client inchangées. Le tableau stocké de la fixture reste `f, e2, t, e1, a, old` après le déplacement, et l'affichage dérivé devient `e2, e1, a, t, f, old`.
- Les deux DOCX natifs ont été inspectés dans leur structure OOXML. L'expert suit **1 Eau B, 2 Eau A, 3 Air, 4 Terre, 5 Chauffage, 6 non classé**. Le client conserve **1 Eau B et 5 Chauffage**, sans contenu du constat exclu. Médias incorporés et cohérence des numéros contrôlés.
- Fermeture de l'onglet de recette puis ouverture d'un nouvel onglet sur `http://127.0.0.1:5183/` : Reprendre retrouve le dossier, l'ordre Eau B / Eau A, les six numéros et les coordonnées des deux repères. Preuve `reouverture-nouvel-onglet.txt` et capture `ordre-nouvel-onglet.jpg` dans l'archive privée.
- Rendu Microsoft Word puis PDF de contrôle : **15 pages expert et 5 pages client inspectées** en planches ; plans et fiches numérotées examinés aussi en pleine page. Numéros et légendes concordent, seul le repère client retenu est visible, champs Constat / Explications / Conseils habitologue lisibles. Aucun chevauchement ni contenu tronqué détecté sur ce cas fictif. Le générateur conserve ses sauts de page existants ; la page finale d'aide à la décision expert est peu remplie. Ces PDF sont des preuves de contrôle, pas une nouvelle fonction d'export PDF de l'application.

Les preuves de recette sont privées, hors Git : [archive du lot 0](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-lot0-observations-20261112/>), notamment [comparaison JSON et Word](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-lot0-observations-20261112/verification-donnees-word.json>) et [ordre Eau final](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-lot0-observations-20261112/ordre-eau-final.jpg>). Les fixtures sont fictives.

### Limites et prochaine vérification

Les contrôles ci-dessus portent sur une fixture fictive à six observations ; ils ne remplacent pas la revue métier de rapports réels ni un essai mobile du glissement. Le renderer LibreOffice n'étant pas installé, le rendu utilise Microsoft Word et les PNG issus de son PDF de contrôle, conservés hors Git dans `C:/Users/examg/Documents local/livraisons-avereo/rapport-lot0-observations-20261112/`.

La sauvegarde en ligne et la nouvelle session CONNECT ne sont pas rejouées sur ce candidat local. Les preuves antérieures de copie entre deux comptes fictifs restent valides pour leur propre version et ne sont pas réattribuées au lot 0.

## Préproduction

### Livraison du 13 novembre 2026

La PR149 est fusionnée sous `be54aa7d945ead50f4c3ee1a4edb18372b32e3e6` ; ses arbres Rapport et composants partagés sont identiques au candidat qualifié `17ed70698d0d322658f666f4679cead4cf4b15bc`. CI et policy réussies sur la tête acceptée `7c8067f`. Sur demande explicite du responsable, le paquet authentifié déjà vérifié est promu sans reconstruction : quatre fichiers statiques seulement (entrée HTML, JavaScript et CSS principaux, module Word). L'API, les sas CONNECT, RGA, le catalogue Missions, le menu du compte et la configuration privée existants sont conservés.

Sauvegarde fraîche des 187 fichiers hébergés et de la configuration privée ; installation et restauration répétées sur copie privée. Les 17 dossiers en base disposent d'une sauvegarde privée relue à l'identique ; aucune restauration de base n'est exécutée. Après installation, les quatre empreintes sont vérifiées, les 186 fichiers préexistants hors remplacement restent identiques, ainsi que les 17 lignes intégrales (propriétaires inclus), la configuration et les fichiers de production. Aucune écriture SQL de livraison.

[Entrée de revue : CONNECT préproduction → Rapport](https://connect-preprod.avereo.fr/?app=rapport). Sans authentification, la racine redirige vers CONNECT (303) et l'API des dossiers refuse l'accès (403). Le lancement authentifié, la liste en ligne et la reprise du brouillon local existant fonctionnent. Les champs Explications / Conseils habitologue, les commandes de numérotation et la vue compacte sont observés sans erreur console. Aucun champ de dossier n'est modifié, aucun JSON importé et aucune nouvelle sauvegarde en ligne effectuée pendant ces contrôles.

Le suivi canonique `rapportV12CadrageProfils20261112.lot0Observations20261112.preproduction20261113` conserve les preuves, le retour arrière et la prochaine action. [Reçu de livraison](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr149-preproduction-20261113/delivery.json>) · [Contrôles navigateur et limites](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr149-preproduction-20261113/browser-verification.json>).

Ces contrôles de disponibilité ne remplacent pas la recette fonctionnelle complète hébergée : réorganisation, Word, sauvegarde/réouverture serveur et scénario à deux comptes restent à recetter sur ce candidat avant de lui attribuer ces résultats. Aucun avis métier ou accord de production ajouté.

## Mise en production

Aucune livraison ni ouverture effectuée pour ce lot. Le merge, les livraisons et les accords applicables restent distincts des tests locaux. Les contrôles après livraison et la préparation de l'itération suivante seront rattachés au suivi canonique si ce candidat est promu.
