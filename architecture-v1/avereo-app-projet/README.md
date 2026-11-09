---
project: avereo-app-projet
document_type: readme
title: Projet AVEREO — planning local
status: active
version: git
created: 2026-09-19
updated: 2026-11-08
owner: jpdandin
tags:
  - projet
  - planning
  - local
---

## 8 novembre — préparation locale du premier lot

Le [guide du module privé](docs/preproduction-developpements.md) complète le paquet séparé : modèles Projet/CONNECT/Drupal désactivés avec secrets vides, plan structuré de publication/récupération et constat du risque `rsync --delete`. Base `main` actualisée dans une copie isolée ; code d'accès propriétaire/global et lecture seule inchangés. Aucune configuration active, vraie source exportée, intervention serveur ou livraison. La préparation reste en Développement local ; les constats suivants sont historiques.

## Alignement et CI du module Développements

Le candidat est reporté sur main dans une branche isolée, sans écraser la copie locale antérieure. Le [workflow CI privé](workflows/ci-developpements.md) vérifie explicitement les suites Projet/CONNECT/Drupal fictives, les refus des autres profils, la lecture seule et la séparation public/privé. Le paquet relève le SHA d'une source propre ; une CI ne vaut ni autorisation, ni installation. Les quatre phases et les validations humaines sont conservées.

## Reprise — session Projet et préparation de préproduction

Le [lecteur PHP privé et sa préparation](docs/preproduction-developpements.md) réutilisent maintenant, dans le code local, la session Projet signée et le propriétaire de la configuration existante. Pont global obligatoire par requête, API consultative et assets privés ; recette sur fixtures, aucun cookie réel exporté. Paquet séparé désactivé par défaut, sans secrets/suivis réels ni écrasement du Gantt. **Aucune installation ni connexion effective au module sur le domaine réel.** La préparation reste en Développement local ; les étapes précédentes ci-dessous sont historiques.

## 7 novembre — pont et stockage, état local courant

Le [guide du pont et stockage privé](docs/pont-stockage-local.md) décrit le candidat courant : contrôle Drupal/CONNECT par requête, copie persistante signée et preuves sélectionnées. Chaîne d'habilitation testée sur fixtures ; vrais suivis sous accès privé du poste, sans SSO réel raccordé. Aucun déploiement. Le lecteur reste Node local ; nouveaux endpoints PHP désactivés par défaut. Commandes `dev:private-storage` et `prepare:private-storage`, depuis `frontend/`. Le registre propriétaire comporte 13 projections/11 JSON pour 12 applications. Les rubriques de cadrage/clôture ci-dessous sont historiques ; le build public exclut toujours ce module.

# Projet AVEREO

## Cible future — Développements privé en ligne

