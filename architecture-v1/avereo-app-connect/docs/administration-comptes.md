---
project: avereo-connect
document_type: functional-design
title: Administration des comptes CONNECT
status: active
version: git
created: 2026-11-02
updated: 2026-11-04
owner: jpdandin
tags: [connect, comptes, essai]
---

## Passer un compte en permanent et ajouter une application

La période et les applications sont indépendantes. Le [candidat des accès temporaires](acces-temporaires-applications.md) permet d’ajouter une application sans supprimer les dates. Cocher **Accès permanent** reste une modification distincte, effective après **Enregistrer l’accès permanent**, confirmation et réponse du serveur ; l’annulation conserve la période.

La PR #105, livrée en préproduction, rendait explicite l’ancienne restriction Rapport/RGA. Cette règle est remplacée par la demande du responsable ; la disponibilité hébergée de la nouvelle règle dépend de l’installation coordonnée du candidat.

## Recréer un compte dont l’identité AVEREO existe

Dans **Gérer les comptes**, créer le compte et sélectionner ses applications. L’option **Envoyer l’invitation après la création** est décochée par défaut. La fiche apparaît dès que CONNECT confirme la création. Si l’envoi est choisi puis échoue, la fiche reste visible et permet une nouvelle tentative. Sans envoi, l’administrateur dispose de **Envoyer le lien d’activation** sur la fiche.

Si une identité AVEREO existe déjà, CONNECT propose au propriétaire un rattachement explicite après une première tentative de création. L’identité doit être active, unique pour cette adresse, disposer d’un mot de passe et ne porter aucun rôle Drupal hors du périmètre qualifié. Le pont autorise les rôles `authenticated` et `utilisateur_rapport` et protège l’utilisateur système. Le nouveau compte CONNECT garde un identifiant distinct. Les anciennes sessions CONNECT sont révoquées et les dossiers conservés ne sont pas réattribués. Le mot de passe et les rôles AVEREO sont préservés. L’accès aux applications reste en attente d’activation, avec ou sans envoi immédiat.

Le contrôle de non-régression `python -X utf8 backend/tests/account-ui-lifecycle.py` utilise le même serveur que la revue locale. Il vérifie sur le même parcours la présence de la fiche et des actions, l’archivage, la restauration et les deux choix de suppression. Lors d’une revue de l’administration, vérifier ces actions sur un compte fictif créé depuis l’interface.

La PR #103 est livrée en préproduction au commit `d04c3fb`. Le pont et le portail ont été livrés ensemble. La recette hébergée couvre la recréation et les actions de cycle de vie sur des identités fictives. Les choix d’envoi immédiat ou différé et l’échec simulé ont été vérifiés en recette locale.

## Alignement des comptes non propriétaires — préproduction

Le propriétaire peut agir sur les administrateurs, membres et lecteurs de sa seule organisation, avec droits hérités ou explicites, lorsque toutes leurs applications disposent de la révocation. Les rattachements multiples, propriétaires et applications non qualifiées restent protégés, avec un motif affiché. La restauration republie les droits calculés par le catalogue, y compris les attributions héritées et les refus individuels. Une session ouverte avant l’archivage ne redonne aucun accès après restauration.

La suppression retire le compte CONNECT, après confirmation de l’adresse. Le pont supprime l’identité native uniquement lorsque CONNECT l’a créée, que l’UID et l’adresse concordent et qu’elle n’a aucun rôle Drupal propre. Une identité préexistante ou dotée d’un rôle Drupal est conservée. Elle peut demander un nouvel accès, qui nécessite une nouvelle approbation CONNECT et reçoit un autre identifiant. Un rattachement discordant ou une dépendance protégée est signalé. La case cochée par défaut s’applique aux dossiers serveur Rapport. Les données Passeport Immo restent sous l’ancien identifiant et demandent leur propre traitement.

Pour intégrer Passeport Immo, configurer `connect_trial_access_file` dans sa configuration privée et qualifier le contrôle des tickets, pages, API et sessions préexistantes. Puis renseigner `ACCOUNT_LIFECYCLE_PASSEPORT_CONFIG` côté CONNECT avec le chemin canonique du même fichier de configuration, de la même cible et de la même politique que Rapport/RGA. Installer d’abord Passeport Immo et le pont Identité. La politique impose une nouvelle connexion aux anciennes sessions Passeport Immo qui ne portent aucune identité. Aucune nouvelle migration SQL. Avant retour arrière, inventorier les comptes archivés ou révoqués depuis la livraison et garantir leur blocage pendant la restauration.

## Cycle de vie des comptes — candidat du 4 novembre

Cette section conserve le périmètre initial de la PR #101. L’extension aux comptes hérités décrite ci-dessus a ensuite été livrée par la PR #102 ; la PR #103 ajoute le rattachement explicite. Les exclusions initiales ci-dessous sont historiques lorsqu’elles sont remplacées par cet alignement.

