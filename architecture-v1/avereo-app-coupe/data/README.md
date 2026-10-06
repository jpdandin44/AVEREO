---
project: avereo-app-coupe
document_type: data
title: Données Coupe
status: active
version: git
created: 2026-09-09
updated: 2026-09-09
owner: jpdandin
tags: [coupe, donnees, local]
---

# Données Coupe

## Référence locale

L'état courant du dessin est dans le navigateur. **Sauvegarder** exporte un JSON
avec `meta`, `fabric` et `section`, selon `getProjectPayload()` dans
`frontend/public/legacy-app.html`. **Charger** réimporte ce format natif.
Le fichier est enregistré à l'emplacement de téléchargement choisi par le navigateur,
pas dans le conteneur ni automatiquement dans ce dépôt. Exporter avant de fermer
ou recharger la page ; conserver ces fichiers dans le dossier du projet métier.

Ne pas confondre ce JSON de sauvegarde avec les exports graphiques/CAO dérivés.
Ne pas commiter de plans clients ni de sauvegardes contenant des données personnelles.

## Stockage en ligne existant

Le schéma [database/migrations/001_create_coupe_projects.sql](../database/migrations/001_create_coupe_projects.sql)
et l'implémentation [projects.php](../frontend/public/api/projects.php) restent les
références du stockage SQL déjà présent. Le lot local n'active aucune base Coupe.
L'état des données hébergées n'a pas été inspecté ou modifié.

## Autres applications

Rapport utilise ses propres secrets et son volume Docker isolé. Dans un nouveau
checkout, son lanceur génère une nouvelle instance : les anciens volumes restent
conservés, mais leurs rapports n'apparaissent pas automatiquement dans cette nouvelle
instance. Ne pas supprimer ou régénérer son `.env` pour tenter de les retrouver.
CONNECT utilise des comptes fictifs dans une base de test éphémère ; ce n'est pas
un stockage durable de comptes réels.
