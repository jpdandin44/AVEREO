---
project: avereo-connect
document_type: preproduction-runbook
title: Préparer CONNECT et la migration d’activation en préproduction
status: active
version: git
created: 2026-10-14
updated: 2026-10-14
owner: jpdandin
tags: [connect, preproduction, sauvegarde, migration, passeport-immo]
---

# Préparation CONNECT et activation des comptes

Le bloc `connect_activation_preparation` du [suivi canonique](suivi-chantier.json)
porte le candidat, ses contrôles et ses blocages. Le [relevé](releve-heberge.md)
en est une vue dérivée. Cette préparation est distincte du lot des cinq autres
applications et du candidat Passeport Immo ; elle ne les installe pas.

Le [reçu du 14 octobre](archives/connect-activation-preparation-20261014.json)
conserve la sauvegarde réelle de CONNECT, sa restauration hébergée et la migration
sur le clone uniquement. Les fichiers et modes de CONNECT sont également récupérables.
Le backend actif, sa base et le fournisseur d’identité ne sont pas mis à jour.
Le dump reste privé sur le serveur ; seul ce reçu sans valeurs de secrets est exporté.

## Cadrage

La cible connue est `https://connect-preprod.avereo.fr`, avec racine applicative
`/home/daje3540/connect-preprod.avereo.fr` et document root `public/`.
Le fichier privé dédié est `/home/daje3540/private/connect-preprod/config.php`.
Ces chemins proviennent de l’inventaire hébergé antérieur : les requalifier dans
la session cPanel active. Le dernier inventaire indique quatre migrations,
sans `20260804140000_account_activation_status`. Il ne prouve pas l’état du jour.

La migration ajoute `onboarding_status` et `activation_email_sent_at`, avec une
contrainte `required` / `sent` / `completed`. Les comptes préexistants reçoivent
`completed` et une date d’envoi nulle : aucune suspension, réinitialisation de
mot de passe ou émission d’e-mail ne découle du SQL. Le pont Drupal et son secret
d’activation restent des prérequis distincts.

## Développement local

Le [préparateur](prepare_connect_activation.py) lit les blobs de la référence
`origin/main` observée, et non des fichiers locaux modifiés. Il prépare un ZIP
reproductible et un manifeste dans `.local/connect-activation/release/` :

```powershell
python outillage/acces-preproduction/prepare_connect_activation.py --source . --expected-sha SHA_MAIN_COMPLET --output outillage/acces-preproduction/.local/connect-activation/release
python -m unittest discover -s outillage/acces-preproduction -p test_connect_activation.py -v
```

Le manifeste énumère 38 fichiers, le SHA source, les empreintes du ZIP et du SQL,
les quatre versions attendues avant migration et les cinq attendues après.
Lors de la livraison, **conserver le `public/.htaccess` hébergé et la configuration
privée**. La règle embarquée dans le ZIP n’autorise pas leur remplacement.
Préparer les opérations fichier par fichier après un nouvel inventaire ; conserver
les chemins absents du manifeste et refuser toute dérive avant écriture.

Le préparateur produit aussi `identity-bridge.zip` et son manifeste à partir des
mêmes sources fusionnées. Ses huit fichiers ne contiennent ni test, secret ou
configuration privée. Le constat serveur du 14 octobre montre l’absence du
contrôleur d’activation et de son formulaire, ainsi que des différences du module
et des routes. Cette dépendance doit être qualifiée et faire l’objet d’un accord
exact sur `auth-next-preprod.avereo.fr` ; elle ne peut pas être déduite du seul
accord de mise à jour du backend CONNECT.

La [répétition PHP](test_connect_activation.php) travaille seulement avec des
comptes fictifs dans un environnement Docker dédié : elle crée le schéma ancien,
sauvegarde, restaure dans une autre base et exécute le vrai runner sur cette copie.
Elle vérifie la conservation des comptes, la contrainte, l’idempotence et les refus
de restauration vers une base source, non vide ou avec un dump altéré.
Elle ne qualifie aucune base hébergée.

## Préproduction

### Sauvegarde privée et restauration de contrôle

Le [helper de sauvegarde](connect_preprod_backup.php) est CLI et ne possède aucune
action de migration ou de déploiement. Le placer uniquement dans un dossier privé
du serveur, jamais sous `public/`. Il lit les secrets sur le serveur sans les afficher.
Le dossier parent de sauvegarde doit exister avec mode 0700 ; les configurations
doivent être privées, canoniques, sans lien symbolique et en mode 0600.

Avant son exécution, qualifier le chemin réel de la configuration de production,
la présence de PHP PDO/MySQL, du client `mysqldump` ou `mariadb-dump`, ainsi que les
droits de lecture de la base. Le helper vérifie l’environnement `preprod`, le
callback OAuth exact et la différence réelle des deux bases via leurs connexions.
Il ne publie pas le nom de base, les comptes ni le contenu du dump.

