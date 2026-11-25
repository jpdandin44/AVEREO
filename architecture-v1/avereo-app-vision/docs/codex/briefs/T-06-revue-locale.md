# Brief Codex T-06 — environnements locaux de recette et de validation

Lot : outillage de revue — Branche : vision/revue-locale — Rédigé par Claude Code le 25/11/2026

> **Note du 25/11/2026** : le responsable a ensuite précisé que **la recette est locale** (un seul environnement, port 5250, candidat de la PR en cours) et que **la validation se fait en préproduction** (`docs/deploiement-mutualise.md`). L'environnement local « validation » (port 5251) décrit ci-dessous a été retiré ; voir `docs/revue-locale.md`.

## Contexte
Lis `architecture-v1/avereo-app-vision/AGENTS.md`, puis uniquement les fichiers listés ci-dessous.
Le responsable veut **voir l'avancement des fonctions** dans un navigateur, comme pour les autres applications du dépôt (chaque PR donne un « service de revue » local `http://127.0.0.1:52xx/` avec des comptes fictifs). Pour AVEREO Vision, deux environnements locaux, chacun avec sa base et ses données de démonstration :
- **recette** : l'application de `main` (ce qui est mergé), `http://127.0.0.1:5250/` ;
- **validation** : le candidat de la PR en cours (le worktree de sa branche), `http://127.0.0.1:5251/`.
On y entre par une **page de comptes fictifs** qui fabrique un vrai ticket signé au format CONNECT et passe par la vraie passerelle de Vision (`/connect/entry.php`), comme en production. Cette page n'existe **qu'en local** : elle n'est jamais dans `frontend/dist`.

**Principe clé** : l'outillage (ce brief) et l'application servie sont deux dossiers différents. L'outillage vit dans le checkout où se trouve `vision-revue.ps1` ; l'application servie est la **source** (un autre worktree : `main` pour la recette, la branche de la PR pour la validation), qui peut ne pas contenir cet outillage. Dans le conteneur : source montée sur `/opt/vision` (lecture seule), outillage `local/revue/` monté sur `/opt/revue` (lecture seule).

## Ce que tu fais (tout sous `architecture-v1/avereo-app-vision/`)

### 1. `local/docker-compose.revue.yml`
- Deux services : `db` (`mysql:8.4`, **aucun port publié**, base `vision`, utilisateur `vision`, mots de passe lus dans le fichier `--env-file` : `VISION_DB_PASSWORD`, `VISION_DB_ROOT_PASSWORD`, volume nommé `revue-db`, healthcheck comme `local/docker-compose.local.yml`) et `api` (build `context: .`, `dockerfile: Dockerfile` : la même image que la pile de développement).
- `api` : `depends_on` db sain ; variables `AVEREO_CONFIG_FILE: /opt/revue/environnements/${VISION_REVUE_NOM}/config.php` et `PHP_CLI_SERVER_WORKERS: "4"` ; commande `["php", "-S", "0.0.0.0:80", "-t", "/opt/vision/frontend/dist", "/opt/revue/router.php"]` ; port `"127.0.0.1:${VISION_REVUE_PORT}:80"` ; volumes `"${VISION_REVUE_SOURCE}:/opt/vision:ro"`, `"./revue:/opt/revue:ro"`, `revue-nonces:/var/lib/avereo/vision/nonces`.
- Le nom du projet Compose est donné par le script (`-p vision-revue-<nom>`) : volumes et conteneurs sont donc séparés par environnement.

### 2. `local/revue/router.php` (routeur du serveur PHP intégré)
- Mêmes règles que `local/router.php` (lis-le) : chemin brut avant `?`, décodé, minuscules, `/` multiples fusionnés ; `/api/lib/…` et `/api/bootstrap.php` → 403 texte.
- Chemin `/revue` ou commençant par `/revue/` → `require __DIR__ . '/index.php'; return true;`.
- Tout le reste : `return false` (fichiers de `dist`, dont `index.html`, `api/*.php`, `connect/entry.php`).

