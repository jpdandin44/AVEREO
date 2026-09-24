# Déploiement - AVEREO Collector Recherche

## Cible O2Switch

- Sous-domaine : `recherche.avereo.fr` (préproduction : `recherche-preprod.avereo.fr`)
- Dossier recommandé : `~/public_html/recherche`
- Contenu publié : `frontend/dist/`, c'est-à-dire la SPA, `index.php` et `connect/` (sas). Aucune donnée : le corpus reste dans le navigateur.

## Prérequis (actions humaines)

1. Créer le sous-domaine dans cPanel et l'associer au dossier public.
2. Générer un secret aléatoire d'au moins 32 caractères, **différent** de ceux des autres applications.
3. Créer la configuration privée du sas, hors document root : `~/.avereo/recherche/config.php` (ou `~/.avereo/recherche-preprod/config.php`). Modèle : `avereo-platform/shared/connect-gate.config.example.php`, avec :
   - `connect_launch_secret` : le secret de l'étape 2 ;
   - `connect_launch_nonce_directory` : un répertoire anti-rejeu propre à Recherche ;
   - `connect_gate_cookie` : `AVEREO_RECHERCHE_GATE` (ou `AVEREO_RECHERCHE_PREPROD_GATE`).
4. Dans la configuration privée CONNECT : `APP_LAUNCH_RECHERCHE_URL=https://recherche.avereo.fr/connect/entry.php` et `APP_LAUNCH_RECHERCHE_SECRET` (même valeur qu'à l'étape 2).
5. Créer l'environnement GitHub `recherche` avec les secrets utilisés par le workflow (`CPANEL_*`, `O2SWITCH_*`, dont `O2SWITCH_TARGET_PATH`).
6. Lancer manuellement « Deploy Recherche to O2Switch » depuis `main`.
7. Publier la carte dans le catalogue CONNECT (prévisualiser, puis `--confirm`) :

```bash
php bin/manage-catalog.php \
  --code=recherche \
  --name="AVEREO Collector Recherche" \
  --description="Retrouver, citer et réemployer les connaissances AVEREO." \
  --launch-url=https://recherche.avereo.fr/ \
  --scope=recherche:use \
  --display-order=60 \
  --status=active \
  --organization-slug=avereo \
  --actor-subject=SUBJECT_DRUPAL_ADMIN
```

Qualifier d'abord en préproduction, comme les autres applications (voir `avereo-app-connect/docs/catalogue-services.md`).

## Contrôles attendus

- Accès direct à `https://recherche.avereo.fr/` sans passer par CONNECT : redirection `303` vers CONNECT.
- Depuis la carte du catalogue : ouverture de l'application, et bouton « Se déconnecter » injecté par `index.php`.

## Rollback manuel

Avant de lancer `rsync --delete`, archiver le contenu public précédent ; en cas de problème, restaurer cette archive.

## Point d'attention

Le corpus est stocké **par navigateur et par domaine** : la préproduction et la production ont des corpus distincts. Pour passer de l'un à l'autre, utiliser la sauvegarde et la restauration.
