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

## Secrets GitHub

Les secrets O2Switch suivants peuvent etre definis par environnement, car `O2SWITCH_TARGET_PATH` change selon l'application :

- `O2SWITCH_SSH_KEY`
- `O2SWITCH_USER`
- `O2SWITCH_HOST`
- `O2SWITCH_PORT`
- `O2SWITCH_TARGET_PATH`

Les secrets cPanel suivants peuvent etre definis au niveau du depot si les memes identifiants servent pour toutes les apps, ou au niveau de chaque environnement :

- `CPANEL_USERNAME`
- `CPANEL_SERVER`

Ajouter ensuite l'une des deux methodes d'authentification :

- `CPANEL_API_TOKEN`, si un token API cPanel est disponible.
- `CPANEL_PASSWORD`, si le token API cPanel n'est pas disponible.

`CPANEL_SERVER` doit contenir le serveur cPanel/O2Switch sans `https://` et sans `:2083`.

## Whitelist SSH dynamique

Avant `rsync`, le workflow :

1. Recupere l'IP publique du runner GitHub.
2. Appelle l'API cPanel `SshWhitelist/add` pour autoriser cette IP sur le port SSH.
3. Verifie que l'IP est bien presente via `SshWhitelist/list`.

Le workflow n'appelle pas `SshWhitelist/remove_all` afin de ne pas supprimer des acces SSH existants.

## Dossiers cibles recommandes

- `connect` : `/home/CPANEL_USERNAME/public_html/connect`
- `coupe` : `/home/CPANEL_USERNAME/public_html/coupe`
- `rapport` : `/home/CPANEL_USERNAME/public_html/rapport`
- `projet` : `/home/CPANEL_USERNAME/public_html/projet`
- `thermo` : `/home/CPANEL_USERNAME/public_html/thermo`
- `drone` : `/home/CPANEL_USERNAME/public_html/drone`

## Lancement

Chaque workflow peut etre lance manuellement depuis GitHub Actions. Apres merge dans `main`, il se declenche aussi quand le frontend correspondant change.

Commencer par `Deploy Connect to O2Switch`, puis dupliquer la configuration de secrets et de dossiers cibles aux autres environnements.