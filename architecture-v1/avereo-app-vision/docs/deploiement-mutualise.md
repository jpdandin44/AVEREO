---
project: avereo-app-vision
document_type: procedure
title: Déploiement mutualisé de Vision
status: active
version: git
created: 2026-11-26
updated: 2026-11-26
owner: jpdandin
tags: [vision, deploiement]
---

# Mise en ligne d'AVEREO Vision en préproduction (hébergement mutualisé O2Switch / cPanel)

Procédure du 24/11/2026, établie d'après `avereo-app-rapport/docs/deployment.md`, `rollback.md`, `preproduction-connect-cutover.md` et `avereo-app-connect/docs/{catalogue-services,application-gateway}.md`. **Elle décrit des opérations sur l'hébergement et sur la base de CONNECT. Chaque étape marquée [responsable] est faite par toi, ou par Claude Code dans ta session cPanel avec ton accord explicite pour cette étape ; jamais de mot de passe saisi par Claude Code.** Le workflow `deploy-vision-o2switch.yml` est préparé par T-08 ; sa qualification GitHub et hébergée reste à réaliser. La procédure manuelle est conservée comme secours.

Périmètre : **préproduction uniquement** (`vision-preprod.avereo.fr`, nom confirmé par le responsable le 24/11/2026). La production suit la même procédure avec les noms `vision` / `vision.avereo.fr`, après qualification de la préproduction et décision séparée.

Depuis les Lots 2B et 2C, Vision enregistre côté serveur les **projets** (nom, adresse, client) et le **contenu des relevés** (bâtiments, niveaux, pièces, ouvertures : synchronisation) ; l'application s'installe et se rouvre sans réseau. **Ne saisir aucune donnée réelle de logement** pendant la recette.

## 0. Ce qu'il faut avoir avant de commencer
| Besoin | Détail |
|---|---|
| Accès cPanel du compte O2Switch | création du sous-domaine, de la base MySQL, du gestionnaire de fichiers |
| Accès SSH ou terminal cPanel | pour `php database/migrate.php` et `bin/manage-catalog.php` de CONNECT. Constaté le 25/11/2026 : cPanel propose « Terminal », « Accès SSH » et « Autorisation SSH » (O2Switch autorise les connexions SSH par adresse IP ; **À VÉRIFIER** à la première connexion). Sans SSH, voir l'étape 3 (variante phpMyAdmin) ; le catalogue CONNECT, lui, exige PHP en ligne de commande |
| CONNECT préproduction à jour | **Non fait à ce jour.** La PR #196 est mergée dans `main` mais n'a été installée sur aucun serveur : aucune livraison n'a été exécutée. Sans elle, les clés `APP_LAUNCH_VISION_*` sont ignorées et Vision reste invisible. Livraison à faire à l'étape 5.0, avec un accord propre |
| Deux comptes CONNECT de recette | approuvés, avec accès à `vision` (étape 5.3), pour le test d'isolation entre utilisateurs ; idéalement un troisième sans accès |
| Identifiant numérique CONNECT du fondateur | pour `admin_user_ids`. **À VÉRIFIER** : où le lire (administration CONNECT / table des comptes) |
| Poste de travail | Node 20.19+ ou 22.12+ ; pour contrôler les fichiers (`php -l`) et lancer les tests dans la version de l'hébergement : `vision-local.ps1 up -Php 8.3` puis `vision-local.ps1 test -Php 8.3` |

