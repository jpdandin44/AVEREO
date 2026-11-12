---
project: avereo-connect
document_type: source-audit
title: Audit source CONNECT
status: active
version: git
created: 2026-07-08
updated: 2026-11-12
owner: jpdandin
tags: [connect, audit, preproduction]
---

## 12 novembre — Médaillon personnel, candidat local

Ajout d'une route de préférences du compte courant et d'un stockage privé, sans migration SQL ni modification des habilitations. Le formulaire utilise le composant partagé ; le champ commun #137 est retiré de l'administration visuelle mais son API reste compatible. Tests sur comptes fictifs et recette locale d'enregistrement/rechargement ; aucun déploiement ni identité réelle attestée. [Contrat et récupération](../../avereo-platform/docs/medaillon-personnel.md).

## 9 novembre — contrôle global compatible Drupal 11

Le contrôleur relit l’utilisateur, ses rôles réellement attribués et leur indicateur `isAdmin()`, après invalidation des caches d’entités. L’ancien champ `user.settings.admin_role` n’est plus consulté. L’identité propriétaire exacte, le contrôle frais, le refus des autres profils et la lecture seule sont conservés ; aucun rôle ou droit n’est modifié. Non-régression : absence de l’ancien champ acceptée seulement avec rôle global attribué, retrait du rôle et changement de définition refusés. Les essais de contrôleur passent sur doubles ; la recette du vrai noyau et l’installation restent des contrôles séparés.


## 7 novembre — pont et stockage, état local courant

Pont de cette copie isolée uniquement : propriétaire/autorité Drupal actuels, nonces, TLS/délais et défaut fermé. PHP : 41 assertions broker/fournisseur et 14 contrôleur avec doubles de services ; régression CONNECT 40/40. Interopérabilité Node/PHP couverte côté Projet sur fixtures. Pas de recette kernel Drupal/hébergée ni de raccordement réel. [Contrat](../api/developments-authorization.md).


## 4 novembre 2026 — Extension des accès temporaires

Le service et la page lèvent la restriction Rapport/RGA à la création, à l’attribution et au changement de période. Les rôles, CSRF, catalogue, validation des dates et publication privée sont conservés. Le contrôle de session est complété dans les sas partagé et Coupe. La clarification précédente #105 devient historique. [Contrat et qualification](acces-temporaires-applications.md).

## 2026-11-04 — Enregistrement du mode permanent

