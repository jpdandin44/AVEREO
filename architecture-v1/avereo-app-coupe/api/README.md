---
project: avereo-app-coupe
document_type: api
title: API et intégration CONNECT de Coupe
status: active
version: git
created: 2026-09-09
updated: 2026-09-09
owner: jpdandin
tags: [coupe, api, connect]
---

# API et intégration

Les sources exécutables sont dans [frontend/public/api](../frontend/public/api/)
et [frontend/public/connect](../frontend/public/connect/). Aucun contrat OpenAPI
n'est actuellement fourni ; ne pas considérer cette page comme un schéma exhaustif.

| Point d'entrée | Entrée / sortie principale | Contrôle |
| --- | --- | --- |
| `/connect/entry.php` | Ticket HMAC → cookie et redirection vers `/` | Signature, application, durée, identité, anti-rejeu |
| `/api/auth.php?action=config` | Mode d'authentification public, sans secret | Cookie du sas |
| `/api/auth.php?action=me` | Identité minimale CONNECT et rôle Coupe | Cookie et identité signés |
| `/api/health.php` | État de configuration, sans identifiants | Public, ne prouve pas seul l'accès métier |
| `/api/projects.php` | Projets JSON et opérations SQL existantes | Sas, identité, droits, configuration de base |
| `/connect/logout.php` | Effacement du cookie Coupe, retour au portail | URL de portail validée côté serveur |

En local sans base Coupe, le healthcheck indique `databaseConfigured=false`,
`authConfigured=true`, `authMode=connect_gateway`. Les endpoints de sauvegarde
en ligne ne sont donc pas utilisables. Une réponse HTTP 200 de santé ne constitue
pas une preuve de sauvegarde réussie.

L'intégration hébergée existante est décrite dans
[la procédure de bascule CONNECT](../docs/preproduction-connect-cutover.md).
