# Rapport AVEREO Pro

Application autonome de creation de rapports d'expertise terrain dans le monorepo AVEREO.

- Slug : `rapport`
- URL locale : `http://rapport.avereo.localhost`
- Port HTTP technique direct : `8100`
- URL de production : `https://rapport.avereo.fr`
- Frontend : React 18 et Vite 7
- API : PHP sous `/api`
- Donnees : MySQL dediee
- Authentification cible : Drupal OAuth/OpenID Connect avec PKCE

## Decision de depot

Rapport reste dans le monorepo. Son dossier, ses ports, sa base, son workflow, son sous-domaine, ses roles et sa configuration sont isoles. Voir `docs/architecture.md` pour les criteres qui pourraient justifier un depot separe plus tard.

## Source importee

La source historique `Rapport_AVEREO_Pro.txt` est conservee dans le ZIP d'audit local, exclu de Git. Le frontend integre preserve et etend ses fonctions. Voir `docs/source-audit.md` et `docs/migration-matrix.md`.

## Installation et build

```powershell
cd frontend
npm ci
npm run build
```

Le build produit `frontend/dist/`, y compris l'API PHP venant de `frontend/public/api/`.

## Environnement local

```powershell
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 token-up
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 oauth-up
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 health
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 down
```

Les secrets locaux sont generes dans des fichiers ignores. Aucun identifiant de production n'est requis pour developper.

Ports locaux : application `8100`, MySQL `3310`, Adminer `8101`, mock OAuth `8102`.

## Production

Le workflow racine `.github/workflows/deploy-rapport-o2switch.yml` construit et publie uniquement `frontend/dist/` en FTPS. La configuration reelle reste hors document root dans `/home/CPANEL_USERNAME/.avereo/rapport/config.php`.

Une preversion peut etre publiee avant Drupal OAuth : le frontend, les brouillons locaux, l'import et les exports restent utilisables, mais la sauvegarde MySQL demeure verrouillee. Le mode `api_token` est refuse hors des hotes locaux et ne doit pas servir de raccourci en production.

Le workflow de production construit actuellement cette preversion avec `VITE_ENABLE_ONLINE_SYNC=false`. Dans ce mode, le navigateur n'appelle pas l'API d'authentification, aucun bouton de connexion ou de sauvegarde serveur n'est affiche et les donnees restent uniquement dans IndexedDB/localStorage. L'utilisateur doit conserver des copies JSON regulieres. Le branchement serveur sera reactive plus tard avec `VITE_ENABLE_ONLINE_SYNC=true`, apres validation de Drupal OAuth.

Le merge, la creation des ressources cPanel/Drupal et le deploiement restent des actions humaines.
