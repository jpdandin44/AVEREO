---
project: avereo-app-coupe
document_type: architecture
title: Architecture Coupe
status: active
version: git
created: 2026-11-04
updated: 2026-11-04
owner: jpdandin
tags: [avereo, acces, documentation]
---

# Architecture Coupe

Coupe est un dossier du monorepo AVEREO. Le frontend Vite encapsule `frontend/public/legacy-app.html`. Les entrées PHP et `.htaccess` passent par le sas CONNECT. L’API PHP existante sauvegarde les projets dans la table MySQL `coupe_projects`, avec identité portée par la session signée.

`frontend/public/connect/gate.php` est une variante dédiée qui conserve les méthodes utilisées par l’API. Le contrôle de politique privée est exécuté à l’échange du ticket et à la lecture du cookie ; les méthodes d’identité de l’API passent par cette lecture. Aucun schéma, endpoint métier ou calcul de coupe n’est ajouté. [Déploiement existant](docs/deployment.md) · [Contrat des périodes](../avereo-app-connect/docs/acces-temporaires-applications.md).
