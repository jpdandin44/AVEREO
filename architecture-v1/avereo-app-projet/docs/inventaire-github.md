---
project: avereo-app-projet
document_type: feature-qualification
title: Inventaire des applications, sites et développements GitHub
status: active
version: git
created: 2026-11-20
updated: 2026-11-22
owner: jpdandin
tags: [cockpit, github, inventaire, couverture]
---


## Correction du 22 novembre — stabilité entre deux collectes

L’essai hébergé sur copie du candidat initial `7ea8269` a détecté une seconde
publication malgré la répétition des mêmes réponses GitHub. Les composants
issus de la découverte étaient réutilisés comme des rattachements manuels au
passage suivant : un simple répertoire pouvait alors être ajouté aux branches
d’un composant sans y posséder de marqueur de code.

La correction exclut de ces déclarations les identifiants dérivés réservés
`github-<empreinte du dépôt et du chemin>`. Elle conserve les identifiants manuels,
y compris ceux qui commencent par `github-` sans être l’identifiant dérivé exact.
Le cache des arbres reste immuable ; les marqueurs présents dans chaque branche
restent l’autorité de découverte. Les essais couvrent trois passages, une branche
avec marqueur, un répertoire sans marqueur et la conservation du rattachement manuel.

Contrôles du correctif : reproduction en échec sur la source initiale, puis
33 tests ciblés et 402 tests applicatifs réussis après préparation des composants
communs et des dépendances locales existantes.

Cette correction constitue un nouveau candidat. Elle ne modifie pas l’accord
limité à `7ea8269` et n’est pas installée en préproduction. Les reçus et relevés
hébergés restent dans le dossier opérationnel privé, hors de ce dépôt public.

# Inventaire GitHub

## Cadrage

Le responsable demande de recenser toutes les applications, sites web et
développements du compte GitHub, au-delà du catalogue manuel. Le collecteur
initial actualise uniquement les applications préinscrites, la branche `main`,
une page de PR ouvertes et les trente dernières PR fermées. Cette couverture
ne suffit pas à l'objectif. Le [suivi canonique](../data/suivi-inventaire-github.json)
conserve les critères, les quatre phases et les validations humaines.

Exigences du lot : découvrir les dépôts du propriétaire avec les accès de lecture
existants, les composants dans leurs versions GitHub, toutes les PR et branches
présentes. Distinguer découverte de code, suivi métier, recette et livraison.
Un composant sans suivi doit apparaître ; aucune phase ou acceptation n'est créée
depuis une PR, une branche, un manifeste ou une CI. Les travaux restés sur le PC
ne sont pas des développements présents sur GitHub.

## Développement local

Implémenté dans la branche isolée `feat/cockpit-inventaire-github`. Le
[contrat](../api/inventaire-github.md) précise la configuration, les limites et
la projection consultable. Le mode de découverte reste optionnel ; les anciennes
projections et le collecteur statique restent compatibles.

Contrôles du 20 novembre :

- 31 tests ciblés réussis : nouveau dépôt, composant sans suivi, autre branche,
  101 PR, cache immuable, arbre tronqué, défaut réseau, versions concurrentes,
  conservation des sources et des accords, deux cycles du publicateur.
- 400 tests du module réussis en exécution séquentielle sur le candidat corrigé.
- Compilation publique réussie et contrôle de 24 fichiers, sans données privées.
  Le paquet privé utilise une compilation distincte de l'écran Développements.
- Syntaxe PHP valide ; un inventaire de 61 composants traverse les lecteurs
  Node/PHP sans modifier les suivis humains. Les marqueurs natifs Drupal et Python sont
  reconnus, avec exclusion du cœur Drupal et des modules tiers. Les liens et références invalides
  sont refusés.
- Recette navigateur locale fictive : 61 composants, 101 PR, recherche, pages
  50/11 et 50/50/1, filtre brouillon, listes branches/dépôts et ouverture du suivi.
  Aucune erreur console relevée ; cette recette ne prouve pas l'état hébergé.

Une première exécution globale concurrente a signalé l'échec du fichier de tests
`planning-local.test.mjs` sans diagnostic détaillé. Ses 40 cas réussissent seuls ;
la suite complète réussit sans concurrence. Aucun test ou contrôle n'a été supprimé
ou assoupli. La cause exacte de cet échec initial n'est pas établie.

Les collectes du compte réel ont réussi en lecture seule. Les listes et reçus
contenant des métadonnées privées sont conservés dans le dossier opérationnel
privé, hors de ce dépôt public. Le registre et le cache opérationnels n'ont pas été
remplacés par ces essais. Aucun développement ni secret du compte n'est intégré
aux fixtures ou à la CI publique.

## Préproduction

Non installée pour ce candidat. Réutiliser le publicateur privé et l'accès du
seul propriétaire/global, après qualification du candidat et de la cible,
sauvegarde fraîche et essai de retour sur copie. Les suivis privés restent une
réception datée, sans relais PC. Les historiques et les projets clients sont
conservés. Une collecte réelle puis un cycle indépendant doivent établir la
couverture effectivement affichée ; une CI seule ne l'atteste pas.

## Mise en production

Exclue du lot courant. Aucun accord de production ou d'ouverture publique n'est
créé. La clôture devra conserver le reçu, les limites constatées et la prochaine
action ; la préparation du code ne prouve pas la réalisation de l'objectif hébergé.
