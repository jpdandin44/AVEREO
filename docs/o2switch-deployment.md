# Deploiement O2Switch

Ce repo utilise des workflows GitHub Actions a la racine pour deployer les applications stockees dans `architecture-v1/`.

## Environnements GitHub

Creer un environnement GitHub par application :

- `connect`
- `coupe`
- `rapport`
- `projet`
- `thermo`
- `drone`

Chaque environnement doit contenir uniquement le chemin cible propre a l'application :

- `O2SWITCH_TARGET_PATH`

Variable optionnelle par environnement :

- `O2SWITCH_PUBLIC_URL` : URL publique a verifier apres deploiement. Utile quand le domaine final ne resout pas encore et qu'il faut verifier l'URL temporaire O2Switch.

## Repository secrets GitHub

Les secrets communs suivants doivent etre definis au niveau du depot GitHub dans `Settings > Secrets and variables > Actions > Repository secrets` :

- `O2SWITCH_SSH_KEY`
- `O2SWITCH_USER`
- `O2SWITCH_HOST`
- `O2SWITCH_PORT`
- `CPANEL_USERNAME`
- `CPANEL_SERVER`
- `CPANEL_PASSWORD`

`CPANEL_API_TOKEN` est optionnel. Si `CPANEL_PASSWORD` est renseigne, il est utilise en priorite par les workflows.

`CPANEL_SERVER` doit contenir le serveur cPanel/O2Switch sans `https://` et sans `:2083`.

## Whitelist SSH dynamique

Avant `rsync`, le workflow :

1. Recupere l'IP publique du runner GitHub.
2. Appelle l'API cPanel `SshWhitelist/add` pour autoriser cette IP sur le port SSH.
3. Verifie que l'IP est bien presente via `SshWhitelist/list`.
4. Supprime l'IP du runner en fin de job via `SshWhitelist/remove` quand l'API le permet.

Le workflow n'appelle pas `SshWhitelist/remove_all` afin de ne pas supprimer des acces SSH existants.

Si cPanel indique que la limite d'exceptions SSH est atteinte, supprimer manuellement les anciennes IP GitHub Actions dans cPanel puis relancer le workflow.

## Dossiers cibles recommandes

- `connect` : `/home/CPANEL_USERNAME/public_html/connect`
- `coupe` : `/home/CPANEL_USERNAME/public_html/coupe`
- `rapport` : `/home/CPANEL_USERNAME/public_html/rapport`
- `projet` : `/home/CPANEL_USERNAME/public_html/projet`
- `thermo` : `/home/CPANEL_USERNAME/public_html/thermo`
- `drone` : `/home/CPANEL_USERNAME/public_html/drone`

## Sous-domaines O2Switch

Chaque sous-domaine doit pointer vers le meme document root que le secret `O2SWITCH_TARGET_PATH` de son environnement GitHub.

Exemples :

- `connect.avereo.fr` -> `/home/CPANEL_USERNAME/public_html/connect`
- `coupe.avereo.fr` -> `/home/CPANEL_USERNAME/public_html/coupe`
- `rapport.avereo.fr` -> `/home/CPANEL_USERNAME/public_html/rapport`
- `projet.avereo.fr` -> `/home/CPANEL_USERNAME/public_html/projet`
- `thermo.avereo.fr` -> `/home/CPANEL_USERNAME/public_html/thermo`
- `drone.avereo.fr` -> `/home/CPANEL_USERNAME/public_html/drone`

Si le workflow est en succes mais que le sous-domaine affiche `My Blog` ou WordPress, le deploiement `rsync` est probablement correct mais le sous-domaine ne route pas vers le bon document root. Verifier alors la configuration du domaine/sous-domaine dans cPanel et, si le domaine est gere par O2Switch via Mon Univers Web, verifier aussi que le sous-domaine y est bien actif et rattache a l'hebergement.

## Verification post-deploiement

Chaque workflow verifie maintenant l'URL publique apres `rsync`.

Pour Coupe, la verification utilise provisoirement `https://coupe.avereo.fr.daje3540.odns.fr/` si `O2SWITCH_PUBLIC_URL` n'est pas definie. Quand le DNS final est pret, definir `O2SWITCH_PUBLIC_URL=https://coupe.avereo.fr` dans l'environnement GitHub `coupe`.

La verification echoue si :

- le DNS du sous-domaine ne resout pas ;
- l'URL publique sert WordPress ou une page par defaut ;
- la page ne contient pas le conteneur React `#root` ;
- la page ne reference pas les assets Vite generes.

## Lancement

Chaque workflow peut etre lance manuellement depuis GitHub Actions. Apres merge dans `main`, il se declenche aussi quand le frontend correspondant change.

Commencer par `Deploy Connect to O2Switch`, puis lancer les autres applications une par une afin d'eviter de saturer la whitelist SSH cPanel.