Dans **Gérer les comptes**, le propriétaire de l’organisation peut archiver et restaurer un compte membre ou lecteur à droits explicites, rattaché à cette seule organisation et limité à Rapport et RGA. Les comptes propriétaires, administrateurs, partagés, historiques à droits hérités ou associés à d’autres applications sont protégés. L’archivage conserve le compte, son adresse, ses droits et ses dossiers. Il coupe les sessions CONNECT, Rapport et RGA. Une restauration rétablit le statut précédent et exige une session nouvelle. La période d’essai conserve ses dates d’origine.

**Supprimer définitivement** demande de ressaisir l’adresse du compte. **Conserver les dossiers Rapport liés** est coché par défaut. Les dossiers conservés restent sous l’ancien identifiant CONNECT et restent accessibles aux administrateurs Rapport qui ont déjà ce droit. Une nouvelle inscription avec la même adresse reçoit un nouvel identifiant et aucun dossier historique. Quand l’option est décochée, seuls les dossiers serveur rattachés à l’identifiant CONNECT exact sont effacés. Les brouillons locaux, téléchargements et archives de sauvegarde sont distincts du stockage en ligne.

La suppression est limitée aux identités Drupal créées par CONNECT, à l’UID et à l’adresse concordants, sans rôle privilégié. CONNECT refuse les dépendances sensibles avant l’opération, révoque l’accès, bloque le compte et conserve le choix sur les dossiers. Identité retire l’identité, ses sessions et le lien d’activation éventuel. Après traitement des dossiers, CONNECT retire droits et compte tout en conservant l’audit. Si un service échoue, le propriétaire retrouve **Reprendre la suppression** avec le choix enregistré. La reprise utilise le même identifiant, sans jamais supprimer un nouveau compte associé à la même adresse.

### Préparer la préproduction

Appliquer la migration réversible account_lifecycle après sauvegardes CONNECT, Identité, Rapport et politique d’accès, et après vérification de leur restauration sur copies. Installer les contrôles Rapport/RGA et le pont Drupal avant d’activer les actions dans CONNECT. Les options privées sont ACCOUNT_LIFECYCLE_ENABLED, IDENTITY_ACCOUNT_DELETION_URL, IDENTITY_ACCOUNT_DELETION_SECRET et, pour l’effacement des dossiers, ACCOUNT_LIFECYCLE_REPORT_CONFIG. L’URL HTTPS doit cibler le pont Identité de la même cible. Le secret dédié, distinct des secrets de provisionnement et d’activation, correspond à account_lifecycle_secret dans les paramètres Drupal. La configuration Rapport doit être privée et correspondre à l’environnement CONNECT et à sa politique d’accès.

Vérifier le candidat avec des identités et dossiers fictifs. Contrôler les deux choix, l’isolement, les sessions après restauration, les reprises sur incident, l’audit et les anciens comptes. Avant un retour arrière, vérifier les suppressions en cours et les comptes archivés. Restaurer le code avant d’enlever les colonnes. La migration descendante laisse les comptes archivés désactivés et retire leur information de restauration. Une suppression définitive n’est pas annulée par une migration descendante.

## Première connexion après l’invitation

Le [parcours d’invitation](parcours-invitation-simplifie.md) décrit le message reçu, le premier mot de passe et la reprise du retour signé vers CONNECT. Le suivi canonique porte l’état de livraison et de recette.

## Reset administratif — nouveau candidat local

Le reset d’un compte existant est livré en préproduction par le runtime 3ac6b66 de la PR #97. [Bouton, protections, preuves et limites de recette](reinitialisation-mot-de-passe.md).


## Préproduction technique du 3 novembre

Le runtime `e76f3d77634bafb4056e3f753e31331bbaa613b2` est installé après le go donné à la fin de la démonstration. L’entrée nominative HTTP a été enregistrée par le responsable. L’invitation métier est enregistrée comme envoyée et la période de sept jours a été recalée sur cet envoi, puis vérifiée dans la base et après réouverture de l’administration. Le suivi privé conserve l’identité, les dates et les preuves ; réception et activation personnelles restent à confirmer.

Les contrôles hébergés comprennent 22 cas HTTP sur PHP/MySQL réels avec identités fictives (isolement, fin de période et suspension sur cookies ouverts), puis le formulaire public HTTP 200 et le refus d’un second usage du lien (410). Les messages ont été interceptés dans le seul processus de recette ; une construction native Symfony sans livraison confirme le Reply-To unique. Les dix enregistrements Rapport initiaux sont inchangés et les dossiers fictifs sont retirés. L’envoi réel est désormais enregistré comme réussi ; réception dans la boîte du destinataire et activation personnelle restent à constater. Le retrait de l’entrée HTTP nominative à l’échéance reste à organiser séparément de l’expiration applicative.

Le portail PHP propose la création d’un compte sans mail, la sélection explicite des applications, une période facultative et l’envoi séparé de l’activation. Le bouton de création est disponible seulement si les trois paramètres privés de provisionnement sont complets. Le rôle créé est toujours `member` ; aucune élévation n’est acceptée dans le corps de la requête.

