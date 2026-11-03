---
project: avereo-connect
document_type: deployment-preparation
title: Préparation de livraison du parcours des comptes
status: active
version: git
created: 2026-11-03
updated: 2026-11-03
owner: jpdandin
tags: [connect, preproduction, comptes, restauration]
---

# Préparer le candidat de préproduction

## Condition d'exécution

Le responsable autorise la préparation du candidat et demande un **nouveau go après la démonstration** avant toute reprise hébergée. La précédente plage « après 11 h » n'est pas une autorisation automatique. Aucune bascule, migration persistante, configuration de secret, création de compte ou invitation ne doit être exécutée avant cette nouvelle confirmation. Les anciens accords et leurs périmètres restent historiques.

La source du parcours est [Administration des comptes](administration-comptes.md). La PR de préparation est [#96](https://github.com/jpdandin44/AVEREO/pull/96). La revue actuelle porte sur le candidat local ; la validation de préproduction viendra après installation et ne se déduit pas d'une CI verte.

## Écarts effectivement constatés

Le schéma de la préproduction ne contient pas `onboarding_status`. Les paramètres privés d'activation ne figurent pas dans la liste de clés observée. Le portail installé doit donc être rapproché du backend actuel avant livraison ; copier uniquement le formulaire serait incomplet.

Le contrôle MariaDB a utilisé des tables **TEMPORARY** clonées sur une connexion séparée. Les tables persistantes ont été comptées sur une connexion de contrôle : elles sont inchangées. Le contrôle intermédiaire a passé 36 vérifications, la migration de période et son retour arrière. La mise à niveau d'activation a été appliquée aux seules tables temporaires. Cela ne constitue pas une migration du site, une restauration complète de sauvegarde, un test de réception de mail ni une recette Drupal hébergée.

Deux erreurs de préparation des tests ont été corrigées : création temporaire via un nom intermédiaire avant renommage, puis nom de variable de contrôle distinct des variables du test inclus. Le second problème provoquait une alerte erronée de divergence des tables ; le contrôle corrigé confirme leur conservation. Les nouvelles protections sur les dates et les identités sont qualifiées par leurs tests et la CI du candidat final, sans réattribuer les résultats d'une ancienne tête.

## Les quatre phases

| Phase | État et résultat |
| --- | --- |
| Cadrage | Périmètre défini, cible et version hébergées à requalifier au go |
| Développement local | Code, tests, contrats, PR et paquet préparés ; CI rattachée à la tête exacte |
| Préproduction | En attente du nouveau go, sauvegarde/restauration et qualification hébergée restantes |
| Mise en production | Non autorisée ; dossier de suite conservé séparément |

## Composition du paquet à examiner

La génération locale produit un manifeste avec SHA source, arbre Git et empreinte SHA-256 de chaque fichier. Le paquet reste hors Git, dans l'archive privée liée au cockpit.

- `connect/public`, `connect/src`, `connect/bin` : portail/API, services et commandes natifs, à installer dans la racine réellement résolue de CONNECT.
- `connect/database/migrations` : migrations versionnées du dépôt. Relire les migrations déjà appliquées et leurs traces avant toute exécution ; ne pas appliquer aveuglément tout le dossier à une base existante.
- `drupal/avereo_identity_bridge` : module et formulaire d'activation, sans tests ni configuration sensible.
- `rapport/connect/gate.php` et `rapport/rga/connect-gate.php` : seulement les deux sas ; aucun remplacement des assets, cartes, dossiers ou paramètres de Rapport.

La copie hébergée de `connect/public/.htaccess` contient le chemin de configuration privée et la protection HTTP de préproduction. **La conserver intégralement** : le fichier générique du paquet est exclu de la copie effective. Son empreinte avant/après doit rester identique ; le reçu distingue cette exception des fichiers applicatifs installés. Le profil liste les applications autorisées indépendamment de la disponibilité de leur sas, conformément au comportement et au contrôle de non-régression du candidat ; ne pas réintroduire le filtre historique `available`, qui masquait aussi des droits valides.

Sont exclus : identités et cas réels, fixtures, tests, environnement local Docker, secrets, configurations privées, sessions, bases, fichiers de données et livrables Word. Le paquet ne lance pas le déploiement et n'inclut aucun secret de substitution.

## À faire au nouveau go

1. **Recontrôler les cibles.** Résoudre les document roots réels, versions PHP/DB, schéma et registre des migrations ; comparer les fichiers aux versions connues. Vérifier la compatibilité des profils d'identité et des clés privées existantes sans afficher leur contenu. Relever les données récentes et préserver les rapports.
2. **Sauvegarder et restaurer sur copie privée.** Fichiers/configurations CONNECT, module/configuration d'identité Drupal, base CONNECT et éléments Drupal concernés, deux sas/configurations Rapport/RGA. Vérifier les empreintes et une restauration avant remplacement. Les essais TEMPORARY déjà réalisés ne remplacent pas cette étape.
3. **Préparer la configuration privée.** Vérifier l'activation existante (`IDENTITY_ACCOUNT_ACTIVATION_URL` et son secret) et la confirmation correspondante côté Drupal. Ajouter le provisionnement (`IDENTITY_ACCOUNT_PROVISIONING_URL`, secret distinct) et la projection `TRIAL_ACCESS_POLICY_FILE`. L'activation et le provisionnement ne partagent pas de secret. Les valeurs restent sur le serveur.
4. **Initialiser la projection sans perte.** S'il n'existe aucun compte explicite, initialiser `{"version":1,"accounts":{}}` hors répertoire public, avec accès minimal. Sinon reconstruire intégralement depuis la base sous contrôle. Configurer `connect_trial_access_file` dans les deux applications. Ne jamais recréer une liste partielle après disparition du fichier.
5. **Qualifier la mise à niveau.** Après résolution des écarts, vérifier notamment la migration d'activation `20260804140000` et celle de période `20261103070000`. La première laisse les anciens comptes à `completed` ; elle ne doit pas forcer leur changement de mot de passe. Relire les autres écarts avant de choisir la commande native. Installer le même artefact vérifié, reconstruire le cache Drupal et contrôler les empreintes.
6. **Tester avec des identités de recette.** Création sans mail automatique, applications explicites, période, lien d'activation et formulaire, renvoi et expiration, session déjà ouverte, dossiers croisés, refus d'une autre application et compte témoin inchangé. Le transport mail réel utilise une boîte de recette autorisée à préciser ; le compte du participant ne sert pas de fixture.
7. **Ouvrir l'essai métier après qualification.** Lire les paramètres nominatifs confirmés dans le cockpit privé, vérifier le rôle et les deux droits, puis déclencher séparément l'invitation. Utiliser un profil personnel distinct pour les brouillons. Confirmer l'activation du destinataire sans annoncer une réception non observée.

## Retour arrière

La restauration doit être répétée avant ouverture de l'essai. Après création d'un compte explicite ou émission d'un cookie d'essai, ne pas supprimer les colonnes ni restaurer un ancien backend/sas qui supprimerait les restrictions. Maintenir une barrière serveur effective pour ces comptes et ces cookies avant toute récupération. Une régression de code ne justifie pas l'écrasement global d'une base ayant reçu de nouvelles données.

Un incident de publication de la projection laisse le compte explicite refusé : réconcilier depuis la base avant de rétablir l'accès. La suspension seule dans un ancien CONNECT ne révoque pas les cookies applicatifs déjà émis.

## Preuves à enregistrer

SHA et manifeste du candidat exact, CI, comparaison avec la base, nouveau go, sauvegardes fraîches et restauration, reçu d'installation, empreintes des fichiers hors lot, recette hébergée, état du compte et résultat de l'envoi. Les quatre validations humaines de PR restent au responsable. Aucun reçu hébergé n'est créé par ce document.
