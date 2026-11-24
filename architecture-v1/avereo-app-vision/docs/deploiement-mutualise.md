# Mise en ligne d'AVEREO Vision en préproduction (hébergement mutualisé O2Switch / cPanel)

Procédure du 24/11/2026, établie d'après `avereo-app-rapport/docs/deployment.md`, `rollback.md`, `preproduction-connect-cutover.md` et `avereo-app-connect/docs/{catalogue-services,application-gateway}.md`. **Elle décrit des opérations sur l'hébergement et sur la base de CONNECT : aucune n'est exécutée par Claude Code. Chaque étape marquée [responsable] est faite par toi, avec ton accord à chaque fois.** Aucun workflow GitHub de déploiement n'existe pour Vision : cette première mise en ligne est **manuelle** (voir « Automatiser plus tard »).

Périmètre : **préproduction uniquement** (`vision-preprod.avereo.fr`, nom proposé : **À VÉRIFIER** avec les noms déjà créés dans cPanel). La production suit la même procédure avec les noms `vision` / `vision.avereo.fr`, après qualification de la préproduction et décision séparée.

À ce stade Vision n'enregistre côté serveur que les **projets** (nom, adresse, client). Le contenu des relevés reste dans le navigateur et disparaît au rechargement (Lot 2B). **Ne saisir aucune donnée réelle de logement** pendant la recette.

## 0. Ce qu'il faut avoir avant de commencer
| Besoin | Détail |
|---|---|
| Accès cPanel du compte O2Switch | création du sous-domaine, de la base MySQL, du gestionnaire de fichiers |
| Accès SSH ou terminal cPanel | pour `php database/migrate.php` et `bin/manage-catalog.php` de CONNECT. **À VÉRIFIER** : accès SSH activé sur le compte. Sans SSH, voir l'étape 3 (variante phpMyAdmin) ; le catalogue CONNECT, lui, exige PHP en ligne de commande |
| CONNECT préproduction à jour | la version de CONNECT servie en préproduction doit **contenir la PR #196** (commit `c59dc59` ou postérieur). Sinon les clés `APP_LAUNCH_VISION_*` sont ignorées et Vision reste invisible. **À VÉRIFIER** : version actuellement déployée en préproduction et mode de déploiement (le workflow de CONNECT documenté vise la production) |
| Un compte CONNECT de recette | approuvé, avec une habilitation sur `vision` (étape 5) ; et un **second** compte pour le test d'isolation |
| Identifiant numérique CONNECT du fondateur | pour `admin_user_ids`. **À VÉRIFIER** : où le lire (administration CONNECT / table des comptes) |
| Poste de travail | Node 20.19+ ou 22.12+, PHP 8.4 pour contrôler les fichiers (`php -l`) |

## 1. Hébergement : sous-domaine, HTTPS, PHP [responsable]
1. cPanel → Domaines : créer le sous-domaine `vision-preprod.avereo.fr`. Noter sa **racine web** (document root) : appelée `DOCROOT` plus bas. Pour Rapport, O2Switch place les sous-domaines sous `/home/COMPTE/<nom-de-domaine>` ; **À VÉRIFIER** pour celui-ci. Le nom du document root doit contenir `preprod` : c'est ce qui fait choisir à Vision sa configuration de préproduction (voir étape 2).
2. Activer le certificat HTTPS (AutoSSL) et vérifier que `https://vision-preprod.avereo.fr/` répond (page d'accueil du serveur ou 403).
3. cPanel → MultiPHP Manager : choisir **PHP 8.4** pour ce sous-domaine (version développée et testée). **À VÉRIFIER** : version disponible. Le code a besoin de PHP ≥ 8.1 (`never`, `readonly`) ; sous 8.4 il est testé, au-dessous il ne l'est pas. Extensions nécessaires : `pdo_mysql` (le reste est dans le noyau PHP ; `mbstring` n'est pas requis).
4. Ne rien mettre d'autre dans `DOCROOT` (Rapport et les autres applications ont chacune leur propre dossier).

