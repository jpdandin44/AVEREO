---
project: avereo-app-projet
document_type: deployment
title: Prévisualisation et publication de Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-24
owner: jpdandin
tags:
  - projet
  - deploiement
  - local
---

# Prévisualisation et publication de Projet

L'espace **Revues & approbations** se lance avec `npm.cmd run dev:review` sur
le port 5190 ; voir le [workflow local](../workflows/revue-developpement.md).
Il utilise le middleware de développement et le chantier choisi.
Le build hébergé exclut son module et ses données, avec contrôle intégré.
Publier le site actuel ne publierait donc pas ce service de revue.
Une revue multiutilisateur hébergée nécessitera un lot dédié et son autorisation.


## Local

Depuis `frontend/` :

```powershell
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 5186 --strictPort
```

Ouvrir [Projet local](http://127.0.0.1:5186/). Vite ne teste pas le sas PHP.
Le préchargement est réservé à `localhost`, `127.0.0.1` et la boucle IPv6.
Les endpoints `/local-planning/planning-pilote.csv` et
`/local-planning/planning-pilote.json` appartiennent au middleware de
développement. Les fichiers sont générés hors de `frontend/public/`
et ne doivent pas figurer dans `dist/`.

## Workflow actif

Le workflow du monorepo est
[`.github/workflows/deploy-projet-o2switch.yml`](../../../.github/workflows/deploy-projet-o2switch.yml).
Les workflows imbriqués dans l'app ne s'exécutent pas pour ce dépôt.

Déclenchement manuel ou push `main` touchant le frontend Projet, son workflow
ou `.github/scripts/**`. Le job utilise l'environnement `projet`, construit
`frontend/dist/` puis publie par SSH/rsync avec `--delete`.

Un push de branche dédiée et une PR brouillon ne déclenchent pas cette
publication automatique. Un futur merge peut la déclencher : l'autorisation
humaine doit considérer cet effet. Les protections réelles de l'environnement
GitHub n'ont pas été vérifiées.

## Cible et paramètres

Sous-domaine documenté : `projet.avereo.fr`. Publier les artefacts PHP,
`.htaccess` et le frontend. Le chemin réel vient de `O2SWITCH_TARGET_PATH` ;
`~/public_html/projet` reste une suggestion historique, pas une preuve du
document root.

Le workflow référence `O2SWITCH_SSH_KEY`, `O2SWITCH_USER`,
`O2SWITCH_HOST`, `O2SWITCH_PORT`, `O2SWITCH_TARGET_PATH`.
La liste blanche cPanel utilise `CPANEL_USERNAME`, `CPANEL_SERVER` et les
modes `CPANEL_PASSWORD` / `CPANEL_API_TOKEN` du script partagé.
Aucune valeur sensible n'est documentée ici.

Apache/PHP sont requis pour le sas même si le métier reste dans le navigateur.
Comptes, configuration et état DNS/HTTPS ne sont pas qualifiés par ce lot.

## Retour arrière

Conserver une archive distante avant transfert destructif et restaurer l'artefact
précédent si nécessaire. Exports utilisateurs et brouillons navigateur sont
distincts de la sauvegarde du code. Aucun merge, déploiement ni retour arrière
distant n'est exécuté dans cette intervention.
