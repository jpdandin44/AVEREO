---
project: avereo-connect
document_type: roadmap
title: Suite CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-11-03
owner: jpdandin
tags: [connect, documentation, preproduction]
---

## 3 novembre — développement local en qualification

Les quatre fonctions sont codées et contrôlées localement. Prochaines étapes : MariaDB et interface, PR/CI, sauvegarde/restauration du candidat exact, puis accord et installation/recette préproduction. Aucun compte nominatif créé ni mail envoyé. [Reprise](docs/reprise-administration-comptes.md).


## Reprise du 3 novembre — préparation close

Le responsable demande de préparer le développement et la mise en préproduction du parcours de compte avant la démo de 9 h 30. Priorité : création sans notification automatique, applications explicites, période d’essai et invitation séparée. Réinitialisation administrative d’un mot de passe existant en suite. [Ordre de travail et critères](docs/reprise-administration-comptes.md). Aucun démarrage automatique, candidat installé ou accès réel déduit de cette préparation.


## Administration des comptes — cadrage à revoir

Création administrative, invitation séparée, réinitialisation via Drupal et période d’essai sont cadrées dans le [parcours des comptes](docs/administration-comptes.md). L’envoi/renvoi d’activation existe pour les comptes provisionnés ; création et échéance pilotées par l’interface restent à développer et à qualifier.


## RGA distincte — préproduction

La déclaration RGA et la copie initiale des droits sont implémentées, testées et activées en préproduction. La gestion des comptes présente une autorisation RGA indépendante de Rapport. Les versions, preuves de livraison et réserves sont conservées dans le [suivi canonique RGA](../avereo-app-rapport/api/rga.md). La revue humaine et toute promotion en production restent à effectuer.


# Suite CONNECT

Le [suivi du lot hébergé](../../outillage/acces-preproduction/suivi-chantier.json)
et celui de [Passeport Immo](../avereo-app-passeport-immo/docs/suivi-chantier.json)
gardent leurs périmètres distincts.

Le raccordement local reconnaît Passeport Immo et son sas testé. La suite est
la vérification authentifiée du portail installé, puis paramètres dédiés,
catalogue et droits ciblés, avec accords applicables et recette réelle.
La déclaration du responsable de mise en préproduction est une entrée de contrôle,
pas une preuve de version ou de parcours de cette nouvelle application.
