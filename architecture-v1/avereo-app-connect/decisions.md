---
project: avereo-connect
document_type: decisions
title: Décisions techniques CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-11-02
owner: jpdandin
tags: [connect, documentation, preproduction]
---

## 2026-11-02 — Droits RGA indépendants

Contexte : après la première livraison du raccourci, le responsable demande une véritable application distincte et confirme la reprise initiale des droits de Rapport. Décision : utiliser le catalogue et les contrôles natifs de CONNECT ; copier une fois les habilitations et accès individuels, puis ne plus synchroniser. Raison : gérer RGA par compte dans l’administration existante. Conséquences : configuration privée, ticket et cookie dédiés ; contrôle de RGA également dans Rapport. [Contrat commun](../avereo-app-rapport/api/rga.md).


# Décisions techniques CONNECT

## 2026-10-14 — Lancement Passeport Immo

Contexte : préparation du raccordement après le lot documentaire approuvé.
Décision : ajouter ses clés de lancement à la configuration existante et réutiliser
le sas commun, sans changer les autorisations du portail ni créer de catalogue.
Raison : conserver le mécanisme HMAC et les contrôles métier des autres applications.
Conséquence : configuration, compte de recette et habilitation hébergés restent à qualifier.
Les accords humains restent dans les suivis canoniques, sans copie ici.