## 1. Hébergement : sous-domaine, HTTPS, PHP [responsable]
**Fait le 25/11/2026** (dans la session cPanel du responsable, avec son accord) : points 1, 2 (en attente du certificat) et 3 ; constats ci-dessous.
1. cPanel → Domaines : créer le sous-domaine `vision-preprod.avereo.fr`, **sans** partager la racine de `public_html`. Racine web obtenue : `/home/daje3540/vision-preprod.avereo.fr` (appelée `DOCROOT` plus bas). Elle contient `preprod` : c'est ce qui fait choisir à Vision sa configuration de préproduction (voir étape 2). Le DNS répond déjà (même adresse que `rapport-preprod.avereo.fr`).
2. HTTPS : le domaine reçoit d'abord un certificat **auto-signé** que l'AutoSSL d'O2Switch ne remplace pas (« not issued via AutoSSL »). Passer par cPanel → **Let's Encrypt™ SSL** → « Générer un nouveau certificat » → filtrer sur le domaine → **Générer** (hôtes `vision-preprod.avereo.fr` et `www.vision-preprod.avereo.fr`, validation http-01, RSA 2048 : réglages par défaut), comme les autres préproductions. **Fait le 26/11/2026** : certificat installé, `https://vision-preprod.avereo.fr/` répond 200 sans alerte environ 75 s après (redémarrage d'Apache) ; renouvellement automatique par O2Switch. **Ne pas poursuivre l'étape 4 sans certificat valide.**
3. PHP : **pas de MultiPHP Manager** chez O2Switch. L'outil « Sélectionner une version de PHP » (CloudLinux) a un onglet par domaine, mais l'isolation des sites y est **désactivée par l'hébergeur** : `vision-preprod.avereo.fr` utilise la version du compte, **PHP 8.3** (8.3 constaté pour les 27 domaines). Ne **pas** changer la version du compte : elle s'applique à tous les sites, production comprise. Vision demande PHP ≥ 8.1 (`never`, `readonly`) et est **qualifié en 8.3** : 140 tests de l'API en mode strict et contrôle de syntaxe des 37 fichiers PHP réussis sous PHP 8.3.33 (`vision-local.ps1 -Php 8.3`), en plus de 8.4. Extension nécessaire : `pdo_mysql` (le reste est dans le noyau PHP ; `mbstring` n'est pas requis) ; **À VÉRIFIER** dans les extensions du compte (Rapport et Passeport, sur le même compte, utilisent déjà PDO MySQL).
4. Ne rien mettre d'autre dans `DOCROOT` (Rapport et les autres applications ont chacune leur propre dossier).

## 2. Base MySQL et configuration privée [responsable]
**Fait le 25/11/2026** (accord du responsable ; mots de passe générés et saisis par lui seul) : base `daje3540_visionpp` ; comptes `daje3540_vispp` (SELECT, INSERT, UPDATE) et `daje3540_vismig` (CREATE, ALTER, INDEX, DROP, SELECT, INSERT, UPDATE, REFERENCES), sur cette base seulement ; dossier `/home/daje3540/.avereo/vision-preprod/` (700) avec `nonces/` (700) et `config.php` (600, syntaxe contrôlée sous PHP 8.3.37). Le fichier est écrit **sans aucun secret** : le mot de passe de `vispp` et le secret de lancement y sont des emplacements `A_REMPLACER`, à remplacer par le responsable (gestionnaire de fichiers cPanel, fichiers cachés affichés, ou `nano` dans le Terminal). Tant qu'ils restent, Vision refuse de démarrer (secret de moins de 32 caractères, connexion MySQL refusée). `admin_user_ids` est vide en attendant l'identifiant CONNECT du fondateur (**À VÉRIFIER**). Constaté aussi : PHP en ligne de commande 8.3.37 avec `pdo_mysql`.

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
### Déploiement automatisé

Le workflow couvre les étapes 3, 4 et 6 : tests PHP 8.3/MySQL 8.4 et Node 20.19, build, validation du paquet, migrations privées SSH, sauvegarde, publication FTPS et contrôles publics HTTPS. L'étape 5 CONNECT reste séparée.

Préparation unique par le responsable :

- Créer les environnements GitHub `vision-preprod` et `vision`, vérifier leurs protections et branches autorisées. Leur existence n'a pas été contrôlée par T-08.
- Saisir `VISION_DB_MIGRATION_USER` et `VISION_DB_MIGRATION_PASSWORD` dans chaque environnement (compte propre à la base cible). Commandes : `gh secret set VISION_DB_MIGRATION_USER --env vision-preprod` et `gh secret set VISION_DB_MIGRATION_PASSWORD --env vision-preprod`, avec saisie protégée ; refaire avec `--env vision`. Les secrets communs restent ceux du brief T-08, sans valeur dans le dépôt.
- **Jeton d'API cPanel** (constat du 26/11/2026 : l'authentification à deux facteurs est active sur le compte cPanel, et l'API refuse alors le mot de passe ; premier déploiement arrêté en 401 avant toute action). Le workflow utilise `CPANEL_API_TOKEN` pour les appels à cPanel (racine du domaine, liste blanche SSH) ; le mot de passe `CPANEL_PASSWORD` ne sert plus qu'à la publication FTPS. Créer le jeton : cPanel → Sécurité → **Gérer les jetons d'API** → Créer, nom `github-vision`, sans expiration ou avec une date notée ; copier la valeur (affichée une seule fois) et l'enregistrer **dans les environnements** `vision-preprod` puis `vision` : `gh secret set CPANEL_API_TOKEN --env vision-preprod --repo jpdandin44/AVEREO`. Il donne un accès complet au compte cPanel : révocable à tout moment depuis la même page. Le module `SshWhitelist` répond au jeton (constaté le 26/11/2026). L'autorisation SSH temporaire du runner passe par `deploiement/autoriser-ssh.sh` : **port 22, connexion entrante** (le script commun du dépôt créait une autorisation sortante sur le port 8888 du secret partagé `O2SWITCH_PORT`, injoignable) ; elle est retirée en fin de job, même en cas d'échec. La liste blanche d'O2Switch est limitée à **5 autorisations** : en garder une libre (le 26/11/2026, une ancienne autorisation de runner GitHub du 29/07 a été supprimée avec l'accord du responsable).
- Compléter la configuration privée de l'étape 2 : environnement exact, permissions 600, `nonces/`, paramètres application et CONNECT. Obtenir un certificat HTTPS valide.
- Créer manuellement la production : domaine `vision.avereo.fr`, racine dédiée, base `daje3540_vision`, comptes application et migrations, `.avereo/vision/config.php` et `nonces/`. Le workflow ne crée pas ces ressources.

