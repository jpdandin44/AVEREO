---
project: avereo-connect
document_type: decisions
title: Décisions techniques CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-11-03
owner: jpdandin
tags: [connect, documentation, preproduction]
---

## 2026-11-03 — Réutiliser le reset natif Drupal

Contexte : l’administration n’expose que l’invitation initiale. Décision : une action distincte pour les comptes initialisés, via le pont signé existant et le mail natif Drupal. Raisons : éviter un deuxième système de jetons et conserver le mot de passe chez l’identité. Conséquences : quota et envoi audité, aucune migration ni prolongation des droits ; recette hébergée séparée. [Détail](docs/reinitialisation-mot-de-passe.md).


## 2026-11-03 — Droits explicites et invitation séparée (implémenté localement)

Les nouveaux comptes créés depuis l'administration reçoivent le rôle membre et une liste explicite d'applications ; l'héritage reste inchangé pour les comptes historiques. La création ne déclenche pas de mail. Le fournisseur d'identité garde le mot de passe et le formulaire d'activation. La période est conservée dans CONNECT puis projetée dans un fichier privé partagé par les sas Rapport/RGA ; un échec de synchronisation reste fermé. Conséquence : l'essai temporaire de cette première version est limité aux deux applications dont les sessions ouvertes sont contrôlées. Ce choix ne vaut ni revue humaine ni livraison. [Périmètre et preuves](docs/administration-comptes.md).


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
