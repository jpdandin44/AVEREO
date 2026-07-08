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

Dans chaque environnement, definir les secrets suivants :

- `O2SWITCH_SSH_KEY`
- `O2SWITCH_USER`
- `O2SWITCH_HOST`
- `O2SWITCH_PORT`
- `O2SWITCH_TARGET_PATH`

Le secret `O2SWITCH_TARGET_PATH` doit pointer vers le dossier public du sous-domaine.

## Dossiers cibles recommandes

- `connect` : `~/public_html/connect`
- `coupe` : `~/public_html/coupe`
- `rapport` : `~/public_html/rapport`
- `projet` : `~/public_html/projet`
- `thermo` : `~/public_html/thermo`
- `drone` : `~/public_html/drone`

## Lancement

Chaque workflow peut etre lance manuellement depuis GitHub Actions. Apres merge dans `main`, il se declenche aussi quand le frontend correspondant change.
