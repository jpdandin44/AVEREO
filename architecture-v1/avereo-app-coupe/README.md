---
project: avereo-app-coupe
document_type: readme
title: Coupe AVEREO Reno Pro
status: active
version: git
created: 2026-07-08
updated: 2026-09-09
owner: jpdandin
tags: [coupe, local, connect]
---

# Coupe AVEREO Reno Pro

Application de dessin et de génération de coupes de bâtiment à partir de plans.

- Depot : avereo-app-coupe
- Slug : coupe
- Sous-domaine : coupe.avereo.fr
- API eventuelle V2 : api-coupe.avereo.fr
- Type : HTML/JS autonome legacy
- Source attendue : Coupe_AVEREO_Reno_Pro.txt

## Architecture

Cette application est dans `architecture-v1/avereo-app-coupe` du monorepo AVEREO.
Le frontend Vite/React ouvre l'interface HTML/JS historique dans une iframe.
Les dossiers `frontend/public/api/` et `database/` contiennent aussi le code de
sauvegarde en ligne déjà présent ; cette étape locale ne l'active pas.

## Commandes locales

Prérequis : Windows/PowerShell, Docker Desktop en mode conteneurs Linux,
Node.js 20.19+ ou 22.12+, et les applications CONNECT et Rapport voisines dans
le même checkout. Une seule stack locale AVEREO doit utiliser ces ports.

Depuis le dossier de cette application :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File local/coupe-local.ps1 up
```

Ouvrir <http://127.0.0.1:8080/>, choisir un profil local, puis **Coupe** ou
**Rapport**. Coupe est servie sur `8200`, Rapport sur `8100`. Projet, Thermo et
Drone restent simulés. Aucune connexion à Drupal, cPanel ou à la production.

La commande `check` exécute les tests HTTP ; `down` arrête Coupe et restaure son
écran simulé dans CONNECT, en laissant Rapport disponible. Voir la
[procédure locale](docs/local-development.md) pour les données et le retour arrière.

Pour travailler seulement sur le frontend :

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
npm.cmd run build
```

Vite seul ne simule pas PHP ni le contrôle d'accès CONNECT : utiliser le lanceur
Docker pour la recette du parcours utilisateur.

## Deploiement O2Switch

Le workflow `.github/workflows/deploy-coupe-o2switch.yml` construit `frontend/dist/` puis publie uniquement son contenu vers le dossier public du sous-domaine `coupe.avereo.fr`.

Chemin cible recommande cote O2Switch :

- `/home/CPANEL_USERNAME/public_html/coupe`

La publication passe par le workflow manuel existant du monorepo, après validation
humaine. Le lanceur local ne publie aucun fichier et ne modifie aucun secret GitHub.
Voir [la procédure de déploiement](docs/deployment.md). Ne pas contourner ce workflow
par un téléversement direct.

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

En local dans ce lot, utiliser **Sauvegarder** / **Charger** pour les fichiers JSON.
La base Coupe n'est pas configurée : **Sauver en ligne** et **Ouvrir en ligne**
ne sont pas opérationnels. Voir [les données locales](data/README.md).

Configuration serveur attendue hors document root :

- `/home/CPANEL_USERNAME/.avereo/coupe/config.php`

Voir `backend/config.example.php` et `docs/deployment.md`.

## Authentification AVEREO CONNECT

En environnement heberge, CONNECT est l'unique point d'authentification. Drupal
reste le fournisseur d'identite en amont de CONNECT. Le ticket signe ouvre Coupe
et etablit une identite applicative locale sans second parcours OAuth.

Voir `docs/auth-drupal.md` pour le retour arriere historique et
`docs/preproduction-connect-cutover.md` pour la bascule cible.

## Statuts V1

- Backend : API PHP minimale pour la sauvegarde projet.
- MySQL : table `coupe_projects`.
- APIs : endpoints `/api/health.php` et `/api/projects.php`.

Ces éléments décrivent le code présent, pas une nouvelle activation de backend.
L'état effectif des services hébergés n'est pas audité par la recette locale.

## Documentation de référence

- [Architecture](architecture.md), [exigences](requirements.md), [roadmap](roadmap.md).
- [Décisions](decisions.md), [changelog](changelog.md), [audit source](docs/source-audit.md).
- [Workflows](workflows/README.md), [API](api/README.md), [tests](tests/README.md), [prompts](prompts/README.md).
