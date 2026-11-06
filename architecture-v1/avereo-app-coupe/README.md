---
project: avereo-app-coupe
document_type: reference
title: README
status: active
version: git
created: 2026-11-04
updated: 2026-11-06
owner: jpdandin
tags: [avereo, acces, documentation]
---


## Références actuelles

[Architecture](architecture.md) · [Exigences](requirements.md) · [Feuille de route](roadmap.md) · [Décisions](decisions.md) · [Historique](changelog.md).

Le lot des [accès temporaires](../avereo-app-connect/docs/acces-temporaires-applications.md) est un candidat local. PHP 8.3 et Node 22 sont utilisés en CI. Depuis la racine du monorepo, les tests `architecture-v1/avereo-platform/tests/temporary-access.php APPLICATION` et `temporary-access-http.py` qualifient la politique et les cookies. Générer d’abord le sas Passeport avec son script `workflows/prepare-connect-gate.mjs`. La présence du code ne prouve pas une installation hébergée.

﻿# Coupe AVEREO Reno Pro

- Depot : avereo-app-coupe
- Slug : coupe
- Sous-domaine : coupe.avereo.fr
- API eventuelle V2 : api-coupe.avereo.fr
- Type : HTML/JS autonome legacy
- Source attendue : Coupe_AVEREO_Reno_Pro.txt

## Architecture

Ce dossier appartient au monorepo AVEREO. Il contient un frontend Vite, des dossiers backend/ et database/ documentaires, la documentation de deploiement et les workflows GitHub Actions.

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

## Mon espace — candidat commun du 6 novembre 2026

Le menu est au pied de la barre latérale. Ouvrir en ligne et l’action d’authentification existante sont conservés ; le mode jeton API local reste accessible.

[Règle commune](../avereo-platform/docs/fonctionnalites-communes.md) · [Qualification et suivi](../avereo-platform/docs/qualification-mon-espace.md). Ce candidat local ne prouve pas une installation hébergée.

## Espaces applicatifs — candidat PR #121

Mes projets ouvre le sélecteur natif des projets en ligne. Les préférences propres à Coupe règlent la grille et l’aimantation de l’éditeur dans ce navigateur. Le candidat de livraison doit appliquer ces raccordements à la variante HTML hébergée en conservant ses traitements OAuth et ses API.

[Règle et portée](../avereo-platform/docs/fonctionnalites-communes.md) · [Qualification](../avereo-platform/docs/qualification-mon-espace.md).
