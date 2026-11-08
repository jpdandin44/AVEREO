---
project: avereo
document_type: architecture
title: Architecture du dépôt AVEREO
status: active
version: git
created: 2026-10-03
updated: 2026-11-08
owner: jpdandin
tags: [avereo, documentation, local]
---

## Intégration RGA — 2 novembre 2026

La nouvelle carte RGA est un module de Rapport, ouvert également par une tuile CONNECT utilisant ses droits. [Architecture et données](architecture-v1/avereo-app-rapport/api/rga.md).

# Architecture du dépôt AVEREO

Le job consultatif `developments-private` qualifie séparément le code Projet et son pont CONNECT/Drupal avec identités fictives. Il conserve seulement des reçus techniques de code et n'accède pas aux sources privées du portefeuille ou à l'hébergement. [Flux de qualification et limites](architecture-v1/avereo-app-projet/workflows/ci-developpements.md).

Les composants existants sont dans `architecture-v1/`. Leur documentation locale fait foi.
Voir [le catalogue existant](architecture-v1/avereo-platform/docs/applications.md),
[CONNECT](architecture-v1/avereo-app-connect/README.md),
[Projet et revue](architecture-v1/avereo-app-projet/api/revue-locale.md)
et [le nouveau sous-projet](architecture-v1/avereo-app-passeport-immo/architecture.md).
TBD : audit global code/documentation ; les domaines déclarés ne prouvent pas la production.

Le [socle transverse](outillage/protocole-developpement/architecture.md) contient le
protocole, les skills et le contrôleur de passage. AVEREO en héberge la source ;
l'installation au niveau utilisateur le rend disponible dans les autres dépôts.
Les opérations et données métier restent dans les projets concernés.

Le [lot d’accès aux préproductions](outillage/acces-preproduction/README.md)
définit une couche HTTP de consultation, appliquée au pilote CONNECT et distincte de l’identité Drupal/CONNECT
et des habilitations métier. Son relevé décrit les racines hébergées observées ;
aucune surcouche Basic indifférenciée n’est appliquée aux fournisseurs d’identité.

La [réparation ciblée du fournisseur d’identité](outillage/acces-preproduction/identite/README.md)
conserve le contrat Composer natif de `auth-next-preprod` et le mécanisme de
livraison/restauration des seules bibliothèques manquantes. Le dépôt du reste de
l’instance Drupal n’est pas établi ; aucune copie de sa base ou de ses secrets
n’est intégrée au monorepo.

La qualification des versions applicatives relie une référence Git commune aux
archives locales, à leur inventaire d’empreintes et aux observations hébergées.
Le [suivi canonique](outillage/acces-preproduction/suivi-chantier.json) porte l’état
par application ; le relevé Markdown en est dérivé. Les tests transversaux utilisent
l’émetteur CONNECT réel et les sas récepteurs. L’identité Drupal conserve sa source
et son candidat distincts ; une compilation commune ne prouve pas la configuration
des serveurs, le catalogue actif ou l’isolation des bases.

Le [lot CONNECT et activation](outillage/acces-preproduction/preparer-connect-activation.md) ajoute un preparateur de sources Git et deux helpers CLI : inventaire sans donnees de compte exportees, sauvegarde privee et restauration sur base distincte. Les dumps/configurations restent sur le serveur hors document root ; le monorepo conserve seulement des recus techniques sans valeurs de secrets. Le bloc `connect_activation_preparation` est canonique, son releve Markdown derive. Ces outils n’installent aucun backend ni module et ne migrent pas la base active.

## Menu commun Mon espace

Le socle fournit désormais le composant de présentation de compte aux applications HTML/React et au portail PHP. Les règles de compte et les données restent dans les services existants. [Architecture du composant](architecture-v1/avereo-platform/architecture.md).

## Bandeau et réglages communs

Le composant de compte rend le bandeau commun aux interfaces HTML et React. CONNECT publie les réglages visuels de son environnement. [Architecture et contrat](architecture-v1/avereo-platform/docs/modele-affichage.md).
