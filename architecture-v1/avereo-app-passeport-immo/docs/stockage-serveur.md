---
project: avereo-app-passeport-immo
document_type: architecture-and-recipe
title: Stockage privé des biens et des documents
status: active
version: git
created: 2026-10-15
updated: 2026-10-15
owner: jpdandin
tags: [stockage, documents, mysql, connect, preproduction]
---

# Stockage privé des biens et des documents

## Cadrage

Le responsable demande de rendre le stockage documentaire opérationnel maintenant,
après constat de la conservation par navigateur. Ce lot autorise le serveur dédié
de préproduction et la migration du cas SCI déjà confié à cette cible. Il remplace
la limite de stockage du lot local ; les preuves approuvées de ce dernier restent
figées. Aucun accord de production, de fusion ou de validation humaine n'est créé.
Le [suivi canonique](suivi-chantier.json) porte l'état réel du nouveau lot.

## Développement local

L'écart **g** ajoute le stockage serveur au prototype. La parité reconstruit
explicitement les seuls ajouts d'App.jsx ; calculs, CSV, PDF et fonctionnement local
restent contrôlés. Les preuves de parité et d'audit antérieures ne sont pas réécrites.

Le mode hébergé est déclaré par l'entrée PHP après validation de la session.
Il charge le compte signé et les données de l'API ; une erreur ne bascule jamais
vers la démonstration ou vers un stockage navigateur. L'enregistrement des biens
et tarifs utilise une file sérialisée et une révision. Une fenêtre périmée reçoit
409 avant toute écriture. Les changements restent visibles mais l'écran bloque
la poursuite en cas d'échec et explique qu'ils peuvent ne pas être enregistrés.
Une navigation pendant une écriture déclenche l'avertissement du navigateur.
Les opérations documentaires attendent la sauvegarde du bien.

La base dédiée contient les tables de [storage.sql](../database/storage.sql) :
comptes applicatifs, clients, biens et métadonnées documentaires. Les modèles de
biens et tarifs restent en JSON pour préserver le prototype ; les relations et
documents sont structurés. Les fichiers sont des Blob privés hors document root,
nommés par identifiant aléatoire. Les tables sont séparées de celles de CONNECT.

Le wrapper [session.php](../frontend/public/connect/session.php) conserve le couple
signé `avereo_connect`/identifiant. Il réutilise signature, durée et anti-rejeu du
sas partagé sans le modifier. Les anciens cookies sans identité demandent un
nouveau lancement depuis CONNECT. Chaque requête impose le propriétaire issu
de cette session ; aucun propriétaire transmis par le navigateur n'est accepté.
Les écritures exigent aussi origine exacte et jeton CSRF lié à la session.
La session expire après 30 minutes ; les droits CONNECT sont contrôlés au lancement,
pas réévalués en continu pendant cette durée. Le profil affiché en configuration
privée ne crée aucun droit CONNECT et ne donne pas accès aux dossiers d'autrui.

L'API [index.php](../frontend/public/api/index.php) expose session, dossier,
association client, liste/import/modification/téléchargement des documents.
Chaque document dépend d'un bien actif du même compte. Un bien contenant des
documents conserve son client. L'archivage est réversible ; le retrait d'un bien
est logique et conserve documents et fichiers pour récupération administrative.
Aucune suppression définitive n'est exposée.

L'import vérifie extension, taille, signature PDF, somme SHA-256 et effectif
attendu. Limites : 25 Mo par fichier, 100 Mo par lot, 100 fichiers au maximum,
sous réserve de la limite PHP effective. Un lot tronqué ou invalide est refusé
en entier. La transaction verrouille le bien, empêche les doublons et nettoie
les nouveaux fichiers si elle échoue. Un arrêt brutal peut laisser un fichier
orphelin sans métadonnée ; il ne devient pas consultable et doit être inventorié
avant tout nettoyage administratif. Les téléchargements passent par l'API,
vérifient taille et empreinte, et sont servis comme pièces jointes inertes.
Les fichiers PHP internes ne sont pas directement accessibles par la réécriture.

## Préproduction

État initial de ce lot : PHP 8.3.35, PDO MySQL, Fileinfo et ZIP constatés ; base
`daje3540_pimpreprod` créée et vide, paramètres préparés hors du dossier public.
L'application active reste inchangée jusqu'à la livraison du candidat testé.
Les paramètres attendus figurent sans secret dans
[connect-config.example.php](../api/connect-config.example.php).

Procédure de livraison : vérifier les empreintes de tous les fichiers actifs,
les sauvegarder ainsi que la configuration privée, répéter leur restitution dans
un dossier distinct, fermer temporairement la cible, installer le schéma dans
la base dédiée vide, importer les neuf documents depuis la copie privée validée,
vérifier les neuf empreintes, tester la sauvegarde, réduire les privilèges du
compte de service, puis activer le mode serveur et le candidat identifié. Préserver
le ZIP source, les originaux et les sauvegardes hors Git et hors dossier public.
Ne pas rejouer une initialisation sur une base peuplée.

La [sauvegarde CLI](../workflows/backup-storage.php) conserve un instantané cohérent
des quatre tables et les fichiers référencés, permissions privées, puis restitue
les lignes dans des tables temporaires et relit les empreintes des copies.
Elle ne change aucune ligne active. Commande :

```text
php workflows/backup-storage.php /private/config.php /private/nouveau-dossier
```

Pour récupérer : fermer les écritures, conserver l'état incident, restaurer les
quatre tables du snapshot dans une base dédiée neuve dans l'ordre du schéma,
recopier les Blob dans un répertoire privé neuf, vérifier les sommes, tester les
accès et pointer la configuration sur cette copie. Les tables temporaires testent
le retour des données ; elles ne constituent pas un exercice de reprise de
l'ensemble de l'hébergement. Aucun transfert hors hébergeur ni planification
automatique de sauvegarde n'est installé par ce lot.

La recette isolée exécute PHP/Apache et MariaDB 11.4 avec deux propriétaires
fictifs et deux sessions indépendantes du même propriétaire. Elle vérifie les
refus anonymes/CSRF/origine/autre compte, conflits, import atomique, dédoublonnage,
archives, restitution exacte, suppression logique et sauvegarde/restauration
temporaire. La recette HTTPS et le reçu d'installation sont encore à produire.

## Mise en production

Hors périmètre autorisé. La revue humaine de préproduction et ses critères,
la fusion et une éventuelle livraison de production restent distincts. Le
prototype local continue d'utiliser ses données du navigateur ; il n'est pas
automatiquement synchronisé avec la préproduction.
