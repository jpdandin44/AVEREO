# Audit source - AVEREO CONNECT

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
