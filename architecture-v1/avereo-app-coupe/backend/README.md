# Backend Coupe

La V1 publie une application statique avec une petite API PHP pour sauvegarder les projets dans MySQL depuis l'application en ligne.

## API publiee

Les fichiers PHP deployes sont dans `frontend/public/api/`, puis copies dans `frontend/dist/api/` au build.

- `GET /api/health.php` : verifie que l'API repond et que la base est configuree.
- `GET /api/projects.php` : liste les projets sauvegardes.
- `GET /api/projects.php?id=...` : charge un projet.
- `POST /api/projects.php` : cree ou met a jour un projet.
- `DELETE /api/projects.php?id=...` : supprime un projet.

En environnement heberge, les endpoints projets exigent le cookie local signe
issu du ticket AVEREO CONNECT. Aucun bearer OAuth ou jeton technique n'est
demande au navigateur. `api_token` reste disponible uniquement en local.

## Configuration O2Switch

Ne pas mettre les identifiants MySQL dans le dossier public `coupe.avereo.fr`.

Creer ce fichier cote O2Switch :

```text
/home/CPANEL_USERNAME/.avereo/coupe/config.php
```

L'API cherche automatiquement ce fichier depuis le home cPanel deduit du document root O2Switch. Si le serveur a une arborescence atypique, forcer explicitement le chemin avec `AVEREO_CONFIG_FILE`.

Contenu type :

```php
<?php
return [
    'db_host' => 'localhost',
    'db_port' => '3306',
    'db_name' => 'CPANELUSER_coupe',
    'db_user' => 'CPANELUSER_coupe_user',
    'db_password' => 'CHANGE_ME',
    'auth_mode' => 'connect_gateway',
    'connect_admin_user_ids' => [],
    'max_payload_bytes' => 50 * 1024 * 1024,
];
```

Copier `backend/config.example.php` puis conserver le secret de sas hors document
root. Les IDs administrateurs Coupe sont ajoutes explicitement dans
`connect_admin_user_ids`.

Verification apres deploiement :

```text
https://coupe.avereo.fr/api/health.php
```

La reponse doit indiquer `databaseConfigured: true`, `authConfigured: true` et
`authMode: connect_gateway`.
