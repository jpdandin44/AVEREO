---
project: avereo-app-rapport
document_type: guide
title: Rapport installable sur Android, hors ligne et reconnexion
status: active
version: git
created: 2026-11-27
updated: 2026-11-27
owner: jpdandin
tags:
  - rapport
  - pwa
  - android
  - hors-ligne
---

# Rapport installable sur Android, hors ligne et reconnexion

Rapport s'ajoute à l'écran d'accueil d'un téléphone Android (Chrome), se rouvre **sans réseau** sur le brouillon enregistré dans le téléphone, puis propose **« Se reconnecter »** quand la session a expiré. Demande du responsable du 27/11/2026, pour les essais terrain sur Android ; iPhone hors périmètre pour l'instant.

## Ce qui change

| Élément | Comportement |
| --- | --- |
| `public/manifest.webmanifest`, `public/icons/` | Nom « Rapport AVEREO Pro », plein écran, #002B45, icônes 192 / 512 / 512 maskable (« R » provisoire, `scripts/icones-application.mjs`) |
| `pwa/plugin.js` + `pwa/sw-modele.js` | Plugin Vite maison, **sans dépendance** : écrit `dist/sw.js` avec la liste exacte des fichiers `assets/` du build |
| Service worker | Garde les fichiers de l'application, le menu de compte, le logo et la page d'accueil **servie par le sas avec une session valide** (réponse 200 HTML non redirigée, sans donnée de dossier). Ouverture de page : réseau d'abord, page gardée seulement si le réseau manque |
| Jamais mis en cache | `/api/`, `/connect/`, `/auth/`, `/rga/`, toute requête autre que GET |
| `src/sessionHorsLigne.js` | Dernière identité confirmée par le serveur, gardée 30 jours dans le téléphone (mode CONNECT seulement), effacée à la déconnexion ; états « hors ligne » / « session expirée » |
| `src/App.jsx` | Sans réseau au démarrage : le brouillon local s'ouvre avec la dernière identité au lieu de l'écran de connexion. Bandeau « Hors ligne » (icône + texte). Au retour du réseau, session refusée : bandeau « Session expirée » et bouton **« Se reconnecter »** (portail CONNECT `?app=rapport`) |
| `src/services/reportApi.js` | Réseau absent : message lisible « Réseau indisponible… » au lieu de « Failed to fetch » |

## Ce qui ne change pas

- Le serveur reste seul juge : sauvegarde en ligne, photos originales, exports et listes exigent toujours une session valide.
- Le sas PHP (`index.php`, `connect/gate.php`) et l'API ne sont pas modifiés ; aucune migration.
- Un seul brouillon par appareil, comme avant (`idb-keyval`).
- Les pages RGA ne fonctionnent pas sans réseau.

## Vérification

- `npm test` : 280 tests, dont manifeste et icônes, contenu du service worker (précache limité à `assets/`, exclusions), états de session, identité mémorisée et lien de reconnexion, erreur réseau lisible.
- `VITE_ENABLE_ONLINE_SYNC=true npm run build` : `dist/sw.js` produit avec les fichiers du build.
- Navigateur local avec une API simulée (session valide puis expirée) : service worker actif, fichiers et page d'accueil en cache ; serveur arrêté → Rapport s'ouvre avec « Hors ligne » et le menu de compte ; retour du réseau avec session expirée → « Session expirée » et « Se reconnecter » (48 px) vers CONNECT `?app=rapport` ; réouverture en ligne avec session expirée → écran de connexion avec « Se reconnecter ».
- **À VÉRIFIER sur Android** en préproduction : installation, ouverture en mode avion, saisie hors ligne, retour du réseau, reconnexion depuis l'application installée.
- **À VÉRIFIER : fichier logo carré** pour remplacer l'icône provisoire.
