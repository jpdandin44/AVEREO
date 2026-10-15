---
project: avereo-connect
document_type: architecture
title: Architecture CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-10-14
owner: jpdandin
tags: [connect, documentation, preproduction]
---

# Architecture CONNECT

Le portail actuel est le backend PHP 8.3 dans `backend/` ; `frontend/` conserve
le prototype historique React. Le contrat natif est [OpenAPI](backend/api/openapi.yaml).
Le front controller charge la configuration privée ; sessions, CSRF et rôles
protègent les routes. Drupal fournit l'identité OAuth/PKCE. MariaDB/MySQL stocke
comptes, organisations, catalogue, accès et audit.

Le [sas applicatif](docs/application-gateway.md) émet un ticket HMAC court après
vérification de l'identité et des droits. Chaque application consomme le nonce et
crée sa session signée. La configuration reconnaît maintenant `passeport-immo`.
Elle ne crée ni entrée de catalogue ni habilitation sur un serveur.
