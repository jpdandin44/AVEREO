---
project: avereo-connect
document_type: functional-design
title: Applications et période d’accès
status: active
version: git
created: 2026-11-04
updated: 2026-11-04
owner: jpdandin
tags: [avereo, acces, documentation]
---

# Applications et période d’accès

## Cadrage

Décision du responsable le 4 novembre : un compte temporaire peut recevoir toute application disponible dans son organisation, notamment Passeport Immo. Les dates renseignées dans **Période d’accès** restent la référence. Cette décision remplace la limitation Rapport/RGA du premier essai et le détour par le mode permanent introduit dans la PR #105.

Les applications et la durée sont deux réglages indépendants. Cocher une application enregistre ce seul droit et conserve début/fin. Modifier la période conserve la liste des applications. Le mode permanent reste possible et exige son enregistrement explicite ; aucune application n’est attribuée automatiquement. Les contrôles de rôle, organisation, catalogue et CSRF restent applicables.

## Développement local

Les trois restrictions serveur (création, modification de période, attribution) et les cases bloquées de l’interface sont retirées. L’encadré et les deux dates sont conservés. La projection privée existante publie déjà les applications sélectionnées, `not_before` et `not_after` ; le schéma reste inchangé.

Le sas partagé Projet/Thermo/Drone/Recherche conserve désormais l’identité dans son cookie et relit cette projection, comme la variante dédiée Coupe. Rapport, RGA et Passeport disposent déjà de ce contrôle. Passeport réutilise aussi le sas généré partagé. Une politique configurée mais absente ou invalide refuse l’accès. Les comptes historiques absents de la projection restent soumis au ticket CONNECT signé. L’activation de la politique oblige les anciens cookies anonymes des applications concernées à être renouvelés par CONNECT.

Le refus s’applique à la prochaine requête protégée, y compris à partir d’une session déjà ouverte ; il ne peut effacer des données ou un contenu déjà téléchargé dans le navigateur. Les mécanismes d’archivage/suppression et leur périmètre de qualification ne sont pas élargis par ce lot.

Tests : création avec les sept applications, ajout/retrait en temporaire sans changement des dates, conversion aller-retour permanent/temporaire, refus avant début/après fin, contrôle des cookies et tickets, isolation d’un autre compte. [Preuves du candidat](../data/verification-acces-temporaire.json). La recette locale utilise uniquement des comptes fictifs et aucun transport mail réel.

## Préproduction

Lot distinct de #105, non installé à ce stade. Le [cockpit canonique](../../../outillage/acces-preproduction/suivi-chantier.json) identifie l’itération `connectTemporaryApplications20261104` dans la copie opérationnelle de ce suivi.

Avant livraison, qualifier les chemins et fichiers actifs de CONNECT, Coupe, Projet, Thermo, Drone et Passeport. Sauvegarder et restaurer sur copies chaque fichier remplacé et chaque configuration privée concernée. Raccorder les sas au même `connect_trial_access_file` que la projection `TRIAL_ACCESS_POLICY_FILE` de CONNECT, en vérifiant la cible préproduction et l’isolement. Les exemples de configuration n’établissent pas l’état hébergé.

Ordre requis : installer et qualifier d’abord les sas et leur configuration privée, puis lever les restrictions dans CONNECT. Ne pas installer uniquement la page ou le service CONNECT. Le retour arrière commence par CONNECT et conserve les sas et politiques nouveaux tant que des comptes temporaires portent les droits supplémentaires. Restaurer un ancien sas sans contrôle de période rendrait ces comptes accessibles hors délai. Ne restaurer ce sas qu’après vérification qu’aucun compte concerné ne subsiste ou après une décision explicite de réconciliation ; aucune suppression de droit, compte ou projection courante par le retour arrière de code. La recette hébergée doit couvrir un ajout temporaire, le rechargement, l’expiration d’un cookie déjà créé et un autre compte inchangé.

TBD — chemins/empreintes et paramètres privés à relire sur les cibles avant toute écriture ; autorisation propre à cette version nécessaire. Les reçus opérationnels feront référence, pas ce plan.

## Mise en production

Non réalisée. Qualification hébergée, acceptation de la version et accord de production/ouverture restent distincts. La prochaine itération traitera les autres points V1 après retour métier ; aucun lancement public automatique.