### 3. `local/revue/lib.php` (fonctions pures, testées)
```php
/** Comptes fictifs : clé => ['id' => chaîne de chiffres, 'libelle' => texte]. */
function vision_revue_comptes(): array
// 'A' => ['id' => '900001', 'libelle' => 'Conseiller A'], 'B' => ['id' => '900002', 'libelle' => 'Conseiller B'], 'F' => ['id' => '900009', 'libelle' => 'Fondateur F']

/** Ticket au format CONNECT : base64url(charge JSON) . '.' . base64url(HMAC-SHA256 brut de la partie encodée, avec $secret). */
function vision_revue_ticket(string $secret, string $userId, int $maintenant, ?string $nonce = null): string
// charge : {"v":1,"app":"vision","iat":maintenant,"exp":maintenant+300,"nonce":<24 octets aléatoires en base64url si null>,
//           "remembered":false,"identity":{"provider":"avereo_connect","id":<userId>}} — json_encode avec JSON_UNESCAPED_SLASHES.
// Référence du format : tests/api/connect_flow_test.php (vision_connect_ticket) et frontend/public/api/lib/connect_gate.php.

/** La page ne fonctionne que si environment === 'local' ET auth_mode === 'connect' ET un secret d'au moins 32 caractères est présent. */
function vision_revue_autorise(array $config): bool
```

