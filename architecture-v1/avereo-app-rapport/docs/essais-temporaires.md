---
project: avereo-app-rapport
document_type: security-design
title: Essais temporaires Rapport et RGA
status: active
version: git
created: 2026-11-02
updated: 2026-11-04
owner: jpdandin
tags: [connect, comptes, essai]
---

## Sessions et dossiers lors de l’archivage CONNECT

La projection privée peut porter sessions_revoked_at. Rapport et RGA refusent les tickets et cookies antérieurs ou égaux à cette date même après restauration. Les écritures de dossiers prennent un verrou partagé sur la politique puis vérifient de nouveau l’accès. CONNECT prend le verrou exclusif avant un effacement. [Cycle de vie](../../avereo-app-connect/docs/administration-comptes.md#cycle-de-vie-des-comptes--candidat-du-4-novembre).


## Intégration CONNECT locale du 3 novembre

Le portail et son service de création alimentent maintenant la projection depuis la base CONNECT. Les autorisations sont vérifiées avant publication d’un refus, puis la règle est rétablie après succès. Une projection absente n’est pas recréée automatiquement. Le [parcours des comptes](../../avereo-app-connect/docs/administration-comptes.md) décrit paramètres, migration et preuves ; aucune installation ni qualification hébergée déduite des contrôles locaux.


# Essais temporaires Rapport et RGA

## État constaté le 2 novembre 2026

Candidat **local non livré**, sur la branche `feat/essai-temporaire-20261103`. Aucun compte réel créé et aucun envoi de mail par ce lot. La qualification hébergée, l'interface d'administration et la validation humaine restent à faire.

Le portail CONNECT contrôle les droits à chaque nouveau lancement. Les cookies applicatifs préexistants ne consultent pas son statut courant. La suspension du compte CONNECT ne constitue donc pas à elle seule une preuve de coupure d'une application déjà ouverte.

## Contrôle local préparé

Option privée `connect_trial_access_file`, hors document root, JSON version 1. Une règle est indexée par l'ID CONNECT signé et contient `status`, `not_before`, `not_after` (secondes Unix entières) et `applications` (codes exacts). La période autorisée est `[not_before, not_after[` ; `revoked` refuse aussi les cookies déjà ouverts. Le contrôle intervient à l'échange du ticket et à la validation de chaque cookie, donc notamment sur les appels API.

Sans option, le comportement existant est conservé. Un compte absent d'une politique valide conserve ses droits normaux ; ceux-ci restent délivrés par CONNECT. Une politique configurée absente, invalide, trop volumineuse ou publique entraîne un refus. Les cookies anciens sans identité doivent être renouvelés lorsqu'une politique est configurée.

La compilation RGA réutilise le sas Rapport en conservant son propre code d'application, son cookie, sa clé et sa configuration. Le sas RGA conserve désormais l'identité signée. Aucun autre sas partagé ni autre application n'est modifié.

## Vérifications et limites

- 17 contrôles unitaires de période par application : avant, début inclus, fin exclue, expiration, révocation et refus en cas de configuration invalide.
- 23 contrôles HTTP PHP : deux identités, création/liste et refus de lecture/modification/suppression du dossier de l'autre ; expiration et révocation sans effacer le cookie ; refus de nouveaux tickets après échéance ; autre compte conservé.
- Le test HTTP utilise une base SQLite privée éphémère : seul le connecteur de base est remplacé, le code SQL et les contrôles de propriété de `reports.php` sont conservés. Il ne qualifie pas MySQL hébergé.
- Non-régression des sas : 17 contrôles HTTP RGA, 10 contrôles PHP RGA, test PHP Rapport ; compilation et 98 tests JavaScript réussis.
- Les brouillons IndexedDB/localStorage actuels sont rattachés au navigateur, pas à chaque identité. L'isolement serveur ne prouve donc pas l'isolement des brouillons lors d'un changement de compte dans un même profil. Pour l'essai, un profil personnel distinct est nécessaire ; cette limite doit être revue avant de généraliser les comptes partagés sur un poste.
- Le refus serveur après échéance ne retire pas un document déjà téléchargé ni des données déjà chargées dans la mémoire du navigateur. CONNECT peut encore afficher le portail ; ce candidat limite l'accès hébergé aux deux applications.

## Préproduction à qualifier

Contrôler la version réelle, sauvegarder les deux sas et leurs configurations privées, répéter la restauration sur une copie privée, puis installer uniquement les fichiers autorisés. Vérifier les empreintes, l'ouverture séparée de chaque application et une échéance courte avec des identités de recette sans données client. Le compte d'essai ne doit pas être administrateur et ne doit jamais hériter des autres applications.

La restauration de l'ancien sas supprimerait le contrôle d'échéance : ne pas la réaliser pendant qu'un cookie d'essai est encore valable. Qualifier d'abord le retour arrière avant d'ouvrir l'essai ; conserver ensuite une barrière serveur effective pour tout cookie émis. La configuration privée et les règles nominatives restent hors Git.

## Administration CONNECT

Le [cadrage de l'administration des comptes](../../avereo-app-connect/docs/administration-comptes.md) décrit la création, l'invitation et la gestion des mots de passe proposées. Ce document ne crée pas une seconde source nominative de suivi : versions, permissions, décisions et preuves hébergées restent dans le cockpit canonique.