`POST /api/v1/admin/organizations/{organizationId}/accounts` crée l’identité Drupal bloquée et sans mot de passe, puis le compte CONNECT en attente d’activation. Les doublons CONNECT sont refusés ; le pont peut reprendre uniquement une identité bloquée non privilégiée et sans mot de passe qu’il a lui-même préparée. Aucun compte actif existant n’est rapproché silencieusement. `PATCH .../users/{userId}/access-period` gère les dates. La route d’activation existante est conservée pour l’envoi/renvoi. [Contrat actif](../backend/api/openapi.yaml) et [contrat du pont](../api/identity-account-provisioning.yaml).

La migration `20261103070000_account_access_period` ajoute `access_starts_at`, `access_ends_at` et `application_access_mode`. Les anciens comptes gardent `inherit` et une période nulle. Les nouveaux utilisent `explicit` : une application non sélectionnée ou ajoutée ultérieurement est refusée. L’essai temporaire de cette première version est limité à Rapport/RGA ; les autres applications sont proposées en accès permanent. Les dates sont stockées en UTC ; le formulaire affiche le fuseau du navigateur (Europe/Paris pour la recette).

Paramètres privés CONNECT : `IDENTITY_ACCOUNT_PROVISIONING_URL`, `IDENTITY_ACCOUNT_PROVISIONING_SECRET` (distinct de l’activation), `TRIAL_ACCESS_POLICY_FILE`. Le pont Drupal attend `account_provisioning_secret` dans ses réglages privés. Rapport et RGA pointent vers cette même projection avec `connect_trial_access_file`.

Avant la première activation du dispositif, initialiser la projection privée vide `{"version":1,"accounts":{}}` **uniquement après vérification qu’aucun compte explicite ne préexiste**. Si des comptes existent, reconstruire la projection complète depuis la base sous contrôle avant ouverture. Le code ne recrée jamais automatiquement une projection absente : une liste incomplète pourrait laisser passer un ancien compte devenu inconnu de la politique. Les règles expirées ne sont pas supprimées tant que des cookies peuvent subsister.

Un verrou privé sérialise les mutations et la publication. Un compte explicite est refusé dans les applications avant sa mutation, puis sa politique est publiée après succès ; une erreur le laisse refusé, avec reprise administrative nécessaire. Les contrôles d’autorisation précèdent cette fermeture pour empêcher une requête illégitime de bloquer un autre compte. La fin de période est exclusive et contrôlée sur les cookies déjà ouverts. La limite initiale de l’essai Rapport/RGA provenait de la qualification des sessions. Son extension locale et ses conditions de livraison sont décrites dans le [lot courant](acces-temporaires-applications.md).

Contrôles locaux : 38 vérifications sur service, routes et projection avec SQLite ; 10 vérifications du client signé et contrôleur Drupal sur doubles de test ; 38 contrôles CONNECT historiques et test d’activation existant réussis. La qualification MariaDB, le Drupal hébergé et le transport mail réel restent séparés. Le contrôle intermédiaire sur MariaDB 11.4.13 a passé 36 vérifications et le retour arrière de la migration sur des tables temporaires, sans changement des tables persistantes. La CI du runtime installé est réussie ; les contrôles de l’étape locale ci-dessus restent des preuves distinctes. [Préparation de livraison et conditions de reprise](preproduction-comptes.md). La recette locale n’utilise que des identités `example.invalid`, sans e-mail réel. Le compte de l’essai métier n’est pas créé par ces tests.

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

## Qualification hébergée du 3 novembre — correction d’activation

La recette du candidat après démo a passé 22 contrôles HTTP sur le serveur et MySQL de préproduction, avec des identités et dossiers fictifs. Le contrôle du formulaire a révélé un doublon de `Reply-To` avec des casses différentes dans les mails Drupal/Symfony. Le module remplace maintenant toutes les variantes par une valeur unique, sans toucher aux autres en-têtes.

Une identité préparée par CONNECT conserve le besoin de définir son premier mot de passe lors d’un renvoi, même après génération du secret initial non transmis. Le marqueur `password_initialized` est écrit après l’enregistrement réussi du formulaire. Les mots de passe des comptes existants restent conservés. La fin de qualification porte sur le nouveau candidat exact ; les reçus des versions antérieures restent historiques.

Les marqueurs natifs `user.data` de Drupal peuvent être relus sous la forme chaîne `"1"`. Les contrôles de création et d’initialisation acceptent strictement `true`, `1` et `"1"` ; les tests couvrent cette représentation hébergée. Aucun autre contenu n’est traité comme un accord.

Le formulaire conserve les paramètres nommés `$form` et `$form_state` attendus par le résolveur de route Drupal. Le paramètre camelCase empêchait le résolveur d’injecter l’état du formulaire et provoquait une erreur 500 ; la signature est contrôlée en non-régression et la page publique doit être requalifiée.


## Nettoyage ponctuel des comptes de test

Les trois suppressions ponctuelles demandées ce soir ont été réalisées par une opération privée sauvegardée et contrôlée. Le parcours d’administration développé ensuite est décrit dans la [section sur le cycle de vie](#cycle-de-vie-des-comptes--candidat-du-4-novembre).