## 2. Base MySQL et configuration privée [responsable]
### 2.1 Base et comptes (cPanel → Bases de données MySQL)
cPanel préfixe tous les noms par le nom du compte : `COMPTE_`.
1. Créer la base `COMPTE_visionpp` (suffixe court : limite de longueur des noms cPanel, **À VÉRIFIER**).
2. Créer **deux** utilisateurs, avec des mots de passe aléatoires longs (générateur de cPanel) :
   - `COMPTE_vispp` (application) : droits **SELECT, INSERT, UPDATE** uniquement ;
   - `COMPTE_vismig` (migrations) : droits sur cette base seulement, **CREATE, ALTER, INDEX, DROP, SELECT, INSERT, UPDATE, REFERENCES** (le strict nécessaire pour les migrations ; pas « Tous les privilèges »). **À VÉRIFIER** : droit `LOCK`/verrou : l'exécuteur utilise `GET_LOCK`, qui n'exige aucun droit particulier.
3. Ces mots de passe ne vont **nulle part** hors du fichier de configuration privée ci-dessous et du gestionnaire de mots de passe du responsable. Ils ne sont jamais écrits dans ce dépôt, ni dans une PR, ni dans une conversation.

### 2.2 Fichier de configuration (hors de la racine web)
Créer le dossier et le fichier (gestionnaire de fichiers cPanel ou SSH) :
```text
/home/COMPTE/.avereo/vision-preprod/config.php
/home/COMPTE/.avereo/vision-preprod/nonces/        (dossier vide, permissions 700)
```
Vision cherche son fichier à cet emplacement : `AVEREO_CONFIG_FILE` s'il est défini, sinon `~/.avereo/vision-preprod/config.php` (dossier personnel déduit de `$HOME` ou de la racine web ; le nom `vision-preprod` est choisi parce que la racine web contient « preprod »). Une préproduction **ne lit jamais** `~/.avereo/vision/config.php` (production) : c'est testé (`config : une préproduction ne lit jamais la configuration de production`).

Contenu du fichier (à compléter ; permissions **600**) :
```php
<?php
return [
    'environment' => 'preproduction',
    'auth_mode' => 'connect',
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'COMPTE_visionpp',
        'user' => 'COMPTE_vispp',
        'password' => 'MOT_DE_PASSE_APPLICATION',
    ],
    // Identifiant numérique CONNECT du fondateur, en chaîne. Vide = personne n'est fondateur.
    'admin_user_ids' => ['ID_CONNECT_FONDATEUR'],
    // Même valeur que APP_LAUNCH_VISION_SECRET dans la configuration privée de CONNECT préproduction.
    'connect_launch_secret' => 'SECRET_DE_LANCEMENT_32_CARACTERES_AU_MOINS',
    'connect_launch_nonce_directory' => '/home/COMPTE/.avereo/vision-preprod/nonces',
    'connect_gate_cookie' => 'AVEREO_VISION_GATE',
    'connect_gate_session_seconds' => 1800,
];
```
Règles :
- **Pas de clé `api_token`** : le mode `token` est refusé hors `local`.
- **Secret de lancement** : aléatoire, 32 caractères au moins, **différent de ceux des autres applications et différent de celui de la production**. À générer sur ton poste, par exemple :
  ```powershell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
  ```
  Alternative sûre : le générateur de mots de passe de cPanel.
- Le mot de passe MySQL des migrations n'est **pas** dans ce fichier (voir l'étape 3).

## 3. Base de données : migrations [responsable]
Variante A (SSH disponible, recommandée). `migrate.php` lit la **même configuration que l'application** ; or le compte de l'application n'a pas le droit de créer des tables. On lui donne donc, le temps de la migration, un fichier de configuration temporaire qui porte le **compte de migrations** :
1. Créer `/home/COMPTE/.avereo/vision-preprod/outils/` (hors racine web) avec **exactement** cette arborescence, le script chargeant `../frontend/public/api/lib/config.php` :
   ```text
   outils/database/migrate.php
   outils/database/migrations/001_create_vision_projects.sql
   outils/frontend/public/api/lib/config.php
   ```
2. Copier `config.php` en `config-migration.php` dans le même dossier privé (permissions 600), y remplacer `user` et `password` par ceux du compte de migrations.
3. Exécuter :
```bash
export AVEREO_CONFIG_FILE=/home/COMPTE/.avereo/vision-preprod/config-migration.php
cd /home/COMPTE/.avereo/vision-preprod/outils
php database/migrate.php --dry-run     # montre ce qui serait appliqué
php database/migrate.php               # applique les migrations en attente
php database/migrate.php --status
unset AVEREO_CONFIG_FILE
```
4. **Supprimer `config-migration.php`** et le dossier d'outils une fois les migrations appliquées. Exporter la base (phpMyAdmin → Exporter) **avant** toute migration suivante.

