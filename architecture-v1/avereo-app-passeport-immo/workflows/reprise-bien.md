---
project: avereo-app-passeport-immo
document_type: workflow
title: Reprise ciblée d'un bien entre préproduction et production
status: active
version: git
created: 2026-10-16
updated: 2026-10-16
owner: jpdandin
tags: [passeport-immo, reprise, documents, production]
---

# Reprise ciblée d'un bien

## Objectif et état

[transfer-property.php](transfer-property.php) exporte le seul bien sélectionné,
son client lié et tous ses documents actifs ou archivés. L'import rattache cette
copie au propriétaire CONNECT de production explicitement identifié. Il préserve
le modèle du bien, les libellés, catégories, dates, états d'archive et octets des
documents. Les comptes, habilitations, secrets, tarifs de l'espace de travail et
autres biens sont exclus. Le client peut aussi servir à un autre bien source :
seule sa fiche est copiée, sans les autres liens.

Le mécanisme est **qualifié localement sous MariaDB 11.4** avec des données
fictives. Aucun dossier réel n'a été exporté ou transféré par cette préparation.
Le candidat public est inchangé : le CLI reste hors du document root et de son ZIP.
Le [dossier de production](../docs/04-mise-en-production.md#reprise-du-dossier-sci)
porte l'accord D06 et les prérequis encore à qualifier sur le serveur.

## Entrées, sorties et dépendances

- PHP CLI avec `pdo_mysql`, accès à la seule base dédiée et au répertoire privé
  de documents ; schéma [storage.sql](../database/storage.sql) déjà installé.
- Configuration locale à chaque environnement : `environment`, `storage_enabled`,
  `storage_dsn`, `storage_user`, `storage_password`, `storage_directory`. Aucune
  configuration ni valeur secrète ne fait partie du lot de transfert.
- Plan JSON privé, explicitement approuvé dans le périmètre retenu, avec le
  propriétaire source, le bien source et le propriétaire cible. Les identifiants
  CONNECT doivent être ceux réellement qualifiés dans chaque environnement.
- Répertoire d'export neuf hors du stockage source et du document root ; il
  contient `manifest.json` et `documents/<identifiant-source>.blob`, en 0700/0600.
- Empreinte SHA-256 du manifeste conservée séparément du lot, dans le reçu privé
  de l'opération. Les sorties CLI ne restituent que résultats, nombres et empreinte.

Les chemins ci-dessous sont illustratifs et doivent être remplacés par les chemins
privés qualifiés sur la cible ; ils ne désignent aucun emplacement déjà installé.
Le plan conserve cet ordre de clés pour une correspondance stable :

```json
{
  "source": {
    "environment": "preprod",
    "ownerId": "IDENTIFIANT_STOCKAGE_SOURCE_QUALIFIE",
    "bienId": "IDENTIFIANT_BIEN_SOURCE_QUALIFIE"
  },
  "target": {
    "environment": "production",
    "ownerId": "IDENTIFIANT_STOCKAGE_CIBLE_QUALIFIE"
  }
}
```

Le propriétaire de stockage vient de l'identité signée CONNECT ; il ne se déduit
pas du nom affiché ou d'une égalité entre identifiants numériques des deux bases.
Le mécanisme ne crée pas de compte et ne modifie aucun droit CONNECT.

## Étapes d'exécution privée

1. **Qualifier avant toute écriture.** Relire l'accord, la cible fermée et isolée,
   la correspondance des propriétaires, le plan et le schéma. Actualiser l'inventaire
   SCI après recette. Préparer une sauvegarde cible récupérable, ou la preuve de
   vacuité/isolement, et le retour arrière ; ne jamais travailler dans la base CONNECT.
2. **Stabiliser la copie.** L'export verrouille l'espace de travail et le bien
   sélectionné pendant la lecture cohérente et la copie des fichiers. Pour la
   bascule finale, prévoir une fenêtre sans nouvelle écriture sur ce dossier entre
   export, contrôle et activation : le CLI ne réplique pas les changements ultérieurs.
3. **Exporter depuis la source qualifiée.** Déposer le CLI et le plan hors web,
   conserver leurs empreintes, puis exécuter :

   ```text
   php transfer-property.php export /private/source-config.php /private/plan.json /private/nouvelle-copie
   ```

   Conserver le `manifestSha256` retourné dans un reçu privé séparé, puis comparer
   le manifeste avec l'inventaire attendu. Le lot est confidentiel et reste hors Git.
   Une erreur laisse au besoin un répertoire partiel pour diagnostic ; il ne doit
   jamais être utilisé comme une copie réussie. Recommencer vers un dossier neuf.
4. **Vérifier la cible sans importer.** Placer le lot dans un espace privé distinct
   des documents cible. Vérifier l'empreinte reçue par un canal distinct, puis :

   ```text
   php transfer-property.php import /private/target-config.php /private/plan.json /private/nouvelle-copie EMPREINTE_MANIFESTE
   ```

   `ready_dry_run` confirme la compatibilité à cet instant, sans modifier de ligne
   ou fichier cible. L'import refuse la base source, les environnements incohérents,
   les mauvais propriétaires, les fichiers supplémentaires, les liens symboliques,
   toute différence de taille/empreinte et tout conflit d'identifiant ou contenu.
5. **Importer et rejouer après vérification des prérequis.** La même commande avec
   `--apply` effectue l'insertion transactionnelle. Le modèle du bien conserve son
   identifiant ; les identifiants client et documents sont recalculés de façon
   déterministe à partir du plan, du type et de l'identifiant source, pour éviter
   de reprendre l'identifiant d'un autre compte cible. Le manifeste et le plan
   constituent la correspondance reproductible ; conserver aussi les reçus CLI.
   L'espace de travail cible garde ses tarifs et sa révision avance une seule fois.
   Rejouer le lot doit retourner `already_imported`, sans doublon ni changement
   de révision. Toute modification ultérieure de la cible provoque un refus,
   jamais un écrasement silencieux ou une synchronisation implicite.
6. **Contrôler et protéger le résultat.** Comparer toutes les métadonnées, les
   états actifs/archives, tailles et empreintes, puis vérifier depuis l'application
   de production la lecture du compte autorisé et le refus d'un autre compte.
   Qualifier ensuite la sauvegarde et la récupération isolée de l'ensemble cible.
   Ces contrôles réels restent distincts de la qualification locale de l'outil.

## Échecs et récupération

Une erreur SQL ou de copie avant validation annule la transaction et, si cette
annulation est confirmée, retire les seuls fichiers créés par cet essai. Les éléments
préexistants ne sont ni remplacés ni supprimés. Une interruption brutale ou un
résultat de validation SQL incertain conserve les fichiers pour examen : un nouvel
essai refuse les fichiers orphelins. Les inventorier et les rapprocher du
manifeste avant toute intervention ; aucune purge automatique n'est prévue.

La cible peut contenir d'autres biens : ils sont conservés. Si le même bien cible,
son client recalculé ou ses documents existent avec un contenu différent, arrêter
et examiner l'écart ; ne pas modifier le plan pour forcer une nouvelle copie.
Une nouvelle exportation après des changements source exige une nouvelle revue
de son empreinte. L'outil réalise une reprise initiale, pas une mise à jour continue.

Le retour arrière doit fermer le lancement et préserver les nouvelles écritures.
Il n'existe pas de commande de suppression du dossier importé : décider d'une
récupération adaptée à l'inventaire courant, sans restaurer aveuglément une base
ancienne ni toucher à la source.

## Contrôles reproductibles

Après construction préalable de l'image de test définie dans
[connect-test.Dockerfile](../docker/connect-test.Dockerfile) :

```text
python tests/check-transfer-property.py
```

La qualification crée un réseau Docker interne, une base source et une base cible,
avec identités et documents fictifs, puis supprime ses conteneurs et son réseau.
Les **35 assertions** couvrent sélection, archives, intégrité, isolement de comptes
et bases, simulation, conflit, retour transactionnel, préservation de l'existant,
rejeu et refus d'écrasement après modification. Ce contrôle est aussi appelé par
`tests/check-storage-http.py`, déjà exécuté dans la CI Passeport Immo.

Le [reçu technique](../api/property-transfer-observation.json) donne les résultats
datés et les empreintes des sources. Il ne constate aucun transfert SCI hébergé,
aucune qualification de compte réel et aucune livraison en production.
