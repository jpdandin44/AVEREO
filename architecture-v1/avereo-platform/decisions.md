---
project: avereo-platform
document_type: decisions
title: Décisions
status: active
version: git
created: 2026-11-04
updated: 2026-11-12
owner: jpdandin
tags: [avereo, acces, documentation]
---

# Décisions

## 12 novembre 2026 — Médaillon personnel centralisé dans CONNECT

Contexte : le responsable précise que le médaillon se règle dans les préférences du compte et doit suivre ses applications. Décision : une préférence par identité CONNECT, stockée dans le répertoire privé de l'environnement, avec lecture authentifiée et non dans le modèle public #137. Raisons : isolation des comptes, fonctionnement interapplications et absence de migration des données métier. Conséquences : un nouveau candidat/PR, contrôles de session/CSRF/contexte et CORS strict pour les seules lectures habilitées. Les préférences applicatives locales et l'autorisation globale du module Développements restent inchangées. Saisie unique autonome ne devient pas un client connecté. [Contrat et limites](docs/medaillon-personnel.md).

## 4 novembre 2026 — Réutiliser la politique privée CONNECT

Contexte : une durée temporaire doit s’appliquer aux applications choisies indépendamment du catalogue. Décision : relire la projection existante sur les tickets et les sessions déjà émises, en conservant l’identité signée. Ce mécanisme réutilise le stockage privé existant sans base ni service supplémentaire. Conséquence : raccorder chaque cible à la même politique avant d’activer la nouvelle administration. [Portée et limites](../avereo-app-connect/docs/acces-temporaires-applications.md).

## 6 novembre 2026 — Un menu natif pour HTML et React

Contexte : généralisation de Mon espace après PR #114. Décision : un Web Component sans dépendance nouvelle, des actions applicatives fournies par emplacements et une copie générée au build. Raisons : les applications utilisent React, des pages HTML intégrées et PHP. Conséquences : même présentation, contrôle de parité en CI et réutilisation des gestionnaires métier ; la copie publique CONNECT reste versionnée pour son paquet sans build Node. [Règle](docs/fonctionnalites-communes.md).

## 6 novembre 2026 — Même structure, contenu propre à l’application

Contexte : le premier menu de #119 ne fournissait pas une liste et des préférences dans toutes les applications métier. Le responsable demande cette extension dans #121 et confirme que CONNECT demeure un portail sans projets métier. Décision : réutiliser les listes existantes, ajouter des listes locales pour Thermo/RGA et définir les préférences par application. Raisons : préserver les stockages et éviter une synchronisation implicite. Conséquences : profil et catalogue communs ; nouveaux réglages limités au navigateur ; toute centralisation en ligne supplémentaire exige un lot distinct. La préparation de 37 fichiers de #119 devient historique ; reconstruire et qualifier le nouveau candidat avant livraison.

## 2026-11-06 — Identité commune, configuration réservée à l’organisation

Contexte : le responsable demande des livrables configurables et donne la priorité
à AVEREO. Décision : réutiliser le nom et le logo officiel dans une source commune,
puis centraliser les réglages d’entreprise avec administration par organisation.
Raison : éviter les identités divergentes et une modification libre par un membre.
Conséquences : aucune information légale inventée ; préférences individuelles
séparées ; contrôle serveur et isolement à qualifier dans un candidat ultérieur.
[Périmètre et limites](docs/identite-livrables.md).

## 2026-11-07 — Préparer l’immatriculation sans la devancer

Contexte : le responsable fournit les informations provisoires d’AVEREO et reporte
les numéros d’immatriculation. Décision : une source JSON d’entreprise, des champs
futurs vides et un affichage des seules valeurs renseignées dans les quatre formats.
Raison : compléter une seule source ultérieurement, sans valeurs fictives sur les
documents. Conséquences : la mention de formation reste explicite ; le formulaire
et le contrôle serveur de l’administration d’organisation restent un lot distinct.
[Source et limites](docs/identite-livrables.md).

## 7 novembre 2026 — Partir du dossier ouvert

Le responsable demande les quatre modèles et la génération depuis les applications. Le candidat lit les données déjà présentes et produit des documents datés. Cette première étape conserve la portée des dossiers actuels. Le répertoire interapplications nécessite un service privé, des autorisations par organisation et des identifiants stables. [Protocole des missions](docs/protocole-missions.md).
