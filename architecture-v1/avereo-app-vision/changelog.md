---
project: avereo-app-vision
document_type: changelog
title: Évolutions de Vision
status: active
version: git
created: 2026-11-26
updated: 2026-11-26
owner: jpdandin
tags: [vision, deploiement]
---

# Évolutions de Vision

## 2026-11-26 — T-10, données terrain du lot 3A

Modèle et calculs des cotes laser, photos et commentaires ciblés, suppressions/détachements et renumérotation ; nouveaux objets synchronisés et validation serveur ; API privée des images, migration 003 et extension additive 004 des deux ENUM explicitement autorisée. Dexie v2 conserve les données v1 et ajoute les blobs ; service médias sans écran, compression et empreinte, reprise après acquittement et erreurs de session. Contrat, configuration et procédure de déploiement complétés. Aucun déploiement exécuté. [Résultats et réserves](docs/terrain-donnees-verification.md), notamment PHP/MySQL non exécutés dans cette session.

## 2026-11-26 — T-08, préparation locale

Ajout du workflow de déploiement manuel préproduction/production, avec vérification sans secret pour les PR. Scripts de validation du paquet et de son empreinte, contrôle de promotion du même SHA, transmission privée des migrations, vérifications HTTPS et tests associés. Procédure manuelle conservée comme secours. Aucun déploiement exécuté.

Les [preuves et limites](docs/deploiement-automatise-verification.md) distinguent les contrôles locaux réussis, la qualification PHP 8.3/MySQL 8.4 restante et le commit bloqué par les permissions Git de la session. Le [suivi canonique](data/suivi-vision.json) conserve les validations et décisions antérieures.

## 2026-11-26 — T-09, compte et reconnexion

Portail CONNECT validé et public dans auth 200/401 ; bouton et bandeau de reconnexion, menu commun sans missions/préférences, déconnexion GET vers CONNECT. Copie exacte du composant et du logo. Configuration et recette locales adaptées, contrôle privé renforcé, tests ajoutés. Session inchangée (1800 s), aucune donnée locale supprimée. Voir R49 et la recette locale pour les réserves mobiles.

## 2026-11-26 — T-11, interface terrain locale

Cotes laser liées aux murs/sommets, capture et choix de photos, miniatures et dialogues, repères plan déplaçables, commentaires ciblés, suppression/détachement communs et insertion préservant les commentaires. Écritures par useReleve, fichier photo durable avant objet, états des médias et erreurs visibles. Tests Node de logique écran ; aucune dépendance, modification serveur ou déploiement. [Preuves et réserves](docs/terrain-interface-verification.md). Socle documentaire indexé par README sans duplication des sources existantes.
