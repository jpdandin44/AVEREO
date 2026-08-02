# Rapport AVEREO Pro

Application autonome de creation de rapports d'expertise terrain dans le monorepo AVEREO.

- Slug : `rapport`
- URL locale : `http://rapport.avereo.localhost`
- Port HTTP technique direct : `8100`
- URL de production : `https://rapport.avereo.fr`
- Frontend : React 18 et Vite 7
- API : PHP sous `/api`
- Donnees : MySQL dediee
- Authentification cible : AVEREO CONNECT, adosse a Drupal OAuth/OpenID Connect

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

En environnement heberge, CONNECT est l'unique point d'authentification. Son
ticket signe ouvre le sas Rapport et etablit une identite applicative locale ;
Rapport ne redemande pas un second OAuth Drupal. Le mode `api_token` reste
strictement local et ne doit pas servir de raccourci en preproduction ou en
production.

Le workflow de production construit l'application avec
`VITE_ENABLE_ONLINE_SYNC=true`. La configuration privee Rapport doit utiliser
`auth_mode=connect_gateway` pour activer la persistance MySQL avec l'identite
signee par CONNECT. La procedure de bascule preproduction est detaillee dans
`docs/preproduction-connect-cutover.md`.

Le merge, la creation des ressources cPanel/Drupal et le deploiement restent des actions humaines.