Commandes futures, depuis la racine du dépôt, après autorisation pour la cible et le candidat :

```bash
gh workflow run deploy-vision-o2switch.yml --ref <branche> -f cible=preproduction
gh run list --workflow deploy-vision-o2switch.yml
gh run watch <identifiant-run> --exit-status
# Après qualification de ce même SHA en préproduction :
gh workflow run deploy-vision-o2switch.yml --ref main -f cible=production -f confirmation="DEPLOYER VISION EN PRODUCTION"
```

`migrations` est vrai par défaut ; `-f migrations=false` les omet explicitement. La production exige `refs/heads/main`, la confirmation exacte et un déploiement réussi de l'environnement `vision-preprod` sur ce même SHA, vérifié par l'API GitHub. Un merge qui change le SHA impose de qualifier le commit résultant en préproduction. Le workflow doit exister sur la branche par défaut pour permettre `workflow_dispatch`. Aucun dispatch n'a été exécuté par T-08.

Les PR exécutent seulement tests et build, sans environnement ni secret. Le runner Ubuntu utilise une base jetable MySQL 8.4, une configuration locale temporaire et un jeton aléatoire. Le mot de passe MySQL fixe de CI n'est utilisé que dans ce service jetable. Le serveur PHP est lancé via sudo en boucle locale au port 80 attendu par les tests. Les scripts sont sous `deploiement/`. Le jeton est recherché dans tous les fichiers du paquet. L'empreinte déterministe SHA-256 représente les noms triés, tailles et octets des fichiers, pas une archive ZIP.

Retour arrière : télécharger l'artefact `vision-<cible>-before-<run_id>-<run_attempt>` (30 jours), examiner puis restaurer son contenu dans la racine dédiée avec l'accord applicable. Retirer `candidat-livre-sha.txt`, métadonnée du run : elle donne le SHA du candidat livré par ce run, pas celui de la version sauvegardée, et ne doit pas être publiée. Une racine initialement vide ne produit que cette métadonnée. Un commit antérieur peut être redéployé depuis une branche en préproduction ; en production, préparer un revert sur `main`, qualifier son nouveau SHA en préproduction, puis relancer le workflow. Le retour arrière applicatif conserve la configuration privée et les données ; il n'annule pas les migrations. Exporter la base avant toute migration ultérieure.

Limites : FTPS supprime les fichiers distants absents du paquet, n'est pas atomique et ne garantit pas `index.html` en dernier. La racine reste exclusivement consacrée à Vision. `verify-public-spa.sh` n'est pas appelé car son repli TLS non vérifié est incompatible avec ce brief. Les contrôles Vision échouent sur certificat invalide. SSH utilise `StrictHostKeyChecking=yes` et `ssh-keyscan` ; l'empreinte de la clé collectée n'est pas vérifiée par un canal indépendant. Les outils et la configuration temporaire de migration sont supprimés par trap distant, avec nettoyage côté runner également ; une panne SSH complète peut empêcher ce dernier : contrôler les dossiers privés `outils-<run_id>-<run_attempt>` après incident.

**À VÉRIFIER** : PHP 8.3/MySQL 8.4 strict sur GitHub, délais SSH depuis le runner, API cPanel et retrait de liste blanche, secrets et protections, production initialisée, restauration réelle, CONNECT et essais PWA mobiles. Voir [preuves locales T-08](deploiement-automatise-verification.md).