Le 7 novembre, le responsable demande un cockpit consultable en ligne dans la durée et propose un module spécifique dans Projet. Le module local existant sert de base à cette préparation, pas de service à exposer. Le [guide du portefeuille](docs/cockpit-portefeuille.md#cible-future-en-ligne--exigence-du-7-novembre) distingue cette cible, réservée au seul propriétaire administrateur global, de l'état local actuel. Exigence et plan documentés seulement : aucun nouveau code, compte, droit CONNECT, synchronisation ou déploiement.

## Portefeuille utilisable en lecture seule — reprise du 7 novembre

La [vue Versions & développements](docs/cockpit-portefeuille.md) référence 12 applications et sites, tous avec un suivi lisible : 12 entrées/projections sur 11 JSON. Recherche est rattachée au lot Missions ; RGA à son sous-suivi de correctif et au lot commun récent. Git local, lots hébergés déclarés, preuves et quatre phases restent distincts. Dates, empreintes et projection source permettent de contrôler la fraîcheur locale, sans promettre un contrôle distant. Le responsable a choisi l'accès privé local, sans SSO CONNECT ni déploiement. Le lanceur `npm.cmd run dev:portfolio -- --local-private-owner --registry CHEMIN_PRIVÉ` protège son accès et les fichiers temporaires ; le guide donne le registre réel et les limites.

## Clôture documentaire du 7 novembre — aucun raccordement

La [procédure locale préparatoire](docs/raccordement-developpements-local.md) décrit l'accès au seul propriétaire administrateur global, la qualification de son identité CONNECT, les vrais suivis en lecture seule et la matrice de confidentialité. Elle n'est pas exécutée. Aucun registre actif, compte, droit, code ou déploiement n'est changé lors de cette clôture. Les tests du 6 novembre ci-dessous restent historiques ; ils ne qualifient pas le rôle CONNECT réel.

## Développements — candidat local privé du 6 novembre 2026

Module séparé du Gantt : plusieurs suivis, quatre phases, critères, preuves versionnées et décisions individuelles dans leur source canonique. Le lanceur privé protège toutes les ressources, pas seulement le menu, et réserve l'accès à un identifiant propriétaire exact. Le navigateur de recette utilise des fixtures fictives ; le rôle réel CONNECT n'est pas qualifié et aucun autre profil n'est raccordé. **Aucun déploiement.**

Depuis `frontend`, lancer `npm.cmd run dev:developments -- --demo` puis suivre le [guide privé local](docs/developpements-local.md). [Contrat](api/developpements-local.md). Le build hébergé exclut ce module et ses API. Le suivi canonique du lot reste dans l'espace de pilotage `avereo-pilotage/data/suivi-cockpit-developpements.json` ; les autres suivis opérationnels ne sont pas réécrits.

## Interface simple — livrée en préproduction le 6 novembre 2026

Le responsable a autorisé la réalisation de la [proposition](docs/proposition-interface-simple.md). Résultats cochables, vérification et date contrainte optionnelles, planning allégé et vues Mois/Années sont développés localement. [Guide](docs/guide-utilisateur.md), [recette et limites](docs/source-audit.md), [suivi canonique](data/suivi-interface-simple.json). La version fusionnée de la PR #114 est installée après accord, sauvegarde et restauration sur copie. Deux projets de 45 tâches conservés ; réserve ouverte sur le positionnement du menu à largeur intermédiaire. Aucune production engagée.


## Sujets et colonnes — préproduction du 6 novembre 2026

Filtres par sujet et priorité, repères emploi proposés, colonnes et séparation tableau/calendrier ajustables sont installés en préproduction après accord du responsable. Le [guide](docs/guide-utilisateur.md) décrit leur usage. Le [suivi canonique](data/suivi-sujets-colonnes.json) porte la version, les preuves et les accords. Les deux projets de 45 tâches ont été relus ; leurs données restent identiques à la sauvegarde. PR #112 fusionnée et filtres/colonnes validés par le responsable. Le contrôle après merge retrouve les neuf assets publics du candidat et les deux API protégées. Les publications automatiques cPanel et du prototype Pages ont échoué ; détails et actions séparées dans le suivi.

La [suite interface simple](docs/proposition-interface-simple.md) est désormais livrée en préproduction ; le suivi conserve les preuves et la réserve visuelle.

PR #111 vérifiée fusionnée le 6 novembre ; les observations de clôture du 5 novembre restent historiques.


## Menu de compte — préproduction du 5 novembre 2026

Le bouton de déconnexion flottant est supprimé de la page qui encadre le Gantt. **Mon espace**, en bas à gauche, ouvre désormais un menu vers les projets, les préférences, le compte et la déconnexion. Installé et vérifié en préproduction après accord du responsable ; les deux projets restent inchangés. PR #110 fusionnée ; recette technique hébergée réalisée, menu confirmé fonctionnel par le responsable à la clôture : [suivi](data/suivi-menu-compte.json).

L’import privé autorisé est terminé : nouveau dossier relu après rechargement, contenu complet identique et planning courant conservé. [Preuves du lot d’import](data/suivi-import-prive.json).


## Préparation d’un import privé — 5 novembre 2026

Le [workflow d’import privé](workflows/import-prive.md) prépare un JSON complet pour **Importer un projet** dans Mon espace, sur la base de la PR #108. Le planning nominatif reste hors du dépôt public. Le [suivi du lot](data/suivi-import-prive.json) distingue préparation locale, import réel et livraison ; import serveur désormais réalisé, selon le suivi lié.


## Mon espace et projets indépendants — 5 novembre 2026

**Livré en préproduction à 15 h 50 (Paris)**, puis vérifié dans le navigateur.
Le planning courant de 45 tâches (révision 2) reste identique à la sauvegarde
prise avant livraison. [PR #108](https://github.com/jpdandin44/AVEREO/pull/108)
fusionnée, comme la PR #107 (constat de clôture du 5 novembre).

Le lot suivant ajoute l’accueil **Mon espace**, accessible par **Mes projets** ou
par le bloc du compte en bas de la barre latérale. Création, import JSON complet,
recherche par projet/client, tri, archives réversibles et préférences du Gantt
utilisent le stockage privé existant. L’administration des comptes reste dans
CONNECT. Le planning existant reste un projet unique, avec ses données et son historique.

[Suivi canonique du lot](data/suivi-espace-projets.json) ·
[Utilisation](docs/guide-utilisateur.md) · [Contrat privé](api/planning-prive.md).
Le statut de livraison et les preuves sont portés par le suivi ; les sections
suivantes décrivent les livraisons précédentes. La PR #107 constitue la base
technique, sans que son merge soit effectué par ce lot.


## Enregistrement privé du planning — 5 novembre 2026

Livré en préproduction le 5 novembre à 11 h 30 (Paris). Le planning de 45 tâches
est enregistré en version 1 à 11 h 31, puis relu et exporté sans aucune différence
avec la sauvegarde de départ. [PR #107](https://github.com/jpdandin44/AVEREO/pull/107)
en attente de revue humaine ; aucune production.

Le lot V2 ajoute la sauvegarde complète du Gantt dans l'espace privé de son
propriétaire CONNECT. Le serveur est la référence après accusé de réception ;
le même compte retrouve son planning depuis un autre navigateur. L'ancien
brouillon V1 reste conservé et exportable. Un conflit ou une panne conserve
la copie en attente et n'écrase aucune version distante plus récente.

Le candidat et sa qualification effective sont dans le
[suivi de cette itération](data/suivi-enregistrement-en-ligne.json).
Le [contrat](api/planning-prive.md), le [guide](docs/guide-utilisateur.md)
et la [livraison](docs/deployment.md) décrivent le fonctionnement.
Les sections datées ci-dessous conservent l'historique de la V1 statique.
Le registre de dossiers clients indépendants reste une évolution distincte.


## Gantt livré en préproduction — 28 octobre 2026

Le calendrier et les tâches partagent un défilement aligné. Les projets sont
repliables et conservent leur barre de synthèse (étendue et avancement).
Un trait rouge daté marque aujourd'hui, dans les deux zooms, sans bloquer les gestes.
Glisser une barre/jalon pour proposer des dates, une synthèse pour un projet
complet, une poignée ⠿ pour réordonner les projets ou les sujets dans leur projet.
La prévisualisation montre les impacts des dépendances avant application ; le
dernier déplacement est annulable pendant la session, hors autre saisie.
Alt + gauche/droite agit sur les dates, Alt + haut/bas sur les poignées.
Le statut des différés, les preuves et les validations ne changent pas implicitement.

Le planning est installé sur [Projet préproduction](https://projet-preprod.avereo.fr/),
sans backend ni livraison de production. Les quatre fichiers et la conservation
de la configuration ont été vérifiés ; une recette ciblée est réalisée dans
Chrome connecté : référence de 45 tâches, import/export, synthèses repliées,
trait du jour et reprise après rechargement. Les exports avant/après sont
strictement identiques. La validation humaine reste distincte.
Le [suivi du lot](data/suivi-gantt-affichage.json) porte le candidat
et les preuves ; la [procédure](docs/deployment.md) impose sauvegarde/restauration
et conservation des accès. À l'ouverture d'une nouvelle origine, importer le JSON
complet : le planning reste propre au navigateur/profil, sans sauvegarde serveur.

Le besoin de dossiers clients indépendants et d'enregistrement serveur est
[demandé et cadré](requirements.md#projets-clients-et-enregistrement-serveur--besoin-demandé-non-implémenté),
pas encore réalisé. Les cartouches du Gantt ne constituent pas un registre de clients.

Le **[guide utilisateur](docs/guide-utilisateur.md)** explique l'accès local,
les écrans de suivi, les décisions, le planning, les sauvegardes et le dépannage.
Il distingue les données du chantier sur disque des brouillons du navigateur.

## Revue et approbation locales — 24 septembre 2026

Double-cliquer sur [start-local.cmd](start-local.cmd), puis ouvrir
[Projet avec les revues](http://127.0.0.1:5190/). Depuis `frontend/`, la commande
équivalente est `npm.cmd run dev:review`. L'onglet **Planning & risques**
conserve le planning existant ; le port 5190 constitue une origine distincte
du précédent port 5186. Un ancien brouillon navigateur reste sur son origine :
utiliser l'export JSON complet puis l'import pour le reprendre ici.

Lecture des livrables, critères, observations et décisions sont réunis.
Les livrables prévus restent décrits avant leur production ; la présence d'un
document ne vaut ni remise ni validation. Le suivi se relit automatiquement
sans effacer les saisies en cours : le [guide](docs/guide-utilisateur.md) précise
la cadence, les attestations à reprendre après changement et les limites.
La vue de progression montre les phases et leurs jalons ; les validations
antérieures fournies par le chantier restent consultables avec leur provenance.
Une phase peut aussi afficher sa PR GitHub et ses **revues complémentaires**, avec
leur état consigné, la date du dernier constat et le contexte du complément,
depuis les [métadonnées du chantier](api/revue-locale.md#pull-request-de-phase).
Ces cartes ne consultent pas GitHub et ne modifient aucune validation ; la PR
principale et sa preuve restent conservées lorsqu'un complément est présenté.
Approbation, autorisation de la suite et démarrage sont des actes distincts.
Le suivi connecté est affiché ; il n'est pas copié dans cette branche.
Accords, empreintes et événements sont conservés dans son JSON, avec sauvegarde.
Le serveur de développement assure ces écritures locales ; aucune API hébergée
ni base MySQL n'est ajoutée.

Le [workflow de développement et de reprise](workflows/revue-developpement.md)
décrit l'installation, le choix du chantier, la démonstration, les sauvegardes,
les contrôles et le passage ultérieur en PR. La [recette du lot](docs/recette-revue-locale.md)
conserve les résultats observés. L'état des validations appartient au journal
du chantier connecté ; les accords déjà enregistrés restent acquis.


Projet est l'application de planification du monorepo AVEREO, dans
`architecture-v1/avereo-app-projet/`. Son HTML/JavaScript historique est
affiché par un wrapper React/Vite. Le planning reste dans le navigateur. La revue utilise un service de
développement local ; aucune API hébergée ni base MySQL n'est ajoutée.

## État du lot

Le planning est **implémenté et vérifié localement** : dates configurables,
charges décimales, import validé, brouillon navigateur et reprise JSON.
Cette évolution est proposée pour revue dans une PR brouillon dédiée.
L’extension de planning du 19 septembre a été préparée dans le périmètre de la
[PR #64](https://github.com/jpdandin44/AVEREO/pull/64), avec fiches d'actions,
checklists et registre détaillé des risques. Ses tests, son build et une recette
locale ciblée sont réalisés ; les limites de cette qualification sont consignées
séparément de celles du planning initial dans l'audit.
Les tests et la recette navigateur effectués,
ainsi que les contrôles encore ouverts, sont consignés dans
[docs/source-audit.md](docs/source-audit.md). Les contrôles de préproduction du
28 octobre sont distincts des recettes historiques ; la production et la recette
métier authentifiée ne sont pas qualifiées.

Le pilote préchargé est une proposition de planning, pas un avancement réalisé.
Son modèle et ses hypothèses sont décrits dans [data/README.md](data/README.md).

## Prérequis et installation

Utiliser Node.js 22, comme la CI, npm et un navigateur récent. Le HTML
historique charge certaines ressources depuis des CDN ; la prévisualisation
locale ne signifie pas que toutes les fonctions sont disponibles sans réseau.

Depuis `frontend/` :

```powershell
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 5186 --strictPort
```

Ouvrir [Projet local](http://127.0.0.1:5186/). Garder le terminal ouvert.
Vite sert le frontend ; il ne qualifie pas le sas PHP CONNECT hébergé.

## Utilisation

1. Vérifier les dates début/cible et la capacité du planning.
2. Utiliser le mode séquentiel pour une capacité commune sans parallélisme.
   Le mode dépendances peut produire des chevauchements sans nivellement
   automatique des ressources.
3. Importer les tâches CSV/XLSX ou reprendre un JSON complet. Un import
   invalide conserve l'état courant ; un remplacement demande confirmation.
4. Ouvrir une tâche pour lire son objectif, ses actions et résultats attendus.
   Renseigner la réalisation, la preuve et le vérificateur avant de valider une
   étape, puis cliquer sur **Enregistrer**. Une case réalisée n'est pas une
   validation ; les deux restent indépendantes du pourcentage du lot.
5. Qualifier les risques, leur prévention, leur responsable et leur suivi.
   Le pilote fournit une préqualification indicative argumentée : le score est
   **proposé**, le statut reste **À qualifier** jusqu'à la revue humaine.
   Ces hypothèses ne sont pas des probabilités mesurées ni une preuve de traitement.
6. Exporter régulièrement le JSON pour une conservation indépendante du navigateur.
   Le **JSON est la seule sauvegarde complète** : paramètres, dates manuelles,
   descriptions, checklists, preuves et risques détaillés. Le CSV neuf colonnes
   reste un échange de tâches ; il ne transporte pas ces informations.

Le pilote est proposé au premier chargement local autorisé, sans remplacer un
brouillon existant. Pour un pilote reconnu, le chargement ou **Compléter les
fiches documentées** ajoute les fiches absentes et les registres de risques vides,
et complète la préqualification des risques encore dans leur état initial,
sans réinitialiser les modifications de suivi. Une fiche déjà renseignée, même
partiellement, est conservée. Les règles précises et les limites de l'import
CSV/XLSX sont dans [data/README.md](data/README.md).
Les exports utilisateurs ne modifient pas la source Git du pilote.
Le stockage navigateur dépend de l'origine et du profil : il ne fournit ni
partage entre comptes ni sauvegarde serveur.

## Commandes principales

Depuis `frontend/` :

```powershell
npm.cmd run generate:planning
npm.cmd run check:planning
npm.cmd test
npm.cmd run build
```

Le générateur produit les fichiers sous `data/generated/` et le document
`docs/pilotage-etapes.md`, hors des assets publics.
`check:planning` vérifie leur alignement sans les modifier. Vite les
sert uniquement en développement sous `/local-planning/`.
Le document [des étapes et risques](docs/pilotage-etapes.md) est aussi accessible
depuis les fiches sur le serveur local ; il est affiché comme texte brut.
Le build exécute cette vérification puis les tests avant de produire
`frontend/dist/` avec le sas PHP. La CI existante lance donc les tests Projet
par le build, sans modification du workflow partagé. L'artefact de l'extension
inspecté ne contient ni CSV, ni JSON, ni document Markdown du pilote ; les
résultats sont dans la recette.

Depuis la racine du monorepo, `npm.cmd run check` réalise le contrôle de base
et ne remplace pas les tests fonctionnels de Projet.

## Structure

- `frontend/src/App.jsx` : wrapper React.
- `frontend/public/legacy-app.html` : interface historique.
- `frontend/public/planning-core.js` : moteur du lot.
- `frontend/public/planning-local.js` : imports, sauvegarde et reprise navigateur.
- `frontend/public/task-details.js` : fiches, validation humaine des étapes et suivi des risques.
- `data/planning-pilote.json` : référence structurée du pilote.
- `workflows/` : générateur et procédure.
- `tests/` : contrôles ciblés.
- `backend/`, `database/` : réserves documentaires, sans backend métier actif.

## Documentation

[Architecture](architecture.md), [exigences](requirements.md),
[décisions](decisions.md), [roadmap](roadmap.md), [changelog](changelog.md),
[audit et recette](docs/source-audit.md), [publication](docs/deployment.md),
[données](data/README.md), [tests](tests/README.md),
[workflows](workflows/README.md), [API](api/README.md),
[prompts](prompts/README.md), [étapes et risques du pilote](docs/pilotage-etapes.md).

La PR brouillon dédiée est soumise à revue humaine. Un futur merge sur
`main` peut déclencher le déploiement automatique : consulter la procédure avant
ce merge.

## Mon espace — candidat commun du 6 novembre 2026

Le pied de barre latérale réutilise le composant commun ; Mes projets et Préférences conservent les actions ProjectWorkspace ; Mon compte ouvre le profil CONNECT. Le lien CONNECT dépend du portail configuré.

[Règle commune](../avereo-platform/docs/fonctionnalites-communes.md) · [Qualification et suivi](../avereo-platform/docs/qualification-mon-espace.md). Ce candidat local ne prouve pas une installation hébergée.

## Espaces applicatifs — candidat PR #121

Mes projets et Préférences conservent les actions natives de ProjectWorkspace. Mon compte ouvre désormais directement le profil CONNECT, comme dans les autres applications ; les plannings, sauvegardes et préférences natives restent inchangés.

[Règle et portée](../avereo-platform/docs/fonctionnalites-communes.md) · [Qualification](../avereo-platform/docs/qualification-mon-espace.md).
