---
project: avereo-app-passeport-immo
document_type: integration-addendum
title: Cycle de vie CONNECT — actualisation du 4 novembre
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [connect, integration, historique, preuves]
---

# Cycle de vie CONNECT — actualisation du 4 novembre

Le paragraphe suivant provient du guide d’intégration dans `main` à
`16338e844912fade2a5e8b315b8313fe6f7e2dbd`. Ajouté le 4 novembre, il est déplacé
ici le 12 novembre afin de restaurer les octets de la référence historique
[approuvée le 15 octobre](02-integration-connect.md). Aucun changement de code,
de compte, d’habilitation ou de livraison CONNECT n’est effectué par ce déplacement.

## Cycle de vie CONNECT — candidat local

Lorsque `connect_trial_access_file` pointe vers la politique privée de la même cible, Passeport Immo contrôle l’identité signée et la date d’émission sur les tickets et les sessions. Un compte archivé ou un ancien ticket après restauration est refusé. Les anciens cookies anonymes doivent être renouvelés à l’activation. Les comptes absents de la politique gardent leur accès par ticket signé, sous réserve des contrôles du portail. L’archivage et la suppression CONNECT ne suppriment pas les dossiers Passeport Immo. [Règles de gestion et préparation](../../avereo-app-connect/docs/administration-comptes.md#alignement-des-comptes-non-propriétaires--candidat-local).

Cette description de candidat n’est pas une preuve d’installation sur une cible.
Les autres évolutions du menu et de la navigation restent dans
[l’annexe Mon espace](source-audit-mon-espace.md).
