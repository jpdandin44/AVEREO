---
project: avereo-app-passeport-immo
document_type: source-audit
title: Annexe de parité UX/UI Bibliothèque
status: active
version: git
created: 2026-11-24
updated: 2026-11-24
owner: jpdandin
tags: [passeport-immo, ux-ui, bibliotheque]
---

# Écart m — Bibliothèque et navigation du bien

Cette annexe complète [l’audit historique gelé](source-audit.md), sans le modifier. Le lot du 24 novembre fait évoluer la présentation de App.jsx, DocumentsPanel, Sharing et import-files, avec DocumentPreview et une feuille de style locale à Passeport Immo. Les autres applications et le composant de compte commun restent inchangés.

Le fichier [ux-ui-parity.json](../tests/ux-ui-parity.json) décrit huit substitutions exactes du conteneur App.jsx, comparées à la base `5f59740`. [check-parity.mjs](../tests/check-parity.mjs) les inverse avant de conserver son contrôle intégral historique : aucune ligne de calcul, de persistance ou d’export PDF n’est soustraite au contrôle. Les tests d’interface et d’export utilisent les nouvelles rubriques. Le placement du retour conditionnel de BienModal après ses hooks corrige l’avertissement React observé lors du parcours ; les champs et gestionnaires restent les mêmes.

DocumentsPanel conserve le dépôt documentaire existant et les mêmes mutations. DocumentPreview ouvre les PDF/images à la demande et libère les URL temporaires ; aucune archive n’est extraite. La reprise d’import utilise le compteur des fichiers confirmés et conserve la catégorie initiale. SharedDocuments reçoit les nouvelles données sans remonter son panneau, tout en le retirant en cas de refus. Les vérifications et leurs limites sont dans le [guide de recette](ux-ui-bibliotheque.md) et le [reçu local](../api/ux-ui-local-observation.json).

Aucun schéma, contrat d’API, secret, droit, tâche planifiée, donnée réelle ou déploiement modifié. Le stockage serveur et CONNECT doivent encore être requalifiés sur la cible pour ce candidat ; les essais locaux ne créent aucune acceptation humaine.
