---
project: avereo-connect
document_type: readme
title: AVEREO CONNECT
status: active
version: git
created: 2026-07-08
updated: 2026-11-03
owner: jpdandin
tags: [connect, documentation]
---

## Rattachement des comptes créés et invités

Le [correctif de raccordement](docs/rattachement-identite.md) aligne le sujet de création sur celui d'OIDC et vérifie l'identité lors de l'invitation/reset. Il conserve le compte et ses accès ; la qualification hébergée nominative reste distincte du cycle natif fictif. L'état exact et les sauvegardes sont dans le suivi canonique.


## Connexion par identifiant ou e-mail — préproduction

Le formulaire Identité accepte un login natif ou une adresse e-mail unique avant les contrôles Drupal habituels. Un ajustement ciblé du nom de connexion conserve le compte et le mot de passe ; le provisionnement prend la langue configurée. [Fonctionnement, tests et préparation](docs/connexion-identifiant-email.md). Candidat installé et vérifié en préproduction ; les preuves sont conservées dans le suivi canonique.

## Réinitialisation administrative — candidat local

Bouton distinct pour envoyer le reset d’un compte déjà initialisé, confirmation du destinataire et résultat explicite. Le mot de passe reste géré par Drupal ; runtime installé sur CONNECT et Identité préproduction après accord, sans migration. Réception réelle, sauvegarde personnelle et nouvelle connexion Identité vérifiées après réparation ciblée de la langue du compte testé. Le correctif de langue est également installé en préproduction. [Fonctionnement, preuves et livraison](docs/reinitialisation-mot-de-passe.md).


## Parcours des comptes — préproduction du 3 novembre

[Paquet, recette et procédure](docs/preproduction-comptes.md). Le go après démonstration a été reçu ; le runtime `e76f3d77634bafb4056e3f753e31331bbaa613b2` est installé en préproduction. Les contrôles techniques, l’entrée nominative HTTP et l’envoi d’invitation sont vérifiés ; réception et activation personnelles restent distinctes. Aucun merge ni changement de production.


## Création des comptes — comportement installé

Création sans notification automatique, applications explicites, période et invitation séparée sont implémentées dans le portail PHP. Essai temporaire limité à Rapport/RGA. Migration et paramètres privés installés ; envoi d’invitation métier enregistré dans le suivi privé. [Fonctionnement et réserves](docs/administration-comptes.md).


## Historique — préparation avant la démonstration

Le [dossier de reprise](docs/reprise-administration-comptes.md) prépare création, choix explicite des applications, période et invitation séparée. Le [parcours fonctionnel](docs/administration-comptes.md) reste la référence. Au moment de cette préparation initiale, ce parcours n’était pas encore implémenté ou livré ; le contrôle temporaire des sas était seulement qualifié localement.


## Application RGA — candidat du 2 novembre

RGA est une application distincte du catalogue, administrable avec ses propres droits. À sa première déclaration, les habilitations de Rapport sont copiées une fois, puis évoluent indépendamment. Son ticket et son cookie sont propres à RGA ; aucun nouveau compte utilisateur. [Parcours et contrat commun](../avereo-app-rapport/api/rga.md).

# AVEREO CONNECT

[Architecture](architecture.md) · [Exigences](requirements.md) ·
[Suite](roadmap.md) · [Décisions](decisions.md) · [Changelog](changelog.md).

Le raccordement Passeport Immo ajoute ses deux clés de lancement dans la configuration
du backend ; catalogue et droits hébergés restent distincts.
Voir le [rapport d'intégration](../avereo-app-passeport-immo/docs/02-integration-connect.md).

- Slug : `connect`
- Domaine cible : `connect.avereo.fr`
- Fournisseur d'identité : Drupal avec Simple OAuth
- Frontend historique : React/Vite
- Candidat C7/V2 : backend PHP 8.3 et schéma MariaDB/MySQL

## Architecture

Le frontend V1 reste présent sans modification fonctionnelle. Le candidat C7/V2
ajoute un backend API séparé dans `backend/`, les migrations dans `database/` et
un environnement Docker local éphémère dans `compose.c7.yaml`.

Le backend délègue l'authentification à Drupal par Authorization Code avec PKCE
S256. CONNECT conserve la session applicative, applique les autorisations côté
serveur et ne stocke aucun mot de passe Drupal.

## Environnement local Docker

Le portail CONNECT actuel est servi par le backend PHP. Le répertoire
`frontend/` reste la source historique V1 et ne constitue pas l'IHM locale de
validation de CONNECT.

Depuis la racine de l'application :

```powershell
docker compose -f compose.c7.yaml up -d database
docker compose -f compose.c7.yaml run --rm php php bin/migrate.php --direction=up
docker compose -f compose.c7.yaml up -d --build web
```

Ouvrir ensuite <http://127.0.0.1:8080/>. Le port est lié exclusivement à
`127.0.0.1` et n'est pas exposé sur le réseau local.

Le bandeau `Mode local Docker` permet d'ouvrir deux sessions fictives :

- `Administrateur local`, propriétaire de l'organisation `AVEREO local` ;
- `Client local`, membre de cette organisation.

Ces profils sont recréés de manière idempotente au démarrage du service `web`.
Ils permettent de contrôler le catalogue, les rôles et l'administration des
droits sans solliciter Drupal. Les adresses utilisent le domaine réservé
`example.invalid` et ne correspondent à aucun compte réel.

Les six cartes ouvrent aussi un récepteur applicatif fictif sur
`127.0.0.1:8080`. Le parcours utilise le même ticket HMAC court que les
applications hébergées, consomme son nonce une seule fois et établit un cookie
de sas local avant d'afficher une page de confirmation. Les clés présentes dans
le récepteur Docker sont distinctes, explicitement factices et ne sont chargées
que lorsque les deux garde-fous du mode local sont actifs. Aucune application
hébergée n'est contactée. Pour Recherche, la page de confirmation propose en plus
un lien vers son conteneur local (`LOCAL_APP_RECHERCHE_URL`, par défaut
`http://127.0.0.1:5174/`, voir `avereo-app-recherche/compose.local.yaml`).

Les contrôles backend restent disponibles séparément :

```powershell
docker compose -f compose.c7.yaml run --rm php php tests/run.php
docker compose -f compose.c7.yaml run --rm php php tests/integration.php
docker compose -f compose.c7.yaml run --rm -e CONNECT_LOCAL_DEMO_EXPECTED=true php php tests/local-web.php
docker compose -f compose.c7.yaml down
```

L'identité AVEREO externe et les applications hébergées ne sont pas configurées
dans cet environnement. Le mécanisme de session fictive appartient uniquement
au routeur Docker, exige simultanément `APP_ENV=local` et
`LOCAL_DEMO_ENABLED=true`, et n'est pas chargé par le point d'entrée de
production.

## Déploiement

Deux workflows manuels et protégés réutilisent l'environnement GitHub
`connect` :

- `deploy-connect-o2switch.yml` déploie le backend CONNECT ;
- `deploy-drupal-identity-bridge-o2switch.yml` déploie uniquement le module
  Drupal `avereo_identity_bridge`, sauvegarde sa version précédente et
  reconstruit le cache Drupal.

Aucun de ces workflows ne se déclenche automatiquement. La branche `main`, une
confirmation textuelle exacte et l'approbation humaine de l'environnement
restent obligatoires. Voir `docs/deployment.md` et
`docs/production-readiness-c7.md`.
