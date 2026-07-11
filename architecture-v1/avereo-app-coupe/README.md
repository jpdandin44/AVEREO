# Coupe AVEREO Reno Pro

- Depot : avereo-app-coupe
- Slug : coupe
- Sous-domaine : coupe.avereo.fr
- API eventuelle V2 : api-coupe.avereo.fr
- Type : HTML/JS autonome legacy
- Source attendue : Coupe_AVEREO_Reno_Pro.txt

## Architecture

Ce depot est un vrai depot Git applicatif separe. Il contient un frontend Vite, des dossiers backend/ et database/ documentaires, la documentation de deploiement et les workflows GitHub Actions.

## Commandes locales

cd frontend
npm install
npm run dev
npm run build

## Deploiement O2Switch

Le workflow `.github/workflows/deploy-coupe-o2switch.yml` construit `frontend/dist/` puis publie uniquement son contenu vers le dossier public du sous-domaine `coupe.avereo.fr`.

Chemin cible recommande cote O2Switch :

- `/home/CPANEL_USERNAME/public_html/coupe`

Deploiement manuel possible :

1. Construire le frontend depuis `frontend/` avec `npm install` puis `npm run build`.
2. Televerser le contenu de `frontend/dist/` dans le dossier public du sous-domaine.
3. Verifier que `.htaccess`, `index.html`, `legacy-app.html` et `assets/` sont bien presents a la racine du dossier public.

Secrets GitHub requis :

- CPANEL_SERVER
- CPANEL_USERNAME
- CPANEL_PASSWORD

Secrets optionnels :

- O2SWITCH_FTP_SERVER
- O2SWITCH_FTP_USER
- O2SWITCH_FTP_PASSWORD

Variables GitHub optionnelles :

- O2SWITCH_FTP_PORT

Par defaut, le workflow Coupe demande a cPanel le document root reel de `coupe.avereo.fr`, puis publie `frontend/dist/` en FTPS dans ce dossier sur `CPANEL_SERVER`, avec `CPANEL_USERNAME` et `CPANEL_PASSWORD`. `O2SWITCH_FTP_*` permet d'utiliser un compte FTP dedie.

## Sauvegarde en ligne

Les projets peuvent etre sauvegardes dans MySQL via l'API PHP publiee dans `/api`.

Configuration serveur attendue hors document root :

- `/home/CPANEL_USERNAME/.avereo/coupe/config.php`

Voir `backend/config.example.php` et `docs/deployment.md`.

## Authentification Drupal

La cible de production est d'utiliser le Drupal `avereo.fr` comme fournisseur d'identite pour les apps AVEREO. Coupe gardera sa base MySQL applicative, mais les utilisateurs et roles viendront de Drupal.

Voir `docs/auth-drupal.md`.

## Statuts V1

- Backend : API PHP minimale pour la sauvegarde projet.
- MySQL : table `coupe_projects`.
- APIs : endpoints `/api/health.php` et `/api/projects.php`.
