# Catalogue des services AVEREO

## Source d'autorité

Le « store » du catalogue est la base MySQL de CONNECT, et plus précisément la
table `applications`. Drupal reste le fournisseur d'identité : il ne publie pas
les applications et ne porte pas les habilitations métier.

Une carte peut être affichée dans CONNECT uniquement si les trois conditions
suivantes sont réunies :

1. l'application existe avec `applications.status = active` ;
2. l'organisation active de l'utilisateur possède une habilitation active et
   valide dans `entitlements` ;
3. CONNECT possède une URL d'entrée et un secret de sas valides pour ce code.

Le navigateur ne reçoit jamais le secret ni l'URL publique directe. Il reçoit
seulement `/api/v1/apps/{code}/launch`.

## Cycle de vie

| État | Effet dans CONNECT |
|---|---|
| `draft` | Service préparé mais invisible |
| `active` | Service publiable, sous réserve d'habilitation et de sas |
| `suspended` | Service immédiatement retiré du catalogue |
| `retired` | Service archivé et invisible |

La colonne `display_order` ordonne les cartes. La colonne `description` fournit
le texte fonctionnel affiché. La migration
`20260730120000_catalog_metadata.up.sql` ajoute ces métadonnées.

## Administration

Lister sans écriture :

```bash
AVEREO_PRIVATE_CONFIG=/home/CPANEL_USERNAME/private/connect-preprod/config.php \
php bin/manage-catalog.php --list
```

Prévisualiser une publication et son attribution à l'organisation AVEREO :

```bash
AVEREO_PRIVATE_CONFIG=/home/CPANEL_USERNAME/private/connect-preprod/config.php \
php bin/manage-catalog.php \
  --code=projet \
  --name="Projet AVEREO Pro" \
  --description="Piloter les projets et leurs données métier." \
  --launch-url=https://projet-preprod.avereo.fr/ \
  --scope=projet:use \
  --display-order=30 \
  --status=active \
  --organization-slug=avereo \
  --actor-subject=SUBJECT_DRUPAL_ADMIN
```

Après contrôle de la prévisualisation, ajouter `--confirm`. La commande écrit
l'application, l'habilitation et une trace `catalog.upsert` dans
`audit_events`, dans une seule transaction.

Suspendre un service utilise la même commande avec `--status=suspended`, sans
`--organization-slug`. Une suspension ne supprime ni l'historique ni les
habilitations : elle retire immédiatement la carte et bloque les lancements.

## Préproduction

| Code | Point d'entrée signé |
|---|---|
| `rapport` | `https://rapport-preprod.avereo.fr/connect/entry.php` |
| `coupe` | `https://coupe-preprod.avereo.fr/connect/entry.php` |
| `projet` | `https://projet-preprod.avereo.fr/connect/entry.php` |
| `thermo` | `https://thermo-preprod.avereo.fr/connect/entry.php` |
| `drone` | `https://drone-preprod.avereo.fr/connect/entry.php` |

Chaque application utilise un secret différent et un répertoire anti-rejeu
privé différent. Les cinq configurations applicatives pointent vers
`https://connect-preprod.avereo.fr/`.

## Session et déconnexion

Sans « Rester connecté avec mon compte », le cookie CONNECT et les cookies de
sas sont des cookies de session. La demande OAuth utilise `prompt=login` pour
représenter l'écran Drupal lors de la prochaine authentification.

Avec la case cochée, CONNECT peut conserver la session jusqu'à la limite absolue
configurée et transmet ce choix au sas. Une déconnexion explicite reste
prioritaire : le cookie applicatif et la session CONNECT sont supprimés, puis
l'utilisateur revient sur la page de connexion. La persistance sert à survivre
à la fermeture du navigateur ; elle n'annule jamais un clic explicite sur
« Se déconnecter ».

