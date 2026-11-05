---
project: avereo-app-projet
document_type: workflow
title: Préparer et importer un planning privé indépendant
status: active
version: git
created: 2026-11-05
updated: 2026-11-05
owner: jpdandin
tags: [projet, import, confidentialite]
---

# Préparer et importer un planning privé indépendant

## Cadrage

Ce lot prépare l'intégration d'un planning complet dans la version **Mon espace**
de la [PR #108](https://github.com/jpdandin44/AVEREO/pull/108), elle-même basée sur
la [PR #107](https://github.com/jpdandin44/AVEREO/pull/107). Le
[suivi canonique](../data/suivi-import-prive.json) porte le candidat, les contrôles,
les décisions, les réserves et la prochaine action.

Le dépôt étant public, le contenu nominatif reste dans la source JSON privée
hors dépôt. Aucun planning réel n'entre dans Git, `frontend/public` ou `dist`.
Le paquet est une copie dérivée, jamais une seconde source à éditer.
Le fichier privé et son manifeste sont remis au responsable localement.

Le choix retenu est un **nouveau projet indépendant**, afin de conserver le
planning courant et ses révisions. Le contenu préparé provient d'un export
antérieur, choisi explicitement par le responsable ; il ne prétend pas fusionner
les modifications intervenues dans le planning courant depuis cet export.

## Développement local

Depuis la racine de l'application, avec Node.js 20 ou supérieur :

```powershell
node workflows/preparer-import-prive.mjs 'C:/dossier-prive/source.json' 'C:/dossier-prive/paquet-neuf'
node --test tests/private-import.test.mjs
```

Le dossier parent doit exister et le dossier du paquet doit être neuf. Choisir
un emplacement personnel non partagé, non synchronisé vers un service public
et hors racine web. L'outil refuse le dépôt courant, les autres arborescences
Git et les noms courants de dossiers publics, y compris via une jonction.
Ces contrôles ne détectent pas toutes les configurations possibles d'un serveur
web ou d'un partage réseau : la confidentialité de l'emplacement reste à vérifier.
Les modes POSIX 0700/0600 sont demandés ; sous Windows, les droits hérités du
dossier utilisateur s'appliquent et ne sont pas modifiés par cet outil.

Le moteur actuel valide le JSON, les dépendances et l'ordonnancement. Toute
normalisation qui changerait un champ ou en supprimerait un est refusée.
Un ancien export incomplet doit d'abord être relu et exporté par Projet, puis
comparé à l'original avant nouvelle préparation. Aucune correction silencieuse.

L'outil conserve exactement les octets du fichier dans `planning.json` et produit
`manifest.json` : empreinte SHA-256, taille, nombre de tâches/jalons et charge.
Ni titre, ni description, ni chemin personnel dans le manifeste ou la sortie
standard. Les erreurs de la commande ne recopient pas les données privées.
En cas d'erreur d'écriture, un dossier partiel peut rester : ne pas l'importer ;
préparer un nouveau dossier après vérification de l'espace disque.
Aucun appel réseau, compte, secret, paquet externe, migration ou écriture serveur.

## Préproduction

Cette procédure est **préparée**, pas exécutée par la création de la PR.
L'import effectif demande l'accord sur le fichier privé, le compte et la cible.

1. Ouvrir CONNECT puis Projet en préproduction avec le compte propriétaire.
2. Exporter le planning courant et relever sa révision avant toute action.
3. Dans **Mes projets / Mon espace**, choisir **Importer un projet** puis le
   `planning.json` du paquet privé. Ne pas utiliser **Importer un planning** dans
   le Gantt courant : cette seconde action remplace le document ouvert.
4. Vérifier le nouveau titre, le nombre de tâches, les paramètres, les jalons,
   les descriptions, checklists, risques, dépendances et ordres de priorité.
   Les jours fériés ne sont pas exclus automatiquement par le calendrier actuel.
5. Recharger puis exporter le nouveau projet ; comparer le JSON complet au
   fichier du paquet, sans ignorer de champ métier (l'ordre des clés et les
   espaces ne sont pas des écarts métier).
6. Revenir au planning courant ; vérifier son export et sa révision inchangés.
   Consigner la preuve privée et son résultat non nominatif dans le suivi.

En cas d'échec, conserver la source et les exports ; ne pas réimporter à répétition
ni remplacer le planning courant. Le nouveau dossier peut être archivé puis
restauré avec l'accord du responsable. Cette possibilité existe dans Mon espace ;
elle ne constitue pas une recette déjà réalisée sur le compte réel pour ce lot.

## Mise en production

Aucun merge, déploiement ni import en production n'est inclus dans cette demande
de PR. Revoir les dépendances #107 et #108 puis la présente PR. Avant toute
livraison ultérieure, qualifier la cible, sauvegarder les données, obtenir les
accords distincts et vérifier les contrôles du protocole commun. Après livraison,
contrôler la relecture, l'export et la conservation des autres projets. La suite
consiste à suivre ce planning dans son espace privé ; aucune synchronisation
automatique du dossier de contexte n'est installée.
