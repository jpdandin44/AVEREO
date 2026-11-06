---
project: avereo-connect
document_type: requirements
title: Exigences CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-11-06
owner: jpdandin
tags: [connect, documentation, preproduction]
---

## Enregistrement du mode permanent et attribution des applications

L’administration doit distinguer le mode sélectionné du mode réellement enregistré. Le choix des applications ne dépend pas du mode temporaire/permanent. Une conversion en permanent exige une confirmation explicite, puis une réponse serveur réussie avant de supprimer la date de fin. L’annulation conserve la période. Le mode permanent ne donne aucun droit automatiquement. L’interface explique que les dates enregistrées s’appliquent à toutes les applications cochées et présente le message métier des erreurs. Les contrôles de rôle, organisation, CSRF et catalogue restent applicables. [Parcours](docs/administration-comptes.md#passer-un-compte-en-permanent-et-ajouter-une-application).


## Cycle de vie des comptes

Le propriétaire peut archiver et restaurer un compte membre éligible. La suppression définitive requiert la confirmation explicite de son adresse et le choix sur les dossiers Rapport. Le choix par défaut est la conservation. Les reprises conservent ce choix et l’identité ciblée. [Périmètre](docs/administration-comptes.md#cycle-de-vie-des-comptes--candidat-du-4-novembre).

## Invitation et première connexion

Un seul e-mail français, un premier mot de passe défini une seule fois, retour fiable à CONNECT et identifiant par e-mail. Les contrôles d’identité, rôles, applications et période restent obligatoires. [Critères du parcours](docs/parcours-invitation-simplifie.md).


## Continuité du compte créé et invité

La création doit enregistrer le sujet natif que le fournisseur OIDC renverra à la connexion. Activation et authentification retrouvent le même identifiant CONNECT, sans nouveau compte en attente ni rapprochement implicite par e-mail. Toute réconciliation d'un compte existant conserve mot de passe, droits et période. [Contrat et critères](docs/rattachement-identite.md).


## Connexion par login lisible ou adresse e-mail — attente confirmée

Un libellé « login ou adresse mail » engage les deux possibilités. Le nom de profil CONNECT ne doit pas être présenté comme un login utilisable s’il ne correspond pas à l’identité. Le reset conserve les identifiants et l’identité existants. État hébergé : service natif limité au nom technique. Candidat local : résolution de l’e-mail par le formulaire, login natif lisible préparé pour le compte demandé, collisions refusées et validation native conservée. [Contrat et preuves](docs/connexion-identifiant-email.md). Aucun déploiement de ce candidat.

## 2026-11-03 — Retour de recette et langue des comptes

La langue de toute identité créée doit appartenir aux langues configurées dans Drupal. Utiliser la langue par défaut du site ; ne pas imposer une langue indisponible. Correction préparée localement le 3 novembre, non installée.

## Envoi administratif du reset

Compte actif initialisé et adhésion active ; rôles et organisation contrôlés côté serveur, confirmation du destinataire, CSRF et HMAC, anti-rejeu et quota. Conservation du mot de passe courant, de la période et des droits lors de l’envoi ; succès transport distinct de la réception. [Critères et preuve](docs/reinitialisation-mot-de-passe.md).


## Périmètre implémenté localement le 3 novembre

Créer un compte membre, sélectionner ses applications, fixer une période ou un accès permanent, puis envoyer séparément l’invitation. L’accès temporaire concerne les applications sélectionnées du catalogue ; aucun mot de passe géré par CONNECT. Vérifier les routes, les sessions ouvertes et le transport réel avant installation. [Critères et état](docs/administration-comptes.md).


## Reprise du 3 novembre — préparation close

Le responsable demande de préparer le développement et la mise en préproduction du parcours de compte avant la démo de 9 h 30. Priorité : création sans notification automatique, applications explicites, période d’essai et invitation séparée. Réinitialisation administrative d’un mot de passe existant en suite. [Ordre de travail et critères](docs/reprise-administration-comptes.md). Aucun démarrage automatique, candidat installé ou accès réel déduit de cette préparation.


## Administration des nouveaux comptes — demande du 2 novembre

Préparer un compte depuis CONNECT, choisir ses applications et sa période, puis envoyer séparément un lien personnel de définition du mot de passe géré par Drupal. Distinguer activation et réinitialisation d’un mot de passe existant ; tracer les états réels sans prétendre à une réception de mail. [Cadrage](docs/administration-comptes.md). Aucun nouveau parcours livré.


## RGA — 2 novembre 2026

Le responsable confirme une tuile RGA distincte et l’accès depuis Rapport. Les droits initiaux de Rapport doivent être repris exactement, refus et périodes de validité compris, puis gérés indépendamment. Rapport seul ne doit pas ouvrir RGA et RGA seule ne doit pas ouvrir Rapport. [Critères d’intégration](../avereo-app-rapport/api/rga.md).

# Exigences CONNECT

- Conserver identité Drupal/OAuth/PKCE, sessions, CSRF, rôles et refus par défaut.
- Lancement réservé aux comptes approuvés et aux droits applicatifs courants.
- Paramètres privés et dumps hors document root, Git et conversation.
- Migrations hébergées et déploiements distincts des PR de préparation.
- Reconnaître les clés URL/SECRET de Passeport Immo sans accorder de droit implicite.

Le [contrat OpenAPI](backend/api/openapi.yaml) et la
[qualification C7](docs/production-readiness-c7.md) portent les détails existants.
Runtime installé : `e76f3d77634bafb4056e3f753e31331bbaa613b2`. Recette technique et réserves dans [le parcours des comptes](docs/administration-comptes.md). Restent l’entrée HTTP nominative, l’invitation métier, sa réception et l’activation personnelle ; les dates définitives doivent suivre l’envoi effectif.

## Alignement du cycle de vie des comptes

Les droits hérités et le rôle administrateur d’un compte non propriétaire n’excluent pas son archivage. Le propriétaire conserve la responsabilité de son organisation. La restauration restitue les droits effectifs. La suppression respecte les identités utilisées dans Drupal et la conservation des dossiers Rapport. [Périmètre et conditions](docs/administration-comptes.md#alignement-des-comptes-non-propriétaires--candidat-local).

## Création visible et invitation facultative

La création confirmée est visible immédiatement dans l’administration. L’envoi d’invitation est une décision distincte. Un échec d’envoi ne remet pas en cause la création. Le propriétaire peut confirmer un rattachement à une identité conservée sous les conditions du [parcours de recréation](docs/administration-comptes.md#recréer-un-compte-dont-lidentité-avereo-existe).

## Première connexion après activation

Une confirmation réussie doit ramener à la connexion avec le mot de passe AVEREO existant, même si une autre session est ouverte. Aucun mot de passe Drupal ne doit être dupliqué dans CONNECT. [Critères et contrôles](docs/retour-activation-connexion.md).
