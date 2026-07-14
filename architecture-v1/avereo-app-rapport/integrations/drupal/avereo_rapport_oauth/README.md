# Module Drupal AVEREO Rapport OAuth

Ce module complete Simple OAuth 6.1 pour exposer uniquement les claims dont Rapport a besoin :

- `sub` : identifiant Drupal stable, fourni par Simple OAuth ;
- `client_id` : client OAuth qui a emis le jeton ;
- `roles` : uniquement `utilisateur_rapport` et `administrateur_rapport`.

Le dossier doit etre copie dans `web/modules/custom/avereo_rapport_oauth` (ou `modules/custom/` si le document root Drupal est deja `web/`), puis active apres `simple_oauth`.

```bash
composer require 'drupal/simple_oauth:^6.1'
vendor/bin/drush en simple_oauth avereo_rapport_oauth -y
vendor/bin/drush cr
```

Ne pas activer ce module tant que les roles Drupal et le client public PKCE de Rapport ne sont pas configures.
