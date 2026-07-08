# Projet AVEREO Pro

- Depot : avereo-app-projet
- Slug : projet
- Sous-domaine : projet.avereo.fr
- API eventuelle V2 : api-projet.avereo.fr
- Type : HTML/JS autonome legacy
- Source attendue : Projet_AVEREO_Pro.txt

## Architecture

Ce depot est un vrai depot Git applicatif separe. Il contient un frontend Vite, des dossiers backend/ et database/ documentaires, la documentation de deploiement et les workflows GitHub Actions.

## Commandes locales

cd frontend
npm install
npm run dev
npm run build

## Deploiement O2Switch

Le workflow .github/workflows/deploy-o2switch.yml construit frontend/dist/ puis publie uniquement son contenu vers le dossier public du sous-domaine.

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
