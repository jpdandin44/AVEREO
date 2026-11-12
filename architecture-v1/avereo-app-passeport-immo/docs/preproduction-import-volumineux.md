---
project: avereo-app-passeport-immo
document_type: deployment-and-acceptance
title: Livraison privée des imports jusqu’à 500 Mo
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [preproduction, documents, sauvegarde, recette]
---

# Livraison privée des imports jusqu’à 500 Mo

## Cadrage

Le responsable demande explicitement la livraison à 500 Mo après fusion des
[PR145](https://github.com/jpdandin44/AVEREO/pull/145) et
[PR146](https://github.com/jpdandin44/AVEREO/pull/146).
Le [suivi canonique du lot](../data/suivi-import-volumineux.json) conserve cet accord
pour la seule préproduction privée. Les décisions de l’ancien chantier et la
production gardent leur portée. Aucun compte, droit, secret ni cron n’est modifié.

## Développement local

Le paquet CI gelé provient de la source `580e4da1d74a469bda3fb88c5ebd497e38072f1c` ;
son SHA-256 est `5f096131d1181389e50a69b59802d3d33f3dda0cefb4db17307cde951b4e0a13`.
Les dix-huit chemins sont vérifiés dans le ZIP fermé. Les sources applicatives
du candidat, de la dernière tête PR146 et du merge sont identiques ; les
vingt-quatre contrôles de la PR réussissent et ses quatre cases humaines sont
cochées. Les deux descriptions fusionnées passent le contrôle strict du dépôt.
La [qualification initiale](import-volumineux.md) reste distincte des essais hébergés.

Le [livreur ciblé](../workflows/release-large-import-preproduction.py) réutilise
le moteur existant limité à Passeport Immo. Il fixe l’empreinte du paquet et exige
les empreintes antérieures exactes de `.user.ini` et `api/index.php`. Les différences
d’authentification, menu commun et accès sont bloquées. Neuf tests ciblés réussissent,
dont trois nouveaux contrôles de périmètre ; les vingt-huit tests Python réussissent.

## Préproduction

Point d’entrée : [CONNECT préproduction — Passeport Immo](https://connect-preprod.avereo.fr/?app=passeport-immo).
Cible : [Passeport Immo privé](https://passeport-immo-preprod.avereo.fr/).

La récupération fraîche du 12 novembre vérifie les quatre tables et treize
documents privés. Les lignes sont restaurées dans des tables temporaires et les
fichiers relus par empreinte. Le candidat puis l’ancien code sont appliqués sur
une copie, avec comparaison des octets et permissions. Le contrôle de passage
du protocole commun réussit avant installation. Six fichiers changent : quatre
remplacements et deux nouveaux fichiers compilés ; douze chemins sont préservés.
Les anciens fichiers compilés restent disponibles pour le retour arrière.

État des contrôles après installation : **réussis**. Réception et validation complète à 173 et 500 Mo, refus à 501 Mo, 106 assertions de conservation et d’accès, puis écran SCI à 500 Mo vérifiés. Aucun nouveau document n’est créé par ces sondes. Configuration privée, production et cron sont comparés avant/après sans changement. Le
[reçu factuel](../api/preproduction-import-volumineux-observation.json) porte les
observations datées, sans dossier client ni secret.

La [sonde de gros envois](../workflows/verify-large-import-preproduction.php)
utilise une session issue du ticket CONNECT normal et de vrais ZIP de taille exacte.
Elle cible un identifiant aléatoire absent de tous les biens. L’inspection complète
du fichier et son empreinte précèdent la recherche du bien : la réponse attendue
« Bien introuvable » prouve la réception et l’acceptation du fichier sans pouvoir
créer de document. Cette preuve ne prétend pas enregistrer positivement un gros
document sur l’hébergement. L’enregistrement, le téléchargement exact et la
sauvegarde d’un ZIP entier de 173 Mo sont prouvés séparément en CI isolée.
Les ZIP fictifs sont générés dans le seul répertoire privé de qualification par
le [générateur de fixtures](../workflows/prepare-large-fixtures.py), avec taille exacte
et relecture de l’intégrité ZIP. Les sources des outils livrés sont reliées par
empreinte dans le reçu ; les fixtures ne sont jamais placées dans un bien client.

### Vérification à réaliser par le responsable

1. Rouvrir l’application depuis CONNECT, puis ouvrir le bien souhaité et **Documents**.
2. Vérifier la limite affichée **500 Mo par fichier** et le client associé.
3. Ajouter les quatorze archives d’origine totalisant 203 Mo, ou le rapport entier
   de 173 Mo : aucune découpe ni extraction n’est nécessaire.
4. Attendre la confirmation avec le nombre de fichiers ajoutés. L’enregistrement
   sur le serveur privé est automatique après l’envoi.
5. Fermer puis rouvrir l’application, retrouver les fichiers et télécharger une
   archive pour contrôler son ouverture et son contenu.
6. En cas de relance de la même sélection, vérifier le décompte des doublons.

Une sélection supérieure à 500 Mo est envoyée en lots successifs, sans découper
les fichiers. Un fichier individuel supérieur à 500 Mo nécessite une évolution
ultérieure de transfert par blocs. La réception complète à 500 Mo est contrôlée
par HTTPS ; aucune modification globale des réglages PHP n’est réalisée. La seule
présence de `.user.ini` ne prouve pas ses valeurs effectives sous LiteSpeed.

## Mise en production

Aucune livraison de ce lot en production. La recette humaine hébergée et un
accord portant sur ce candidat restent nécessaires pour ce passage. La sauvegarde,
les droits et le dossier SCI existants sont conservés ; ne rejouer aucune migration.
