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
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 gateway-up
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 build
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 health
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 logs
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 ps
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 down
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 gateway-down
```

Au premier lancement, le script genere des secrets aleatoires dans `local/.env` et une configuration dans `local/config.php`. Ces deux fichiers sont ignores et leurs valeurs ne sont pas affichees.

Les commandes `up`, `token-up` et `oauth-up` construisent explicitement le
frontend avec `VITE_ENABLE_ONLINE_SYNC=true` pour les tests locaux de l'API. La
commande `build` conserve un mode hors ligne local, tandis que le workflow de
production construit explicitement l'application authentifiee avec
`VITE_ENABLE_ONLINE_SYNC=true`.

La commande `gateway-up` qualifie le parcours cible sans service heberge :

1. elle genere un secret HMAC et un identifiant d'instance dans `local/.env` ;
2. elle configure Rapport en `connect_gateway` et demarre un volume MySQL
   propre a cette instance, sans supprimer un volume local anterieur ;
3. elle applique les migrations de la base ephemere CONNECT ;
4. elle recree uniquement le service web CONNECT avec l'URL Rapport reelle ;
5. le lancement depuis `http://127.0.0.1:8080` ouvre Rapport sur le port `8100`.

Le secret et la configuration generes restent ignores par Git. Le HTTP et le
cookie sans attribut `Secure` ne sont acceptes que lorsque la configuration
Rapport porte explicitement `environment=local`. Les controles HTTPS de
preproduction et de production restent inchanges. Utiliser `gateway-down` (ou
`down`) pour restaurer le placeholder Rapport de CONNECT si le mode passerelle
avait ete active.

## URLs et ports

| Service | URL/port |
| --- | --- |
| Application et API | `http://rapport.avereo.localhost` |
| Acces HTTP technique direct | `127.0.0.1:8100` |
| AVEREO CONNECT local | `http://127.0.0.1:8080` |
| MySQL | `127.0.0.1:3310` |
| Adminer | `http://rapport.avereo.localhost:8101` |
| Mock OAuth | `http://oauth-rapport.avereo.localhost:8102` |

Le script demarre si necessaire le gateway HTTP partage du monorepo. La commande Rapport `down` n'arrete pas ce gateway, car d'autres applications peuvent l'utiliser. Son arret explicite est documente dans `../../avereo-platform/infra/local-gateway/README.md`.

## Verifications

- `/api/health.php` retourne `ok: true` et `app: rapport`.
- `/api/auth.php?action=config` ne retourne aucun secret.
- Le build contient `api/`, `auth/callback/`, `.htaccess`, `index.html` et les assets.
- Deux identites OAuth standard ne peuvent pas lire les rapports l'une de l'autre.
- Le profil local CONNECT ouvre la vraie application Rapport, sans page de
  demonstration intermediaire, et les autres applications restent simulees.
