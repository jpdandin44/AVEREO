# Brief Codex T-08 — déploiement automatisé de Vision en préproduction et en production

Branche : `vision/deploiement-auto` (empilée sur `vision/preprod-php83`, PR 204) — Rédigé par Claude Code le 26/11/2026

## Contexte
Lis `architecture-v1/avereo-app-vision/AGENTS.md`, puis `architecture-v1/avereo-app-vision/docs/deploiement-mutualise.md` (procédure manuelle actuelle, étapes 0 à 9 et « Automatiser plus tard »), `docs/o2switch-deployment.md` (conventions du dépôt), et les fichiers existants que tu vas **réutiliser sans les modifier** :
- `.github/workflows/deploy-rapport-o2switch.yml` et `deploy-connect-o2switch.yml` (FTPS, sauvegarde, artefact de retour arrière) ; `deploy-projet-o2switch.yml` (SSH avec liste blanche dynamique) ;
- `.github/scripts/cpanel-domain-docroot.py`, `ftps-backup-dir.py`, `ftps-deploy-dir.py` (attention : il **supprime** les fichiers distants absents du dossier local), `cpanel-ssh-whitelist.sh`, `verify-public-spa.sh` ;
- Vision : `database/migrate.php`, `database/migrations/*.sql`, `frontend/public/api/lib/config.php` (choix du fichier de configuration), `frontend/public/.htaccess`, `frontend/public/api/.htaccess`, `frontend/public/api/lib/.htaccess`, `frontend/public/api/health.php`, `frontend/pwa.config.js`, `local/vision-local.ps1`, `tests/api/run.php`.

Le responsable veut que Claude Code puisse **mettre Vision en préproduction et en production en autonomie**, sans manipuler de mot de passe : Claude Code lancera `gh workflow run`. Les secrets restent dans GitHub ; le responsable les saisit une fois.

État de l'hébergement (O2Switch, cPanel, compte `daje3540`) :
- Préproduction : `vision-preprod.avereo.fr`, racine `/home/daje3540/vision-preprod.avereo.fr` (vide), base `daje3540_visionpp`, comptes MySQL `daje3540_vispp` (application) et `daje3540_vismig` (migrations), configuration privée `/home/daje3540/.avereo/vision-preprod/config.php` (+ `nonces/`). **PHP 8.3** (pas de 8.4 possible). Certificat HTTPS AutoSSL pas encore émis.
- Production : `vision.avereo.fr` **n'existe pas encore** (ni domaine, ni base, ni configuration) ; elle sera créée plus tard avec les noms de la procédure (`daje3540_vision`, `.avereo/vision/config.php`).
- Secrets déjà présents **au niveau du dépôt** : `CPANEL_USERNAME`, `CPANEL_SERVER`, `CPANEL_PASSWORD`, `O2SWITCH_SSH_KEY`, `O2SWITCH_USER`, `O2SWITCH_HOST`, `O2SWITCH_PORT`. PHP en ligne de commande du serveur : 8.3.37 avec `pdo_mysql` ; Python du serveur ancien (3.6) : n'en dépends pas.

## Ce que tu fais
### 1. `.github/workflows/deploy-vision-o2switch.yml` (nouveau fichier ; ne modifie aucun autre workflow ni script partagé)
Déclenchement `workflow_dispatch` avec les entrées :
- `cible` : `preproduction` | `production` (choix, obligatoire) ;
- `confirmation` : chaîne ; pour la production, doit valoir exactement `DEPLOYER VISION EN PRODUCTION` ;
- `migrations` : booléen, vrai par défaut.

Règles de cible :
| | Préproduction | Production |
|---|---|---|
| Environnement GitHub | `vision-preprod` | `vision` |
| Domaine | `vision-preprod.avereo.fr` | `vision.avereo.fr` |
| Dossier privé | `.avereo/vision-preprod` | `.avereo/vision` |
| Référence autorisée | toute branche (candidat de PR à valider) | `refs/heads/main` uniquement |
| Condition supplémentaire | — | le **même commit** a déjà été déployé avec succès en préproduction (vérifie-le par l'API GitHub : un run réussi de ce workflow avec `cible=preproduction` sur ce SHA, ou les déploiements de l'environnement `vision-preprod`) ; sinon échec avec un message clair |

