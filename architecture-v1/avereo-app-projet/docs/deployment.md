---
project: avereo-app-projet
document_type: deployment
title: Prévisualisation et publication de Projet
status: active
version: git
created: 2026-09-19
updated: 2026-11-06
owner: jpdandin
tags:
  - projet
  - deploiement
  - local
---

# Prévisualisation et publication de Projet

## Sujets et colonnes — livré en préproduction le 6 novembre 2026

Candidat `79182df` installé à 08 h 38 Paris après accord, sauvegarde fraîche et restauration sur copie. Seize fichiers vérifiés, huit JSON privés identiques après recette des deux projets. Reçus privés : `/home/daje3540/private/projet-sujets-79182df-20261106`. Les [preuves](../data/preprod-sujets-colonnes/delivery-observation.json) sont rattachées à [la fiche du lot](../data/suivi-sujets-colonnes.json). Réutiliser `prepare-preprod-workspace.py` après build et commit propre : ses 16 fichiers couvrent le moteur, l’interface, la validation PHP et le wrapper compilé. Il préserve notamment `index.php` et le sas ; le menu déjà livré reste conservé. Le paquet ne contient aucune donnée utilisateur.

Avant installation : accord sur ce candidat et `https://projet-preprod.avereo.fr`, sauvegarde fraîche des fichiers et documents privés, restauration sur copie vérifiée, contrôle du passage et qualification PHP sur fixtures. Après installation : empreintes des assets et fichiers protégés, refus API anonyme, ouverture des deux projets en lecture, filtres et colonnes, comparaison des JSON privés avant/après. Fermer/recharger les anciens onglets avant toute édition des nouveaux champs. Aucun accord de production acquis.


## Menu de compte — livré en préproduction

Le 5 novembre 2026 à 22:08:56 UTC, le candidat `679e201` a été installé après accord explicite du responsable. Sept fichiers vérifiés, quatre fichiers du sas conservés et tous les JSON privés identiques avant/après installation et recette navigateur. Sauvegarde restaurée sur copie et reçu privé : `/home/daje3540/private/projet-menu-679e201-20261105/delivery-receipt.json`. L'accord concerne cette préproduction ; ni merge ni production ne sont autorisés par cet accord.

Ce lot remplace uniquement l’injection visuelle finale de `index.php`, le HTML du Gantt, son script/CSS de compte et le wrapper compilé avec son nouvel asset JS. Il ne remplace ni `connect/gate.php`, ni la configuration privée, ni les routes API, ni les données. Les anciens installateurs qui préservent `index.php` ne conviennent pas à ce lot : ne pas les détourner. Préparer une sauvegarde restaurée des sept fichiers concernés, vérifier les empreintes et obtenir l’accord exact avant livraison. État dans le [suivi](../data/suivi-menu-compte.json).


## Livraison de Mon espace et des projets indépendants

Livraison observée à `2026-11-05T14:50:12Z` : code
`f1a920b313a2a28ac45325f0b7a8bf114679af73`, paquet
`09895358477965126a893484165f4c6d219f6b8ed8acbad57e0e3a4f58e1d1b9`.
Reçus et récupération : `/home/daje3540/private/projet-workspace-f1a920b-20261105`.
Les [observations](../data/preprod-workspace/delivery-observation.json) et la
[recette](../data/preprod-workspace/browser-recipe.json) distinguent les contrôles
du site réel des tests isolés sur données fictives. La session cPanel expirée
a été rétablie par le responsable avant transfert.

Le lot s’appuie sur la sauvegarde privée déjà installée. Source dédiée :
`feat/projet-account-space-20261105`, basée sur la PR #107 encore ouverte.
Le [suivi canonique](../data/suivi-espace-projets.json) donne l’état effectivement
observé ; les reçus historiques ci-dessous restent propres aux anciens candidats.

Après tests/build et commit propre :
`python workflows/prepare-preprod-workspace.py --source CHEMIN_APP --output DOSSIER_NEUF`.
Le paquet ne contient que 16 fichiers applicatifs, jamais les données utilisateur.
Le dossier privé de transfert contient aussi les scripts et fixtures de qualification.
Sur l’hôte : `deploy-preprod-workspace.py prepare`, contrôle du passage,
`deploy-preprod-workspace.py deploy`, puis `deploy-preprod-workspace.py verify`.

La préparation sauvegarde le site, la configuration privée et tous les documents,
puis vérifie une restauration sur copie. Toute dérive des données avant livraison
exige une nouvelle préparation. Aucun document métier n’est migré ou remplacé.
La qualification HTTP native utilise seulement des identités et projets fictifs.
Le rollback restaure le code sans modifier la configuration de stockage ni les
nouveaux dossiers ; ces derniers restent privés et récupérables même si l’ancienne
interface ne sait pas les lister. Le sas CONNECT reste inchangé.


