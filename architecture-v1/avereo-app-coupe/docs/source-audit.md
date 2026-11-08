---
project: avereo-app-coupe
document_type: reference
title: source-audit
status: active
version: git
created: 2026-11-04
updated: 2026-11-08
owner: jpdandin
tags: [avereo, acces, documentation]
---


## 4 novembre 2026 — Période CONNECT

Le sas dédié relit la politique privée configurée avant émission de session et à chaque lecture de cookie. Les points d’entrée/API existants utilisent ce contrôle. Le contenu métier, les projets et les migrations restent inchangés. [Contrat et preuve locale](../../avereo-app-connect/docs/acces-temporaires-applications.md).

﻿# Audit source - Coupe AVEREO Reno Pro

## Source

- Fichier attendu : Coupe_AVEREO_Reno_Pro.txt
- Statut : trouve dans le zip technique fourni

## Integration V1

Le HTML source est place dans frontend/public/legacy-app.html; frontend/src/App.jsx fournit un wrapper React iframe.

## Dependances detectees ou prevues

- Runtime : react, react-dom
- Dev : @vitejs/plugin-react, vite

## APIs navigateur visibles

- FileReader
- Blob
- URL.createObjectURL
- canvas
- window
- document

## Points a verifier manuellement

- Verifier les caracteres accentues si la source historique etait encodee differemment.
- Verifier le rendu responsive apres npm run dev.
- Verifier les exports PDF, imports fichiers et stockages locaux si l'application les utilise.

## Refactorisations reportees

Notes V1.1 : fabric et pdfjs-dist devront etre integres proprement via npm.

## Validation

- `npm ci` et `npm run build` sont reproductibles avec Node.js 20.19 ou plus.
- Le lot du 29 juillet 2026 ajoute un sas serveur CONNECT devant `index.html` et
  `legacy-app.html`.
- Un ticket HMAC court, lié à Coupe et à usage unique, établit un cookie
  `Secure`, `HttpOnly` et `SameSite=Lax`.
- Les accès directs sont redirigés vers CONNECT ; les endpoints métier refusent
  aussi les requêtes sans cookie de sas. Seul le healthcheck reste public.
- Le lot « point d'accès unique » ajoute l'identifiant CONNECT au ticket signé,
  neutralise l'ancien callback OAuth Coupe et supprime le second bearer OAuth
  des appels API. Les administrateurs restent explicitement listés côté serveur.
- Le sas reste à qualifier intégralement en préproduction avant tout
  déclenchement manuel du workflow de production.

## 6 novembre 2026 — Menu de compte commun

Le menu est au pied de la barre latérale. Ouvrir en ligne et l’action d’authentification existante sont conservés ; le mode jeton API local reste accessible.

Le périmètre transverse est demandé explicitement par le responsable. [Contrat commun](../../avereo-platform/docs/fonctionnalites-communes.md) et [preuve du lot](../../avereo-platform/docs/qualification-mon-espace.md). Aucune migration, modification de secret ou de droit ; tests sur données fictives.

## Préparation hébergée du menu après PR #119

Le [dossier transverse](../../avereo-platform/docs/preparation-mon-espace.md)
consigne l’écart entre la variante de connexion hébergée et la source cumulée.
La livraison proposée applique seulement le menu au HTML installé ; ses API et
ses traitements OAuth restent inchangés. La restauration sur copie est vérifiée ;
aucune installation ni recette métier hébergée du menu n’est encore réalisée.

## 6 novembre 2026 — Extension de PR #121

Mes projets ouvre le sélecteur natif des projets en ligne. Les préférences propres à Coupe règlent la grille et l’aimantation de l’éditeur dans ce navigateur. Le candidat de livraison doit appliquer ces raccordements à la variante HTML hébergée en conservant ses traitements OAuth et ses API.

Les contrôles actualisés sont dans la [qualification transversale](../../avereo-platform/docs/qualification-mon-espace.md). Les preuves précédentes restent attachées à leur candidat.

## 7 novembre 2026 — Module Missions en recette locale

Missions reprend le nom du dessin et l’adresse présents dans les champs de la coupe ouverte. La recette a vérifié les valeurs saisies sur un dessin fictif. Le raccordement est additif et indépendant du chargement du moteur CAO. [Recette commune](../../avereo-platform/docs/preparation-missions.md).

## 8 novembre 2026 — Coupe comme outil de mission

Le candidat retire l’action Missions et la transmission du nom et de l’adresse du dessin à ce formulaire. Le menu conserve « Mes projets » et les réglages de grille et d’aimantation. Le moteur CAO et ses exports restent ceux de Coupe. [Candidat des outils complémentaires](../../avereo-platform/data/recette-missions/outils-complementaires.json).
