---
project: avereo-connect
document_type: changelog
title: Évolutions CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-11-06
owner: jpdandin
tags: [connect, documentation, preproduction]
---


## 4 novembre 2026 — Applications en accès temporaire

Candidat : choix de toute application du catalogue sans modifier début/fin ; contrôles de période étendus aux sas partagé et Coupe, avec tests natifs et HTTP. Aucune migration, donnée réelle ou installation hébergée. [Contrat](docs/acces-temporaires-applications.md).

## 2026-11-04 — Clarification des accès après un essai

Candidat local : distinguer la sélection du mode permanent de son enregistrement, expliquer les cases temporairement indisponibles et afficher les erreurs métier. Recette locale du passage en permanent puis ajout de Passeport Immo, avec rechargement et contrôle natif des droits. [Preuves](data/verification-acces-permanent.json). Aucun compte réel ni déploiement modifié.


## 2026-11-04 — Cycle de vie des comptes

Actions d’archivage et de restauration, suppression définitive confirmée et conservation optionnelle des dossiers serveur Rapport. La version est préparée pour revue locale. [Procédure et limites](docs/administration-comptes.md#cycle-de-vie-des-comptes--candidat-du-4-novembre).

## 2026-11-04 — Simplification de l’invitation et du premier accès

Une invitation française remplace les deux messages concurrents dans le parcours CONNECT. Deux champs dédiés permettent la première définition du mot de passe. Un écran explique les identifiants d’entrée en préproduction et permet de relancer la confirmation signée jusqu’à l’expiration de l’invitation. [Parcours et contrôles](docs/parcours-invitation-simplifie.md).

## 3 novembre 2026 — Diagnostic de première connexion et clôture

Diagnostic : notification Drupal concurrente de l’invitation AVEREO, formulaire natif et retour CONNECT bloqué par la protection HTTP. Reproduction native de deux mails, assertion d’unicité rouge ; proposition de correction et critères consignés, pas de nouveau code runtime ni déploiement dans ce dernier lot. Nettoyage exceptionnel de trois comptes de test effectué dans les deux systèmes sur demande, avec sauvegardes/restaurations et invariants vérifiés ; ce n’est pas une fonction produit. Archivage et suppression dans l’interface enregistrés pour plus tard.


## 2026-11-03 — Correction du sujet des comptes créés et invités

Le provisionnement et la connexion partagent le même sujet natif. L'invitation et le reset refusent un sujet discordant ; les anciens UUID exacts restent compatibles avec le pont signé. Aucun schéma SQL ni mot de passe modifié par le patch. La réconciliation éventuelle d'un compte existant reste ciblée et sauvegardée. [Périmètre et tests](docs/rattachement-identite.md).


## 2026-11-03 — Candidat login ou e-mail et langue

Résolution d’une adresse unique vers le login natif avant les contrôles Drupal, libellé cohérent et 254 caractères. Opération privée de nom lisible avec sauvegarde et conservation de l’identité et du secret. Langue configurée au provisionnement. Tests ciblés et recette HTTP native locale réussis ; aucune livraison de ce lot. [Preuves et limites](docs/connexion-identifiant-email.md).

## 2026-11-03 — Retour de recette et langue des comptes

Recette réelle du reset : mail reçu, sauvegarde personnelle et nouvelle connexion Identité vérifiées. Réparation ciblée de deux champs de langue invalides sur le compte autorisé. Correctif local de provisionnement utilisant la langue configurée ; 12 contrôles dédiés et 15 régressions reset réussis, sans nouvelle livraison.

## 2026-11-03 — Candidat du reset administratif

Bouton, confirmation du destinataire, route protégée, mail natif Drupal et audit séparé ; tests de refus, transport, quota et conservation. Runtime 3ac6b66 installé en préproduction après sauvegarde et restauration sur copie. Recette hébergée partielle réussie, réception SMTP et formulaire natif non qualifiés. [État et limites](docs/reinitialisation-mot-de-passe.md).


## 2026-11-03 — Préproduction après démonstration

Runtime `e76f3d77634bafb4056e3f753e31331bbaa613b2` installé après go, sauvegardes et restaurations sur copies. Création native, droits explicites, période et invitation séparée ; corrections du Reply-To Drupal/Symfony, des marqueurs natifs et du paramètre de formulaire. Contrôles HTTP d’isolement/expiration et formulaire public réussis ; données Rapport initiales conservées. Compte métier préparé sans mail ; accès HTTP nominatif et invitation encore à finaliser. [État](docs/administration-comptes.md). Aucun merge ni production.

## 2026-11-03 — Parcours local de création et invitation

Création sans mail, applications explicites, période individuelle, invitation séparée et confirmation accessible dans la page. Pont Drupal de création bloquée sans mot de passe, migration réversible et projection privée pour les deux sas. Tests de doublons, refus, périodes, sessions existantes et erreurs. À cette étape locale initiale, non livré et qualification hébergée restante.


## 2026-11-02 — Préparation du parcours des comptes

Dossier de reprise, ordre de développement, points de code, critères P0 et procédure de qualification rédigés. Création administrative et durée individuelles non implémentées ; aucune invitation ou installation réalisée par cette préparation. [Point de départ](docs/reprise-administration-comptes.md).


## 2026-11-02 — RGA distincte, après retour du responsable

Remplacement du raccourci synthétique par le catalogue natif et le lancement `rga`. Ajout des paramètres dédiés, d’une déclaration transactionnelle avec copie unique des droits Rapport et d’un retour arrière ciblé sous contrôle d’empreinte. Ajout des contrôles d’indépendance et des fixtures locales.


## 2026-11-02 — Raccourci RGA

Ajout du raccourci de la carte hébergée dans Rapport et du choix fixe de vue, sans changement de droits ni de configuration. [Contrat et état de livraison](../avereo-app-rapport/api/rga.md).

# Évolutions CONNECT

## 6 novembre 2026 — Mon espace commun

Candidat local : Le portail PHP regroupe Mon compte, Mes applications, Gérer les comptes selon les droits et la confirmation de déconnexion. Le menu est masqué pour les visiteurs non authentifiés. Le frontend historique reprend seulement la présentation et conserve ses actions locales. [Suivi du lot](../avereo-platform/data/suivi-fonctions-communes.json).

## 2026-10-14

Reconnaissance des clés `APP_LAUNCH_PASSEPORT_IMMO_URL` et
`APP_LAUNCH_PASSEPORT_IMMO_SECRET`, y compris dans le chargeur de configuration
privée. Le contrôle des clés applicatives inclut les noms comportant un underscore.
Socle documentaire complété avec références vers les contrats et procédures existants.
Aucune migration, habilitation ou installation hébergée exécutée par ce lot.

## 2026-11-04 — Cycle de vie des comptes à droits hérités

Candidat local pour les comptes non propriétaires avec Rapport, RGA et Passeport Immo qualifié. Motifs d’indisponibilité affichés, droits hérités restaurés et suppression CONNECT dissociée de l’identité native lorsqu’elle doit être conservée.

## 2026-11-04 — Recréation d’un compte avec identité existante

Le candidat local ajoute le rattachement explicite d’une identité historique, l’affichage immédiat du compte créé et l’option d’invitation après création.
