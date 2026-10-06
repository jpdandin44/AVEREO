---
project: avereo
document_type: architecture
title: Architecture du dépôt AVEREO
status: active
version: git
created: 2026-10-03
updated: 2026-10-06
owner: jpdandin
tags: [avereo, documentation, local]
---

# Architecture du dépôt AVEREO

Les composants existants sont dans `architecture-v1/`. Leur documentation locale fait foi.
Voir [le catalogue existant](architecture-v1/avereo-platform/docs/applications.md),
[CONNECT](architecture-v1/avereo-app-connect/README.md),
[Projet et revue](architecture-v1/avereo-app-projet/api/revue-locale.md)
et [le nouveau sous-projet](architecture-v1/avereo-app-passeport-immo/architecture.md).
TBD : audit global code/documentation ; les domaines déclarés ne prouvent pas la production.

Le [socle transverse](outillage/protocole-developpement/architecture.md) contient le
protocole, les skills et le contrôleur de passage. AVEREO en héberge la source ;
l'installation au niveau utilisateur le rend disponible dans les autres dépôts.
Les opérations et données métier restent dans les projets concernés.

Le [lot d’accès aux préproductions](outillage/acces-preproduction/README.md)
définit une couche HTTP de consultation, appliquée au pilote CONNECT et distincte de l’identité Drupal/CONNECT
et des habilitations métier. Son relevé décrit les racines hébergées observées ;
aucune surcouche Basic indifférenciée n’est appliquée aux fournisseurs d’identité.
