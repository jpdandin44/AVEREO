---
project: avereo-app-passeport-immo
document_type: source-audit
title: Écart Mon espace dans Passeport Immo
status: active
version: git
created: 2026-11-06
updated: 2026-11-08
owner: jpdandin
tags: [passeport-immo, parite, mon-espace]
---

# Écart Mon espace

L’[audit historique](source-audit.md) et la [reprise identique](01-reprise-identique.md)
sont des preuves approuvées dont les empreintes sont conservées par le cockpit.
Cette annexe décrit le nouvel écart autorisé pour toutes les applications ; elle
ne modifie ni les octets de ces preuves ni les décisions humaines antérieures.

| Élément | Écart du candidat | Conservation vérifiée |
| --- | --- | --- |
| En-tête | Menu partagé Mon espace | Navigation Mes biens existante |
| Compte et applications | Liens vers CONNECT du même environnement | Aucun droit créé par l’interface |
| Administration | Libellé Administration de l’application dans le menu | Contrôle du rôle natif conservé |
| Déconnexion | Action native placée en dernière position | Gestionnaire et confirmation existants conservés |
| Livrable | Copie générée account-menu.js et métadonnée du portail | Configuration publique d’envoi .user.ini conservée |
| Accès au script commun | Chemin exact account-menu.js servi par le contrôleur protégé | Session requise, type JavaScript, no-store et refus sans réécriture vérifiés |
| Métier | Aucune modification des calculs/imports/exports/documents | 29 tests et contrôle de parité existant réussis |

[Règle commune](../../avereo-platform/docs/fonctionnalites-communes.md) ·
[Qualification transversale](../../avereo-platform/docs/qualification-mon-espace.md).
La recette hébergée et les validations humaines restent à réaliser pour ce candidat.

La recette Apache isolée compte 74 contrôles, dont la récupération du script commun
après connexion et son refus sans session ou sous fermeture de préproduction.
Les contrôles de stockage sur MariaDB fictive réussissent : 30 API, 22 sauvegardes
planifiées et 35 transferts de bien. Ils ne modifient aucun compte hébergé.

## 6 novembre 2026 — Extension de PR #121

Mes projets reprend la liste native des biens. Les préférences de ce navigateur règlent le tri par adresse et l’affichage de la composition ; les biens et documents conservent leur stockage existant. Mon compte et Mes applications ouvrent CONNECT.

Les contrôles actualisés sont dans la [qualification transversale](../../avereo-platform/docs/qualification-mon-espace.md). Les preuves précédentes restent attachées à leur candidat.

Le contrôle de parité inverse explicitement les sept substitutions du menu et des préférences de #121, puis compare toujours le reste à la source historique. Une mutation témoin hors de ces substitutions doit être refusée ; les calculs, imports, exports et stockages restent sous le contrôle existant.

## 8 novembre 2026 — Modèle commun

Le bouton Mon compte rejoint le bas gauche. Le bandeau supérieur indique la sauvegarde du bien selon son mode serveur ou démonstration. Le contrôle de parité vérifie les substitutions exactes, y compris sur l’écran de connexion. [Matrice des actions du candidat](../../avereo-platform/docs/modele-affichage.md).

Le frontal PHP sert le seul PNG officiel après vérification de la session, y compris en requête HEAD. Le test Apache vérifie son contenu, son type MIME et le refus des autres PNG.
