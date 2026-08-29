# AVEREO CONNECT

- Slug : `connect`
- Domaine cible : `connect.avereo.fr`
- Fournisseur d'identité : Drupal avec Simple OAuth
- Frontend historique : React/Vite
- Candidat C7/V2 : backend PHP 8.3 et schéma MariaDB/MySQL

## Architecture

Le frontend V1 reste présent sans modification fonctionnelle. Le candidat C7/V2
ajoute un backend API séparé dans `backend/`, les migrations dans `database/` et
un environnement Docker local éphémère dans `compose.c7.yaml`.

Le backend délègue l'authentification à Drupal par Authorization Code avec PKCE
S256. CONNECT conserve la session applicative, applique les autorisations côté
serveur et ne stocke aucun mot de passe Drupal.

## Environnement local Docker

Le portail CONNECT actuel est servi par le backend PHP. Le répertoire
`frontend/` reste la source historique V1 et ne constitue pas l'IHM locale de
validation de CONNECT.

Depuis la racine de l'application :

```powershell
docker compose -f compose.c7.yaml up -d database
docker compose -f compose.c7.yaml run --rm php php bin/migrate.php --direction=up
docker compose -f compose.c7.yaml up -d --build web
```

Ouvrir ensuite <http://127.0.0.1:8080/>. Le port est lié exclusivement à
`127.0.0.1` et n'est pas exposé sur le réseau local.

Le bandeau `Mode local Docker` permet d'ouvrir deux sessions fictives :

- `Administrateur local`, propriétaire de l'organisation `AVEREO local` ;
- `Client local`, membre de cette organisation.

Ces profils sont recréés de manière idempotente au démarrage du service `web`.
Ils permettent de contrôler le catalogue, les rôles et l'administration des
droits sans solliciter Drupal. Les adresses utilisent le domaine réservé
`example.invalid` et ne correspondent à aucun compte réel.

Les cinq cartes ouvrent aussi un récepteur applicatif fictif sur
`127.0.0.1:8080`. Le parcours utilise le même ticket HMAC court que les
applications hébergées, consomme son nonce une seule fois et établit un cookie
de sas local avant d'afficher une page de confirmation. Les clés présentes dans
le récepteur Docker sont distinctes, explicitement factices et ne sont chargées
que lorsque les deux garde-fous du mode local sont actifs. Aucune application
hébergée n'est contactée.

Les contrôles backend restent disponibles séparément :

```powershell
docker compose -f compose.c7.yaml run --rm php php tests/run.php
docker compose -f compose.c7.yaml run --rm php php tests/integration.php
docker compose -f compose.c7.yaml run --rm -e CONNECT_LOCAL_DEMO_EXPECTED=true php php tests/local-web.php
docker compose -f compose.c7.yaml down
```

L'identité AVEREO externe et les applications hébergées ne sont pas configurées
dans cet environnement. Le mécanisme de session fictive appartient uniquement
au routeur Docker, exige simultanément `APP_ENV=local` et
`LOCAL_DEMO_ENABLED=true`, et n'est pas chargé par le point d'entrée de
production.

## Déploiement

Deux workflows manuels et protégés réutilisent l'environnement GitHub
`connect` :

- `deploy-connect-o2switch.yml` déploie le backend CONNECT ;
- `deploy-drupal-identity-bridge-o2switch.yml` déploie uniquement le module
  Drupal `avereo_identity_bridge`, sauvegarde sa version précédente et
  reconstruit le cache Drupal.

Aucun de ces workflows ne se déclenche automatiquement. La branche `main`, une
confirmation textuelle exacte et l'approbation humaine de l'environnement
restent obligatoires. Voir `docs/deployment.md` et
`docs/production-readiness-c7.md`.
