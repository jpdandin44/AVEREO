---
project: avereo
document_type: decisions
title: Décisions du dépôt AVEREO
status: active
version: git
created: 2026-10-03
updated: 2026-10-06
owner: jpdandin
tags: [avereo, documentation, local]
---

# Décisions du dépôt AVEREO

Les décisions existantes restent dans leurs sources de chantier.
Voir le [cadre Passeport Immo](architecture-v1/avereo-app-passeport-immo/decisions.md).
TBD : index des décisions globales ; aucune approbation humaine créée par l’agent.

## 2026-10-03 — Source commune du protocole de développement

Le responsable a choisi AVEREO comme dépôt de rattachement du socle transverse.
Les [décisions du socle](outillage/protocole-developpement/decisions.md) conservent le détail.
Le protocole reste indépendant des applications ; son installation utilisateur permet
l'appel dans les autres dépôts, avec leurs cibles et contrôles propres.

## 2026-10-06 — Accès privés aux préproductions

Le responsable a demandé dans « Cahier des charges AVEREO » de remplacer le
filtrage IP de consultation par des identifiants, CONNECT d’abord puis les autres
préproductions. Le [lot d’accès](outillage/acces-preproduction/README.md) conserve
la méthode et ses contraintes ; le [suivi](outillage/acces-preproduction/suivi-chantier.json)
conserve les preuves, limites et décisions de bascule. Aucun accord de merge
ou de production n’est déduit de ce choix.
