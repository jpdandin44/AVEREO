---
project: avereo-connect
document_type: architecture
title: Architecture CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-11-04
owner: jpdandin
tags: [connect, documentation, preproduction]
---


## Période commune aux applications sélectionnées

Le candidat étend la lecture de la projection privée existante aux sas partagé et Coupe. Aucune migration : les dates et les droits restent deux dimensions de la même fiche. [Flux, compatibilité et installation coordonnée](docs/acces-temporaires-applications.md).

## Cycle de vie CONNECT, Identité et Rapport

CONNECT gère le statut d’archivage, la révocation et le journal de reprise dans la base. Le pont Identité confirme une suppression signée par UID et adresse. L’effacement optionnel des dossiers utilise la connexion privée de Rapport et le même verrou que ses écritures serveur. [États et orchestration](docs/administration-comptes.md#cycle-de-vie-des-comptes--candidat-du-4-novembre).


## Identifiant commun au provisionnement et à OIDC

Le sujet de création est l'UID Drupal natif sous forme de chaîne, identique au sujet OIDC du fournisseur qualifié. Le pont signé d'invitation/reset vérifie le compte et accepte aussi son UUID historique exact, sans modifier le sujet de session ni les droits. Pas de nouvelle table, d'alias automatique ou de fusion par e-mail. [Flux, données conservées et qualification](docs/rattachement-identite.md).


## Résolution de l’identifiant de connexion — candidat local

Le hook du seul formulaire `user_login_form` précède les validateurs natifs. `LoginIdentifierResolver` recherche le nom et, pour une adresse, l’e-mail ; une résolution unique fournit le nom Drupal, toute collision est refusée. Aucun mot de passe lu par ce résolveur, aucune authentification alternative ; statut, secret, flood et session restent natifs. L’opération privée de login lisible garde UID/UUID et les droits CONNECT. [Contrat et limites](docs/connexion-identifiant-email.md).

## Reset administratif — candidat local

Le portail appelle une API protégée par session/CSRF. Le pont signé existant distingue `purpose=password_reset` et délègue au mail natif Drupal ; CONNECT ne reçoit ni jeton ni mot de passe. Audit indépendant de l’activation, sans modification de la projection d’essai. [Flux et limites](docs/reinitialisation-mot-de-passe.md).


## Administration des comptes

`AccountAdministration` orchestre le provisionnement Drupal et la transaction des droits. `TrialPolicyStore` sérialise les mutations et projette les règles hors répertoire public ; les sas Rapport/RGA les relisent. La migration ajoute dates individuelles et mode explicite sans changer l’héritage des anciens comptes. Le pont de création est signé avec un secret distinct ; l’activation existante garde le formulaire de mot de passe. [Contrat et limites](docs/administration-comptes.md). Le stockage natif Drupal `user.data` conserve l’origine de création et l’initialisation réussie du premier mot de passe ; les booléens relus sous forme chaîne sont normalisés strictement. Le renvoi garde le formulaire initial jusqu’à cette confirmation.


## Application RGA distincte

Le catalogue natif contient une application `rga`. `/api/v1/apps/rga/launch` applique les contrôles de compte, organisation, habilitation et accès individuel à cette application, puis émet un ticket signé avec sa propre clé. L’initialisation copie les droits Rapport une seule fois ; le schéma SQL existant est conservé. [Contrat](../avereo-app-rapport/api/rga.md).

# Architecture CONNECT

Le portail actuel est le backend PHP 8.3 dans `backend/` ; `frontend/` conserve
le prototype historique React. Le contrat natif est [OpenAPI](backend/api/openapi.yaml).
Le front controller charge la configuration privée ; sessions, CSRF et rôles
protègent les routes. Drupal fournit l'identité OAuth/PKCE. MariaDB/MySQL stocke
comptes, organisations, catalogue, accès et audit.

Le [sas applicatif](docs/application-gateway.md) émet un ticket HMAC court après
vérification de l'identité et des droits. Chaque application consomme le nonce et
crée sa session signée. La configuration reconnaît maintenant `passeport-immo`.
Elle ne crée ni entrée de catalogue ni habilitation sur un serveur.

## Projection d’accès des comptes archivés et restaurés

CONNECT réutilise le catalogue effectif pour republier les droits d’un compte après restauration. Le fichier privé partagé est vérifié par Rapport, RGA et, lorsque configuré et qualifié, Passeport Immo. Le pont Identité retourne l’issue distincte « retained » pour une identité native que CONNECT doit conserver. [Règles d’administration](docs/administration-comptes.md#alignement-des-comptes-non-propriétaires--candidat-local).

## Rattachement d’une identité conservée

Après décision explicite du propriétaire, CONNECT transmet au pont un rattachement signé. Le pont relit l’identité native et renvoie son sujet sans créer de doublon. CONNECT crée son propre identifiant, révoque les sessions antérieures et conserve l’activation séparée. [Procédure et protections](docs/administration-comptes.md#recréer-un-compte-dont-lidentité-avereo-existe).
