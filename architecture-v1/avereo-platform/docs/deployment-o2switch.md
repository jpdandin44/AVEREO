# Deploiement O2Switch

## Sous-domaines cPanel

Creer un sous-domaine par application dans cPanel, puis pointer chaque sous-domaine vers son dossier public.

## Dossiers cibles recommandes

- `~/public_html/connect`
- `~/public_html/coupe`
- `~/public_html/rapport`
- `~/public_html/projet`
- `~/public_html/thermo`
- `~/public_html/drone`

## Secrets GitHub

Chaque depot applicatif doit definir uniquement :

- `O2SWITCH_SSH_KEY`
- `O2SWITCH_USER`
- `O2SWITCH_HOST`
- `O2SWITCH_PORT`
- `O2SWITCH_TARGET_PATH`

Si `O2SWITCH_PORT` n'est pas renseigne, le port `8888` est utilise par defaut.

## Deploiement manuel

Lancer le workflow `Deploy frontend to O2Switch` depuis GitHub Actions. Le workflow build le frontend Vite puis publie uniquement `frontend/dist/`.

## Rollback manuel

Avant un deploiement sensible, archiver le dossier public actuel. En cas d'incident, restaurer l'archive dans le dossier public du sous-domaine.
