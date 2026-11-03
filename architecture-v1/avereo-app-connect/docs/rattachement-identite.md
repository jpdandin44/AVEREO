---
project: avereo-connect
document_type: functional-specification
title: Rattachement des comptes créés et invités
status: active
version: git
created: 2026-11-03
updated: 2026-11-03
owner: jpdandin
tags: [connect, identite, invitation, oidc, preproduction]
---

# Même identité de la création à la connexion

CONNECT doit retrouver le compte créé par l'administration après l'invitation,
le choix du premier mot de passe et la connexion OIDC. Le nom de connexion et
l'UUID de l'entité ne remplacent pas le sujet OIDC. Le fournisseur Drupal
qualifié pour cette application utilise l'UID numérique comme sujet.

Le défaut reproduit provenait du renvoi de l'UUID au provisionnement, puis de
son stockage dans `users.drupal_subject`, alors que la connexion présente un
UID numérique. Il conduisait à une nouvelle demande en attente malgré la
présence d'un compte déjà autorisé. Aucun rapprochement implicite sur le seul
e-mail n'est introduit pour masquer cet écart.

## Contrat corrigé

Le [pont de création](../api/identity-account-provisioning.yaml) renvoie l'UID
natif comme chaîne décimale positive. CONNECT refuse un UUID, un entier JSON,
un zéro, un identifiant avec zéro initial et tout autre format non canonique.
Un désaccord de versions échoue avant l'insertion d'un mauvais sujet dans CONNECT.
Le compte Drupal déjà préparé, bloqué et sans mot de passe peut être repris
selon les garde-fous existants après mise à jour du client.

L'invitation et le reset vérifient tous deux que le sujet signé désigne le
compte trouvé par e-mail. Une pluralité de comptes ou une discordance est
refusée avant génération de lien ou envoi. Le sujet natif est accepté ; l'UUID
exact du même compte reste accepté pour les comptes et invitations antérieurs.
Cette compatibilité ne transforme pas l'UUID en sujet accepté à la connexion.

Les jetons déjà émis restent liés au même UID Drupal et au même identifiant
CONNECT. Aucune invalidation générale ni régénération de mot de passe.
L'activation, sa signature de retour, le statut, les rôles, les applications,
la durée d'essai et la projection privée gardent leurs contrôles existants.

## Comptes existants

Un compte ancien portant encore un UUID nécessite une réconciliation ciblée,
préparée dans un plan privé et exécutée après sauvegarde/restauration contrôlée.
Le plan lie la racine et l'UUID du site, l'UID/UUID/e-mail Drupal, l'identifiant
CONNECT existant, l'ancien sujet et le sujet natif attendu. Refuser un doublon,
une collision ou toute identité différente. Modifier uniquement le sujet du
compte autorisé, dans une transaction, en conservant ses autres champs, ses
adhésions, ses droits et sa période. Le mot de passe n'est jamais remplacé.

Les invitations en attente ne sont ni consommées ni déclarées terminées par
une réconciliation. Les demandes en attente et les autres comptes ne sont pas
approuvés ou fusionnés automatiquement. Les plans nominatifs et reçus restent
privés, dans le suivi canonique `connectSubjectInvitation20261103`.

## Qualification

Les contrôles ciblés couvrent la création, les formats de sujet refusés,
la signature, le rejeu, les collisions et la compatibilité du reset.
`tests/native-subject-flow.php` exerce les vrais contrôleurs Drupal, le
collecteur de mails natif, le formulaire d'initialisation, l'authentification
native et le repository CONNECT sur tables temporaires MariaDB : même compte
de bout en bout, Rapport/RGA seulement, période conservée et expiration refusée.

Ce test se lance seulement par Drush dans le conteneur Drupal local dédié,
avec `AVEREO_SUBJECT_NATIVE_TEST=1`, `ACCOUNT_ADMIN_MYSQL_TEMPORARY=true`,
`APP_ENV=test` et `AVEREO_CONNECT_TEST_ROOT` pointant sur un backend de fixture
privé sous `/tmp`. La racine `/opt/drupal/web` est imposée. Il ne peut pas être
exécuté sur les racines hébergées. Tous les mails sont capturés par le plugin
natif `test_mail_collector`, vérifié avant opération, et les données Drupal sont
annulées par transaction. Le transport interne relie le client signé au vrai
contrôleur sans réseau ; aucune recette HTTP navigateur ou émission OIDC par
Simple OAuth n'est déduite de ce seul test.

| Phase | Portée |
| --- | --- |
| Cadrage | Défaut de format reproduit ; compte réel et accès à préserver |
| Développement local | Correctif minimal, régressions et chaîne native sur fixture |
| Préproduction | Autorisée par le responsable ; sauvegarde, installation et contrôles réels à consigner au cockpit |
| Mise en production | Aucun accord donné pour ce lot |

La réception d'un mail et le choix du mot de passe par le destinataire restent
distincts des preuves techniques. Le parcours personnel d'un invité n'est
déclaré complet qu'après sa connexion réelle et le contrôle de ses applications.