```sh
php connect_preprod_backup.php --action=backup --production-config=CHEMIN_CONFIG_PRODUCTION_QUALIFIE --output=/home/daje3540/private/connect-preprod-recovery/IDENTIFIANT_FRAIS
```

Le dump est transactionnel pour les tables InnoDB. Une dérive des données entre
les observations, une vue, une table non transactionnelle ou un objet programmable
interrompt la qualification et impose une préparation adaptée. Les journaux clients
restent privés. Le fichier temporaire de connexion est retiré ; le dump, son reçu
et ses empreintes restent en mode 0600. Un dump seul n’est pas une restauration.

Qualifier une **base de test vide et distincte des bases CONNECT préproduction et
production**, avec configuration privée `APP_ENV=test`, puis restaurer :

```sh
php connect_preprod_backup.php --action=verify-restore --production-config=CHEMIN_CONFIG_PRODUCTION_QUALIFIE --output=/home/daje3540/private/connect-preprod-recovery/IDENTIFIANT_FRAIS --restore-config=CHEMIN_CONFIG_TEST_QUALIFIE
```

Le helper refuse une base source ou non vide et un dump dont l’empreinte a changé.
Il compare les empreintes des DDL et de toutes les lignes après restauration.
Le reçu `restore.json` est la preuve de cette répétition. Les dumps et configurations
réels restent sur le serveur privé, hors Git, conversation et artefact de CI.
La création de cette base et de nouveaux accès doit être qualifiée séparément ;
aucun compte ni secret n’est créé par le helper.

### Migration et remplacement après accord exact

1. Identifier l’inventaire et les versions réellement installés, les paramètres
   d’activation du pont Drupal et les transports de messages de recette.
2. Contrôler la sauvegarde et son reçu de restauration, puis préparer une fenêtre
   sans écritures applicatives. Refaire une sauvegarde fraîche si des données ont changé.
3. Présenter cible, source, ZIP, SQL, règles conservées, récupération et effet au
   responsable ; contrôler l’accord exact dans le suivi avant toute migration.
4. Conserver une copie privée fraîche du code, du `.htaccess` et de leurs modes,
   ainsi que la configuration privée sans l’exposer. Vérifier le plan de restauration.
5. Préparer le candidat hors document root, relire toutes ses empreintes et exiger
   les quatre migrations historiques exactes, avec les deux nouvelles colonnes absentes.
   Une situation différente requiert un nouveau plan ; ne pas lancer toutes les
   migrations manquantes par commodité.
6. Lancer le runner du candidat avec la configuration dédiée uniquement :

   ```sh
   php CHEMIN_CANDIDAT_PRIVE/bin/migrate.php --direction=up --config=/home/daje3540/private/connect-preprod/config.php
   ```

7. Exiger quatre `SKIP` et un seul `UP` pour l’activation, puis contrôler colonnes,
   contrainte, cinq versions et conservation des données/anciens statuts. Réexécuter
   le runner doit produire cinq `SKIP`. Le DDL MySQL n’est pas globalement transactionnel :
   en cas d’échec partiel, arrêter et inspecter au lieu de relancer automatiquement.
8. Installer les seuls fichiers autorisés par le plan, garder Basic Auth et les
   secrets actuels, puis relever les empreintes effectivement installées.
9. Recetter HTTPS anonyme et mauvais identifiants, accès privé correct, santé,
   connexion Drupal/callback, rôles, catalogue, refus sans ticket, déconnexion.
   Recetter l’approbation d’un compte fictif, l’e-mail de test, confirmation,
   expiration et renvoi, sans utiliser les comptes ou transports de production.

La présence d’un nouveau code de pont Drupal ne vaut pas installation ni secret
partagé vérifié. La migration ne démontre pas à elle seule l’activation réelle.
Le fournisseur d’identité requiert sa propre récupération qualifiée avant mise
à jour : la sauvegarde CONNECT ne couvre pas sa base Drupal ni ses settings.

### Retour arrière

En cas d’échec du code, remettre les anciens fichiers et modes vérifiés en conservant
les règles d’accès. Les colonnes ajoutées peuvent être conservées pour éviter une
suppression de données ; qualifier la compatibilité avec l’ancien backend.
Ne pas exécuter automatiquement le SQL `down`, qui supprime les informations
d’activation. Une restauration complète de base exige l’accord et l’assurance
qu’aucune écriture récente ne serait perdue. Conserver les reçus d’incident.

### Dépendances de Passeport Immo

CONNECT actualisé ne crée ni sas, ni entrée de catalogue, ni clé de lancement pour
Passeport Immo. Vérifier séparément son candidat courant, la protection privée de
sa cible, son contrat de ticket, la configuration partagée, les habilitations,
la récupération et la recette réelle. Le suivi Passeport Immo reste sa référence.
Le ZIP métier ne contient aucune pièce du dossier client ; celles du navigateur
local ne seront pas transférées automatiquement vers la nouvelle origine HTTPS.

## Mise en production

Aucune action de production n’est incluse. Les accords, reçus et contrôles de
préproduction ne constituent pas une autorisation de livraison ou d’ouverture.
