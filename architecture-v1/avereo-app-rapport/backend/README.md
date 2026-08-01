# API PHP Rapport

Les sources PHP publiees sont dans `frontend/public/api/`. Vite les copie vers `frontend/dist/api/`; il n'existe pas de seconde implementation divergente.

Endpoints :

- `GET /api/health.php`
- `GET /api/auth.php?action=config`
- `GET /api/auth.php?action=me`
- `POST /api/auth.php?action=token` (retour arriere `drupal_oauth` uniquement)
- `GET|POST|DELETE /api/reports.php`

La configuration de production doit etre creee hors document root dans `/home/CPANEL_USERNAME/.avereo/rapport/config.php` a partir de `config.example.php`. Le fichier reel ne doit jamais entrer dans Git ou dans `frontend/dist`.

En environnement heberge, `auth_mode=connect_gateway` relit l'identite signee du
cookie de sas. Aucun bearer OAuth supplementaire n'est exige. L'API utilise PDO,
les requetes preparees, des reponses JSON, une limite de payload et des controles
de roles/propriete. Les erreurs internes ne sont pas renvoyees au navigateur.
