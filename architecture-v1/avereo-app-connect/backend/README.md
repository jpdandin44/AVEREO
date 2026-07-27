# Backend - AVEREO CONNECT

Backend PHP 8.3 sans dépendance applicative externe, préparé pendant la gate C7.

## Périmètre C7

- contrat OpenAPI sous `api/openapi.yaml` ;
- front controller sous `public/index.php` ;
- session serveur et CSRF ;
- routes santé, session, profil, organisations, catalogue et habilitations ;
- autorisation côté serveur, refus par défaut et audit des mutations ;
- migrations via `bin/migrate.php`.

Le SSO Drupal est activé lorsque les variables `OAUTH_*` sont complètes. La transaction
OAuth est conservée à la fois dans la session PHP et, pendant cinq minutes maximum,
dans un stockage privé à usage unique lié à un cookie de navigateur distinct. Ce
second stockage sécurise le callback lorsque l'hébergeur renouvelle la session PHP
entre le départ vers Drupal et le retour vers CONNECT.

Le callback établit l'identité Drupal dans la session CONNECT. Le catalogue de
démarrage `/api/v1/catalog` permet alors d'ouvrir les applications AVEREO
effectivement déployées. Ce catalogue est refusé aux sessions anonymes.

Le rattachement automatique du `subject` Drupal à une ligne `users`, à une
organisation et à ses habilitations reste une étape distincte avant d'appliquer
des droits fins par utilisateur ou organisation.

Avec Simple OAuth 6.1.1, `OAUTH_ISSUER` doit correspondre exactement à l'URL racine
émise par Drupal, slash final compris (par exemple `https://idp.example/`). Cette
version ne recopie pas le paramètre `nonce` dans l'ID token du flux Authorization
Code. CONNECT conserve donc les protections `state`, code à usage unique, PKCE S256
et liaison au navigateur ; si un fournisseur émet un nonce, sa correspondance reste
obligatoirement vérifiée.

## Contrôles locaux

Depuis la racine de l'application :

```powershell
docker compose -f compose.c7.yaml build php
docker compose -f compose.c7.yaml up -d database
docker compose -f compose.c7.yaml run --rm php php tests/run.php
docker compose -f compose.c7.yaml run --rm php php bin/migrate.php --direction=up
docker compose -f compose.c7.yaml run --rm php php tests/integration.php
docker compose -f compose.c7.yaml run --rm php php bin/migrate.php --direction=down --all
docker compose -f compose.c7.yaml down
```

Le service MariaDB utilise un stockage `tmpfs` et des identifiants uniquement locaux. Aucun secret ou accès hébergé ne doit être ajouté au dépôt.