### 4. `local/revue/index.php` (page « Choisir un compte fictif »)
- Charge la configuration de la **source** : `require_once '/opt/vision/frontend/public/api/lib/config.php'` puis `vision_config()` (le chemin vient de `AVEREO_CONFIG_FILE`), et `require_once __DIR__ . '/lib.php'`. Si `vision_revue_autorise()` est faux ou si la configuration est invalide : réponse 403 texte « Page de revue disponible uniquement en environnement local. », rien d'autre.
- `GET` : page HTML autonome (pas de ressource externe), en français, conforme à la charte AVEREO : variables CSS déclarées une fois en tête (`--brand-primary: #002B45`, `--brand-accent: #FF6600`, `--surface-muted: #EEF3F6`, `--text-primary: #263238`, `--radius: 8px`), police `Inter, Arial, sans-serif`, logo `/branding/logo-avereo.png` (largeur 220 px, fond blanc), bouton principal bleu nuit, **aucun texte orange sur fond blanc**. Contenu : titre « AVEREO Vision — environnement de revue locale » ; encadré « Données fictives, environnement local : n'y saisissez aucune donnée réelle » ; nom de l'environnement (variable d'environnement `VISION_REVUE_NOM` lue avec `getenv`, à défaut « local ») ; un formulaire `POST` par compte (bouton « Entrer comme Conseiller A », etc.) ; rappel « Pour changer de compte : Se déconnecter dans l'application, puis revenir sur /revue/ ».
- `POST` avec `compte` ∈ {A, B, F} : fabrique le ticket avec `connect_launch_secret` et `time()`, puis `303` vers `/connect/entry.php?ticket=` + `rawurlencode($ticket)`, avec `Cache-Control: no-store`. Compte inconnu : 400. Toute autre méthode : 405.
- Échapper toute valeur affichée (`htmlspecialchars`).

### 5. `local/revue/donnees-demo.php` (CLI, lancé dans le conteneur, rejouable)
- Refuse de s'exécuter hors CLI. Charge depuis la **source** : `config.php`, `http.php`, `db.php`, `projects.php` de `/opt/vision/frontend/public/api/lib/`, et `sync.php` **seulement s'il existe** (`main` peut ne pas l'avoir encore). Refuse si `environment` ≠ `local`. Connexion : `vision_pdo(vision_config())`.
- Projets, identifiants fixes (32 hexadécimaux), créés avec `vision_project_create($pdo, $identite, $clean)` seulement s'ils n'existent pas (`vision_project_find`) ; identité `['provider' => 'avereo_connect', 'id' => …]` :
  - Conseiller A (`900001`) : `de000000000000000000000000000a01` « Maison Martin (démo) », adresse « 12 rue des Lilas, Nantes », client « M. et Mme Martin (fictifs) » ; `de000000000000000000000000000a02` « Appartement en L (démo) », adresse « 3 place du Marché, Rennes » ; `de000000000000000000000000000a03` « Ancien projet (démo, archivé) », puis archivé avec `vision_project_update(…, ['status' => 'archived'])` s'il est encore actif.
  - Conseiller B (`900002`) : `de000000000000000000000000000b01` « Studio Durand (démo) ».
  - **Attention** : sur la base de `main` (Lot 2A), `vision_project_create` ignore `$clean['id']` et tire un identifiant au hasard. Dans ce cas, retrouve le projet par son nom et son propriétaire (requête préparée sur `vision_projects`) au lieu de dupliquer ; documente-le en commentaire.
- Relevés (seulement si `function_exists('vision_sync_exchange')`) : pour `…a01`, envoie le contenu de `local/revue/donnees/ref2.json` ; pour `…a02`, `local/revue/donnees/ref3.json`, avec `vision_sync_exchange($pdo, $projet, $identite, 'donnees-demo', 0, $changements)` où `$changements` est la liste validée par `vision_sync_validate_request()`. Un rejeu donne des statuts `unchanged` : pas de doublon.
- Affiche un résumé (projets créés / déjà présents, relevés envoyés / absents de cette version). Code de sortie non nul en cas d'erreur.

### 6. `local/revue/donnees/ref2.json` et `ref3.json`
Format : `{"changes": [...]}` (changements du protocole de synchronisation, `base_rev` 0).
- `ref2.json` : exactement ces changements (relevé de référence REF-2, pièce 4,00 × 3,00 m, porte et fenêtre) :
```json
[{"object_id":"batiment-1","kind":"batiment","parent_id":null,"base_rev":0,"deleted":false,"data":{"nom":"Logement"}},{"object_id":"niveau-1","kind":"niveau","parent_id":"batiment-1","base_rev":0,"deleted":false,"data":{"nom":"Rez-de-chaussée","ordre":0}},{"object_id":"piece-salon","kind":"piece","parent_id":"niveau-1","base_rev":0,"deleted":false,"data":{"nom":"Salon","hauteurMm":2500,"ordre":0,"sommets":[{"x":0,"y":0},{"x":4000,"y":0},{"x":4000,"y":3000},{"x":0,"y":3000}]}},{"object_id":"ouv-1-porte","kind":"ouverture","parent_id":"piece-salon","base_rev":0,"deleted":false,"data":{"type":"porte","murIndex":0,"positionMm":500,"largeurMm":900,"hauteurMm":2040,"alleMm":0}},{"object_id":"ouv-2-fenetre","kind":"ouverture","parent_id":"piece-salon","base_rev":0,"deleted":false,"data":{"type":"fenetre","murIndex":1,"positionMm":600,"largeurMm":1200,"hauteurMm":1000,"alleMm":900}}]
```
- `ref3.json` : `batiment-1` (« Logement »), `niveau-1` (« Rez-de-chaussée », ordre 0), pièce `piece-sejour-l` « Séjour en L », hauteur 2500, ordre 0, sommets (0,0), (4000,0), (4000,2000), (2000,2000), (2000,4000), (0,4000) ; une porte `ouv-1-porte` sur le mur 0, position 1000, 900 × 2040, allège 0.

### 7. `local/vision-revue.ps1` (PowerShell 5.1, style de `local/vision-local.ps1`, messages en français)
- Paramètres : `-Action` (`up`, `down`, `reset`, `donnees`, `actualiser`, `etat`, `logs`), `-Nom` (`recette` | `validation`), `-Source` (dossier racine d'un worktree du dépôt), `-Port`, `-Confirmer` (switch).
- Défauts : `recette` → port 5250, source `<dossier parent du dépôt de l'outillage>\avereo-vision-recette` ; `validation` → port 5251, `-Source` **obligatoire**. Racine du dépôt de l'outillage : `git -C $PSScriptRoot rev-parse --show-toplevel`.
- `actualiser` (recette seulement) : si le worktree n'existe pas, `git fetch origin` puis `git worktree add --detach <chemin> origin/main` ; sinon, refus s'il n'est pas propre (`git status --porcelain` non vide), puis `git -C <chemin> fetch origin` et `git -C <chemin> checkout --detach origin/main`. Affiche le commit obtenu.
- `up` : Docker disponible ; pour la recette, crée le worktree s'il manque (comme `actualiser`) ; la source doit contenir `architecture-v1/avereo-app-vision/frontend/package.json` ; avertissement (sans blocage) si la source a des modifications non commitées ; refus clair si le port est occupé par autre chose que ce même environnement (`Get-NetTCPConnection`) ; dans `<source>/architecture-v1/avereo-app-vision/frontend` : `npm ci` si `node_modules` manque, puis `npm run build` (arrêt si échec) ; crée si besoin `local/revue/environnements/<nom>/.env` (mots de passe aléatoires) et `config.php` (`environment` `local`, `auth_mode` `connect`, `db` hôte `db` / base `vision` / utilisateur `vision`, `admin_user_ids` `['900009']`, `connect_launch_secret` aléatoire de 48 caractères, `connect_launch_nonce_directory` `/var/lib/avereo/vision/nonces`, **`connect_gate_cookie` `AVEREO_VISION_GATE_RECETTE` ou `AVEREO_VISION_GATE_VALIDATION`** : les cookies de `127.0.0.1` sont communs à tous les ports, deux environnements doivent avoir des noms différents) ; `docker compose -f docker-compose.revue.yml -p vision-revue-<nom> --env-file <.env> up -d --build` avec `VISION_REVUE_SOURCE` (chemin de `<source>/architecture-v1/avereo-app-vision`), `VISION_REVUE_PORT`, `VISION_REVUE_NOM` dans l'environnement du processus ; migrations (`exec -T api php /opt/vision/database/migrate.php`) ; données (`exec -T api php /opt/revue/donnees-demo.php`) ; attente de `http://127.0.0.1:<port>/api/health.php` (30 s au plus) ; affiche l'adresse `http://127.0.0.1:<port>/revue/`, les comptes, la source (chemin, branche, commit court).
- `down` : `compose … down` (jamais `-v`, jamais d'autre projet). `reset` : exige `-Confirmer`, puis `down -v` et supprime `local/revue/environnements/<nom>/`. `donnees` : relance seulement `donnees-demo.php`. `etat` : pour recette et validation, conteneurs, santé, adresse, source et commit. `logs` : `logs --tail 100`.
- Les chemins Windows avec espaces doivent fonctionner (le dépôt est sous `C:\Users\…\Documents local\…`).

### 8. Tests `tests/api/revue_test.php` (lanceur `tests/api/run.php`, style de `tests/api/connect_gate_test.php`)
- `vision_revue_comptes()` : trois comptes, identifiants de chiffres, F différent de A et B.
- Un ticket de `vision_revue_ticket()` est **accepté** par `vision_gate_exchange_ticket()` de `frontend/public/api/lib/connect_gate.php` (dossier de nonces temporaire, secret de 48 caractères) et donne l'identité `avereo_connect` / `900001` ; son **rejeu** est refusé ; avec un autre secret il est refusé ; `exp - iat` = 300 ; `app` = `vision`.
- `vision_revue_autorise()` : vrai pour `local` + `connect` + secret ≥ 32 ; faux pour `production`, `preproduction`, `auth_mode` `token`, secret court.
- Le routeur n'est pas exécutable sans serveur : contrôle statique que `local/revue/router.php` contient le refus de `/api/lib/` et de `bootstrap.php`.

### 9. `.gitignore` de l'application
Ajoute `local/revue/environnements/` (configurations et mots de passe générés). Ne supprime rien.

## Périmètre
- Fichiers à créer : `local/docker-compose.revue.yml`, `local/vision-revue.ps1`, `local/revue/router.php`, `local/revue/lib.php`, `local/revue/index.php`, `local/revue/donnees-demo.php`, `local/revue/donnees/ref2.json`, `local/revue/donnees/ref3.json`, `tests/api/revue_test.php`. Fichier à modifier : `.gitignore` (une ligne).
- Fichiers à lire : `local/vision-local.ps1`, `local/docker-compose.local.yml`, `local/router.php`, `local/Dockerfile`, `local/config.example.php`, `frontend/public/api/lib/{config,connect_gate,projects,db}.php`, `frontend/public/connect/entry.php`, `tests/api/{support,run,connect_flow_test,connect_gate_test}.php`, `docs/authentication.md`.
- Tu ne touches à aucun autre fichier (ni code de l'application, ni `docs/`, ni `data/suivi-vision.json`, ni `docs/plan-lots.md`), et à **rien hors de `architecture-v1/avereo-app-vision/`** (pas de route dans le gateway partagé).
- Aucune nouvelle dépendance, aucun appel réseau externe, aucune donnée réelle.

## Terminé quand
- Les fichiers ci-dessus existent et suivent ce contrat ; le JSON de `ref2.json`/`ref3.json` est valide ; tu as relu ton diff.
- Tu signales ce que tu n'as pas pu exécuter (PHP et Docker ne sont pas disponibles dans ton bac à sable : Claude Code lancera les tests PHP et les environnements).

## Ce que tu rends
- Liste des fichiers créés ou modifiés ; commandes lancées et leur résultat ; « À VÉRIFIER » éventuels et questions.
Tu ne commites pas, tu ne pousses pas, tu ne merges pas : Claude Code vérifie puis commite.
