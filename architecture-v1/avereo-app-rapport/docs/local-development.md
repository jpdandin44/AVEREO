# Developpement local

## Prerequis

- Node.js 20 ou plus recent et npm.
- Docker Desktop avec Docker Compose.
- PowerShell 5.1 ou plus recent.

Les sous-domaines en `.localhost` resolvent sur la boucle locale dans les navigateurs modernes; aucun fichier `hosts` n'est normalement requis.

## Commandes

```powershell
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 up
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 token-up
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 oauth-up
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 build
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 health
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 logs
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 ps
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 down
```

Au premier lancement, le script genere des secrets aleatoires dans `local/.env` et une configuration dans `local/config.php`. Ces deux fichiers sont ignores et leurs valeurs ne sont pas affichees.

Les commandes `up`, `token-up` et `oauth-up` construisent explicitement le frontend avec `VITE_ENABLE_ONLINE_SYNC=true` pour les tests locaux de l'API. La commande `build` produit la preversion sans synchronisation (`false`), comme le workflow de production actuel.

## URLs et ports

| Service | URL/port |
| --- | --- |
| Application et API | `http://rapport.avereo.localhost` |
| Acces HTTP technique direct | `127.0.0.1:8100` |
| MySQL | `127.0.0.1:3310` |
| Adminer | `http://rapport.avereo.localhost:8101` |
| Mock OAuth | `http://oauth-rapport.avereo.localhost:8102` |

Le script demarre si necessaire le gateway HTTP partage du monorepo. La commande Rapport `down` n'arrete pas ce gateway, car d'autres applications peuvent l'utiliser. Son arret explicite est documente dans `../../avereo-platform/infra/local-gateway/README.md`.

## Verifications

- `/api/health.php` retourne `ok: true` et `app: rapport`.
- `/api/auth.php?action=config` ne retourne aucun secret.
- Le build contient `api/`, `auth/callback/`, `.htaccess`, `index.html` et les assets.
- Deux identites OAuth standard ne peuvent pas lire les rapports l'une de l'autre.
