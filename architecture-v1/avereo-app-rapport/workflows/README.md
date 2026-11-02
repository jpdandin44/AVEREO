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

# Workflows de Rapport AVEREO

## Livraison RGA en préproduction

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
