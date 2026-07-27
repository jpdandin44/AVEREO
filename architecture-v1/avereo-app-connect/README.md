# AVEREO CONNECT

- Slug : `connect`
- Domaine cible : `connect.avereo.fr`
- Fournisseur d'identité : Drupal avec Simple OAuth
- Frontend historique : React/Vite
- Candidat C7/V2 : backend PHP 8.3 et schéma MariaDB/MySQL

## Architecture

Le frontend V1 reste présent sans modification fonctionnelle. Le candidat C7/V2
ajoute un backend API séparé dans `backend/`, les migrations dans `database/` et
un environnement Docker local éphémère dans `compose.c7.yaml`.

Le backend délègue l'authentification à Drupal par Authorization Code avec PKCE
S256. CONNECT conserve la session applicative, applique les autorisations côté
serveur et ne stocke aucun mot de passe Drupal.

## Commandes locales

Frontend :

```powershell
cd frontend
npm install
npm run dev
npm run build
```

Backend et base éphémère :

```powershell
docker compose -f compose.c7.yaml build php
docker compose -f compose.c7.yaml up -d database
docker compose -f compose.c7.yaml run --rm php php tests/run.php
docker compose -f compose.c7.yaml run --rm php php bin/migrate.php --direction=up
docker compose -f compose.c7.yaml run --rm php php tests/integration.php
docker compose -f compose.c7.yaml down
```

## Déploiement

Le workflow existant `deploy-connect-o2switch.yml` reste limité au frontend.
Cette PR n'active aucun déploiement automatique du backend, ne crée aucune base
hébergée et ne modifie pas la production.

La mise en production du candidat C7/V2 relève d'une gate C11 distincte après
validation des paramètres OAuth de production, du document root, de la base,
des sauvegardes et du plan de retour arrière. Voir
`docs/production-readiness-c7.md`.
