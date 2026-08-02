# Administration des comptes CONNECT

## Objectif

L'interface « Gérer les comptes » remplace la validation courante par terminal
pour les opérations quotidiennes. Elle reste distincte de Drupal :

- Drupal authentifie l'identité ;
- CONNECT approuve son accès métier, son organisation et son rôle ;
- les applications visibles sont celles déjà habilitées pour l'organisation.

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

L'approbation crée ou réactive le compte CONNECT et son adhésion active. Les
applications ne sont pas attribuées individuellement : le compte hérite des
habilitations actives de son organisation.

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
- les habilitations applicatives restent gérées au niveau de l'organisation ;
- le changement de rôle d'un compte déjà approuvé reste hors périmètre ;
- le blocage d'un compte dans Drupal empêche ses authentifications suivantes,
  mais ne révoque pas à lui seul une session CONNECT déjà ouverte ; la
  suspension CONNECT, elle, est réévaluée à chaque requête.

Ces limites évitent d'introduire une nouvelle migration ou un modèle
d'autorisation spéculatif avant la validation du parcours simple en
préproduction.

## Qualification en préproduction

1. créer un nouveau compte dans Drupal ;
2. se connecter à CONNECT avec ce compte et constater l'état en attente ;
3. ouvrir CONNECT avec un owner et sélectionner « Gérer les comptes » ;
4. approuver le compte comme Client ;
5. se reconnecter avec le nouveau compte et vérifier le catalogue hérité ;
6. suspendre le compte et vérifier que le lancement est refusé ;
7. réactiver le compte et vérifier que l'accès revient ;
8. vérifier les événements `identity.approve`, `identity.reject` et
   `user.status.update` dans `audit_events`.
