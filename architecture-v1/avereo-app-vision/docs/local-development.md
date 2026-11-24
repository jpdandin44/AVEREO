# Développement local — AVEREO Vision

Prérequis : Node 20.19 ou plus (ou 22.12 ou plus), Docker Desktop. PHP n'est pas nécessaire sur le poste (l'API tourne dans un conteneur).

## Le frontend seul (plan 2D et métrés, sans serveur)
```powershell
cd architecture-v1/avereo-app-vision/frontend
npm ci
npm run dev
npm test
npm run build
```
Sans l'API, l'écran Projets affiche « Connexion requise » ; la logique de métré se teste sans serveur.

## La pile locale : API PHP et MySQL (Docker)
Depuis `architecture-v1/avereo-app-vision/` :
```powershell
powershell -ExecutionPolicy Bypass -File .\local\vision-local.ps1 up
```
| Action | Effet |
|---|---|
| `up` | crée `local/.env` et `local/config.php` (secrets aléatoires, ignorés par git) et `frontend/.env.development.local`, construit l'image PHP 8.4 + `pdo_mysql`, démarre MySQL 8.4 et l'API, applique les migrations |
| `health` | appelle `http://127.0.0.1:8110/api/health.php` |
| `migrate` | applique les migrations en attente (`database/migrate.php`) |
| `test` | lance tous les tests PHP dans le conteneur |
| `logs`, `ps` | journaux et état |
| `down` | arrête la pile (la base est conservée) |
| `reset` | arrête la pile **et efface la base de développement** |

Adresses : API `http://127.0.0.1:8110/api/…`, MySQL `127.0.0.1:3311` (utilisateur et mot de passe dans `local/.env`). Le serveur web est le serveur PHP intégré (`local/router.php` reproduit les interdictions de `.htaccess` sur `api/lib/` et `api/bootstrap.php`).

## Travailler avec l'API depuis le frontend
`npm run dev` envoie `/api` et `/connect` vers `http://127.0.0.1:8110` (proxy de `vite.config.js`). Le fichier `frontend/.env.development.local` (créé par `up`, **ignoré par git**) contient `VITE_LOCAL_API_TOKEN` et `VITE_LOCAL_USER` : seul `npm run dev` le lit, jamais `npm run build`. Changer `VITE_LOCAL_USER` change d'identité de test ; l'identité listée dans `admin_user_ids` de `local/config.php` (« 1 » par défaut) est fondateur.

Test sur un smartphone : `npm run dev -- --host` sert les pages au réseau local, mais le plugin `vite-plugins/boucle-locale.js` refuse à ces appareils tout appel vers `/api` : le jeton de test n'est utilisable que depuis ce poste. N'enregistrez jamais de vrais relevés dans la base locale.

## Les tests PHP
Sans dépendance (aucun Composer) : `tests/api/run.php [filtre]`.
- Dans le conteneur (tout, y compris la base et HTTP) : `vision-local.ps1 test`, ou, pour un seul fichier : `docker compose -f local/docker-compose.local.yml --env-file local/.env exec -T api php /opt/vision/tests/api/run.php droits` (dans Git Bash, préfixer par `MSYS_NO_PATHCONV=1`).
- Sur le poste, sans base (droits, passerelle, configuration, validation, authentification, sécurité) : `php tests/api/run.php connect_gate`. Les tests qui ont besoin de la base ou du serveur sont ignorés avec un message ; `--strict` (utilisé par `vision-local.ps1 test`) fait échouer l'exécution si un test a été ignoré, pour qu'un test non exécuté ne passe pas pour réussi.
- Les tests de migrations utilisent des tables d'essai `zz_mig_*` et les nettoient.

## Dépannage
- « Connexion requise » en développement : la pile n'est pas démarrée, ou `frontend/.env.development.local` manque (relancer `up`).
- `docker compose` échoue sur des variables : `local/.env` manque (relancer `up`).
- Le serveur d'essai du parcours CONNECT utilise un port aléatoire entre 18100 et 18900 dans le conteneur.
- Une migration appliquée ne se modifie jamais (empreinte contrôlée) : ajouter une nouvelle migration, ou `reset` en développement.
