# Backend Coupe

La V1 publie une application statique avec une petite API PHP pour sauvegarder les projets dans MySQL depuis l'application en ligne.

## API publiee

Les fichiers PHP deployes sont dans `frontend/public/api/`, puis copies dans `frontend/dist/api/` au build.

- `GET /api/health.php` : verifie que l'API repond et que la base est configuree.
- `GET /api/projects.php` : liste les projets sauvegardes.
- `GET /api/projects.php?id=...` : charge un projet.
- `POST /api/projects.php` : cree ou met a jour un projet.
- `DELETE /api/projects.php?id=...` : supprime un projet.

Les endpoints projets exigent actuellement `Authorization: Bearer <AVEREO_API_TOKEN>`.

La cible est de remplacer ce jeton technique par un jeton utilisateur Drupal valide. Voir `../docs/auth-drupal.md`.

## Configuration O2Switch

Ne pas mettre les identifiants MySQL dans le dossier public `coupe.avereo.fr`.

Creer ce fichier cote O2Switch :

```text
/home/CPANEL_USERNAME/.avereo/coupe/config.php
```

Contenu type :

```php
<?php
return [
    'db_host' => 'localhost',
    'db_port' => '3306',
    'db_name' => 'CPANELUSER_coupe',
    'db_user' => 'CPANELUSER_coupe_user',
    'db_password' => 'CHANGE_ME',
    'auth_mode' => 'api_token',
    'api_token' => 'CHANGE_ME_LONG_RANDOM_TOKEN',
    'max_payload_bytes' => 50 * 1024 * 1024,
];
```

L'application demandera le jeton API lors de la premiere sauvegarde en ligne, puis le stockera dans le navigateur.

Pour le mode cible Drupal, copier `backend/config.example.php`, renseigner les valeurs `drupal_*`, puis passer `auth_mode` a `drupal_oauth`.