`concurrency` par cible, sans annulation d'un déploiement en cours. `permissions` minimales (`contents: read`, plus `actions: read` / `deployments: read` si nécessaire pour le contrôle de production). `run-name` lisible (cible, ref, acteur).

Étapes, dans l'ordre, chacune arrêtant tout en cas d'échec :
1. **Contrôles d'entrée** (cible, confirmation, ref).
2. **Tests** : `npm ci` + `npm test` dans `frontend` (Node 20.19+) ; tests PHP de l'API **en PHP 8.3** avec un service MySQL 8.4 (conteneur de service GitHub) et une configuration locale générée au vol (mode `local`, jeton aléatoire), `php tests/api/run.php --strict` ; `php -l` sur tous les fichiers PHP livrés. Inspire-toi de `local/docker-compose.local.yml` et `local/vision-local.ps1` pour la configuration ; si le serveur HTTP intégré est nécessaire aux tests, lance-le comme dans le conteneur local.
3. **Build** : `npm run build`, puis **validation du paquet** `frontend/dist` : présence de `index.html`, `sw.js`, `manifest.webmanifest`, `.htaccess`, `api/.htaccess`, `api/lib/.htaccess`, `api/health.php`, `connect/entry.php` ; **absence** de tout `config.php` hors `api/lib/config.php`, de `.env*`, de `local/`, de `revue/`, et de toute chaîne `VITE_LOCAL_API_TOKEN` ou jeton local dans les fichiers ; empreinte SHA-256 du paquet affichée.
4. **Résolution de la racine** avec `cpanel-domain-docroot.py <domaine>` ; échec si vide ou si elle ne contient pas le nom du domaine (garde-fou contre une racine partagée avec `public_html`).
5. **Configuration privée présente** : par SSH (liste blanche dynamique comme `deploy-projet-o2switch.yml`, retrait en `always()`), vérifier que `~/<dossier privé>/config.php` existe, est en 600, que `nonces/` existe, et que `php` charge le fichier et déclare l'environnement attendu (`preproduction` ou `production`) **sans afficher aucune valeur** ; échec sinon (message : configuration privée absente, voir étape 2 de la procédure).
6. **Migrations** (si `migrations=true`) : par SSH, déposer `database/migrate.php`, `database/migrations/` et `frontend/public/api/lib/config.php` dans un dossier temporaire privé `~/<dossier privé>/outils-<run_id>/` en respectant l'arborescence attendue par `migrate.php` ; créer un fichier de configuration temporaire (600) = configuration privée de l'application dont `db.user` et `db.password` sont remplacés par le compte de migrations, lus dans les secrets d'environnement `VISION_DB_MIGRATION_USER` et `VISION_DB_MIGRATION_PASSWORD` transmis **par l'entrée standard** de SSH (jamais en argument de ligne de commande ni dans les journaux) ; `AVEREO_CONFIG_FILE=<temporaire> php database/migrate.php --dry-run`, puis sans option, puis `--status` ; **suppression du fichier temporaire et du dossier d'outils dans tous les cas** (trap). Secret absent → échec clair.
7. **Sauvegarde** de la racine actuelle avec `ftps-backup-dir.py` (`FTP_ALLOW_MISSING=true`, première livraison) et **artefact de retour arrière** (30 jours), comme Rapport.
8. **Publication FTPS** de `frontend/dist` avec `ftps-deploy-dir.py` (`FTP_REQUIRED_FILE=index.html`), mêmes secrets que Rapport.
9. **Vérifications publiques** (sans `--insecure` : un certificat invalide fait échouer, car la PWA exige HTTPS) :
   - `https://<domaine>/` : 200, contient `<div id="root">` et un asset Vite ;
   - `https://<domaine>/sw.js` et `/manifest.webmanifest` : 200, `Cache-Control` contenant `no-cache` ; manifeste au type `application/manifest+json` ;
   - `https://<domaine>/api/health.php` : réponse JSON attendue (lis `health.php`) ;
   - `https://<domaine>/api/projects.php` sans session : 401 ;
   - `https://<domaine>/api/lib/config.php` et `/api/lib/db.php` : 403 (bibliothèques jamais servies) ;
   - en-têtes `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY` sur la page ;
   - `http://<domaine>/` redirige vers `https://`.
