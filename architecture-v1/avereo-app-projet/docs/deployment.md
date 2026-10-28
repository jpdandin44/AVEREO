---
project: avereo-app-projet
document_type: deployment
title: Prévisualisation et publication de Projet
status: active
version: git
created: 2026-09-19
updated: 2026-10-28
owner: jpdandin
tags:
  - projet
  - deploiement
  - local
---

# Prévisualisation et publication de Projet

## Préproduction Gantt — 28 octobre 2026

Le responsable demande la version locale comme outil en préproduction. La cible
est `https://projet-preprod.avereo.fr/`, racine cPanel vérifiée
`/home/daje3540/projet-preprod.avereo.fr`, distincte des autres racines.
Le lanceur hébergé référence déjà `/legacy-app.html` ; la configuration privée
existe. Le workflow de production ci-dessous n'est pas utilisé.

Le lot contient exactement `legacy-app.html`, `planning-core.js`,
`planning-local.js` et `task-details.js`. Il conserve index, assets existants,
`.htaccess`, sas CONNECT, configuration privée et bases. Aucun JSON personnel
n'est publié. Les sources et tests sont sur une branche dédiée ; pas de merge main.

Après build d'une source commitée et propre, exécuter
`python workflows/prepare-preprod-gantt.py --source CHEMIN_APP --output DOSSIER_NEUF`.
L'archive, son manifeste et `deploy-preprod-gantt.py` sont transférés dans un
dossier privé sous `/home/daje3540/private/`. L'installateur n'accepte aucune
autre cible ni fichier et relit le document root cPanel.

`prepare` sauvegarde et répète installation/restauration dans une copie privée ;
`deploy` refuse une dérive puis installe les dépendances avant l'HTML ; `verify`
contrôle les empreintes et la configuration. `rollback` restaure uniquement les
chemins du candidat et refuse d'écraser une modification ultérieure. Les reçus
restent en privé. Exécuter le contrôle du protocole avant le passage effectif.

Contrôler ensuite les réponses anonymes, l'accès CONNECT réel, l'affichage,
l'import/export JSON et la reprise. Le navigateur de préproduction constitue
une nouvelle origine : importer sa sauvegarde une fois dans le navigateur
d'usage, puis exporter régulièrement. Pas de base partagée dans cette version.
Le [suivi](../data/suivi-gantt-affichage.json) porte les preuves réelles ; cette
procédure ne suffit pas à attester une livraison ou une validation humaine.

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