Modification ciblée de `backend/public/index.html` : état sélectionné/enregistré, confirmation explicite, motif de blocage pendant l’essai et message métier des erreurs. Le backend d’autorisation, le schéma et les règles d’essai restent identiques. Le test natif `backend/tests/account-administration.php` couvre le passage en permanent puis l’attribution, la persistance et la révocation de Passeport Immo. [Parcours et limites](administration-comptes.md#passer-un-compte-en-permanent-et-ajouter-une-application).


## 2026-11-04 — Administration du cycle de vie

Le portail PHP, son API, sa projection d’accès et le pont Drupal portent le candidat. La source d’interface reste backend/public/index.html. Les sas Rapport et RGA utilisent la date de révocation et les écritures Rapport prennent le verrou de politique. [Périmètre et procédure](administration-comptes.md#cycle-de-vie-des-comptes--candidat-du-4-novembre).

## 4 novembre — invitation unique et confirmation réessayable

Trois fichiers du pont Drupal sont concernés : le contrôleur d’activation conserve l’échéance de l’invitation pour signer de nouveau le retour, le formulaire valide deux champs dédiés et le module neutralise la notification native uniquement pour l’enregistrement déclenché par le pont. Le test natif active la notification Drupal, compte tous les messages et vérifie le maintien de cette notification lors d’une activation Drupal ordinaire. Le contrat CONNECT de confirmation signée reste le même. [Parcours et risques](parcours-invitation-simplifie.md).


## 2026-11-03 — Mail concurrent et confirmation bloquée

Le test natif antérieur comptait seulement les messages AVEREO et acceptait donc la présence de la notification native de statut. La nouvelle assertion exige un seul message total et reproduit l’échec sur Drupal 11.4.10, collecteur de mails et tables temporaires. Le contrôle hébergé avant nettoyage confirme le mot de passe initialisé mais la confirmation CONNECT encore en attente, le retour étant arrêté par HTTP Basic. [Cadrage, limites et critères](parcours-invitation-simplifie.md). Aucun nouveau correctif runtime livré dans cette dernière séquence.


## 2026-11-03 — Rattachement des comptes invités

Défaut reproduit : UUID stocké par la création, sujet OIDC numérique à la connexion. Le candidat renvoie le sujet natif et le vérifie pour l'invitation comme pour le reset, tout en acceptant l'UUID exact des comptes anciens sur le pont signé. Aucun rapprochement automatique par e-mail. Régressions et cycle natif Drupal/MariaDB réussis ; recette nominative hébergée distincte et à consigner dans le cockpit. [Contrat, conservation et limites](rattachement-identite.md).


## 2026-11-03 — Candidat de connexion lisible et e-mail

Le service user.auth reste natif ; le formulaire convertit une adresse unique en nom avant ses validateurs. 18 contrôles ciblés, 10 contrôles HTTP Drupal natifs et 11 contrôles de réconciliation/retour arrière, plus régressions langue/reset. Recette réelle locale sur 11.4.10, cible observée 11.4.10. Préparation hébergée en lecture seule des fichiers et du compte ; aucun nom réel modifié pour ce lot. [Source de référence](connexion-identifiant-email.md).

## 2026-11-03 — Retour de recette et langue des comptes

Cause reproduite : langue fr imposée par AccountProvisioningController, refusée sur une cible avec en seul. Réparation des seules métadonnées de langue du compte personnel testé, attributs protégés inchangés, sauvegarde et nouvelle connexion confirmées. Correctif local : langue par défaut Drupal ; test rouge puis 12 contrôles provisionnement et 15 reset verts. Non installé. Identifiant technique antérieur au reset, distinct du nom de profil CONNECT ; login lisible et e-mail attendus confirmés, désormais couverts par le candidat local décrit ci-dessus.

## 2026-11-03 — Livraison du reset

Runtime 3ac6b66 installé sur CONNECT et Identité préproduction ; huit contrôles hébergés avec identité transactionnelle fictive et mail natif construit sans livraison. Première comparaison de l’entité complète trop stricte avant rechargement : recette affinée pour comparer les attributs persistants après rechargement ; aucun changement applicatif. Réception SMTP et formulaire natif restant à qualifier. [État détaillé](reinitialisation-mot-de-passe.md).

## 2026-11-03 — Reset distinct de l’activation

Le bouton d’activation était masqué pour un compte initialisé ; il ne pouvait donc pas servir au reset. Le nouveau candidat ajoute une opération séparée, conserve les droits et les périodes, et utilise le mail natif Drupal. [Périmètre et contrôles](reinitialisation-mot-de-passe.md).


## 2026-11-03 — Invitation métier et période finalisées

Après le go, runtime installé et qualification technique réalisés : voir [état courant et preuves](administration-comptes.md). Entrée HTTP enregistrée par le responsable, envoi réussi enregistré, période de sept jours vérifiée en base et après rechargement UI ; réception et activation restent à confirmer. Le finaliseur CLI a dû recevoir explicitement la racine publique réelle : un DOCUMENT_ROOT vide se résolvait au dossier courant et déclenchait correctement le refus de stockage public. Aucune protection du runtime affaiblie. Les rubriques suivantes restent historiques.

## 2026-11-03 — Qualification et préparation différée

Le schéma hébergé observé ne possède pas le suivi d'activation. Un contrôle privé MariaDB 11.4.13 sur tables temporaires a passé 36 vérifications et le retour arrière de la migration ; les tables persistantes sont inchangées. Le contrôle de conservation utilisait initialement un nom de variable repris par le test inclus : cette collision de test est corrigée sans affaiblir l'assertion. La fixture sait préparer le suivi d'activation manquant sur sa copie temporaire. Aucune modification du schéma réel.

La relecture ajoute le refus d'une période incomplète (qui ne doit jamais enlever l'échéance implicitement) et le refus de réutiliser une identité Drupal préparée devenue privilégiée. Les contrôles passent localement : 38 administration et 10 provisionnement. La CI de la tête finale reste à relire. [Paquet et procédure](preproduction-comptes.md). Le responsable exige un nouveau go après la démonstration avant toute reprise hébergée ; compte et invitation non créés.


## 2026-11-03 — Candidat d’administration en qualification

Le prototype React historique reste intact. Changements ciblés dans portail PHP, routeur, repository, service de création signé, projection privée, migration et contrats. Essai limité aux deux sas qualifiés Rapport/RGA ; anciens comptes conservés en héritage. Un format de date ISO avec millisecondes émis par le navigateur a été corrigé et ajouté à la recette. La projection manquante n’est jamais réinitialisée silencieusement. [Détail des preuves et limites](administration-comptes.md).


## 2026-11-02 — Préparation de création administrative

Lecture du portail PHP, repository, schémas, routes et pont Drupal : activation existante sans provisionnement d’une identité absente ; droits individuels sans période, absence de ligne héritant du catalogue. Le [dossier de reprise](reprise-administration-comptes.md) qualifie les écarts et les fichiers à modifier, sans changer le contrat actif ni présenter une route proposée comme disponible.


## 2026-11-02 — Candidat RGA distinct

Relecture du catalogue, de l’émetteur de tickets et des habilitations natives. Le raccourci dérivé est remplacé par `rga`. Tests de copie unique, droits croisés et restauration ciblée ajoutés. Les preuves hébergées du raccourci précédent ne qualifient pas ce candidat ; voir le [contrat commun](../../avereo-app-rapport/api/rga.md).


## Historique — raccourci RGA initial du 2 novembre

Modification limitée à `src/Application.php` : raccourci dérivé et paramètre fixe. Le contrôle d’habilitation porte toujours sur Rapport ; l’URL libre est ignorée. Les tests couvrent présence, refus sans droit et destination non autorisée. [Contrat commun](../../avereo-app-rapport/api/rga.md).

# Audit source - AVEREO CONNECT

## 6 novembre 2026 — Menu de compte commun

Le portail PHP regroupe Mon compte, Mes applications, Gérer les comptes selon les droits et la confirmation de déconnexion. Le menu est masqué pour les visiteurs non authentifiés. Le frontend historique reprend seulement la présentation et conserve ses actions locales.

Le périmètre transverse est demandé explicitement par le responsable. [Contrat commun](../../avereo-platform/docs/fonctionnalites-communes.md) et [preuve du lot](../../avereo-platform/docs/qualification-mon-espace.md). Aucune migration, modification de secret ou de droit ; tests sur données fictives.

## Raccordement Passeport Immo — 14 octobre 2026

Les clés URL/SECRET de `passeport-immo` sont ajoutées à `Config.php` et au
chargeur privé de `public/index.php`. Le catalogue natif et les autorisations
restent inchangés ; l'entrée proposée reste en brouillon, sans grant automatique.
Le [rapport du sas](../../avereo-app-passeport-immo/docs/02-integration-connect.md)
porte les contrôles locaux et les limites de qualification hébergée.

## Source historique V1

- Fichier attendu : `AVEREO CONNECT.txt`
- Statut : trouvé dans le zip technique fourni
- Intégration : contenu conservé dans `frontend/src/App.jsx`

## Écart C7/V2 formalisé

Le besoin d'identification centralisée autorise désormais un backend dédié à
CONNECT. Le candidat ajouté dans cette PR provient de la version qualifiée en
préproduction le 27 juillet 2026.

Le périmètre ajouté comprend :

- API PHP 8.3 et contrat OpenAPI ;
- sessions serveur, CSRF et autorisations avec refus par défaut ;
- délégation OAuth à Drupal avec Authorization Code et PKCE S256 ;
- transaction OAuth privée, à usage unique et liée au navigateur ;
- schéma MariaDB/MySQL versionné et migrations réversibles ;
- tests unitaires et d'intégration.

## Environnement web local

Le frontend React/Vite V1 reste conservé comme source historique, mais il ne
représente pas l'IHM du portail CONNECT actuellement déployé. La validation
locale du candidat C7/V2 passe par le service Docker `web`, qui sert
`backend/public/index.html` et route les appels API vers
`backend/public/index.php` sur `127.0.0.1:8080`.

Ce service utilise uniquement la base MariaDB éphémère et les identifiants de
test déclarés dans `compose.c7.yaml`. Il n'embarque aucun secret OAuth et ne
contacte pas l'identité AVEREO hébergée tant que les variables correspondantes
ne sont pas explicitement fournies.

Le mode de démonstration ajoute deux identités fictives, une organisation et le
catalogue AVEREO dans cette base éphémère. L'initialisation et la connexion sont
implémentées exclusivement sous `backend/docker/`, hors document root. Elles
exigent `APP_ENV=local` et `LOCAL_DEMO_ENABLED=true`; le bootstrap public
`backend/public/index.php` ne connaît ni la route locale ni ces profils.

Le récepteur applicatif de démonstration reste dans ce même périmètre Docker.
Il valide les cinq tickets HMAC avec des clés factices distinctes, vérifie
l'application et l'identité minimales, consomme le nonce à usage unique puis
retire le ticket de l'URL au profit d'un cookie local signé. Les routes restent
inaccessibles lorsque le mode de démonstration est désactivé et ne redirigent
vers aucun domaine hébergé.

Le lot de sécurisation du 29 juillet 2026 ajoute un sas serveur entre CONNECT,
Rapport et Coupe : ticket HMAC court, secret distinct par application, nonce à
usage unique et refus des accès directs. Les URL applicatives ne sont plus
publiées directement dans le catalogue. Une identité Drupal inconnue est
enregistrée sans droit dans `pending_identities`; seule une approbation
administrative explicite peut créer son compte actif et son adhésion.

Le lot d'administration des comptes remplace ensuite la commande courante par
un écran CONNECT protégé pour approuver ou refuser une demande, puis activer,
suspendre ou désactiver un compte. La CLI reste le mécanisme de bootstrap et de
reprise. Le schéma existant suffit : aucune migration supplémentaire ni
suppression de données n'est introduite.

Le lot du 3 août 2026 ajoute l'écart fonctionnel validé en préproduction :

- confirmation de déconnexion dans CONNECT et fermeture de la session
  d'identité par une URL HMAC courte, sans interface technique intermédiaire ;
- migration réversible `user_application_access` pour les droits par compte ;
- gestion des applications dans l'administration des comptes ;
- application de la révocation au catalogue et au sas de lancement ;
- retour des erreurs de callback vers une page CONNECT compréhensible.

L'absence de ligne dans `user_application_access` conserve l'héritage
historique de l'organisation. Une ligne `revoked` constitue un refus explicite.
Ce choix maintient la compatibilité des comptes existants tout en permettant une
révocation immédiate et auditée.

Le lot du 4 août 2026 ajoute l’initialisation sécurisée des comptes approuvés :

- appel serveur signé de CONNECT vers le pont d’identité ;
- invalidation du mot de passe précédent dans Drupal ;
- e-mail AVEREO avec lien unique de définition du mot de passe valable
  24 heures ;
- renvoi administrateur, anti-rejeu, limitation des envois et audit du résultat ;
- contact `contact@avereo.fr` sur le portail et dans les messages ;
- aucun mot de passe traité ou stocké par CONNECT.

## Convergence production du 19 août 2026

La première activation de CONNECT production a révélé trois écarts entre le
commit déployé et l'instance corrigée :

- deux propriétés `readonly` du pont Drupal entraient en collision avec les
  propriétés héritées des classes de base ;
- l'amorçage du premier propriétaire exigeait un catalogue déjà publié alors
  que la publication exigeait elle-même un propriétaire actif ;
- le workflow pouvait être déclenché par la CLI avec les credentials génériques
  de l'environnement `connect`, sans seconde approbation indépendante.

Le présent correctif versionne les renommages Drupal et autorise uniquement le
premier propriétaire `--bootstrap` à être créé sans application. Le catalogue
est ensuite publié et attribué par la commande d'administration auditée.

Le workflow avait initialement introduit un second environnement
`connect-production` et de nouveaux noms de secrets sans migrer les credentials
déjà présents dans l'environnement historique `connect`. Cette séparation
rendait le workflow inutilisable sans duplication manuelle des mêmes secrets.

Le correctif d'exploitation rétablit donc `connect` comme environnement de
production autoritatif et réutilise ses secrets `CPANEL_*`. Il conserve la
phrase de confirmation exacte, la restriction à `main`, la sauvegarde préalable
et la vérification publique. Le port FTPS reste explicitement fixé à `21` afin
de ne pas détourner le secret `O2SWITCH_PORT`, réservé aux connexions SSH.

Le contrôle public de Rapport a aussi établi que son point d'entrée
`/connect/entry.php` sert encore le frontend en `200`. La version de production
ne contient donc pas encore le sas CONNECT qualifié en préproduction. Aucun
secret et aucun déploiement Rapport ne sont inclus dans ce correctif.

Le profil CONNECT distingue désormais l'habilitation enregistrée de l'état
technique du sas : une application autorisée reste listée dans le profil lorsque
sa carte indique `Configuration requise`. Le bouton d'ouverture demeure refusé
par défaut tant que l'URL et le secret du sas ne sont pas valides.

## Compatibilité Simple OAuth

Simple OAuth 6.1.1 ne renvoie pas le `nonce` dans l'ID token du flux testé.
CONNECT exige sa correspondance lorsqu'il est présent et conserve, dans tous
les cas, les contrôles `state`, PKCE S256, code à usage unique et liaison de la
transaction au navigateur.

La valeur `OAUTH_ISSUER` doit correspondre exactement à l'émetteur Drupal,
slash final compris.

## Validation du candidat déjà en ligne

- syntaxe PHP 8.3 validée sur la copie de qualification ;
- 13 tests sur 13 réussis sur la copie de validation ;
- 11 tests sur 11 réussis sur l'instance active ;
- parcours réel de préproduction : login `200`, callback `303`, retour `200`,
  puis affichage d'une session Drupal authentifiée.

Ces preuves portent sur le candidat OAuth actuellement en ligne. Le sas
obligatoire, l'approbation en base et les refus d'API ajoutés le 29 juillet
restent soumis aux contrôles CI et à une qualification complète de
préproduction avant production.

## Hors périmètre de cette PR

- aucune configuration OAuth de production ;
- aucun secret, certificat privé ou donnée réelle ;
- aucune migration sur une base hébergée ;
- aucun déploiement automatique du backend ; le workflow de production reste
  exclusivement manuel ;
- aucun auto-provisioning : l'approbation crée explicitement l'utilisateur,
  l'adhésion et les habilitations ;
- aucune modification fonctionnelle du frontend V1.

## Après démonstration du 3 novembre — recette hébergée

Le runtime `e76f3d77634bafb4056e3f753e31331bbaa613b2` a été installé sur les seules préproductions CONNECT/Rapport/RGA et identité auth-next, après go et restauration de contrôle. La recette a identifié puis corrigé le Reply-To dupliqué, la représentation chaîne des marqueurs Drupal et l’injection nommée de `form_state`. Les contrôles de dossiers/expiration et de formulaire public sont conservés dans le suivi privé. Les comptes fictifs sont suspendus, leurs dossiers retirés et les données initiales Rapport inchangées.

Après conservation du fichier HTTP lors de la livraison, le responsable a demandé de préparer aussi une entrée nominative : seul le fichier d’utilisateurs de CONNECT a été isolé par copie des utilisateurs existants, sans changer le fichier partagé ni supprimer la protection. La saisie du secret et l’invitation métier restent en attente. [État opérationnel](administration-comptes.md).

## 2026-11-04 — Élargissement du cycle de vie

Les contrôles des comptes historiques sont exercés par le moteur CONNECT et le pont Identité. La configuration Passeport Immo est une condition du périmètre éligible. [Référence](administration-comptes.md#alignement-des-comptes-non-propriétaires--candidat-local).

## 2026-11-04 — Séparer création, rattachement et envoi

Le portail appelle toujours deux opérations distinctes. Le pont de provisionnement traite le rattachement signé sans modifier l’identité et renvoie son sujet natif. Le moteur CONNECT inscrit un nouveau compte en attente d’activation et refuse les anciennes sessions. [Procédure](administration-comptes.md#recréer-un-compte-dont-lidentité-avereo-existe).

## 2026-11-06 — Session conservée après activation

Écart ciblé du portail PHP : fermeture de session après confirmation réussie et messages de reconnexion. Frontend historique et module Drupal inchangés. Les deux fichiers sont installés en préproduction après accord, avec empreintes et permissions contrôlées ; les tests fictifs sur le code installé réussissent. La première connexion du compte neuf sans accès applicatif a été vérifiée avec saisie humaine et même mot de passe, puis le compte fictif archivé et les autres états/droits conservés. [Diagnostic, données et preuves](retour-activation-connexion.md).

## 6 novembre 2026 — Extension de PR #121

Le portail PHP ajoute ses préférences de tri et de visibilité du catalogue, enregistrées dans ce navigateur. Mon compte et Mes applications restent les destinations communes ; CONNECT ne possède pas de rubrique Mes projets. Aucun contrôle de droit ni parcours d’activation n’est modifié.

Les contrôles actualisés sont dans la [qualification transversale](../../avereo-platform/docs/qualification-mon-espace.md). Les preuves précédentes restent attachées à leur candidat.

## 7 novembre 2026 — Module Missions en recette locale

Le portail expose la génération autonome de mission depuis Mon espace. Le candidat ne modifie aucune route de compte, aucun rôle et aucune attribution d’application. [Recette commune](../../avereo-platform/docs/preparation-missions.md).

## 2026-11-08 — Modèle commun

Le portail PHP porte le réglage administrateur et la confirmation de sortie. Le frontend historique conserve sa session de démonstration. [Modèle partagé](../../avereo-platform/docs/modele-affichage.md).

## 9 novembre 2026 — Navigation commune

Le portail PHP identifie la vue de connexion ou l’espace connecté sous le bandeau commun. Le frontend historique garde son retour au tableau de bord. [Modèle](../../avereo-platform/docs/modele-affichage.md).

## Habilitations par organisation — candidat local

Le candidat étend la gestion des seules applications aux adhésions déléguées. [Périmètre, recette et état de livraison](../../../docs/administration-acces-exports.md).
