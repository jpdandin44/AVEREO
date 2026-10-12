---
project: avereo
document_type: integration-contract
title: Contrat Composer du fournisseur d’identité de préproduction
status: active
version: git
created: 2026-10-06
updated: 2026-10-06
owner: jpdandin
tags: [oauth, composer, preproduction]
---

# Contrat Composer du fournisseur d’identité de préproduction

[composer.json](composer.json) et [composer.lock](composer.lock) sont les sources
natives du candidat préparé pour `auth-next-preprod.avereo.fr`. Ils proviennent
de la copie privée du contrat hébergé, complétée par les deux bibliothèques
exigées par Simple OAuth. Le verrou conserve tous les packages préexistants.
Le [suivi canonique](../suivi-chantier.json) porte les versions ajoutées,
empreintes, reçu de sauvegarde, autorisation et résultat de livraison.

Cette conservation ne fait pas de ce dossier une copie complète du site Drupal.
Le module Simple OAuth, Consumers, les thèmes, contenus, configuration privée,
clés et base ne sont pas inclus. Leur installation historique et le dépôt du
reste de l’instance restent à identifier. Le manifeste historique porte encore
le nom et les contraintes du template Drupal legacy ; ils sont conservés.

Utiliser le [script ciblé](../repair_identity.py) et la [procédure](../README.md#réparation-des-dépendances-du-fournisseur-didentité)
pour qualifier et appliquer le candidat. Une installation Composer générale avec
plugins/scripts actifs n’a pas été qualifiée. Le prochain déploiement de cette
instance doit conserver ce contrat et ne pas rétablir un vendor incomplet.
