---
project: avereo
document_type: requirements
title: Exigences du dépôt AVEREO
status: active
version: git
created: 2026-10-03
updated: 2026-10-06
owner: jpdandin
tags: [avereo, documentation, local]
---

# Exigences du dépôt AVEREO

Les exigences sont décrites dans chaque sous-projet. La maquette racine est historique
et ne remplace pas le comportement du frontend React repris.
Voir [Passeport Immo](architecture-v1/avereo-app-passeport-immo/requirements.md).
Contraintes : préserver les sources et les validations humaines. TBD : consolidation globale.

Le [protocole commun](outillage/protocole-developpement/requirements.md) doit être
réutilisable hors de ce monorepo, avec un suivi canonique propre à chaque projet
et les accords humains applicables. Sa disponibilité ne prouve pas l'installation
d'une CI ou d'une préproduction dans chaque dépôt.

Les [exigences d’accès aux préproductions](outillage/acces-preproduction/README.md#objectif-et-frontières)
portent sur des comptes de consultation, HTTPS, la conservation des droits
applicatifs et une recette par environnement. CONNECT est le pilote demandé.

Avant production, le responsable demande la cohérence de toutes les applications.
La qualification doit identifier la référence et l’empreinte de chaque candidat,
vérifier son lancement depuis CONNECT, ses droits, sa configuration de recette et
son stockage, puis comparer au contenu effectivement hébergé. Une PR ouverte,
un merge, une compilation ou un refus anonyme ne constitue pas une recette complète.
Les sauvegardes, restaurations et validations gardent une portée par cible/version.