## Lot de sauvegarde privée — 5 novembre 2026

Livraison observée à `2026-11-05T10:30:49Z` : source `a1933e74de6299153189cff1838f5d6020bbf6eb`,
paquet `5b50bca10b5bf52509be5c91fcd514addf0da5eda9293c150a6638ffa6507bb9`.
Reçus et sauvegardes privés dans `/home/daje3540/private/projet-online-a1933e7-20261105`.
Les [observations de livraison](../data/preprod-online/delivery-observation.json)
et la [recette](../data/preprod-online/browser-recipe.json) portent les preuves et limites.

Source : branche dédiée `feat/projet-online-save-20261105`. La demande directe
autorise la mise en place sur `https://projet-preprod.avereo.fr`.
Voir le [suivi canonique](../data/suivi-enregistrement-en-ligne.json) pour la
version effectivement livrée et ses preuves ; les reçus historiques restent datés.

Après tests PHP/HTTP, tests frontend, build, contrôle documentaire et commit :
`python workflows/prepare-preprod-online.py --source CHEMIN_APP --output DOSSIER_NEUF`.
Transférer le paquet en privé puis exécuter `deploy-preprod-online.py prepare`,
le contrôle de passage et `deploy`, puis `verify`. L'installateur réutilise
le workflow Gantt pour sauvegarde intégrale, répétition installation/restauration,
refus de dérive et retour arrière. Il qualifie le document root par cPanel.

Les fichiers applicatifs autorisés incluent les deux endpoints PHP, les scripts,
le wrapper et ses deux assets, ainsi que `.htaccess`. Le sas et ses secrets
ne sont pas remplacés. Le propriétaire CONNECT `avereo_admin` a été retrouvé
par lecture serveur comme identité 1, active. Cette donnée est vérifiée avant
création de `~/.avereo/projet-preprod/planning.php` (0600) et de `planning-data`
(0700). L'API refuse un stockage situé sous la racine publique.

La qualification HTTP distante utilise un serveur en boucle locale, des secrets
fictifs et un répertoire temporaire ; aucune donnée métier n'est modifiée.
Le retour arrière restaure les fichiers et désactive la configuration de planning
en la conservant dans le dossier privé de livraison. Les JSON créés depuis la
livraison restent conservés ; aucun retour arrière de données automatique.

La PR #90 a été fusionnée le 2 novembre ; le statut brouillon mentionné dans
la recette du 28 octobre ci-dessous est une observation historique.


## Préproduction Gantt — 28 octobre 2026

Le responsable demande la version locale comme outil en préproduction. La cible
est `https://projet-preprod.avereo.fr/`, racine cPanel vérifiée
`/home/daje3540/projet-preprod.avereo.fr`, distincte des autres racines.
Le lanceur hébergé référence déjà `/legacy-app.html` ; la configuration privée
existe. Le workflow de production ci-dessous n'est pas utilisé.

Le lot contient exactement `legacy-app.html`, `planning-core.js`,
`planning-local.js` et `task-details.js`. Il conserve index, assets existants,
`.htaccess`, sas CONNECT, configuration privée et bases. Aucun JSON personnel
n'est publié. Les sources et tests sont sur une branche dédiée ; pas de merge main.

Après build d'une source commitée et propre, exécuter
`python workflows/prepare-preprod-gantt.py --source CHEMIN_APP --output DOSSIER_NEUF`.
L'archive, son manifeste et `deploy-preprod-gantt.py` sont transférés dans un
dossier privé sous `/home/daje3540/private/`. L'installateur n'accepte aucune
autre cible ni fichier et relit le document root cPanel.

`prepare` sauvegarde et répète installation/restauration dans une copie privée ;
`deploy` refuse une dérive puis installe les dépendances avant l'HTML ; `verify`
contrôle les empreintes et la configuration. `rollback` restaure uniquement les
chemins du candidat et refuse d'écraser une modification ultérieure. Les reçus
restent en privé. Exécuter le contrôle du protocole avant le passage effectif.

Contrôler ensuite les réponses anonymes, l'accès CONNECT réel, l'affichage,
l'import/export JSON et la reprise. Le navigateur de préproduction constitue
une nouvelle origine : importer sa sauvegarde une fois dans le navigateur
d'usage, puis exporter régulièrement. Pas de base partagée dans cette version.
Le [suivi](../data/suivi-gantt-affichage.json) porte les preuves réelles.

### Livraison constatée

