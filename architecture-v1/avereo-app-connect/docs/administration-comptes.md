---
project: avereo-connect
document_type: functional-design
title: Administration des comptes CONNECT
status: active
version: git
created: 2026-11-02
updated: 2026-11-03
owner: jpdandin
tags: [connect, comptes, essai]
---

## Candidat local du 3 novembre — non livré

Le portail PHP propose la création d’un compte sans mail, la sélection explicite des applications, une période facultative et l’envoi séparé de l’activation. Le bouton de création est disponible seulement si les trois paramètres privés de provisionnement sont complets. Le rôle créé est toujours `member` ; aucune élévation n’est acceptée dans le corps de la requête.

`POST /api/v1/admin/organizations/{organizationId}/accounts` crée l’identité Drupal bloquée et sans mot de passe, puis le compte CONNECT en attente d’activation. Les doublons CONNECT sont refusés ; le pont peut reprendre uniquement une identité bloquée non privilégiée et sans mot de passe qu’il a lui-même préparée. Aucun compte actif existant n’est rapproché silencieusement. `PATCH .../users/{userId}/access-period` gère les dates. La route d’activation existante est conservée pour l’envoi/renvoi. [Contrat actif](../backend/api/openapi.yaml) et [contrat du pont](../api/identity-account-provisioning.yaml).

La migration `20261103070000_account_access_period` ajoute `access_starts_at`, `access_ends_at` et `application_access_mode`. Les anciens comptes gardent `inherit` et une période nulle. Les nouveaux utilisent `explicit` : une application non sélectionnée ou ajoutée ultérieurement est refusée. L’essai temporaire de cette première version est limité à Rapport/RGA ; les autres applications sont proposées en accès permanent. Les dates sont stockées en UTC ; le formulaire affiche le fuseau du navigateur (Europe/Paris pour la recette).

Paramètres privés CONNECT : `IDENTITY_ACCOUNT_PROVISIONING_URL`, `IDENTITY_ACCOUNT_PROVISIONING_SECRET` (distinct de l’activation), `TRIAL_ACCESS_POLICY_FILE`. Le pont Drupal attend `account_provisioning_secret` dans ses réglages privés. Rapport et RGA pointent vers cette même projection avec `connect_trial_access_file`.

Avant la première activation du dispositif, initialiser la projection privée vide `{"version":1,"accounts":{}}` **uniquement après vérification qu’aucun compte explicite ne préexiste**. Si des comptes existent, reconstruire la projection complète depuis la base sous contrôle avant ouverture. Le code ne recrée jamais automatiquement une projection absente : une liste incomplète pourrait laisser passer un ancien compte devenu inconnu de la politique. Les règles expirées ne sont pas supprimées tant que des cookies peuvent subsister.

Un verrou privé sérialise les mutations et la publication. Un compte explicite est refusé dans les applications avant sa mutation, puis sa politique est publiée après succès ; une erreur le laisse refusé, avec reprise administrative nécessaire. Les contrôles d’autorisation précèdent cette fermeture pour empêcher une requête illégitime de bloquer un autre compte. La fin de période est exclusive et contrôlée sur les cookies déjà ouverts. Les sessions des autres applications ne sont pas qualifiées par ce mécanisme ; c’est la raison de la limite de l’essai Rapport/RGA.

Contrôles locaux : 38 vérifications sur service, routes et projection avec SQLite ; 10 vérifications du client signé et contrôleur Drupal sur doubles de test ; 38 contrôles CONNECT historiques et test d’activation existant réussis. La qualification MariaDB, le Drupal hébergé et le transport mail réel restent séparés. Le contrôle intermédiaire sur MariaDB 11.4.13 a passé 36 vérifications et le retour arrière de la migration sur des tables temporaires, sans changement des tables persistantes. La CI du candidat final doit être relue après publication des corrections. [Préparation de livraison et conditions de reprise](preproduction-comptes.md). La recette locale n’utilise que des identités `example.invalid`, sans e-mail réel. Le compte de l’essai métier n’est pas créé par ces tests.

Les brouillons Rapport restent liés au profil de navigateur ; utiliser un profil personnel distinct. Aucun mot de passe, lien personnel ou secret n’est publié. [Préparation et reprise](reprise-administration-comptes.md).


# Administration des comptes CONNECT

## Historique — cadrage demandé le 2 novembre

L'administration doit permettre de préparer un nouveau compte sans demander une première inscription et une première connexion préalables. La lecture du code confirme un envoi/renvoi d'activation existant pour un compte déjà provisionné ; elle ne révèle pas de création administrative d'identité ni de réinitialisation dédiée d'un mot de passe existant.

Parcours cible proposé :

