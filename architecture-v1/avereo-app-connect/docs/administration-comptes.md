# Administration des comptes CONNECT

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
| `suspended` | Accès immédiatement bloqué, données conservées | réactivation possible |
| `disabled` | Compte désactivé, historique conservé | réactivation explicite possible |

Seul un owner peut modifier le statut global d'un compte. Il ne peut pas
modifier son propre statut ni suspendre ou désactiver le dernier owner actif.
Aucune action de l'interface ne supprime un utilisateur.

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
   `user.status.update` et `user.application_access.update` dans
   `audit_events`.
