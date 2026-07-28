# Module Drupal AVEREO Applications OAuth

Ce module complete Simple OAuth 6.1 pour exposer les claims controles par les
API AVEREO :

- `sub` : identifiant Drupal stable, fourni par Simple OAuth ;
- `client_id` : client OAuth qui a emis le jeton ;
- `roles` : uniquement les roles applicatifs Rapport et Coupe.

Le dossier doit etre copie dans `web/modules/custom/avereo_rapport_oauth` (ou `modules/custom/` si le document root Drupal est deja `web/`), puis active apres `simple_oauth`.

```bash
composer require 'drupal/simple_oauth:^6.1'
vendor/bin/drush en simple_oauth avereo_rapport_oauth -y
vendor/bin/drush cr
```

Chaque application doit disposer de son propre client OAuth, de son propre
secret serveur et de son URI de redirection. Un jeton Rapport est refuse par
Coupe et inversement grace au claim `client_id`.

Ne pas activer ce module tant que les roles Drupal et les clients PKCE des
applications ne sont pas configures.
