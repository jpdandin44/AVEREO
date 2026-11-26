---
project: avereo-app-vision
document_type: decision
title: Médias privés et extension additive des types synchronisés
status: active
version: git
created: 2026-11-26
updated: 2026-11-26
owner: jpdandin
tags: [vision, medias, stockage, migration]
---

# Médias privés du lot 3A

Date : 2026-11-26. Contexte : le [brief T-10](../codex/briefs/T-10-terrain-donnees.md) sépare les métadonnées synchronisées et les octets des photos. Les relevés concernent des logements privés.

Décision du responsable : stockage O2Switch dans un dossier privé hors racine web, lecture par l'API après contrôle de session et de droits. Aucune dépendance ni transmission à un service externe. Les blobs locaux restent dans la base Dexie cloisonnée par identité.

Le schéma livré utilise un ENUM à quatre valeurs dans `vision_objects.kind` et `vision_sync_log.kind`. L'interdiction initiale de changer ces tables rendait impossible l'ajout des deux types. Le responsable a répondu « Oui, étendre » et autorisé uniquement l'ajout final de `photo` et `commentaire`, sans changement des données ou des autres colonnes.

Décision technique : migration 003 réservée à la création idempotente de `vision_media`, migration 004 distincte pour les deux extensions d'ENUM. Leurs ordres existants et ordinaux sont conservés. Réexécuter le même ALTER est sans effet logique sur les données ; l'exécuteur normal évite aussi les réapplications par empreinte. Le test vérifie données et autres colonnes avant/après deux passages. Qualification MySQL encore requise avant livraison.

Conséquences : la nouvelle API exige les migrations et la clé privée `media_directory` avant toute livraison ultérieure. Aucune migration existante n'est réécrite. Les octets des médias supprimés restent en place jusqu'à une purge future hors périmètre.