1. **Créer un compte** : nom et e-mail, recherche d'un compte existant et prévention des doublons ; provisionnement de l'identité Drupal et du compte CONNECT avec un statut en attente d'activation. Aucun mot de passe saisi par l'administrateur.
2. **Définir l'accès** : rôle non administrateur par défaut, applications explicitement sélectionnées, début et fin de l'essai. Ne pas reprendre implicitement toutes les habilitations de l'organisation lors de l'invitation.
3. **Envoyer l'invitation** : réutiliser le service d'activation existant, lien personnel à usage unique avec expiration à 24 heures ; formulaire de définition du mot de passe pour une identité nouvelle sans mot de passe. L'utilisateur définit lui-même son secret chez Drupal.
4. **Renvoyer l'invitation** : bouton existant à rendre clairement accessible, invalidation de l'ancien lien et état d'envoi visible. « Envoyé » prouve l'acceptation par le transport, pas la réception dans la boîte du destinataire.
5. **Mot de passe oublié** : action distincte utilisant le mécanisme de réinitialisation Drupal. Ne pas réutiliser l'activation pour remplacer silencieusement le mot de passe d'un compte existant ; le parcours actuel le conserve volontairement.
6. **Suivre l'essai** : afficher invitation à envoyer/envoyée/erreur, activation confirmée et période d'accès ; les statuts Expiré et Suspendu doivent correspondre à un refus serveur effectif, y compris dans les applications déjà ouvertes.

Les commandes de création et d'envoi doivent être séparables afin de préparer un compte avant notification. Maintenir les contrôles owner/admin, CSRF, organisation et journal des opérations. En cas d'échec partiel de création, ne laisser aucun droit applicatif actif ni envoyer un lien vers un compte incomplet. La liaison à un compte Drupal existant doit vérifier l'identité stable, pas seulement rapprocher des adresses e-mail.

Le pont actuel ne crée pas l'identité absente : il répond `ACCOUNT_NOT_FOUND`. Une création depuis CONNECT nécessite donc un contrat de provisionnement supplémentaire avec Drupal, à implémenter et tester ; l'envoi d'activation seul ne suffit pas. Aucun mot de passe ne doit être connu de CONNECT, inscrit dans les journaux ou transmis par e-mail. Les secrets de service restent privés ; le lien personnel est destiné uniquement au mail de son utilisateur et ne doit pas être journalisé.

### Préparation opérationnelle demandée avant clôture

Le responsable demande de préparer l’exécution pour le 3 novembre avant la démonstration. Les quatre fonctions prioritaires sont création, applications, durée et invitation ; la réinitialisation administrative d’un mot de passe existant reste en suite. Le [dossier de reprise](reprise-administration-comptes.md) porte les fichiers, tâches et critères sans constituer un déploiement.

### Phases et critères de passage

| Phase | État de ce besoin | Résultat attendu |
| --- | --- | --- |
| Cadrage | préparé, proposition à revoir | champs, rôles, période, séparation création/envoi et source Drupal |
| Développement local | non commencé pour l'administration | création sans doublon, droits minimaux, invitation, reset distinct, échecs et journaux testés |
| Préproduction | non réalisée pour ce lot | sauvegarde/restauration puis parcours réel avec comptes de recette et preuve d'expiration des sessions |
| Mise en production | non autorisée | accord distinct et livraison de la version qualifiée |

Le contrôle d'essai préparé côté Rapport/RGA est un candidat local séparé : [fonctionnement, preuves et limites](../../avereo-app-rapport/docs/essais-temporaires.md). Le cloisonnement des brouillons d'un même profil de navigateur reste à traiter avant généralisation ; un compte personnel ne doit pas ouvrir les données du compte de démonstration.

## Objectif

L'interface « Gérer les comptes » remplace la validation courante par terminal
pour les opérations quotidiennes. Elle reste distincte de Drupal :

- Drupal authentifie l'identité ;
- CONNECT approuve son accès métier, son organisation et son rôle ;
- le catalogue de l'organisation définit les applications disponibles ;
- CONNECT autorise ou révoque ensuite chaque application pour chaque compte.

Le compte d'identité reste visible dans **Drupal > People**. L'état
d'approbation CONNECT, le rôle, l'organisation et les applications ne sont pas
répliqués dans Drupal : ils sont visibles et administrés dans CONNECT.

La commande `bin/approve-pending-user.php` est conservée uniquement pour le
premier owner, la reprise et les interventions d'urgence.

## Accès

Le bouton est affiché uniquement à un compte CONNECT actif possédant le rôle
`owner` ou `admin` dans une organisation active. Les mêmes contrôles sont
réappliqués côté serveur sur chaque requête ; masquer le bouton ne constitue
donc pas le contrôle d'accès.