Variante B (sans SSH) : dans phpMyAdmin, onglet SQL sur `COMPTE_visionpp`, coller le contenu de `database/migrations/001_create_vision_projects.sql` (idempotent : `CREATE TABLE IF NOT EXISTS`). Limite : la table `schema_migrations` n'est pas renseignée ; le premier passage de l'exécuteur appliquera donc la migration 001 une deuxième fois, sans effet (idempotent), puis l'enregistrera.

Contrôle : la table `vision_projects` existe, vide.

## 4. Construire et déposer l'application [responsable, avec une préparation par Claude possible]
### 4.1 Construire (poste de travail, depuis un clone à jour de `main`)
```powershell
cd architecture-v1\avereo-app-vision\frontend
npm ci
npm test
npm run build
```
Contrôler le résultat (`dist/`), qui doit contenir **exactement** :
- `index.html`, `assets/` (JS, CSS, polices), `branding/` ;
- `.htaccess` (racine), `api/.htaccess`, `api/lib/.htaccess` (fichiers cachés : les afficher) ;
- `api/{auth,bootstrap,health,logout,projects}.php`, `api/lib/{auth,config,connect_gate,db,droits,http,projects}.php` ;
- `connect/entry.php`.

Contrôles à lancer sur `dist/` :
```powershell
Get-ChildItem dist -Recurse -Force -File | ForEach-Object { $_.FullName.Substring((Resolve-Path dist).Path.Length) }
Get-ChildItem dist -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
Select-String -Path dist\assets\*.js -Pattern 'VITE_LOCAL_API_TOKEN|Bearer ' -SimpleMatch
```
Attendu : aucun fichier `.env`, `config.php`, `local/` ni `tests/` ; `php -l` sans erreur ; la dernière commande ne trouve **aucun** jeton local. Noter l'empreinte de l'archive pour la trace :
```powershell
Compress-Archive -Path (Get-ChildItem dist -Force).FullName -DestinationPath vision-dist.zip -Force
Get-FileHash vision-dist.zip -Algorithm SHA256
```
(`(Get-ChildItem dist -Force)` inclut les fichiers cachés ; un `Compress-Archive dist\*` les oublierait.)

### 4.2 Sauvegarder l'existant
Avant tout dépôt, même sur un dossier vide : cPanel → Gestionnaire de fichiers → compresser `DOCROOT` en archive datée, la télécharger ; copier aussi `config.php`. **Ne jamais écraser ni supprimer `/home/COMPTE/.avereo/vision-preprod/`** lors d'un redéploiement.

### 4.3 Déposer
1. Gestionnaire de fichiers cPanel (option « Afficher les fichiers cachés » cochée) ou FTPS (FileZilla/WinSCP, port 21, chiffrement explicite) : envoyer le **contenu** de `dist/` dans `DOCROOT` (pas le dossier `dist` lui-même).
2. Ordre : `api/`, `connect/`, `assets/`, `branding/`, `.htaccess`, puis **`index.html` en dernier**.
3. Vérifier que les trois `.htaccess` sont présents et que `api/lib/.htaccess` contient `Require all denied`.

## 5. CONNECT : catalogue, secret, habilitation [responsable ; **accord explicite** pour chaque opération sur la base hébergée de CONNECT]
Ces opérations touchent des comptes et des droits réels. À faire sur **CONNECT préproduction** uniquement.
1. **Configuration privée CONNECT** : dans `/home/COMPTE/private/connect-preprod/config.php` (chemin documenté ; **À VÉRIFIER** sur ton compte), ajouter dans le tableau renvoyé les deux clés (même secret que `connect_launch_secret` de Vision) :
   ```php
   'APP_LAUNCH_VISION_URL' => 'https://vision-preprod.avereo.fr/connect/entry.php',
   'APP_LAUNCH_VISION_SECRET' => 'LE_MEME_SECRET_QUE_DANS_VISION',
   ```
   Tant qu'elles sont absentes, la carte reste indisponible.
