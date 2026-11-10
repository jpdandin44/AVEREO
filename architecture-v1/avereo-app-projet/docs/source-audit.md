---
project: avereo-app-projet
document_type: source-audit
title: Audit et recette du planning Projet
status: active
version: git
created: 2026-09-19
updated: 2026-11-10
owner: jpdandin
tags:
  - projet
  - audit
  - recette
---

## 10 novembre — Écart qualifié pour les chemins de référence

Complément du module Développements existant : interface privée et métadonnées de publication seulement, sans nouvelle API, base, autorité ou accès au disque du PC. Sept tests couvrent qualification, confinement, conservation, séquences, copie, repli et ancienne publication. La suite complète de 309 tests et le build Projet passent. Un ancien test PHP utilisait un chemin URL non décodé ; il utilise désormais fileURLToPath pour les chemins Windows avec espaces, sans assertion supprimée. La livraison reste une preuve séparée.


## 9 novembre — badges des environnements

Périmètre : présentation de la vue d’ensemble et qualification consultative des déclarations. Tests de version/cible discordantes, preuve/date absentes, CI ou phase seules, anciennes projections, blocage du suivi sans panne inférée, préparation/examen/accord distincts. Aucun secret, endpoint, rôle, critère, source métier, Gantt ou contrôle Drupal/CONNECT modifié. Le rendu réel et le candidat/CI/artefact sont qualifiés séparément dans le suivi privé du lot. [Sémantique](cockpit-portefeuille.md#badges-des-environnements).

## 9 novembre — correction du masquage des liens GitHub à l’export

Le nouveau test reproduit d’abord `https://github.com/...` transformé en `http[chemin local masqué]` (1 échec/8). Ajout d’une borne de début au filtre Windows, puis 8/8 tests de projection réussis. PR, commit, CI avec requête/fragment et lien imbriqué préservés ; chemins Windows/POSIX toujours masqués, données réelles non écrites. La correction touche le seul export opérateur et son test, pas l’habilitation ni les lecteurs hébergés. Tests complets, CI et publication effective du candidat restent des preuves distinctes portées par le suivi canonique.

## 9 novembre — correction du refus de navigation dans Chrome

Reproduction du JSON « Origine refusée » avant connexion lors d'une navigation externe. Deux tests ajoutés échouent d'abord sur le candidat précédent ; correction limitée au sas HTML public de l'entrée, sans lecture de suivi ni session, puis tests de non-régression réussis. Les ressources privées restent strictement derrière le garde, y compris avec un cookie présenté depuis une origine tierce. Les en-têtes de navigation sont transmis par le client HTTP natif dans la fixture : node.fetch remplace `Sec-Fetch-Mode`, ce qui ne reproduisait pas correctement Chrome. [Parcours et limites](developpements-local.md#ouverture-dans-chrome-ou-depuis-un-lien-extérieur). Sessions séparées par navigateur et bootstrap unique conservés, aucun SSO réel ou hébergement qualifié par cette correction.

## 9 novembre — qualification et préparation de PR

Changements limités au module privé : qualification d’alias exacts et contextes non concluants, collecte GET manuelle, état des dernières fusions, projection signée et lecture Node/PHP des pièces sans phase. Tests de changement d’empreinte, source modifiée, confinement, non-copie implicite, échec/race GitHub, verrou, intervalle, origine/CSRF et compatibilité PHP ajoutés ; les suites antérieures restent requises. Un premier essai de fixture PHP avait un échappement de namespace incorrect : fixture corrigée et test rejoué sans affaiblir les assertions. [Contrat et limites](preuves-et-actualisation-github.md). Sources réelles en lecture seule, aucun accord humain ou contrôle hébergé déduit.

## 9 novembre — recette de cohérence locale

Les changements sont limités au lecteur Node, aux projections, au lanceur de configuration et à l’affichage privé. L’authentification, le Gantt, le pont PHP/Drupal/CONNECT et les sources métier ne sont pas modifiés. Sept tests nouveaux vérifient sélection d’identité, refus et conservation, observation GitHub, reçus et cibles Missions ; la suite complète et le build normal sont rejoués. Les reçus exacts du candidat, de conservation et du navigateur restent dans le suivi privé du lot. [Guide](coherence-github-locale.md). Aucun résultat local ne qualifie une livraison hébergée.

## 8 novembre — premier lot de préparation locale

Copie dédiée issue de main `5e79a9c` ; aucun changement au runtime d'habilitation, au pont CONNECT/Drupal, au Gantt ou aux vraies sources. Modèles des trois services exécutés/testés avec activation désactivée, secrets/identifiants vides ; plan structuré et empreinte du workflow public inclus au paquet. La restauration ne concerne qu'une copie fictive : seuil anti-rejeu conservé et original intact.

Contrôles Windows locaux : **77 tests ciblés**, **273 tests complets**, aucun échec/ignoré ; build normal de 23 fichiers sans module privé. Broker PHP : 41 assertions ; contrôleur Drupal avec doubles : 14 ; régression CONNECT : 41/41, incluant l'apparence commune ajoutée sur main. Syntaxe de 27 fichiers PHP, dont les trois nouveaux modèles, vérifiée. Environnement constaté : Node 24.18.0, PHP CLI 8.4.23 ; le job CI existant reste Node 22/PHP 8.3, non relancé pour ce lot local. Les reçus du candidat exact restent dans le cockpit propriétaire ; ces résultats ne prouvent ni noyau Drupal réel, ni SSO hébergé, ni sauvegarde indépendante/restauration du serveur. [Procédures et réserves](preproduction-developpements.md).

## Alignement et contrôles CI — 7 novembre

La première CI Linux a refusé une fixture dont le dossier assets utilisait le mode par défaut trop ouvert. La fixture crée désormais explicitement ses dossiers privés en 0700 et fichiers en 0600 ; le test POSIX élargit volontairement dossier/configuration pour vérifier les refus 503, puis rétablit les modes privés et exige 200. Aucun contrôle du runtime n'est affaibli et aucune permission réelle n'est modifiée.

Report sans conflit du candidat dans une branche issue de main, copie locale antérieure préservée. Sur Windows, première qualification : 72 tests ciblés et build complet de 268 tests réussis, 22 fichiers publics sans module privé ; lint explicite de 24 fichiers PHP, suites d'autorisation 41/14 et régression CONNECT 40/40. Le premier essai sur checkout neuf a signalé le sas généré absent avant les tests : ordre corrigé puis suites relancées avec succès. Le contrôle de paquet a ensuite révélé un faux refus du fichier de code `SnapshotReader.php` par une recherche trop large : remplacement par une liste fermée de fichiers autorisés et ajout d'un test de refus des vraies données. La qualification finale est enregistrée dans le suivi canonique. [Commandes et limites CI](../workflows/ci-developpements.md). Aucun vrai compte, suivi, rôle ou hébergement modifié ; les résultats locaux ne sont pas une CI distante.

## Reprise — session Projet et préparation de préproduction

La reprise ajoute le lecteur PHP et son API hors du public normal. Session native signée, rôle frais, assets/pièces, refus, interopérabilité Node/PHP, paquet fermé et menu conditionnel sont contrôlés localement sur fixtures. Le sas commun, les fichiers publics du Gantt et les sources externes restent hors modification. Le vrai instantané privé est seulement lu hors ligne pour compatibilité. Le reçu canonique de cette reprise porte les résultats définitifs ; les résultats ci-dessous restent ceux de leurs candidats historiques. [Guide](preproduction-developpements.md).

## 7 novembre — pont et stockage, état local courant

Candidat de la copie isolée : build Projet **260 tests réussis**, 21 fichiers publics, module privé/données exclus. PHP : 41 assertions broker/fournisseur, 14 contrôleur avec doubles de services (pas de kernel Drupal), régression CONNECT 40/40. DACL Windows réellement qualifiée par le test de persistance. Pont sur identités fictives ; copie des vrais suivis privée et consultative, sans connexion réelle. La recette navigateur a révélé une collision de cookie entre ports : le nouveau lanceur utilise désormais un cookie distinct par port, couvert par un test dédié. [Guide](pont-stockage-local.md). Les anciennes preuves sont historiques ; les versions exportées ne mesurent pas les hôtes.

# Audit et recette du planning Projet

## Raccordement Recherche/RGA — vérification locale du 7 novembre

Les sources lues sont `avereo-platform/data/suivi-missions.json` et `data/suivi-fonctions-communes.json # correctiveDeployment`, dans la copie active des travaux communs. Recherche figure dans la qualification locale et n'a pas de livraison déclarée ; RGA possède son candidat et sa livraison historique de correctif PR #122. Aucun champ du parent n'est pris pour le statut propre du correctif. Les quatre phases, les preuves, la provenance et le rechargement sont examinés dans le cockpit local.

Le contrôle de fraîcheur compare les JSON/empreintes et les références Git du poste, sans appel réseau d'audit. Les dates déclarées restent celles des sources, distinctes de l'heure de lecture ; les informations absentes restent inconnues. Les autres chats peuvent continuer à modifier leurs sources, qui seront relues au rafraîchissement. Aucun test n'approuve un vrai critère, aucune écriture externe et aucun déploiement.

## Reprise du 7 novembre — portefeuille réel en lecture seule

Après accord explicite sur l'accès privé local sans SSO, les 12 applications/sites et les 10 suivis du registre sont lus. Recette dans le navigateur : tableau, recherche Rapport, quatre phases, ouverture d'une preuve déclarée, revue d'un critère réel désactivée, rechargement et retour au portefeuille. Une première recette a mis en évidence l'annulation du premier chargement entre effets React : correction et test de régression ajoutés. Les preuves relatives à `data/` sont raccordées explicitement sans sortie de racine.

Les clés/configurations temporaires du cockpit sont limitées au compte Windows courant et SYSTEM, héritage retiré ; aucun profil distant n'est ouvert. Le build exclut le module privé. Les autres chats et leurs sources ne sont pas écrits par ce lot ; les changements légitimes qu'ils effectuent restent visibles à la prochaine lecture. [Guide et limites](cockpit-portefeuille.md). Les résultats de la clôture documentaire ci-dessous restent historiques.

## 7 novembre — Documentation du raccordement local, non exécuté

Le lanceur, le garde d'accès, le contrat des sources et les scénarios fictifs sont relus sans démarrer de service ni lancer de test. Le ticket CONNECT de la copie inspectée contient une identité mais pas le rôle global ; les rôles d'organisation ne prouvent pas ce rôle. La [procédure](raccordement-developpements-local.md) conserve ce blocage et impose ID propriétaire exact, autorité qualifiée, refus des autres profils et pilote consultatif. Aucun raccordement réel, registre actif, changement d'identité, décision métier ou déploiement. Les contrôles du 6 novembre ne deviennent pas des résultats du 7 novembre ; les nouveaux textes restent hors de leur manifeste historique.

## Recette hébergée de #114 — 6 novembre 2026

Installation explicitement autorisée de la version fusionnée, paquet identique au candidat local corrigé. Sauvegarde/restauration code et données sur copie vérifiées ; 74 contrôles HTTP sur identités fictives réussis sur l’hôte. Seize fichiers vérifiés côté serveur, neuf empreintes publiques HTTPS conformes ; index protégé par CONNECT (303), API planning/espace privées (401, no-store).

Les deux projets réels sont ouverts en lecture seule : 45 tâches chacun, révisions 5 et 1. Huit JSON privés restent identiques octet par octet après recette ; configuration et sas inchangés. Mois/Années, filtres, fiches avec résultats réalisés/non réalisés et préférences par défaut relus. Aucune erreur de console relevée. Les écritures sont qualifiées sur fixtures HTTP et par les essais locaux antérieurs, pas par mutation des dossiers réels.

**Réserve ouverte :** à 761 px et avec l’en-tête replié, le menu Projet et fichiers déborde à gauche derrière la barre latérale. Le contrôle du centre des boutons ne prouve pas la visibilité complète des étiquettes ; la prochaine qualification doit contrôler les bords du panneau. Le correctif de superposition fonctionne, mais ne suffit pas à ce cas de positionnement. [Reçu](../data/preprod-interface-simple/delivery-observation.json), [recette](../data/preprod-interface-simple/browser-recipe.json) et [suivi](../data/suivi-interface-simple.json).


## Correction du menu Projet et fichiers — 6 novembre 2026

Retour utilisateur reproduit dans le candidat local : quatre des cinq commandes du menu sont recouvertes par la barre d’échelle ou les filtres. Leurs couches de priorité 45/50 dépassaient le contexte de l’en-tête (20), malgré la priorité 60 du panneau enfant.

Correction limitée à `isolation: isolate` sur la vue planning : les couches du Gantt restent dans leur contexte, sous le menu de l’en-tête et sous les fiches. Vérification réelle par ciblage du centre des cinq boutons avant/après : 1/5 accessibles avant, 5/5 après à 1280 × 720 et 390 × 844. Ouverture/fermeture au clavier et fiche au premier plan vérifiées. Exemple fictif uniquement ; aucune donnée ni installation hébergée modifiée. Les preuves et la nouvelle version sont rattachées au [suivi canonique](../data/suivi-interface-simple.json).

## Interface simple — recette locale du 6 novembre 2026

Écarts autorisés : résultats cochables sur les entrées existantes, vérification/date contrainte optionnelles, simplification de l’en-tête et des fiches, recherche, colonnes secondaires, densité, Mois/Années et navigation temporelle. Le moteur de dates et le schéma de planning sont conservés. Aucun secret, droit CONNECT ou document hébergé modifié.

Contrôles : 196 tests Node, build Vite et vérification des 20 fichiers de livraison ; 74 contrôles HTTP PHP isolés avec identités et données fictives. Les validations finales et le candidat exact sont rattachés au [suivi canonique](../data/suivi-interface-simple.json).

Navigateur local, exemple fictif de cinq tâches 2026–2028 : cocher puis sauvegarder/réouvrir, section simple validée sans changement du statut, activer la vérification et conserver une preuve après rechargement, préférences locales persistées, recherche, vue annuelle, fiche en 390 × 844 et défilement horizontal mobile vers le calendrier. Le serveur Vite assure les ressources locales ; les erreurs 404 initiales du serveur statique ont disparu après son remplacement par Vite. La recette PHP prouve la persistance des préférences par requêtes indépendantes, pas une connexion au compte réel depuis deux navigateurs.

Limites : validation humaine, recette des deux projets réels et sauvegarde/restauration fraîche sur l’hébergement encore à réaliser. Les publications automatiques en échec après #112 restent suivies séparément. La borne existante de 3 660 jours reste en place ; les petits segments sont surtout lisibles via leur fiche ou une échelle plus détaillée.


## Sujets et colonnes — recette préproduction du 6 novembre 2026

Installation autorisée du candidat `79182df`, après sauvegarde et restauration sur copie. Les 65 contrôles HTTP isolés passent avec PHP 8.3.36 sur l’hébergement. Seize fichiers livrés et vérifiés côté serveur ; neuf assets contrôlés par empreinte HTTPS. L’index anonyme redirige vers CONNECT (303), les deux API privées refusent l’accès anonyme (401, sans cache).

Après reconnexion CONNECT, les deux projets de 45 tâches sont ouverts et relus, avec leurs paramètres et dates conservés. Filtres Emploi/AVEREO/TC Longages, signalement des dépendances masquées, fiche détaillée en lecture, réglage des largeurs au pointeur et au clavier, repli/dépli et persistance après rechargement vérifiés. Aucun enregistrement sur les projets réels ; huit JSON privés restent identiques à la sauvegarde, révisions 5 et 1. Aucune erreur de console dans le relevé final. Les écritures de classement sont couvertes par les fixtures HTTP et la recette locale ; elles ne sont pas présentées comme une mutation réelle du compte.

[Observation de livraison](../data/preprod-sujets-colonnes/delivery-observation.json), [recette navigateur](../data/preprod-sujets-colonnes/browser-recipe.json) et [contrôles HTTPS](../data/preprod-sujets-colonnes/https-checks.json). Les captures privées restent hors dépôt public. Le responsable a ensuite confirmé le fonctionnement des filtres et colonnes ; les quatre cases humaines et le merge #112 sont vérifiés le 6 novembre. Les classements proposés restent à confirmer dans les tâches.

### Recette locale antérieure du 6 novembre 2026

Écart fonctionnel : classement optionnel des tâches, suggestions visuelles, filtres après calcul du calendrier et colonnes réglables. Aucun changement des identités, routes d’authentification ou données hébergées.

188 tests Node, build Vite et contrôle des 20 fichiers de livraison réussis. 65 contrôles HTTP PHP locaux sur fixtures fictives réussis : notamment conservation des nouveaux champs et refus des valeurs invalides sans écriture. Les tests couvrent JSON/CSV, dates inchangées, filtres, indices de groupes, dépendances masquées et réglages hors sauvegarde projet.

Recette navigateur locale : filtre Emploi et TC Longages, résultat vide combiné, ouverture et sauvegarde du classement puis réouverture après rechargement, glissement de colonne et séparation, clavier, persistance des largeurs et repli/dépli. Aucun message d’erreur dans le relevé final de console. Le serveur statique ne fournit pas le complément documentaire du pilote ; cette indisponibilité attendue ne remplace pas une recette du serveur privé.

La copie locale du planning est utilisée pour la lecture visuelle ; le fichier source privé reste inchangé et n’est pas publié. La qualification hébergée est décrite ci-dessus. Les preuves et limites sont rattachées au [suivi du lot](../data/suivi-sujets-colonnes.json).


## Menu de compte — recette préproduction du 5 novembre 2026

Après installation autorisée des sept fichiers exacts : ouverture du menu au-dessus de Mon espace en bas à gauche, fermeture par Échap et clic extérieur, accès Préférences, puis ouverture des deux projets de 45 tâches. Le formulaire Nouvelle tâche garde Annuler et Enregistrer dégagés ; il a été annulé sans écriture. Le lien de déconnexion quitte Projet et ouvre CONNECT, dont la session d'identité reste active ; le retour à Projet fonctionne. Cela ne constitue pas une déconnexion globale de CONNECT.

Toutes les empreintes JSON privées restent identiques après ces parcours, comme les quatre fichiers protégés du sas après installation. L'entrée anonyme renvoie 303 vers CONNECT ; trois assets HTTPS répondent 200 avec les empreintes du candidat. Preuves dans le [suivi canonique](../data/suivi-menu-compte.json). Recette visuelle effectuée dans le navigateur intégré sur bureau ; bon fonctionnement confirmé ensuite par le responsable à la clôture du 5 novembre.

### Preuves locales antérieures

182 tests Node, build, contrôle des 20 fichiers de livraison, syntaxe PHP et baseline réussis. Dans le navigateur local : menu au-dessus de Mon espace, fermeture Échap et clic extérieur, accès Préférences, formulaire de tâche avec bouton Enregistrer dégagé. La navigation vers la déconnexion réelle n’est pas exécutée lors de cette recette ; son lien `_top` conserve la route existante. Le serveur statique local ne fournit pas l’API privée ; ses messages réseau ne sont pas une preuve de panne hébergée.


## Préparation de l’import privé — 5 novembre 2026

Le nouveau préparateur est un outil local : aucun écart de comportement du frontend ou de l’API. Ses tests utilisent des données fictives. La conservation du JSON privé est contrôlée par empreinte et aller-retour avec le moteur courant ; la recette du nouvel import sur le compte hébergé reste à faire. Les résultats sont rattachés au [suivi canonique](../data/suivi-import-prive.json).


## Recette Mon espace — 5 novembre 2026

177 tests applicatifs et 59 contrôles HTTP locaux réussis ; huit jobs CI réussis
sur le candidat `f1a920b`. Les 59 contrôles passent sur PHP 8.3.36 hébergé avec
données fictives. Sauvegarde et restauration sur copie du site et des quatre
fichiers privés vérifiées avant installation de 16 fichiers. Le document courant
révision 2 (45 tâches) est identique à la copie avant et après recette.
Accueil, ouverture du Gantt, retour par le compte, préférences, archives et lien
CONNECT vérifiés dans le navigateur intégré. Les mutations sont testées sur
fixtures ; aucun projet ni réglage réel modifié pendant cette recette.

Écart à la source V1 : page associée au compte et catalogue de plusieurs projets
privés. L’autorisation du responsable porte sur cette page dans la continuité de
la préproduction et de l’enregistrement en ligne demandés.

Les tests couvrent les projets indépendants, l’import complet, le catalogue privé,
la traversée de chemins refusée, les conflits, les archives et leurs écritures
refusées, les préférences, la corruption et la restauration des copies. La recette
navigateur locale a vérifié création, liste, archive/restauration et préférences
après rechargement. Les résultats et limites hébergés sont dans le
[suivi du lot](../data/suivi-espace-projets.json), sans déduire une livraison des tests locaux.


## Lot en ligne — 5 novembre 2026

Résultat : **171 tests frontend**, **23 contrôles HTTP locaux et 23 sur PHP 8.3.36
hébergé avec identités fictives**, huit jobs CI réussis sur `a1933e7`. Sauvegarde
intégrale et installation/restauration répétées sur copie avant livraison de
11 fichiers. Sas/configuration CONNECT conservés ; empreintes HTTPS vérifiées.
Enregistrement réel du planning en version 1, reprise après reconnexion/rechargement
et export strictement identique (`c69f4bff…`). Sauvegarde réelle du JSON privé et
restauration sur copie vérifiées. Le contrôle de Chrome natif reste une limite
explicite ; les sessions indépendantes sont couvertes par les tests automatisés.

L'interface ancienne de la capture utilisateur et la séparation des brouillons
par navigateur motivent une actualisation du chargement et une persistance privée.
La demande autorise un premier backend V2 pour le Gantt existant, sans reprendre
le registre clients différé. Écart assumé à la V1 statique : deux routes PHP
servent un document privé, avec l'identité du sas PR #106 inchangé.

Les résultats courants sont conservés dans
[le suivi du lot](../data/suivi-enregistrement-en-ligne.json). Les tests automatisés
couvrent droits, CSRF, conflit, panne, stockage privé, sauvegarde précédente et
reprise ; la preuve hébergée reste séparée du succès local.


## Reprise du Gantt pour préproduction — 28 octobre 2026

Les deux fichiers métier modifiés et leurs tests sont repris depuis la copie de
pilotage, à l'identique, dans une branche issue de `main` `cf21b593faf9b6f4fae5e88eea3ff0117d41a074`.
L'HTML du repère du jour conserve l'empreinte
`2f531ccaa435153c4890d453cce89a352499da4c9bd5758d32bc1f238088bcaa`.
Les preuves locales antérieures restent datées dans le suivi ; elles ne valent
pas recette hébergée. Les suites complètes de cette nouvelle base sont rejouées.

Résultat local : `npm.cmd run build` réussi, **162 tests sur 162**, aucun échec
ou test sauté, 31 modules ; contrôle de l'artefact de 12 fichiers réussi.
Le paquet de livraison reste limité aux quatre fichiers du planning, et non au
build complet : les nouveaux assets du wrapper ne sont pas installés.

Lecture cPanel : document root Projet préproduction présent, non symbolique,
distinct des autres racines ; lanceur compatible avec `/legacy-app.html` ;
configuration privée présente. L'ancienne interface est encore servie et les
trois scripts séparés sont absents avant livraison. L'entrée anonyme redirige
vers CONNECT préproduction ; l'accès SSH direct expire, sans écriture distante.
Le terminal cPanel connecté fournit le canal d'exploitation autorisé.

L'outillage de livraison est testé sur fixtures : sauvegarde, installation,
restauration et préservation du sas, refus d'une dérive et d'un candidat invalide.
Sur Windows, les cas de création/modes POSIX sont réservés à la CI Linux ;
la fixture locale couvre le remplacement en conservant les modes existants.
La récupération réelle a ensuite été vérifiée avant écriture de la racine active.

### Résultat hébergé de cette itération

La [CI de la source a6b4cdf](https://github.com/jpdandin44/AVEREO/actions/runs/40737675957)
réussit ses huit jobs, y compris Projet et les cas POSIX. La sauvegarde réelle
et la répétition installation/restauration en copie privée réussissent avant le
contrôle de passage. Livraison à 17:48 UTC puis vérification à 17:49 UTC : quatre
fichiers exacts, arbre attendu et configuration privée conservés, aucune écriture
de base. Les [preuves canoniques](../data/suivi-gantt-affichage.json) relient
candidat, autorisation ciblée, sauvegarde et reçus serveur.

À 17:52 UTC, les quatre fichiers HTTP répondent 200 et leurs empreintes sont
identiques au manifeste. L'entrée principale répond 303 vers CONNECT ; CONNECT
répond 401 en anonyme. Les ressources statiques ne sont pas protégées par ce sas ;
elles ne contiennent pas le planning personnel. Le navigateur intégré ne possède
pas l'authentification de préproduction : recette du parcours connecté et
import/export/rechargement dans le navigateur d'usage encore ouverts. Le contrôle
serveur et la CI ne valent pas validation humaine ni livraison en production.

### Recette Chrome après connexion du responsable — 19:06, Europe/Paris

La session réelle sur l'entrée principale est observée avec son lien de
déconnexion. Le parcours de saisie des identifiants n'est pas rejoué par l'agent.
Une ancienne interface encore chargée est remplacée par la version attendue après
rechargement des fichiers, sans effacement du stockage ; le mécanisme exact du
cache n'est pas démontré. La nouvelle interface constate un brouillon vide.

La référence initiale du portefeuille est importée : 45 tâches, 22 jours-personne,
cible du 27 novembre. Les projets repliés gardent leurs synthèses ; trait rouge
du 28 octobre visible en Jours. Après rechargement, « Brouillon restauré » et les
45 tâches sont constatés. Les exports avant/après sont strictement identiques,
SHA-256 `c69f4bff3fcb811a2838b7db740e101aed58dec601f78905132779dc9177d732`,
et leur contenu JSON complet est identique à la référence importée. Les preuves
et limites sont dans le [reçu navigateur](../data/preprod-gantt/browser-recipe.json).
Les exports et la capture restent locaux, sans publication du planning personnel.

Aucun déplacement de date ou d'ordre n'est appliqué pendant cette recette.
Autres profils, vue Semaines, tactile et gestes de déplacement hébergés ne sont
pas requalifiés ici. Le besoin nouveau clients/projets et sauvegarde distante
reste en cadrage ; aucune sauvegarde métier serveur n'a été ajoutée.

Contrôle documentaire de ce complément : socles présents, dix documents
applicatifs/90 liens et 14 Markdown du pilotage/75 liens vérifiés, sans erreur.
Preuves navigateur comparées et empreintes des quatre fichiers déployés inchangées.
Baseline, prévalidation de la description PR et whitespace réussis ; références
main actualisées et fusion sans conflit vérifiée avant remise. Aucun test du
futur stockage serveur n'est présenté comme réalisé.

Contrôle documentaire après livraison : socles du sous-projet et du pilotage
présents ; neuf documents applicatifs et 80 liens locaux, 14 Markdown du pilotage
et 72 liens vérifiés. Métadonnées, archive, sources et reçus rapprochés sans erreur.
Policy PR prépublication, baseline racine et `git diff --check` réussis.
Le commit documentaire des preuves est distinct de la source technique a6b4cdf ;
aucun des quatre fichiers déployés n'est changé par cette consignation.

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

Contrôle navigateur du 25 septembre : la phase 2 du chantier site présente
simultanément PR #6 « Fusionnée » et « Revue complémentaire · PR #7 » ouverte,
avec liens exacts et portée distincte. Les compteurs restent à trois remises et
trois validations sur sept ; Services reste non commencé. Les douze empreintes
des pièces approuvées, cinq événements et huit décisions historiques ont été
contrôlés sans modification. Le moteur commun est proposé dans la
[PR #68](https://github.com/jpdandin44/AVEREO/pull/68), distincte de la PR du site.

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
| Mot-clé nommant un partenaire dans le classement suggéré des sujets | Mots-clés génériques « partenariat » et « saisie unique » (06/11/2026) : le dépôt public ne cite aucun partenaire ; une tâche qui ne mentionnait que ce nom n'est plus suggérée « AVEREO », le choix manuel du sujet reste possible |

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
EV métier planifiées. Les contrôles hébergés du 28 octobre sont limités à leur
périmètre décrit en tête ; la recette métier authentifiée et la production restent ouvertes.
Les CDN historiques restent une dépendance réseau ; le fonctionnement
entièrement hors connexion n'est pas établi.

Le déclenchement d'un futur déploiement est expliqué dans
[deployment.md](deployment.md). La livraison ciblée de préproduction du 28 octobre
ne constitue ni une migration de données, ni une livraison de production.

## 6 novembre 2026 — Menu de compte commun

Le pied de barre latérale réutilise le composant commun ; Mes projets, Préférences et Mon compte conservent les actions ProjectWorkspace. Le lien CONNECT dépend du portail configuré.

Le périmètre transverse est demandé explicitement par le responsable. [Contrat commun](../../avereo-platform/docs/fonctionnalites-communes.md) et [preuve du lot](../../avereo-platform/docs/qualification-mon-espace.md). Aucune migration, modification de secret ou de droit ; tests sur données fictives.

## 6 novembre 2026 — Extension de PR #121

Mes projets et Préférences conservent les actions natives de ProjectWorkspace. Mon compte ouvre désormais directement le profil CONNECT, comme dans les autres applications ; les plannings, sauvegardes et préférences natives restent inchangés.

Les contrôles actualisés sont dans la [qualification transversale](../../avereo-platform/docs/qualification-mon-espace.md). Les preuves précédentes restent attachées à leur candidat.

## 7 novembre 2026 — Module Missions en recette locale

Le module reprend la référence uniquement si le projet actif et le catalogue en ligne concordent. Le libellé historique « Client / référence » est un indice à confirmer par l’opérateur. La préparation ne modifie pas le planning. [Recette commune](../../avereo-platform/docs/preparation-missions.md).

## 2026-11-08 — Modèle commun

Le bandeau délègue au planning ouvert son export JSON et son enregistrement privé quand celui-ci est disponible. [Modèle partagé](../../avereo-platform/docs/modele-affichage.md).

## 9 novembre 2026 — Navigation commune

La liste de projets conserve son titre métier sous le bandeau, sans seconde signature AVEREO. [Modèle](../../avereo-platform/docs/modele-affichage.md).