10. **Résumé** dans `$GITHUB_STEP_SUMMARY` : cible, SHA, empreinte du paquet, migrations appliquées, nom de l'artefact de retour arrière.

### 2. Vérification sans secret à chaque PR
Ajoute au même fichier un déclenchement `pull_request` limité aux chemins `architecture-v1/avereo-app-vision/**` et au workflow lui-même, qui n'exécute **que** les étapes 2 et 3 (tests + build + validation du paquet), sans environnement ni secret. Le job de déploiement ne s'exécute jamais sur `pull_request`.

### 3. Scripts locaux testables
Mets la logique non triviale dans des scripts versionnés sous `architecture-v1/avereo-app-vision/deploiement/` (par exemple validation du paquet, génération de la configuration de migration côté serveur, vérifications publiques), appelés par le workflow, pour pouvoir les tester localement. Pas de dépendance nouvelle (bash, PHP, Node intégrés). Tests : `node --test` ou tests PHP existants (`tests/api/`) selon le langage ; au minimum la validation du paquet (paquet correct accepté ; paquet contenant `local/`, un `.env` ou un jeton refusé) et la génération de la configuration de migration (le mot de passe lu sur l'entrée standard remplace bien `db.user`/`db.password`, le reste est conservé, fichier en 600, rien n'est affiché).

### 4. Documentation
- `docs/deploiement-mutualise.md` : nouvelle section « Déploiement automatisé » en tête des étapes 3, 4 et 6 : commandes `gh workflow run deploy-vision-o2switch.yml --ref <branche> -f cible=preproduction` et `--ref main -f cible=production -f confirmation="DEPLOYER VISION EN PRODUCTION"`, suivi avec `gh run watch`, retour arrière (artefact, re-déploiement d'un commit antérieur), et la liste de ce que le responsable règle **une fois** : environnements GitHub `vision-preprod` et `vision`, secrets `VISION_DB_MIGRATION_USER` et `VISION_DB_MIGRATION_PASSWORD` par environnement (`gh secret set VISION_DB_MIGRATION_PASSWORD --env vision-preprod`, valeur saisie par lui), et la création initiale de la production (domaine, base, comptes, configuration) qui reste manuelle. Garde la procédure manuelle comme secours.
- `AGENTS.md` de Vision, section « Stack et hébergement » : une ligne avec les deux commandes de déploiement.
- `docs/licences.md` : si tu utilises une action GitHub tierce non déjà utilisée dans le dépôt, inscris-la (licence MIT/Apache/BSD seulement ; sinon arrête-toi et signale-le). Réutilise de préférence `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`, `webfactory/ssh-agent@v0.9.0`, `shivammathur/setup-php@v2`, déjà présents.

## Ce que tu ne fais pas
- Ne lance **aucun** déploiement, ne crée ni ne modifie de secret, d'environnement ou de réglage GitHub, ne te connecte pas au serveur.
- Ne modifie aucun autre workflow, aucun script de `.github/scripts/`, aucun autre sous-projet que `architecture-v1/avereo-app-vision/` (hors le nouveau workflow).
- N'écris aucun secret, mot de passe ou nom de secret inventé autre que ceux listés ici.
- Pas de `--insecure`, pas de `StrictHostKeyChecking=no` si tu peux l'éviter (utilise `O2SWITCH_HOST`/`O2SWITCH_PORT` et `ssh-keyscan` sur l'hôte, en le signalant comme limite) ; sinon garde le choix des workflows existants et signale-le dans ton rapport.

## Terminé quand
- `npm test` (frontend) et `tests/api/run.php` passent, nouveaux tests compris ; le workflow est un YAML valide (`python3 -c "import yaml; yaml.safe_load(open(...))"` ou `actionlint` s'il est disponible) ; `bash -n` sur les scripts shell ; `php -l` sur les scripts PHP.
- Un commit sur `vision/deploiement-auto`, message en français se terminant par `Co-Authored-By: Codex <noreply@openai.com>`, sans pousser.
- Rapport final : fichiers créés, choix faits, limites et points « À VÉRIFIER » (par exemple délais SSH depuis les runners, déclenchement d'un `workflow_dispatch` possible seulement une fois le fichier sur `main`).
