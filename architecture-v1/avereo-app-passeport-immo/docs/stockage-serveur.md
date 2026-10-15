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
Le candidat est maintenant installé ; le reçu ci-dessous précise la vérification.
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
temporaire. La recette HTTPS et le reçu d’installation sont produits ci-dessous.


### Complément à l’audit et matrice de parité g

| Élément | Mode local conservé | Mode serveur ajouté | Vérification |
| --- | --- | --- | --- |
| Identité | Démonstration | Identité du ticket CONNECT signé | Ticket sans identité refusé, compte réel affiché |
| Biens et tarifs | localStorage | MySQL et révision | Deux sessions et conflit 409 |
| Documents | IndexedDB | API, métadonnées MySQL, Blob privés | Imports, isolation, archives, empreintes |
| Calculs, CSV et PDF | Comportement antérieur | Même calcul et rendu | Parité reconstruite et tests frontend |

### Livraison et recette constatées

Candidat source `7209bf3334a5f3f98d422b41d177c734970a0750`, ZIP
`c44f397fd03daa433f19e6d4c72127f29e55dbf9fca679e8c7f41cc207a843cf`.
La [CI](https://github.com/jpdandin44/AVEREO/actions/runs/38714544403)
réussit ; son archive est identique au candidat installé. Seize fichiers publics
relus après transfert. L’état précédent et sa configuration sont copiés et
restitués dans un répertoire de test privé avant activation. Le
[reçu courant](../api/storage-observation.json) est la preuve structurée de cette livraison.

Un dossier client/bien, six documents actifs et trois archives sont migrés depuis
le ZIP privé validé ; leurs neuf tailles et SHA-256 sont vérifiés. Les fichiers
sources et anciennes données du navigateur restent conservés. Les dates affichées
sont celles de cette migration ; le manifeste privé préserve les références sources.
Le compte de service possède SELECT, INSERT, UPDATE, DELETE et CREATE TEMPORARY
TABLES sur la seule base dédiée, sans droit DDL permanent après initialisation.

La recette HTTPS valide 34 assertions avec deux lancements CONNECT autorisés
indépendants, sans réutilisation de cookies : les deux sessions retrouvent le même
bien, les six actifs/trois archives et les neuf téléchargements exacts. Accès sans
session, bien inexistant, écriture sans CSRF et révision périmée sont refusés.
L’isolation entre propriétaires différents est exercée localement avec des comptes
fictifs ; aucun compte réellement non habilité ne reçoit de ticket de recette.

Le navigateur intégré affiche le compte réel sans bouton de démonstration,
importe un PDF déjà présent en doublon sans créer de ligne, enregistre les
métadonnées, affiche les trois archives et les deux pages des coupes, télécharge
un fichier identique et retrouve le dossier après rechargement. Un premier
téléversement y a signalé une erreur réseau ; le nouvel essai répond 201 et le
contrôle de doublon passe. Les deux sessions HTTPS indépendantes vérifient la
conservation partagée ; aucune recette humaine Chrome n’est attribuée à l’agent.

Le premier accès API a révélé un répertoire public créé en 0700 par le masque
restrictif de l’installateur. Correction : **0755 pour chaque sous-dossier public,
après création**, en contrôlant le mode effectif ; les fichiers publics sont en
0644. La copie privée des Blob reste en 0700/0600. Ne pas appliquer 0755 aux
répertoires de documents, secrets ou sauvegardes. La recette complète passe après
cette correction. Le masque doit être pris en compte dans toute future livraison.

Une sauvegarde finale après recette contient les quatre tables et neuf fichiers.
La restitution des lignes en tables temporaires et les empreintes des copies
passent avec les privilèges réduits. La sauvegarde n’est pas planifiée automatiquement.
La reprise complète d’un hébergement reste hors du test effectué.

## Mise en production

Hors périmètre autorisé. La revue humaine de préproduction et ses critères,
la fusion et une éventuelle livraison de production restent distincts. Le
prototype local continue d'utiliser ses données du navigateur ; il n'est pas
automatiquement synchronisé avec la préproduction.