2. **Catalogue** : prévisualiser, puis confirmer (la commande écrit l'application, l'habilitation de l'organisation et une trace d'audit dans une seule transaction) :
   ```bash
   AVEREO_PRIVATE_CONFIG=/home/COMPTE/private/connect-preprod/config.php \
   php bin/manage-catalog.php \
     --code=vision \
     --name="AVEREO Vision" \
     --description="Relever un logement, produire le plan et les métrés." \
     --launch-url=https://vision-preprod.avereo.fr/connect/entry.php \
     --scope=vision:use \
     --display-order=70 \
     --status=active \
     --organization-slug=avereo \
     --actor-subject=SUBJECT_DRUPAL_ADMIN
   ```
   Relancer avec `--confirm` seulement après lecture de la prévisualisation. Les valeurs `--scope`, `--display-order` et `--description` sont des **propositions** : à ajuster. **À VÉRIFIER** : le `--actor-subject` (identité Drupal de l'administrateur) et le slug de l'organisation (`avereo` dans la documentation de CONNECT).
3. **Habilitation des comptes de recette** : seuls les comptes qui doivent voir Vision. La procédure d'attribution par compte est dans `avereo-app-connect/docs/administration-comptes.md` (**À VÉRIFIER** : méthode exacte pour deux comptes de test).

## 6. Contrôles de passage
Lancer depuis le poste (remplacer l'hôte si besoin). Aucun ne demande d'identifiant.
```powershell
curl.exe -s -o NUL -w "%{http_code} %{redirect_url}\n" http://vision-preprod.avereo.fr/
curl.exe -s https://vision-preprod.avereo.fr/api/health.php
curl.exe -s -o NUL -w "%{http_code}\n" https://vision-preprod.avereo.fr/api/projects.php
curl.exe -s -o NUL -w "%{http_code}\n" https://vision-preprod.avereo.fr/api/bootstrap.php
curl.exe -s -o NUL -w "%{http_code}\n" https://vision-preprod.avereo.fr/api/lib/config.php
curl.exe -s -o NUL -w "%{http_code}\n" https://vision-preprod.avereo.fr/connect/entry.php
curl.exe -s -o NUL -w "%{http_code}\n" "https://vision-preprod.avereo.fr/connect/entry.php?ticket=x.y"
curl.exe -sI https://vision-preprod.avereo.fr/ | findstr /i "nosniff referrer x-frame"
```
| Contrôle | Attendu | Si autre |
|---|---|---|
| HTTP sur le site | `301` vers `https://` | `.htaccess` absent ou ignoré (`AllowOverride`) |
| `/api/health.php` | `200` et `{"ok":true,"app":"vision","database":"up"}` | `503` « misconfigured » : configuration absente (étape 2) ou invalide ; `database:"down"` : accès MySQL |
| `/api/projects.php` sans cookie | `401` | tout autre code : **arrêter** |
| `/api/bootstrap.php` et `/api/lib/config.php` | `403` | `200` ou `404` avec contenu : **retirer le site**, le `.htaccess` n'est pas pris en compte |
| `/connect/entry.php` sans ticket ou avec faux ticket | `403` (sans détail) | `503` : configuration ; `404` : `auth_mode` n'est pas `connect` |
| en-têtes de sécurité | `nosniff`, `strict-origin-when-cross-origin`, `DENY` | `mod_headers` absent (non bloquant, à noter) |

### Parcours avec CONNECT (comptes de recette)
1. Fenêtre privée → `https://connect-preprod.avereo.fr/` → connexion avec le **compte A** → carte « AVEREO Vision » visible → clic. Attendu : l'écran Projets s'affiche, l'identité apparaît dans l'en-tête (« Se déconnecter » disponible).
2. Outils du navigateur → cookies : `__Host-AVEREO_VISION_GATE` avec **HttpOnly, Secure, SameSite=Lax, Path=/** et sans domaine. Fichier `.used` créé dans `…/vision-preprod/nonces/` (un par ticket).
3. `https://vision-preprod.avereo.fr/api/auth.php` : `provider` = `avereo_connect`, `id` = identifiant CONNECT de A, rôle `fondateur` seulement si cet identifiant est dans `admin_user_ids`.
4. Créer un projet fictif, le renommer, l'archiver, le retrouver dans la liste des archives.
5. **Rejeu** : copier l'adresse `…/connect/entry.php?ticket=…` de l'historique (ou des outils réseau) et la rouvrir : attendu `403` (nonce déjà utilisé).
6. **Isolation** : avec le **compte B** (conseiller, autre fenêtre privée), A n'est pas visible ; B ne voit pas le projet de A, et l'adresse API du projet de A répond `404`. Le fondateur voit tout.
7. **Déconnexion** : « Se déconnecter » efface le cookie ; recharger → écran « non connecté » ; la session CONNECT n'est **pas** fermée (limite connue).
8. **Connexion forcée par ticket** (limite documentée dans `docs/authentication.md`) : noter si CONNECT lie l'état à un navigateur ; sinon, la limite reste ouverte. Résultat à consigner, pas à corriger ici.
9. Sans habilitation sur `vision` (compte C) : pas de carte, et l'adresse `…/api/v1/apps/vision/launch` de CONNECT répond `403`.

## 7. Trace de la recette (à compléter, sans secret)
| Date | Version déployée (commit, empreinte `vision-dist.zip`) | Cible (hôte, `DOCROOT`) | Contrôles 6 : résultats | Écarts | Auteur |
|---|---|---|---|---|---|
| | | | | | |

À consigner dans `data/suivi-vision.json` (preuve « recette préproduction »), **jamais** l'accord humain dans le champ `approvals`.

## 8. Retour arrière
1. **Application** : restaurer l'archive de `DOCROOT` de l'étape 4.2 (ou vider `DOCROOT` en gardant le dossier). L'application redevient inaccessible ou revient à l'état précédent.
2. **Carte CONNECT** : `manage-catalog.php … --code=vision --status=suspended` (sans `--organization-slug`) : la carte disparaît et les lancements sont bloqués, sans supprimer l'historique. Retirer ensuite `APP_LAUNCH_VISION_URL` et `…_SECRET` de la configuration privée de CONNECT.
3. **Base** : ne jamais supprimer la base ni ses comptes pour un retour arrière applicatif. En cas de besoin, restaurer la sauvegarde exportée avant migration (cPanel → phpMyAdmin → Exporter, à faire avant l'étape 3).
4. **Configuration privée** : conserver une copie protégée de `config.php` ; un retour arrière du code ne la publie ni ne la remplace.
5. **Secret compromis ou douteux** : générer un nouveau secret, le poser **dans les deux configurations** (CONNECT et Vision) ; les cookies déjà émis restent valides jusqu'à leur expiration (30 minutes) tant que l'ancienne clé dérivée n'a pas changé : le changement de secret les invalide.

## 9. Limites et points « À VÉRIFIER » de cette procédure
- Le nom du sous-domaine, la racine web, la version de PHP, les extensions, la présence de SSH, le chemin de la configuration privée de CONNECT et le mode de déploiement de CONNECT préproduction n'ont pas été vérifiés sur le serveur.
- **`.htaccess` et `AllowOverride`** : `api/lib/.htaccess` et `api/.htaccess` protègent le code (`Require all denied`). Si O2Switch ignorait ces fichiers, les bibliothèques seraient servies : les contrôles 6 le détectent.
- **Ressources du serveur** : pour les projets seuls, la charge est négligeable. Les reconstructions 3D (Lot 7) ne tournent **pas** ici : elles relèvent du serveur OVH, qui n'est pas encore choisi (`docs/serveur-ovh.md`).
- **Données** : seules des données fictives pendant la recette ; la base de préproduction n'est pas sauvegardée automatiquement par cette procédure.
- **Comptes MySQL séparés** : prévus ici (application et migrations) ; cela lève l'une des réserves du Lot 2A, à confirmer par la recette.
- **Compression, cache et en-têtes** : non réglés ; le fichier `.htaccess` ne fixe que l'HTTPS et trois en-têtes simples. Pas de `Strict-Transport-Security` : à décider avec la production.
- **Pas de PWA** : l'installation sur l'écran d'accueil et le mode hors ligne viennent au Lot 2B ; la recette ne les vérifie pas.

## Automatiser plus tard
Un workflow `deploy-vision-o2switch.yml` calqué sur `deploy-rapport-o2switch.yml` (déclenchement manuel depuis `main`, build, validation de l'archive, sauvegarde FTPS de l'existant, déploiement FTPS, vérifications) modifie `.github/` et utilise des secrets GitHub : **PR séparée, avec ton accord**. Les contrôles de l'étape 6 (adaptés) en seraient la dernière étape.
