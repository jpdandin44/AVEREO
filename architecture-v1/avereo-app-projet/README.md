---
project: avereo-app-projet
document_type: readme
title: Projet AVEREO — planning local
status: active
version: git
created: 2026-09-19
updated: 2026-09-19
owner: jpdandin
tags:
  - projet
  - planning
  - local
---

# Projet AVEREO

Projet est l'application de planification du monorepo AVEREO, dans
`architecture-v1/avereo-app-projet/`. Son HTML/JavaScript historique est
affiché par un wrapper React/Vite. Le métier reste dans le navigateur ;
aucune API métier ni base MySQL n'est ajoutée.

## État du lot

Le planning est **implémenté et vérifié localement** : dates configurables,
charges décimales, import validé, brouillon navigateur et reprise JSON.
Cette évolution est proposée pour revue dans une PR brouillon dédiée.
Les tests et la recette navigateur effectués,
ainsi que les contrôles encore ouverts, sont consignés dans
[docs/source-audit.md](docs/source-audit.md). La préproduction et la production
ne sont pas qualifiées par ce lot.

Le pilote préchargé est une proposition de planning, pas un avancement réalisé.
Son modèle et ses hypothèses sont décrits dans [data/README.md](data/README.md).

## Prérequis et installation

Utiliser Node.js 22, comme la CI, npm et un navigateur récent. Le HTML
historique charge certaines ressources depuis des CDN ; la prévisualisation
locale ne signifie pas que toutes les fonctions sont disponibles sans réseau.

Depuis `frontend/` :

```powershell
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 5186 --strictPort
```

Ouvrir [Projet local](http://127.0.0.1:5186/). Garder le terminal ouvert.
Vite sert le frontend ; il ne qualifie pas le sas PHP CONNECT hébergé.

## Utilisation

1. Vérifier les dates début/cible et la capacité du planning.
2. Utiliser le mode séquentiel pour une capacité commune sans parallélisme.
   Le mode dépendances peut produire des chevauchements sans nivellement
   automatique des ressources.
3. Importer les tâches CSV/XLSX ou reprendre un JSON complet. Un import
   invalide conserve l'état courant ; un remplacement demande confirmation.
4. Modifier et suivre les tâches. Exporter régulièrement le JSON pour une
   conservation indépendante du navigateur.
5. Utiliser le CSV neuf colonnes pour échanger les tâches et le JSON pour
   reprendre aussi la configuration, les dates fixées manuellement et l'état
   des risques. Le CSV ne conserve pas ces trois éléments.

Le pilote est proposé au premier chargement local autorisé, sans remplacer un
brouillon existant. Les exports utilisateurs ne modifient pas sa source Git.
Le stockage navigateur dépend de l'origine et du profil : il ne fournit ni
partage entre comptes ni sauvegarde serveur.

## Commandes principales

Depuis `frontend/` :

```powershell
npm.cmd run generate:planning
npm.cmd run check:planning
npm.cmd test
npm.cmd run build
```

Le générateur produit des fichiers sous `data/generated/`, hors des assets
publics. `check:planning` vérifie leur alignement sans les modifier. Vite les
sert uniquement en développement sous `/local-planning/`.
Le build exécute cette vérification puis les tests avant de produire
`frontend/dist/` avec le sas PHP. La CI existante lance donc les tests Projet
par le build, sans modification du workflow partagé. L'artefact local inspecté
ne contient aucun CSV ou JSON du pilote ; les résultats sont dans la recette.

Depuis la racine du monorepo, `npm.cmd run check` réalise le contrôle de base
et ne remplace pas les tests fonctionnels de Projet.

## Structure

- `frontend/src/App.jsx` : wrapper React.
- `frontend/public/legacy-app.html` : interface historique.
- `frontend/public/planning-core.js` : moteur du lot.
- `frontend/public/planning-local.js` : imports, sauvegarde et reprise navigateur.
- `data/planning-pilote.json` : référence structurée du pilote.
- `workflows/` : générateur et procédure.
- `tests/` : contrôles ciblés.
- `backend/`, `database/` : réserves documentaires, sans backend métier actif.

## Documentation

[Architecture](architecture.md), [exigences](requirements.md),
[décisions](decisions.md), [roadmap](roadmap.md), [changelog](changelog.md),
[audit et recette](docs/source-audit.md), [publication](docs/deployment.md),
[données](data/README.md), [tests](tests/README.md),
[workflows](workflows/README.md), [API](api/README.md),
[prompts](prompts/README.md).

La PR brouillon dédiée est soumise à revue humaine. Un futur merge sur
`main` peut déclencher le déploiement automatique : consulter la procédure avant
ce merge.
