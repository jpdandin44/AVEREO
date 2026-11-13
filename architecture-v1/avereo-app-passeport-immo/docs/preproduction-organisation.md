---
project: avereo-app-passeport-immo
document_type: deployment-and-acceptance
title: Livraison privée de la corbeille et du classement
status: active
version: git
created: 2026-11-13
updated: 2026-11-13
owner: jpdandin
tags: [preproduction, documents, corbeille, recette]
---

# Livraison privée de la corbeille et du classement

## Cadrage

Le responsable demande le déploiement privé après fusion de la
[PR153](https://github.com/jpdandin44/AVEREO/pull/153). Le
[suivi canonique](../data/suivi-organisation-documents.json) conserve cet accord
pour la seule préproduction. Les validations antérieures ne sont pas réattribuées
à la recette hébergée du nouveau candidat.

## Développement local

Le paquet CI gelé de `fb0c259b8f6e7cff68b27576c242527be5ddaa4b` porte le SHA-256
`ad0b3f1ae198f51aa253af74be8941e6407228d8899b1de7dd47d411adc48a3e` et dix-huit
chemins. Les sources exécutables sont identiques à celles du merge PR153
`fb2dcafbff6d9eeb408b47f9243b6b4482f7908f`. Les vingt-sept contrôles réussissent ;
la description fusionnée passe la policy stricte, avec quatre cases humaines
réellement cochées. Le [guide fonctionnel](organisation-documents.md) conserve
la qualification isolée et les dix critères O1–O10.

Le [livreur ciblé](../workflows/release-document-organisation-preproduction.py)
réutilise le moteur de livraison existant pour la seule application. Il fixe
l’artefact et les empreintes des deux API antérieures à remplacer. Il refuse un
écart sur les fichiers protégés, même lorsqu’une opération prévoit de les conserver.
Quatre tests supplémentaires contrôlent ces protections ; les trente-deux tests
Python du module réussissent.

## Préproduction

Entrée de revue : [CONNECT — Passeport Immo](https://connect-preprod.avereo.fr/?app=passeport-immo).
Cible : [Passeport Immo privé](https://passeport-immo-preprod.avereo.fr/).
Le [reçu factuel](../api/preproduction-organisation-observation.json) porte
l’état courant et les dates des vérifications. Ne pas déduire une revue humaine
hébergée de la réussite de ces contrôles techniques.

### Sauvegarde, copie et migration

La sauvegarde fraîche comprend quatre tables et **vingt-huit documents privés**,
soit 418 758 362 octets. Les quinze documents ajoutés depuis la précédente livraison
sont inclus. Les fichiers sont relus par empreinte et les lignes restaurées dans
des tables temporaires. Le candidat puis l’ancien code sont appliqués sur une
copie privée avec vérification des octets et permissions.

La [qualification de migration](../workflows/qualify-organisation-preproduction.php)
recrée quatre tables temporaires de connexion avec la définition obtenue par
`LIKE`, puis masque leurs noms réels dans cette seule connexion. MariaDB refuse
`LIKE` avec un nom source et destination identique ; renommer vers un nom réel
exige aussi un droit CREATE absent. La définition temporaire est donc réutilisée
pour créer directement chaque masque ; son caractère TEMPORARY est vérifié avant
toute insertion. Les deux premières tentatives ont échoué avant tout changement
métier. La répétition finale réussit : migration additive, réglages, corbeille,
restauration d’une archive et purge d’un fichier fictif. Une connexion indépendante
compare ensuite toutes les lignes réelles à la sauvegarde.

L’utilisateur SQL applicatif ne possède pas ALTER. L’administration phpMyAdmin
existante de cPanel applique uniquement deux ajouts dans la base dédiée confirmée
par la configuration : `pi_documents.trashed_at VARCHAR(32) NULL` et
`pi_biens.document_settings LONGTEXT NULL`. Aucun privilège n’est ajouté.
La migration originale relit ensuite types, nullabilité, données et idempotence,
sans DDL supplémentaire. Aucune colonne n’est supprimée.

### Installation et contrôle

Six écritures livrent le même paquet : trois remplacements (index et deux API),
trois nouveaux fichiers compilés ; douze chemins restent identiques. Le code
antérieur et ses fichiers compilés sont conservés. Configuration privée,
production et cron font l’objet de comparaisons avant/après.

La [recette HTTPS](../workflows/verify-organisation-preproduction.php) vérifie
deux sessions issues de tickets CONNECT normaux et télécharge chaque document
avec calcul progressif de taille et d’empreinte. Elle ne charge pas un rapport
volumineux entier en mémoire. Elle vérifie les contrats réglages/corbeille, les
refus anonymes, les tickets invalides et les écritures sans CSRF. Les fichiers et
les valeurs métier initiales sont comparés à la sauvegarde.

Les mutations positives sont exercées sur copies temporaires et en CI ; les
documents réels ne sont ni mis à la corbeille ni purgés pour une démonstration.
Cette recette ne prétend pas vérifier une nouvelle saisie de mot de passe Drupal.
Les droits du compte secondaire restent ceux réellement fournis par CONNECT : il n’est pas éligible au lancement lors de ce contrôle, donc aucun accès ne lui est ajouté.

Résultat : **247 assertions HTTPS réussies**, 28 téléchargements exacts, 17 documents actifs et 11 archivés répartis sur deux biens. Le navigateur retrouve le bien SCI avec six actifs et trois archives, les dossiers repliables, les commandes Monter/Descendre, huit icônes et les couleurs, ainsi qu’une corbeille vide. Les deux sauvegardes restaurées comprennent les 28 documents ; celle réalisée après migration contient le nouveau schéma. La recette humaine reste ouverte.

### Vérification par le responsable

1. Rouvrir Passeport Immo depuis CONNECT et ouvrir **Documents** du bien voulu.
2. Retrouver les fichiers sous leurs dossiers de catégorie ; replier et déplier
   un dossier, puis vérifier recherche et filtre.
3. Ouvrir **Personnaliser les catégories**, choisir une icône et une couleur, enregistrer et
   rouvrir le bien pour constater leur conservation.
4. Utiliser **Monter / Descendre** sur deux documents d’une même catégorie,
   sans recherche active, puis rouvrir pour vérifier l’ordre.
5. Ajouter un petit document fictif clairement nommé. Le mettre à la corbeille,
   rouvrir **Corbeille**, le restaurer et vérifier son téléchargement.
6. Avec ce seul fichier fictif, ouvrir puis annuler la suppression définitive.
   Si souhaité, le remettre à la corbeille et confirmer sa suppression pour
   contrôler le cycle complet. Ne pas utiliser un document client pour cet essai.
7. Vérifier que l’import des archives entières reste limité à **500 Mo par fichier**
   et que les documents existants restent consultables et téléchargeables.

La [PR155 de revue hébergée](https://github.com/jpdandin44/AVEREO/pull/155) réunit ce reçu et les outils opératoires. Ses quatre cases sont réservées au responsable après les vérifications ci-dessus.

### Retour arrière

Le code antérieur est restaurable sous contrôle de ses empreintes et de celles
des fichiers installés. Le livreur refuse ce retour dès qu’un nouveau champ
contient une valeur non nulle : un ancien code pourrait réafficher des documents
en corbeille ou perdre les réglages. Après utilisation, privilégier un correctif
conservant ces fonctions. Ne pas restaurer une ancienne base sur des données
récentes et ne pas retirer les colonnes. Le test de retour de code a lieu sur
copie ; aucun rollback réel n’est déclenché pendant la livraison réussie.

## Mise en production

Aucune livraison en production ni ouverture publique de ce lot. La recette humaine
de cette version en préproduction reste à effectuer, puis les accords applicables
à sa production. Les anciennes décisions, la migration SCI et les tâches de
sauvegarde existantes restent conservées.
