---
project: avereo-connect
document_type: prompt
title: Reprendre le lot de création et invitation des comptes
status: active
version: git
created: 2026-11-02
updated: 2026-11-02
owner: jpdandin
tags: [connect, comptes, reprise, preproduction]
---

# Reprendre le lot de création et invitation des comptes

## Objectif

Réaliser le parcours de création des nouveaux comptes CONNECT et préparer son installation contrôlée en préproduction.

## Contexte

Lire [la reprise](../docs/reprise-administration-comptes.md) et [les exigences fonctionnelles](../docs/administration-comptes.md). Le lot est préparé, non développé pour l'administration ; les contrôles d'essai Rapport/RGA sont locaux. Une démonstration est prévue à 9 h 30 le 3 novembre 2026, sans garantie que le nouveau parcours puisse être qualifié avant.

## Entrées

Instructions AGENTS applicables, copie et branche de la fiche, suivi canonique privé et paramètres de l'essai. Relire l'état Git et la cible actuelle avant toute mutation.

## Instructions

Suivre les quatre phases du protocole GitHub/cockpit. Préserver les modifications locales. Implémenter en priorité création sans mail, droits explicites, période et invitation séparée ; réutiliser le fournisseur d'identité Drupal et le service d'activation. Qualifier les échecs et les sessions déjà ouvertes. Mettre à jour les contrats réellement implémentés, les tests et la documentation. Préparer la PR et le candidat exact avant tout passage hébergé.

## Contraintes

Aucune donnée nominative, clé ou lien personnel dans Git. Aucun mot de passe choisi pour l'utilisateur. Ne pas lancer l'essai réel avant qualification. Réutiliser les autorisations dans leur portée ; ne pas déduire merge, installation ou ouverture d'un succès technique. Respecter la clôture : cette source ne déclenche pas de reprise automatique.

## Sources autorisées

Code, schémas, contrats actifs, preuves et décisions du cockpit ; les intitulés de route proposés restent des propositions jusqu'à implémentation.

## Format de sortie

Résultat concret, preuves locales/hébergées séparées, candidat et PR, état du compte et de l'envoi, réserves et prochaine action. Bilan documentaire concis.

## Tests

Appliquer A1 à A12 et les commandes de la reprise, sur leurs cibles autorisées. Un test destructif de fixture n'est jamais exécuté sur la base hébergée.

## Historique des versions

Git constitue l'autorité ; préparation initiale le 2 novembre 2026.
