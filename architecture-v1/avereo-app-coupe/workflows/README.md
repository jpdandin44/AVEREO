---
project: avereo-app-coupe
document_type: workflows
title: Workflows de Coupe
status: active
version: git
created: 2026-09-09
updated: 2026-09-09
owner: jpdandin
tags: [coupe, workflows, docker]
---

# Workflows

## Intégration locale

Source exécutable : [coupe-local.ps1](../local/coupe-local.ps1),
[Compose Coupe](../docker-compose.local.yml) et
[override CONNECT](../local/connect-gateway.override.yml).

- Entrées : code du checkout, dépendances Node/Docker, secret local généré et
  applications voisines Rapport/CONNECT.
- Étapes : construction, démarrage Coupe, appel au lanceur Rapport,
  composition du catalogue CONNECT.
- Sorties : services locaux, `frontend/dist/`, configuration privée ignorée.
- Retour arrière : retrait de Coupe réelle du catalogue et arrêt de son conteneur,
  sans suppression des volumes Rapport.

Les noms des secrets et les commandes sont dans
[la procédure locale](../docs/local-development.md), qui reste la référence humaine.

## Publication hébergée

Source exécutable : workflow du monorepo
[deploy-coupe-o2switch.yml](../../../.github/workflows/deploy-coupe-o2switch.yml).
La [procédure de déploiement](../docs/deployment.md) documente l'hébergement.
Ce lot ne modifie ni le workflow, ni ses environnements/secrets, ni la checklist PR.
Le déclenchement de publication reste manuel après validation humaine.