Le 28 octobre à 17:48 UTC, le candidat source `a6b4cdf309aff8f2ee1c41922d27e84e2fe0bedc`
et paquet `201bf0d501cce3677957fa3f929628be4a3e280fad310949666fda30d16a6b51`
est installé. La [préparation/restauration](../data/preprod-gantt/prepare-receipt.json),
le [contrôle de passage](../data/preprod-gantt/gate-before-delivery.json), le
[reçu de livraison](../data/preprod-gantt/deploy-receipt.json), la
[vérification distante](../data/preprod-gantt/verify-receipt.json) et le
[contrôle HTTP](../data/preprod-gantt/http-receipt.json) sont conservés.
La configuration privée et le reste de l'arbre sont inchangés ; aucune écriture SQL.
La sauvegarde reste dans le dossier privé de cette itération.

L'entrée principale renvoie 303 vers CONNECT, qui demande l'authentification
préproduction (401 anonyme). Les fichiers statiques restent lisibles anonymement :
ce sas n'est pas une protection globale du code frontend. Aucun planning personnel
n'a été transféré sur le serveur. La session Chrome connectée du responsable a
ensuite été observée : import de la référence de 45 tâches dans un brouillon vide,
export et reprise après rechargement réussis, avec fichiers exportés strictement
identiques. Synthèses repliées et trait du jour observés. Le
[reçu navigateur](../data/preprod-gantt/browser-recipe.json) précise les limites :
pas de rejeu de connexion vierge ni de tous les gestes, autres profils indépendants.
La [PR #90](https://github.com/jpdandin44/AVEREO/pull/90) reste en brouillon,
sans merge ni validation humaine déduite de la livraison technique.

Le nouvel enregistrement de dossiers clients sur serveur est seulement demandé.
Il nécessite un lot V2 distinct, des droits par projet et une récupération de
données qualifiée ; la présente livraison de fichiers statiques ne l'active pas.

L'espace **Revues & approbations** se lance avec `npm.cmd run dev:review` sur
le port 5190 ; voir le [workflow local](../workflows/revue-developpement.md).
Il utilise le middleware de développement et le chantier choisi.
Le build hébergé exclut son module et ses données, avec contrôle intégré.
Publier le site actuel ne publierait donc pas ce service de revue.
Une revue multiutilisateur hébergée nécessitera un lot dédié et son autorisation.


## Local

Depuis `frontend/` :

```powershell
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 5186 --strictPort
```

Ouvrir [Projet local](http://127.0.0.1:5186/). Vite ne teste pas le sas PHP.
Le préchargement est réservé à `localhost`, `127.0.0.1` et la boucle IPv6.
Les endpoints `/local-planning/planning-pilote.csv` et
`/local-planning/planning-pilote.json` appartiennent au middleware de
développement. Les fichiers sont générés hors de `frontend/public/`
et ne doivent pas figurer dans `dist/`.

## Workflow actif

Le workflow du monorepo est
[`.github/workflows/deploy-projet-o2switch.yml`](../../../.github/workflows/deploy-projet-o2switch.yml).
Les workflows imbriqués dans l'app ne s'exécutent pas pour ce dépôt.

Déclenchement manuel ou push `main` touchant le frontend Projet, son workflow
ou `.github/scripts/**`. Le job utilise l'environnement `projet`, construit
`frontend/dist/` puis publie par SSH/rsync avec `--delete`.

Un push de branche dédiée et une PR brouillon ne déclenchent pas cette
publication automatique. Un futur merge peut la déclencher : l'autorisation
humaine doit considérer cet effet. Les protections réelles de l'environnement
GitHub n'ont pas été vérifiées.

## Cible et paramètres

Sous-domaine documenté : `projet.avereo.fr`. Publier les artefacts PHP,
`.htaccess` et le frontend. Le chemin réel vient de `O2SWITCH_TARGET_PATH` ;
`~/public_html/projet` reste une suggestion historique, pas une preuve du
document root.

Le workflow référence `O2SWITCH_SSH_KEY`, `O2SWITCH_USER`,
`O2SWITCH_HOST`, `O2SWITCH_PORT`, `O2SWITCH_TARGET_PATH`.
La liste blanche cPanel utilise `CPANEL_USERNAME`, `CPANEL_SERVER` et les
modes `CPANEL_PASSWORD` / `CPANEL_API_TOKEN` du script partagé.
Aucune valeur sensible n'est documentée ici.

Apache/PHP sont requis pour le sas même si le métier reste dans le navigateur.
Comptes, configuration et état DNS/HTTPS ne sont pas qualifiés par ce lot.

## Retour arrière

Conserver une archive distante avant transfert destructif et restaurer l'artefact
précédent si nécessaire. Exports utilisateurs et brouillons navigateur sont
distincts de la sauvegarde du code. Aucun merge, déploiement ni retour arrière
de production n'est exécuté dans cette intervention. La livraison ciblée de
préproduction et sa récupération sont celles documentées en tête de ce document.
