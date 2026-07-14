# AGENTS.md - Rapport AVEREO

## Perimetre

Ce dossier contient l'application autonome Rapport AVEREO. Ne modifier aucune autre application. Les seuls fichiers partages autorises sont le workflow racine `deploy-rapport-o2switch.yml`, les scripts de deploiement deja mutualises et l'infrastructure generique `avereo-platform/infra/local-gateway/` necessaire au sous-domaine local sans port.

## Architecture

- Frontend React/Vite dans `frontend/`.
- API PHP publiee sous `frontend/public/api/`, donc copiee dans `frontend/dist/api/` au build.
- Base MySQL dediee `rapport` avec migrations dans `database/migrations/`.
- Configuration sensible hors document root dans `/home/CPANEL_USERNAME/.avereo/rapport/config.php`.
- OAuth Drupal cible; `api_token` uniquement comme secours temporaire local.

## Commandes

Depuis `frontend/` : `npm ci`, `npm run build`.

Depuis la racine de l'application :

```powershell
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 token-up
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 oauth-up
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 health
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 down
```

## Regles absolues

- Ne jamais commiter de secret, `.env`, `local/config.php`, ZIP, `node_modules` ou `frontend/dist`.
- Valider toutes les entrees API, utiliser PDO et des requetes preparees.
- Controler roles et propriete des rapports cote PHP.
- Ne jamais exposer de secret OAuth ou MySQL au navigateur.
- Preserver les fonctions de brouillon, import/export, photos, dictee et generation de rapport.
- Documenter tout ecart dans `docs/source-audit.md` et `docs/migration-matrix.md`.
- Travailler sur une branche dediee; ne jamais pousser sur `main`.
- Ne jamais merger, activer l'auto-merge ou declencher un deploiement de production.

Voir `docs/` pour l'architecture, l'authentification, le developpement local, le deploiement et le rollback.
