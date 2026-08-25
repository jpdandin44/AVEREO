# Déploiement - AVEREO CONNECT

## État actuel

- Domaine cible : `connect.avereo.fr`
- Hébergeur : O2Switch / cPanel
- Workflow de production : déclenchement manuel uniquement depuis `main`
- Backend C7/V2 : déployé sur un document root dédié se terminant par `/public`
- Base de production : distincte, migrée et contrôlée par le healthcheck CONNECT
- Écart à résorber : les correctifs d'exploitation doivent être fusionnés avant
  tout nouveau déploiement

Le chemin public O2Switch du backend n'est jamais présumé dans le dépôt. Le
workflow le résout par l'API cPanel et refuse le déploiement si le document root
de `connect.avereo.fr` ne se termine pas par `/public`.

## Gate C11 préalable

Avant toute mise en production, le responsable humain doit valider :

1. la sauvegarde complète des fichiers et de la base existante ;
2. le document root exact de `connect.avereo.fr` ;
3. le client OAuth Drupal de production et son callback exact ;
4. l'émetteur Drupal exact, slash final compris ;
5. la clé publique et les variables privées hors document root ;
6. une base distincte, ses droits minimaux et la migration testée ;
7. une fenêtre de déploiement et un plan de retour arrière ;
8. les tests fonctionnels et de sécurité après déploiement.

## Préparation reproductible

Le package backend peut être construit localement sans secret :

```powershell
python scripts/package_backend.py backend artifacts/connect-backend.tar.gz
```

Le package ne doit jamais contenir de fichier `.env`, de clé privée, de journal
ou de donnée de production. `backend/.env.example` inventorie les variables
attendues ; leurs valeurs doivent être injectées par l'hébergeur ou placées dans
un `config.php` privé hors document root.

## Ordre d'exécution autorisé en C11

1. sauvegarder et identifier un point de restauration ;
2. déployer dans un nouveau répertoire versionné ;
3. créer la configuration privée à partir de la liste `.env.example` ;
4. exécuter la migration `up` après contrôle de la cible ;
5. installer et activer `integrations/drupal/avereo_identity_bridge` sur
   l'instance d'identité, puis placer son secret dans la configuration privée ;
6. configurer le même secret côté CONNECT avec `IDENTITY_LOGOUT_URL` et
   `IDENTITY_LOGOUT_SECRET` ;
7. configurer un secret distinct pour `IDENTITY_ACCOUNT_ACTIVATION_URL` et
   `IDENTITY_ACCOUNT_ACTIVATION_SECRET`, puis `SUPPORT_EMAIL=contact@avereo.fr` ;
8. basculer le document root ou le lien de version ;
9. reconstruire les caches Drupal avec `php vendor/bin/drush cr` après toute
   mise à jour du pont d’identité ;
10. tester santé, session anonyme, login, callback, conservation du mot de passe
   d’inscription, activation par e-mail, expiration et renvoi du lien,
   révocation applicative et
   déconnexion complète ;
11. surveiller les erreurs sans afficher de détails au navigateur.

## Verrouillage du workflow de production

Le job réutilise l'environnement GitHub historique `connect`, qui contient déjà
les credentials O2Switch de CONNECT production. Il reste impossible à lancer
automatiquement : le workflow impose `main` et une confirmation textuelle
exacte avant d'accéder à cet environnement.

Le responsable du dépôt doit configurer dans **Settings → Environments →
connect** :

1. au moins un approbateur obligatoire ;
2. l'interdiction pour l'auteur du déclenchement d'approuver son propre job ;
3. l'interdiction de contourner les règles de protection, y compris pour les
   administrateurs lorsque GitHub propose cette option ;
4. les secrets existants `CPANEL_USERNAME`, `CPANEL_API_TOKEN`,
   `CPANEL_PASSWORD` et `CPANEL_SERVER`.

Le transfert FTPS utilise ces mêmes credentials et le port explicite `21` ; le
secret `O2SWITCH_PORT` reste réservé aux workflows SSH. Aucun second
environnement ni aucune duplication des secrets ne sont nécessaires. Un
déclenchement par l'interface, la CLI ou l'API crée au plus un déploiement en
attente : il ne peut pas atteindre O2Switch avant les contrôles du workflow et,
si elle est configurée, l'approbation de l'environnement.

Le déclenchement autorisé impose la branche `main` et la phrase exacte
`DEPLOYER CONNECT EN PRODUCTION`. La saisie de cette phrase n'est pas une
approbation : la validation de l'environnement reste obligatoire.

Les accès directs cPanel sont réservés au retour arrière ou à une intervention
d'urgence documentée. Ils ne remplacent jamais le workflow normal.

## Workflow du module Drupal

Le workflow `deploy-drupal-identity-bridge-o2switch.yml` est le seul workflow
autorisé à mettre à jour le module `avereo_identity_bridge` en production. Il
réutilise l'environnement GitHub `connect` et ne déploie ni le backend CONNECT
ni les applications Rapport, Coupe, Projet, Thermo ou Drone.

Son déclenchement est exclusivement manuel depuis la branche `main`, avec la
phrase exacte `DEPLOYER LE MODULE DRUPAL EN PRODUCTION`. Avant le transfert, le
workflow :

1. valide la syntaxe PHP et le test du parcours d'activation ;
2. exclut les tests du paquet de production ;
3. contrôle les secrets O2Switch existants dans l'environnement `connect` ;
4. fixe la racine Drupal de production à `public_html`, sans dépendre de
   l'API cPanel `DomainInfo` ;
5. valide cette racine par SSH en vérifiant que Drupal, Drush et le module actif
   sont disponibles ;
6. sauvegarde le module distant et conserve l'archive de retour arrière pendant
   30 jours.

Le transfert FTPS cible uniquement
`public_html/modules/custom/avereo_identity_bridge`. Après le transfert, le
workflow contrôle le fichier principal du correctif, exécute
`php vendor/bin/drush cr`, vérifie que le module reste activé et contrôle la
réponse HTTP de `https://avereo.fr/`.

Si le transfert ou une validation postérieure échoue après la sauvegarde, le
workflow restaure automatiquement la version sauvegardée puis reconstruit le
cache Drupal. Le job reste en échec pour rendre l'incident visible. L'adresse
du runner GitHub est retirée de la liste blanche SSH dans tous les cas.

## Configuration des sas applicatifs

Une application n'est disponible dans CONNECT que lorsque les deux conditions
suivantes sont vraies :

- CONNECT possède une URL HTTPS `APP_LAUNCH_<CODE>_URL` vers le point d'entrée
  sécurisé de l'application et un secret `APP_LAUNCH_<CODE>_SECRET` d'au moins
  32 caractères ;
- l'application cible possède le même secret dans sa configuration privée et
  son point d'entrée refuse une requête sans ticket.

Pour Rapport, l'URL attendue est
`https://rapport.avereo.fr/connect/entry.php`. Sans ticket, elle doit répondre
`403`. Une réponse `200` contenant l'application React indique qu'une ancienne
version, sans sas CONNECT, est encore déployée. Les deux secrets doivent être
générés et installés hors Git ; leur modification exige une validation humaine
distincte.

## Retour arrière

En cas d'échec, remettre l'ancien document root ou l'ancienne version, restaurer
la configuration précédente et n'exécuter la migration `down` qu'après avoir
vérifié son impact sur les données. Une restauration de sauvegarde reste la
référence si des données ont été écrites.

Cette procédure documente la future intervention ; elle ne vaut pas
autorisation de déployer.
