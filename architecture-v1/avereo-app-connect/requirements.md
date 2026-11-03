---
project: avereo-connect
document_type: requirements
title: Exigences CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-11-03
owner: jpdandin
tags: [connect, documentation, preproduction]
---

## Périmètre implémenté localement le 3 novembre

Créer un compte membre, sélectionner ses applications, fixer une période ou un accès permanent, puis envoyer séparément l’invitation. L’essai temporaire de cette première version concerne Rapport/RGA ; aucun mot de passe géré par CONNECT. Vérifier les routes, les sessions ouvertes et le transport réel avant installation. [Critères et état](docs/administration-comptes.md).


## Reprise du 3 novembre — préparation close

Le responsable demande de préparer le développement et la mise en préproduction du parcours de compte avant la démo de 9 h 30. Priorité : création sans notification automatique, applications explicites, période d’essai et invitation séparée. Réinitialisation administrative d’un mot de passe existant en suite. [Ordre de travail et critères](docs/reprise-administration-comptes.md). Aucun démarrage automatique, candidat installé ou accès réel déduit de cette préparation.


## Administration des nouveaux comptes — demande du 2 novembre

Préparer un compte depuis CONNECT, choisir ses applications et sa période, puis envoyer séparément un lien personnel de définition du mot de passe géré par Drupal. Distinguer activation et réinitialisation d’un mot de passe existant ; tracer les états réels sans prétendre à une réception de mail. [Cadrage](docs/administration-comptes.md). Aucun nouveau parcours livré.


## RGA — 2 novembre 2026

Le responsable confirme une tuile RGA distincte et l’accès depuis Rapport. Les droits initiaux de Rapport doivent être repris exactement, refus et périodes de validité compris, puis gérés indépendamment. Rapport seul ne doit pas ouvrir RGA et RGA seule ne doit pas ouvrir Rapport. [Critères d’intégration](../avereo-app-rapport/api/rga.md).

# Exigences CONNECT

- Conserver identité Drupal/OAuth/PKCE, sessions, CSRF, rôles et refus par défaut.
- Lancement réservé aux comptes approuvés et aux droits applicatifs courants.
- Paramètres privés et dumps hors document root, Git et conversation.
- Migrations hébergées et déploiements distincts des PR de préparation.
- Reconnaître les clés URL/SECRET de Passeport Immo sans accorder de droit implicite.

Le [contrat OpenAPI](backend/api/openapi.yaml) et la
[qualification C7](docs/production-readiness-c7.md) portent les détails existants.
Runtime installé : `e76f3d77634bafb4056e3f753e31331bbaa613b2`. Recette technique et réserves dans [le parcours des comptes](docs/administration-comptes.md). Restent l’entrée HTTP nominative, l’invitation métier, sa réception et l’activation personnelle ; les dates définitives doivent suivre l’envoi effectif.
