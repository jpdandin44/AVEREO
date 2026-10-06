---
project: avereo-app-coupe
document_type: source-audit
title: Audit source de Coupe AVEREO Reno Pro
status: active
version: git
created: 2026-07-08
updated: 2026-09-09
owner: jpdandin
tags: [coupe, audit, securite]
---

# Audit source - Coupe AVEREO Reno Pro

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

## Lot local du 2026-09-09

- Ajout du lanceur Docker Coupe, réutilisant Rapport sans modifier son code.
- Écart nécessaire pour HTTP local : portail de boucle locale et cookie sans
  `Secure` uniquement lorsque `environment=local`. Les autres protections restent
  actives ; le défaut hébergé est inchangé.
- Un seul changement dans l'interface historique : la déconnexion navigue dans
  la fenêtre principale au lieu de tenter d'afficher CONNECT dans l'iframe,
  incompatible avec sa protection `frame-ancestors`.
- Aucun changement de dessin, stockage, schéma, dépendances ou workflow hébergé.
- Le socle documentaire est complété à l'échelle Coupe. Le README est réaligné
  sur le monorepo et le déploiement manuel via workflow, sans procédure concurrente.

Les contrôles exécutés, alertes npm et limites de recette sont consignés dans
[la procédure locale](local-development.md). Ce lot n'atteste pas de l'état actuel
de la production ni d'une conformité documentaire de tout le monorepo.
