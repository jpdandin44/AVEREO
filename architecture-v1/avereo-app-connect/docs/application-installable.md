---
project: avereo-connect
document_type: guide
title: CONNECT installable sur Android
status: active
version: git
created: 2026-11-27
updated: 2026-11-27
owner: jpdandin
tags: [connect, pwa, android, preproduction]
---

# CONNECT installable sur Android

Le portail CONNECT peut être ajouté à l'écran d'accueil d'un téléphone Android (Chrome) et s'ouvre en plein écran. Sans réseau, il affiche une page « Hors ligne » au lieu d'une erreur du navigateur. Demande du responsable du 27/11/2026, pour les essais terrain de Vision et Rapport sur Android ; iPhone hors périmètre pour l'instant.

## Ce qui est livré

| Fichier (`backend/public/`) | Rôle |
| --- | --- |
| `manifest.webmanifest` | Nom « AVEREO CONNECT », affichage plein écran, couleur #002B45, icônes 192 et 512 px (dont une « maskable ») |
| `sw.js` | Service worker minimal : met en cache la seule page `hors-ligne.html` et une icône ; n'intercepte que l'ouverture de `/` |
| `hors-ligne.html` | Page affichée sans réseau, avec libellé, icône et bouton « Réessayer » (48 px) |
| `icons/connect-*.png` | Icônes provisoires (« C » géométrique blanc sur bleu nuit), produites par `scripts/icones-application.mjs` |
| `index.html` | Lien vers le manifeste, couleur de thème, enregistrement du service worker |
| `.htaccess` | Type `application/manifest+json` pour le manifeste |

## Ce qui ne change pas

- Aucune page du portail ni réponse d'API n'est mise en cache : le portail dépend de la session et des droits du moment.
- L'identification, la session (30 min d'inactivité, 12 h au plus) et « Rester connecté avec mon compte » sont inchangés.
- Aucune dépendance ajoutée ; aucune migration ; aucun changement de l'API.
- Sans réseau, on ne peut ni se connecter ni lancer une application depuis CONNECT. Vision et Rapport installés s'ouvrent seuls et gardent leurs données sur le téléphone.

## Vérification

- `php backend/tests/run.php` : test « portal is installable on Android without caching session data » (manifeste, tailles réelles des icônes PNG, service worker limité à la page d'accueil et sans `cache.put`, page hors ligne).
- Navigateur local (`php -S` sur `backend/public`) : service worker actif, page hors ligne et icône en cache ; serveur arrêté → « Hors ligne » affiché.
- **À VÉRIFIER sur Android (Chrome)** en préproduction : proposition d'installation, ouverture en plein écran, page hors ligne en mode avion, lancement de Vision et Rapport depuis l'application installée.
- **À VÉRIFIER : fichier logo carré** pour remplacer l'icône provisoire.