### Procédure manuelle de secours
Variante A (SSH disponible, recommandée). `migrate.php` lit la **même configuration que l'application** ; or le compte de l'application n'a pas le droit de créer des tables. On lui donne donc, le temps de la migration, un fichier de configuration temporaire qui porte le **compte de migrations** :
1. Créer `/home/COMPTE/.avereo/vision-preprod/outils/` (hors racine web) avec **exactement** cette arborescence, le script chargeant `../frontend/public/api/lib/config.php` :
   ```text
   outils/database/migrate.php
   outils/database/migrations/001_create_vision_projects.sql
   outils/database/migrations/002_create_vision_sync.sql
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

Variante B (sans SSH) : dans phpMyAdmin, onglet SQL sur `COMPTE_visionpp`, coller le contenu de `database/migrations/001_create_vision_projects.sql`, puis celui de `002_create_vision_sync.sql`, **dans cet ordre** (002 référence `vision_projects` ; idempotents : `CREATE TABLE IF NOT EXISTS`). Limite : la table `schema_migrations` n'est pas renseignée ; le premier passage de l'exécuteur appliquera donc ces migrations une deuxième fois, sans effet (idempotentes), puis les enregistrera.

Contrôle : les tables `vision_projects`, `vision_project_counters`, `vision_objects` et `vision_sync_log` existent, vides. Le compte de l'application n'a besoin que de SELECT, INSERT, UPDATE (aucune suppression physique : la synchronisation fait des suppressions logiques).

## 4. Construire et déposer l'application [responsable, avec une préparation par Claude possible]
### Déploiement automatisé
Utiliser le workflow et les commandes de la [section automatisée](#déploiement-automatisé). Les étapes suivantes restent le secours manuel.

### 4.1 Construire (poste de travail, depuis un clone à jour de `main`)
```powershell
cd architecture-v1\avereo-app-vision\frontend
npm ci
npm test
npm run build
```
Contrôler le résultat (`dist/`), qui doit notamment contenir :
- `index.html`, `assets/` (JS, CSS, polices), `branding/` ;
- `.htaccess` (racine), `api/.htaccess`, `api/lib/.htaccess` (fichiers cachés : les afficher) ;
- `api/{auth,bootstrap,health,logout,projects}.php`, `api/lib/{auth,config,connect_gate,db,droits,http,projects}.php` ;
- `connect/entry.php`.
- `sw.js`, `manifest.webmanifest`, `icons/` et les fichiers Workbox générés ; `api/sync.php` et `api/lib/sync.php` depuis le Lot 2B.

Contrôles à lancer sur `dist/` :
```powershell
Get-ChildItem dist -Recurse -Force -File | ForEach-Object { $_.FullName.Substring((Resolve-Path dist).Path.Length) }
Get-ChildItem dist -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
# Le jeton local de développement ne doit apparaître dans aucun fichier du build (chaque commande : aucun résultat attendu).
Select-String -Path dist\assets\*.js -Pattern 'VITE_LOCAL_API_TOKEN' -SimpleMatch
$jeton = (Select-String -Path .env.development.local -Pattern '^VITE_LOCAL_API_TOKEN=(.+)$').Matches[0].Groups[1].Value
Select-String -Path dist\assets\*.js -Pattern $jeton -SimpleMatch
```
Attendu : aucun fichier `.env`, aucun `config.php` hors `api/lib/config.php` (chargeur de configuration, sans secret), aucun dossier `local/`, `revue/` ni `tests/` ; `php -l` sans erreur ; les deux recherches de jeton ne trouvent **rien** (le texte « Bearer » seul n'est pas une fuite : il est présent dans le client d'API). Si `.env.development.local` n'existe pas sur le poste, la deuxième recherche est sans objet. Noter l'empreinte de l'archive pour la trace :
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
0. **Livrer le code de #196 sur CONNECT préproduction** (accord propre à cette livraison). Le code de CONNECT servi en préproduction n'est probablement pas `main` : ne pas déployer tout `main` sans comparer. `backend/src/Config.php` et `backend/public/index.php` sont les deux fichiers concernés ; le commit `180b3fa` (clés de la configuration privée d'UNI) a modifié `public/index.php` juste avant #196 : **vérifier qu'il est aussi présent en préproduction**, sinon la livraison de `index.php` l'emporterait avec elle. Livraison minimale, comme les livraisons précédentes de Rapport (fichiers listés, sauvegarde et retour arrière relus) : comparer d'abord ces deux fichiers préproduction avec ceux de `main` avant #196 (`git show 59b31bc^:<fichier>`), sauvegarder les deux fichiers, les remplacer, puis contrôler `/api/v1/health` (200), une connexion normale et les cartes déjà présentes. Retour arrière : restaurer les deux fichiers. Les outils de livraison existants sont sous `outillage/acces-preproduction/` ; **À VÉRIFIER** lequel s'applique à CONNECT. Cette PR n'en exécute aucun.
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
3. **Qui verra la carte (décision du 24/11/2026 : restreindre compte par compte).** L'habilitation de l'étape 5.2 est attribuée à l'**organisation** ; CONNECT distingue ensuite deux types de comptes (colonne `users.application_access_mode`, `user_application_access`) : (a) les comptes en mode **`explicit`** (ceux créés par l'invitation de l'administration) ne voient que les applications cochées pour eux : il suffit de **cocher « AVEREO Vision » sur les seuls comptes de recette** ; (b) les comptes en mode **`inherit`** (comptes historiques) héritent de toutes les habilitations de l'organisation et **verront donc la carte dès l'étape 5.2**. Avant de confirmer l'étape 5.2 : dans l'administration des comptes de CONNECT, lister les comptes en mode `inherit` (**À VÉRIFIER** : l'écran qui l'affiche) et décider pour chacun : l'accepter, ou le passer en mode explicite avec ses applications actuelles cochées. En cas de doute, ne confirmer l'étape 5.2 qu'avec le statut `--status=draft` (carte invisible pour tous) et passer à `active` seulement quand la liste est maîtrisée.

## 6. Contrôles de passage
### Déploiement automatisé
Le workflow appelle `deploiement/verifier-public.mjs` : HTTPS vérifié, page Vite, PWA et cache, santé JSON, refus anonymes et protection des bibliothèques, en-têtes et redirection HTTP. Ces contrôles techniques ne remplacent pas les parcours humains ci-dessous.

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
9. Compte sans habilitation sur `vision` (si l'étape 5.3 a permis d'en avoir un) : pas de carte, et l'adresse `…/api/v1/apps/vision/launch` de CONNECT répond `403`. Sinon, ce contrôle reste non réalisé et la trace le dit.

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
- Vérifiés sur le serveur le 25/11/2026 : nom du sous-domaine, racine web, DNS, version de PHP (8.3, imposée par l'hébergeur), présence de SSH et du Terminal. Constaté ensuite : `pdo_mysql` présent (PHP 8.3.37 en ligne de commande), Terminal cPanel fonctionnel. Certificat Let's Encrypt installé le 26/11/2026 et compte MySQL de l'application vérifié (connexion réussie depuis le serveur). Restent à vérifier : connexion SSH depuis le poste, chemin de la configuration privée de CONNECT et mode de déploiement de CONNECT préproduction.
- **PHP 8.3 sur l'hébergement, 8.4 en développement** : toute PR qui touche l'API passe aussi `vision-local.ps1 test -Php 8.3` tant que l'hébergement reste en 8.3.
- **`.htaccess` et `AllowOverride`** : `api/lib/.htaccess` et `api/.htaccess` protègent le code (`Require all denied`). Si O2Switch ignorait ces fichiers, les bibliothèques seraient servies : les contrôles 6 le détectent.
- **Ressources du serveur** : pour les projets seuls, la charge est négligeable. Les reconstructions 3D (Lot 7) ne tournent **pas** ici : elles relèvent du serveur OVH, qui n'est pas encore choisi (`docs/serveur-ovh.md`).
- **Données** : seules des données fictives pendant la recette ; la base de préproduction n'est pas sauvegardée automatiquement par cette procédure.
- **Comptes MySQL séparés** : prévus ici (application et migrations) ; cela lève l'une des réserves du Lot 2A, à confirmer par la recette.
- **Compression, cache et en-têtes** : non réglés ; le fichier `.htaccess` ne fixe que l'HTTPS et trois en-têtes simples. Pas de `Strict-Transport-Security` : à décider avec la production.
- **PWA (Lot 2C)** : l'installation sur l'écran d'accueil et la réouverture sans réseau exigent HTTPS ; leurs essais sur Android et iPhone (R04, R09) se font sur cette préproduction, une fois le certificat émis.

## État de l'automatisation
Le code T-08 est préparé ; voir [Déploiement automatisé](#déploiement-automatisé) et [preuves locales](deploiement-automatise-verification.md). Aucune livraison ni modification GitHub ou serveur n'a été effectuée par ce lot.
