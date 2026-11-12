---
project: avereo-app-passeport-immo
document_type: deployment-and-acceptance
title: Livraison privée des archives après PR144
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [preproduction, archives, recette, sauvegarde]
---

# Livraison privée des archives après PR144

## Cadrage

Le responsable demande explicitement la livraison en préproduction après fusion
de la PR144. Le merge `28f24cdd475f6b4989eee41eeb0576d86b7a5f62` est vérifié,
ainsi que les quatre attestations humaines et la policy stricte. L’artefact CI
reste celui qualifié depuis `0a3eacf04b3cbdcaa756980a86e58ba3630237dc`, SHA-256
`7baca4c4be6fa3cac93444714aff9c50b41681c7b850f4362192df2a53fd1352` ; les
compléments documentaires et le merge n’en modifient pas les fichiers applicatifs.

## Développement local

Le [livreur limité à ce lot](../workflows/release-archives-preproduction.py)
réutilise le moteur partagé sans modifier ce dernier. Il impose la seule cible
Passeport Immo et cette empreinte d’archive. Les autres applications et la
production restent exclues des écritures.

L’inventaire hébergé révèle deux composants plus anciens que ceux du paquet
accepté : `connect/gate.php` et `account-menu.js`. Leurs sources publiques sont
comparées à la version revue ; les seules empreintes normalisées observées
peuvent être remplacées. Toute autre divergence de ces composants ou d’un fichier
d’accès est bloquante. `.htaccess`, paramètres privés, limites PHP et fichiers
non listés sont préservés. La politique CONNECT privée est déjà configurée ;
la recette doit donc vérifier les comptes existants avec le nouveau sas.

Les six tests ciblés couvrent le périmètre d’une application, l’archive imposée,
les composants reconnus, le refus d’une dérive, le retour arrière sur copie et
la conservation des fichiers actifs. Le moteur partagé conserve ses onze tests.
La source de sauvegarde existante est réutilisée, sans migration SQL.

## Préproduction

Cible : [Passeport Immo privé](https://passeport-immo-preprod.avereo.fr/), ouvert
depuis [CONNECT préproduction](https://connect-preprod.avereo.fr/?app=passeport-immo).
Document root : `/home/daje3540/passeport-immo-preprod.avereo.fr/public`,
comparé au domaine déclaré par cPanel avant écriture.

La préparation du 12 novembre à 16:26 UTC vérifie une sauvegarde des quatre tables
et des treize documents, avec empreintes des fichiers et restitution des lignes
dans des tables temporaires. Aucun enregistrement métier actif n’est modifié.
Le candidat est posé sur une copie puis retiré : l’arbre initial est retrouvé
à l’identique. Les fichiers de production, sa configuration et le crontab sont
empreintés et contrôlés avant/après les opérations.

Le plan prévoit onze chemins conservés, quatre remplacés et trois créés, parmi
les dix-huit chemins du candidat. Les assets sont posés avant `index.html`.
Les anciens assets restent disponibles ; aucune donnée ni configuration ne fait
partie de l’archive applicative. Les reçus non sensibles et l’état réel de livraison
sont conservés dans la [preuve courante](../api/preproduction-archives-observation.json)
et le [suivi canonique](../data/suivi-documents-compresses.json).

La livraison est effectuée à 16:29 UTC : sept écritures, dix-huit chemins
contrôlés, onze fichiers conservés (normalisation LF prise en compte). À 16:33 UTC,
106 assertions HTTPS réussissent : deux sessions normales du compte habituel,
treize téléchargements exacts, refus anonymes et CSRF. Les quatre tables et les
treize fichiers privés sont identiques à la sauvegarde fraîche. La vérification
finale confirme fichiers, configuration, crontab et production inchangés.

Le navigateur confirme le dossier SCI, six documents actifs et trois archives,
l’aperçu d’un PDF de sept pages, les boutons d’import actifs, les formats et la
mention du stockage serveur. Aucun nouveau document n’est ajouté pour ces contrôles.
La nouvelle connexion Drupal n’est pas rejouée : l’ouverture utilise un ticket
normal du composant CONNECT installé, après vérification de l’habilitation existante.

Le compte secondaire historique n°2 n’est actuellement pas éligible selon CONNECT.
Son accès n’est ni modifié ni déclaré qualifié ; cette réserve se traite séparément.
Le premier ajout réussi d’une nouvelle archive sur l’hébergement reste également
à valider, sans le déduire des tests locaux/CI.

Pour la revue humaine : appliquer A0 à A6 du [guide documentaire](documents-compresses.md).
Vérifier notamment l’association du client, l’ajout d’un ZIP fictif, sa confirmation
d’enregistrement serveur, son téléchargement, puis les documents et aperçus déjà
présents. Les archives restent entières ; aucune extraction n’est ajoutée.

## Mise en production

Cette demande autorise la seule préproduction. La recette hébergée, sa revue et
l’accord de production restent distincts. Le lot CIL complet reste une itération
ultérieure. Ne pas rejouer la migration SCI, l’activation ni les tâches planifiées.
