---
project: avereo-connect
document_type: roadmap
title: Suite CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-11-04
owner: jpdandin
tags: [connect, documentation, preproduction]
---

## Finition V1 — applications après passage en permanent

Le candidat local clarifie l’enregistrement de la période et l’attribution séparée des applications. La recette navigateur sur un compte fictif et les contrôles natifs passent. Revue locale, intégration GitHub et livraison en préproduction restent à effectuer avant la recette du compte réel. [Preuves](data/verification-acces-permanent.json). Le lot ne modifie pas les comptes réels et ne vaut pas ouverture de la V1.


## Cycle de vie des comptes — qualification

Les PR #101 à #103 sont livrées en préproduction. Les comptes non propriétaires à droits hérités et Passeport Immo sont couverts dans le périmètre qualifié par #102. Restent la revue métier de l’administration hébergée et la préparation distincte de production ; les comptes multi-organisations et applications non qualifiées gardent leurs protections.

## Priorités après la recette du 3 novembre

Priorité : qualifier [l’invitation et la première connexion](docs/parcours-invitation-simplifie.md) en préproduction. La recette de Philippe et l’évolution éventuelle de la protection d’entrée font l’objet de décisions séparées.


## Rattachement des invitations — lot du 3 novembre

Corriger la création et l'invitation, puis qualifier le compte invité existant en préproduction sans le recréer. Le suivi canonique `connectSubjectInvitation20261103` porte version, preuves et état hébergé ; la fin de l'activation personnelle ne se déduit pas d'un test fictif. Production distincte. [Parcours et reprise](docs/rattachement-identite.md).


## Connexion lisible et e-mail — préparation du 3 novembre

Implémentation locale et recette native réussies sur Drupal 11.4.10, même version observée en préproduction. Préparer un patch de trois fichiers de module et l’opération ciblée de nom, puis faire autoriser la livraison exacte. Ensuite : vérifier avec le titulaire les deux connexions, le même compte CONNECT et ses applications. Aucun changement de production. [Périmètre](docs/connexion-identifiant-email.md).

## 2026-11-03 — Retour de recette et langue des comptes

Qualifier et livrer après accord le correctif local de langue du provisionnement. Examiner les identités existantes concernées avant toute réparation élargie. L’attente login lisible/e-mail est confirmée et couverte par le candidat local ; aucune modification automatique de toutes les identités.

## 2026-11-03 — Qualification du reset en préproduction

Runtime 3ac6b66 installé après accord explicite ; sauvegarde, restauration sur copie privée et huit contrôles du pont installé réussis. Bouton et annulation vérifiés en session administrateur. La réception, la sauvegarde et une nouvelle connexion ont ensuite été vérifiées sur le compte personnel autorisé ; voir le retour de recette ci-dessus. [Preuves et limites](docs/reinitialisation-mot-de-passe.md).

## Reset administratif — développement local

Bouton et service développés et contrôlés localement ; qualification SMTP/lien natif en préproduction après accord sur le candidat. Ne pas confondre avec le parcours de comptes déjà installé. [Procédure](docs/reinitialisation-mot-de-passe.md).


## 3 novembre — préproduction technique vérifiée

Les quatre fonctions sont installées sur le runtime `e76f3d77634bafb4056e3f753e31331bbaa613b2`, après sauvegardes et restaurations de contrôle. CI, isolement/expiration HTTP et formulaire d’initialisation sont contrôlés. Le compte métier est préparé sans mail. Suite : terminer son entrée HTTP nominative, envoyer l’invitation puis caler sept jours sur l’envoi enregistré ; réception et activation restent à confirmer. [État et limites](docs/administration-comptes.md).


## Historique — préparation close avant reprise du 3 novembre

Le responsable demande de préparer le développement et la mise en préproduction du parcours de compte avant la démo de 9 h 30. Priorité : création sans notification automatique, applications explicites, période d’essai et invitation séparée. Réinitialisation administrative d’un mot de passe existant en suite. [Ordre de travail et critères](docs/reprise-administration-comptes.md). Aucun démarrage automatique, candidat installé ou accès réel déduit de cette préparation.


## Historique — cadrage des comptes du 2 novembre

Création administrative, invitation séparée, réinitialisation via Drupal et période d’essai sont cadrées dans le [parcours des comptes](docs/administration-comptes.md). L’envoi/renvoi d’activation existe pour les comptes provisionnés ; création et échéance pilotées par l’interface restaient alors à développer et à qualifier.


## RGA distincte — préproduction

La déclaration RGA et la copie initiale des droits sont implémentées, testées et activées en préproduction. La gestion des comptes présente une autorisation RGA indépendante de Rapport. Les versions, preuves de livraison et réserves sont conservées dans le [suivi canonique RGA](../avereo-app-rapport/api/rga.md). La revue humaine et toute promotion en production restent à effectuer.


# Suite CONNECT

Le [suivi du lot hébergé](../../outillage/acces-preproduction/suivi-chantier.json)
et celui de [Passeport Immo](../avereo-app-passeport-immo/docs/suivi-chantier.json)
gardent leurs périmètres distincts.

Le raccordement local reconnaît Passeport Immo et son sas testé. La suite est
la vérification authentifiée du portail installé, puis paramètres dédiés,
catalogue et droits ciblés, avec accords applicables et recette réelle.
La déclaration du responsable de mise en préproduction est une entrée de contrôle,
pas une preuve de version ou de parcours de cette nouvelle application.

## Alignement des comptes non propriétaires

Qualifier le candidat local en préproduction avec des profils hérités et explicites, puis étendre la révocation aux applications qui ne lisent pas encore la politique. Traiter séparément les comptes rattachés à plusieurs organisations et la gestion des dossiers hors Rapport. [Parcours et périmètre](docs/administration-comptes.md#alignement-des-comptes-non-propriétaires--candidat-local).
