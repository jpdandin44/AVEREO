---
project: avereo-app-coupe
document_type: requirements
title: Exigences de Coupe et de son intégration locale
status: active
version: git
created: 2026-09-09
updated: 2026-09-09
owner: jpdandin
tags: [coupe, exigences, local]
---

# Exigences

## Fonctionnelles

- Ouvrir l'interface Coupe réelle depuis CONNECT avec un profil local autorisé.
- Conserver l'accès réel à Rapport et les simulations Projet, Thermo et Drone.
- Préserver les fonctions de dessin, import et export de l'interface historique.
- Revenir à la confirmation CONNECT lors de la déconnexion depuis l'iframe.
- Pouvoir retirer l'intégration Coupe locale sans effacer les données Rapport.

## Techniques et sécurité

- Ports de test liés à `127.0.0.1`, secrets locaux générés dans des fichiers ignorés.
- Refuser les accès directs non authentifiés, signatures altérées, tickets
  expirés, rejoués ou destinés à une autre application.
- Conserver les protections HTTPS/cookie de l'hébergement par défaut.
- Ne pas activer de base Coupe ni modifier le schéma, les comptes ou les secrets
  hébergés. Garder la sauvegarde locale par fichier dans cette étape.
- Respecter la checklist PR et les décisions humaines de merge/déploiement.

## Dépendances et limites

Le lanceur suppose les applications voisines dans le monorepo, Docker Desktop
Linux et Node.js compatible avec `frontend/package.json`. Les ports nécessaires
à Rapport doivent aussi être disponibles ; sa procédure reste la référence.

La recette locale prouve le passage du ticket et l'interface, pas le fonctionnement
des emails, de Drupal ni des règles réseau O2Switch. Le calendrier d'une éventuelle
activation de stockage Coupe local est **TBD — hors périmètre de ce lot**.
