---
project: avereo-connect
document_type: api-index
title: Contrats CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-11-24
owner: jpdandin
tags: [connect, documentation, preproduction]
---

## Création de Rapports Techniques — 24 novembre

Le [contrat machine](../backend/api/openapi.yaml) décrit PUT technical-report-creation et la carte facultative par compte de la réponse du catalogue. Le droit porte sur la création seulement ; les contrôles ordinaires des anciens dossiers restent inchangés. [Comportement, stockage et révocation](../docs/profils-et-droits.md#droit-de-création-rapport-technique--complément-du-24-novembre).

# Contrats CONNECT

La source machine est [backend/api/openapi.yaml](../backend/api/openapi.yaml).
Le contrat du [sas](../docs/application-gateway.md) complète les routes de lancement.
Ce répertoire est un index ; aucune seconde copie du contrat n'est maintenue.

Le [pont de création](identity-account-provisioning.yaml) renvoie le sujet natif OIDC ; [rattachement, compatibilité et limites](../docs/rattachement-identite.md).

## Confirmation d’activation

`GET /api/v1/identity/account-activation-complete` conserve sa signature et son contrôle d’expiration. Après réussite, la réponse 303 rejoint le pont signé de déconnexion Identité ; le retour autorisé rejoint la connexion CONNECT. Le pont manquant retourne 503 avant mutation. [Contrat de comportement](../docs/retour-activation-connexion.md).
