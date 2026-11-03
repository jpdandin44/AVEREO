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

## Reset administratif — développement local

Bouton et service développés et contrôlés localement ; qualification SMTP/lien natif en préproduction après accord sur le candidat. Ne pas confondre avec le parcours de comptes déjà installé. [Procédure](docs/reinitialisation-mot-de-passe.md).


## 3 novembre — préproduction technique vérifiée

Les quatre fonctions sont installées sur le runtime `e76f3d77634bafb4056e3f753e31331bbaa613b2`, après sauvegardes et restaurations de contrôle. CI, isolement/expiration HTTP et formulaire d’initialisation sont contrôlés. Le compte métier est préparé sans mail. Suite : terminer son entrée HTTP nominative, envoyer l’invitation puis caler sept jours sur l’envoi enregistré ; réception et activation restent à confirmer. [État et limites](docs/administration-comptes.md).


## Historique — préparation close avant reprise du 3 novembre

Le responsable demande de préparer le développement et la mise en préproduction du parcours de compte avant la démo de 9 h 30. Priorité : création sans notification automatique, applications explicites, période d’essai et invitation séparée. Réinitialisation administrative d’un mot de passe existant en suite. [Ordre de travail et critères](docs/reprise-administration-comptes.md). Aucun démarrage automatique, candidat installé ou accès réel déduit de cette préparation.


## Historique — cadrage des comptes du 2 novembre

Création administrative, invitation séparée, réinitialisation via Drupal et période d’essai sont cadrées dans le [parcours des comptes](docs/administration-comptes.md). L’envoi/renvoi d’activation existe pour les comptes provisionnés ; création et échéance pilotées par l’interface restaient alors à développer et à qualifier.


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