Toutes les mutations exigent la session CONNECT et le jeton CSRF de même
origine. Elles produisent une entrée dans `audit_events`.

## Demandes en attente

Une identité Drupal inconnue est enregistrée dans `pending_identities` sans
droit applicatif.

L'administrateur peut :

- approuver la demande avec le rôle `member` ou `viewer` ;
- refuser la demande sans supprimer son historique.

Un owner peut aussi attribuer `admin` ou `owner`. Un admin ne peut pas élever
un compte vers un rôle d'administration.

L'approbation crée ou réactive le compte CONNECT et son adhésion active. Le
compte hérite initialement des habilitations actives de son organisation.

Elle demande ensuite au fournisseur d’identité d’envoyer un lien personnel de
confirmation. Ce lien :

- est utilisable une seule fois ;
- expire après 24 heures ;
- conserve le mot de passe choisi lors de l’inscription ;
- ouvre le formulaire de définition du mot de passe uniquement si le compte a
  été créé sans mot de passe initial ;
- mentionne `contact@avereo.fr` comme adresse d’assistance.

L’écran distingue l’e-mail à envoyer de l’e-mail envoyé et propose un renvoi.
Un renvoi invalide le lien précédent. L’échec d’envoi ne retire pas
l’approbation métier : il reste visible et récupérable depuis l’administration.
Le catalogue et les routes de lancement restent refusés tant que le lien n’a
pas produit sa confirmation HMAC vers CONNECT. Pour un compte sans mot de passe,
cette confirmation intervient seulement après sa définition.

## Droits aux applications

Chaque fiche de compte affiche les applications du catalogue de l'organisation.
Une case cochée autorise l'application ; une case décochée crée une révocation
explicite dans `user_application_access`.

La révocation est contrôlée à deux niveaux :

- l'application disparaît immédiatement du catalogue du compte ;
- sa route `/api/v1/apps/{code}/launch` renvoie aussi un refus, même si
  l'utilisateur conserve une ancienne URL.

Un owner gère les droits de tous les comptes. Un admin peut gérer uniquement les
comptes `member` et `viewer`. Chaque mutation est enregistrée sous l'action
`user.application_access.update`.

## Cycle de vie des comptes

| Statut | Effet | Réversibilité |
|---|---|---|
| `active` | Connexion et applications autorisées | état normal |
| `suspended` | Requêtes CONNECT et nouveaux lancements bloqués, données conservées | réactivation possible |
| `disabled` | Compte CONNECT désactivé, historique conservé | réactivation explicite possible |

Seul un owner peut modifier le statut global d'un compte. Il ne peut pas
modifier son propre statut ni suspendre ou désactiver le dernier owner actif.
Aucune action de l'interface ne supprime un utilisateur. Le contrôle CONNECT ne révoque pas à lui seul un cookie déjà délivré à Rapport ou RGA : leur refus après échéance doit être qualifié séparément.

## Limites de la première version

- l'écran ouvre la première organisation administrable du compte courant ;
- les demandes en attente ne portent pas encore d'organisation demandée et
  sont donc visibles par les owner/admin CONNECT autorisés ;
- le changement de rôle d'un compte déjà approuvé reste hors périmètre ;
- le blocage d'un compte dans Drupal empêche ses authentifications suivantes,
  mais ne révoque pas à lui seul une session CONNECT déjà ouverte ; la
  suspension CONNECT, elle, est réévaluée à chaque requête.

Les droits applicatifs CONNECT restent distincts des rôles du fournisseur
d'identité. Modifier uniquement un rôle externe ne remplace donc pas une
révocation explicite dans l'administration CONNECT.

## Qualification en préproduction

1. créer un nouveau compte dans Drupal ;
2. se connecter à CONNECT avec ce compte et constater l'état en attente ;
3. ouvrir CONNECT avec un owner et sélectionner « Gérer les comptes » ;
4. approuver le compte comme Client ;
5. décocher Coupe et vérifier sa disparition ainsi que le refus de son URL de
   lancement ;
6. recocher Coupe et vérifier que l'accès revient ;
7. suspendre le compte et vérifier que le lancement est refusé ;
8. réactiver le compte et vérifier que l'accès revient ;
9. vérifier les événements `identity.approve`, `identity.reject`,
   `identity.activation_email`, `user.status.update` et
   `user.application_access.update` dans
   `audit_events`.
10. approuver un compte inscrit avec un mot de passe, vérifier sa conservation,
    la réception de l’e-mail, l’expiration à 24 heures et l’invalidation du lien
    précédent après renvoi ;
11. vérifier séparément qu’un compte créé sans mot de passe doit en définir un
    avant la confirmation CONNECT.
