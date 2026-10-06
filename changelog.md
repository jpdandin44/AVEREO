---
project: avereo
document_type: changelog
title: Changelog du dépôt AVEREO
status: active
version: git
created: 2026-10-03
updated: 2026-10-06
owner: jpdandin
tags: [avereo, documentation, local]
---

# Changelog du dépôt AVEREO

## 2026-10-03
Ajout du socle documentaire racine manquant sous forme d’index et du chantier local
[Passeport Immo](architecture-v1/avereo-app-passeport-immo/changelog.md).
Les évolutions historiques des autres applications ne sont pas reconstruites ici.

Ajout du [socle transverse GitHub et cockpit](outillage/protocole-developpement/README.md),
des skills `dev` et `developpement-github-cockpit`, de leur installateur utilisateur
et des contrôles ciblés. Les applications et déploiements restent sous leurs lots propres.

## 2026-10-06

Reprise de la PR #76 : inventaire cPanel de onze préproductions, confirmation du
filtrage IP de CONNECT et préparation privée de son remplacement par Basic sur
HTTPS. Raccordement du lot au cockpit avec conservation du suivi initial, et
contrôles d’accès portables sur Windows. Pilote CONNECT appliqué après accord direct,
avec sauvegarde privée vérifiée, contrôle HTTPS 401/Basic et refus HTTP 403 sans
challenge. Accès avec le bon compte et recette métier en attente ; aucune modification
de production. Voir le [relevé](outillage/acces-preproduction/releve-heberge.md).

Après fusion de la PR #76, diagnostic en lecture seule de l’échec de connexion
sur le fournisseur d’identité de préproduction. Le suivi identifie une installation
Simple OAuth incomplète, avec deux bibliothèques PHP absentes ; la recette reste
bloquée avant le lancement des applications. Aucune réparation distante ni
modification des comptes ou secrets effectuée pendant ce diagnostic.

Réparation demandée puis appliquée au seul serveur d’identité : contrat Composer
exact conservé dans Git, ajout des bibliothèques manquantes, disposition et
empreinte du cœur Drupal préservées. Premier candidat restauré après échec de
chargement ; second candidat qualifié et recette technique réussie, avec écran
OAuth de connexion accessible. Huit tests locaux de réparation et 22 tests CI
réussis. Parcours avec le compte du responsable et lancement des applications
encore à recetter ; aucune livraison de production ni modification de compte.

Clarification des liens de revue de la PR #77 : accès de recette CONNECT,
fournisseur d’identité, tests locaux du correctif et cockpit de suivi distingués.
Une première correction de la case de test pointait vers la procédure de
validation ; elle est corrigée pour ouvrir directement CONNECT préproduction.
Le lien a été cliqué depuis la PR : destination CONNECT confirmée, protection
HTTPS 401 Basic contrôlée. Le navigateur intégré bloque sur l’authentification ;
le parcours avec le compte du responsable reste à recetter. Le suivi conserve
ce contrôle et sa limite. Les serveurs et validations humaines sont inchangés.
