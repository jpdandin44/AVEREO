---
project: avereo-app-coupe
document_type: changelog
title: Évolutions significatives de Coupe
status: active
version: git
created: 2026-09-09
updated: 2026-09-09
owner: jpdandin
tags: [coupe, changelog]
---

# Changelog

## Non publié — 2026-09-09

- Ajout d'un lanceur Docker local réunissant CONNECT, Rapport et Coupe réels.
- Autorisation explicite du portail de boucle locale et du cookie HTTP uniquement
  en environnement local ; protections hébergées conservées.
- Déconnexion Coupe vers la confirmation CONNECT dans la fenêtre principale.
- Tests du sas et du parcours HTTP multi-applications.
- Socle documentaire de l'application et procédure locale avec limites de stockage.
- Procédure de mise en production complétée avec GO / NO-GO, sauvegarde,
  recette post-déploiement et retour arrière ciblé.

L'historique antérieur reste dans Git et dans [l'audit source](docs/source-audit.md).
