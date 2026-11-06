---
project: avereo-app-passeport-immo
document_type: source-audit
title: Écart Mon espace dans Passeport Immo
status: active
version: git
created: 2026-11-06
updated: 2026-11-06
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
| Métier | Aucune modification des calculs/imports/exports/documents | 29 tests et contrôle de parité existant réussis |

[Règle commune](../../avereo-platform/docs/fonctionnalites-communes.md) ·
[Qualification transversale](../../avereo-platform/docs/qualification-mon-espace.md).
La recette hébergée et les validations humaines restent à réaliser pour ce candidat.
