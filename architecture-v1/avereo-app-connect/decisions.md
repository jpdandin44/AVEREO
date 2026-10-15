---
project: avereo-connect
document_type: decisions
title: Décisions techniques CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-10-14
owner: jpdandin
tags: [connect, documentation, preproduction]
---

# Décisions techniques CONNECT

## 2026-10-14 — Lancement Passeport Immo

Contexte : préparation du raccordement après le lot documentaire approuvé.
Décision : ajouter ses clés de lancement à la configuration existante et réutiliser
le sas commun, sans changer les autorisations du portail ni créer de catalogue.
Raison : conserver le mécanisme HMAC et les contrôles métier des autres applications.
Conséquence : configuration, compte de recette et habilitation hébergés restent à qualifier.
Les accords humains restent dans les suivis canoniques, sans copie ici.
