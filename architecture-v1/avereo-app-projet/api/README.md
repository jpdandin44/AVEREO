---
project: avereo-app-projet
document_type: api-index
title: API et frontières de Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-24
owner: jpdandin
tags:
  - projet
  - api
---

# API et frontières de Projet

Le [contrat de revue locale](revue-locale.md) décrit les routes de lecture et
d'écriture du serveur de développement sur le port 5190. Elles sont absentes
du build hébergé. Les routes et le moteur de planning ci-dessous conservent
leur rôle ; aucun backend métier de planning n'est activé.


Aucune API métier ni connexion MySQL de planning n'est active en V1.
Imports, calculs, brouillons et exports relèvent du navigateur.

Les fichiers PHP `index.php`, `connect/entry.php` et `connect/logout.php`
concernent le sas CONNECT hébergé, pas une sauvegarde de planning.

## Routes locales de lecture

Ces routes sont déclarées dans `frontend/vite.config.js` via `configureServer`,
sur le serveur de développement configuré pour `127.0.0.1:5186`.

| Route | Réponse |
|---|---|
| `/local-planning/planning-pilote.csv` | Neuf colonnes des tâches, `text/csv` UTF-8 |
| `/local-planning/planning-pilote.json` | Paramètres, provenance et `taskDetails`, `application/json` UTF-8 |
| `/local-planning/pilotage-etapes.md` | Document généré, `text/plain` UTF-8 |

Les trois réponses utilisent `Cache-Control: no-store`. Les chemins sont fixes,
pas choisis depuis une saisie utilisateur. Les fichiers restent hors du
répertoire public. Le document est affecté à `textContent` dans l'interface :
son contenu n'est pas interprété comme HTML. Ces routes ne constituent pas un
service métier hébergé ni une API d'écriture.

## Contrat du moteur dans le navigateur

`frontend/public/planning-core.js` expose `ProjetPlanning` : import/normalisation,
validation des tâches, calendrier, JSON/CSV et helpers `riskScore`/`riskLevel`.
`task-details.js` utilise ce contrat pour afficher et suivre les fiches. Aucun
appel distant ne décide de la réalisation d'une étape ou du traitement d'un risque.

Le contrat des données et la rétrocompatibilité du schéma version 1 sont décrits
dans [data/README.md](../data/README.md). Voir aussi
[l'architecture](../architecture.md).
