---
project: avereo-app-rapport
document_type: workflows-index
title: Workflows de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-11-02
owner: jpdandin
tags:
  - rapport
  - workflows
  - deploiement
---

## Application RGA distincte

`prepare-rga-access-delivery.py` compose une livraison ciblée à partir du relevé
privé des fichiers actifs. Entrées : répertoire `--observed` (trois sources CONNECT
sans secrets, empreintes des deux racines), `--rapport-build` (copie isolée du
candidat hébergé `63ec279`, déjà reconstruite avec synchronisation) et `--output`
(répertoire neuf). Le HTML et ses assets doivent reproduire exactement la version
Rapport active avant application des changements. Le script applique uniquement
les modifications RGA, conserve la dictée et la saisie récentes, vérifie les
composants inchangés, exécute les tests/build et produit archive et manifeste.
La variante CONNECT conserve sa base hébergée `76566ca` et l’ajout Passeport Immo ;
elle est contrôlée avec ses tests historiques et les nouvelles assertions RGA.

Le manifeste `kind=rga-independent-access` autorise seulement cinq fichiers
CONNECT, six pages/bibliothèque RGA, l’index Rapport et ses assets. Le sas Rapport,
les API métier et les fichiers privés restent exclus du paquet public.
`deliver-rga-preproduction.py` conserve ses commandes de fichiers décrites plus bas.
Sa liste autorisée distingue ce nouveau profil du raccourci historique.

Dans un dossier privé sous `~/.avereo/rga-preprod/`, placer l’archive, le manifeste,
le script de fichiers et `activate-rga-preproduction.php`. Ordre de préparation :
`python3 deliver.py prepare`, puis `php activate.php prepare ID_PROPRIETAIRE`.
Le premier sauvegarde les fichiers/configurations et répète installation et
restauration sur copies. Le second conserve un plan des lignes CONNECT concernées,
répète leur copie et leur retrait en base SQLite isolée avec les droits réellement
observés, puis prépare une clé RGA aléatoire et les configurations privées. Il
n’écrit pas dans la base active pendant cette préparation. Les secrets restent
sur l’hébergement, hors des racines publiques et des comptes rendus.

Après qualification du candidat et contrôle de passage dans le cockpit :
`python3 deliver.py deploy`, `php activate.php activate`, puis
`php activate.php verify` et `python3 deliver.py verify`. L’activation refuse
une dérive des configurations ou des droits source, déclare RGA dans une transaction
et installe les configurations privées. Le reçu prouve la copie exacte et la
conservation des droits Rapport. Les fichiers hors lot restent inchangés.

Retour arrière : `php activate.php rollback`, puis `python3 deliver.py rollback`.
Il refuse d’écraser des droits ou fichiers modifiés depuis. Le plan, les reçus et
les copies privées restent conservés. Aucun changement de schéma SQL, de données
de rapport, ni de production. La recette authentifiée et l’état réel sont tracés
dans le [contrat et le suivi canonique](../api/rga.md).

## Historique — livraison du raccourci RGA en préproduction


Après commit du candidat et build avec `VITE_ENABLE_ONLINE_SYNC=true`,
`python workflows/prepare-rga-delivery.py` produit l'archive et son manifeste
dans `frontend/.local/rga-delivery/`. Le script refuse les sources non commitées.
Il dérive le seul correctif CONNECT de la version hébergée identifiée
`76566ca43b3e1e03a4a465391aac2f99017517cb`, en conservant ses autres méthodes.
Les modifications sont identiques à celles de la branche de développement ;
la variante est testée avec son backend historique avant transfert.

`deliver-rga-preproduction.py`, copié comme `deliver.py` dans un dossier privé
`/home/daje3540/.avereo/rga-preprod/<candidat>/`, accepte `qualify`, `prepare`,
`deploy`, `verify` et `rollback`. Il vérifie les deux racines, l'isolement des
bases/configurations, les empreintes antérieures et l'archive. `prepare`
sauvegarde les fichiers et configurations, puis répète installation/restauration
sur copies privées. `deploy` refuse toute dérive depuis la sauvegarde ; les
autres fichiers et les bases sont conservés. `rollback` refuse un état modifié
depuis la livraison. Aucun accès de production n'est prévu dans cet outil.

Entrées : commit Git, build authentifié, archive vérifiée, configuration cPanel
existante et accord applicable. Sorties : manifeste, qualification, récupération
et reçus privés. Aucun nouveau secret requis. [Contrat et suivi](../api/rga.md).

Tests : `python -m unittest discover -s tests -p test_rga_delivery.py` ;
syntaxe Python 3.6 et PHP des fichiers produits. Les essais locaux ne remplacent
pas `prepare` sur l'état hébergé immédiatement antérieur à la livraison.

Pour une correction après première installation, archiver le manifeste et
l'artefact précédents, puis lancer `prepare-rga-delivery.py --previous-manifest
CHEMIN_DU_MANIFESTE_ARCHIVE`. Les cibles et la base CONNECT doivent coïncider.
La liste complète des empreintes précédentes devient le contrôle préalable
du serveur ; les deux identités de candidat restent tracées. Utiliser un nouveau
dossier privé de livraison pour préserver les anciens reçus et sauvegardes.
Le lot inclut désormais `rga/cadastre-map.js`, le module de reprojection partagé
et les fichiers Leaflet locaux avec leur licence.

Le workflow executable de deploiement est mutualise a la racine du monorepo :
`.github/workflows/deploy-rapport-o2switch.yml`.

Sa procedure, ses dependances et ses secrets sans valeur sont documentes dans
[`../docs/deployment.md`](../docs/deployment.md).

Le workflow fonctionnel envisage pour `Visite Globale` est formalise, sans
etre encore implemente, dans la section `Propositions en etude` de
[`workflow-habitologie.md`](workflow-habitologie.md).
