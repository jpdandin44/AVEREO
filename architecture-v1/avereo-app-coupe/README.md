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

- O2SWITCH_SSH_KEY
- O2SWITCH_USER
- O2SWITCH_HOST
- O2SWITCH_PORT
- O2SWITCH_TARGET_PATH

## Statuts V1

- Backend : desactive en V1.
- MySQL : desactive en V1.
- APIs : reportees en V2 uniquement si un besoin metier reel le justifie.
