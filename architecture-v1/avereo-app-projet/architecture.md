---
project: avereo-app-projet
document_type: architecture
title: Architecture du planning Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-19
owner: jpdandin
tags:
  - projet
  - architecture
  - stockage
---

# Architecture du planning Projet

## Vue d'ensemble

Projet appartient au monorepo AVEREO. React 18/Vite 5 portent le point d'entrée ;
`frontend/src/App.jsx` affiche `frontend/public/legacy-app.html` dans une iframe.
Le métier s'exécute dans le navigateur. Le sas PHP CONNECT concerne
l'hébergement ; Vite ne l'exécute pas.

Le lot décrit ci-dessous est implémenté localement. Les preuves et les limites
de sa qualification sont centralisées dans [l'audit](docs/source-audit.md).

## Composants et flux

| Composant | Responsabilité |
|---|---|
| Interface HTML | Saisie, tableau/Gantt, risques et commandes de fichiers |
| `planning-core.js` | Validation, normalisation, import/export et calendrier |
| `planning-local.js` | Coordination interface, fichiers et stockage local |
| Stockage navigateur versionné | Brouillon propre à l'origine |
| JSON exporté | Reprise complète, y compris paramètres |
| CSV neuf colonnes | Échange des tâches |
| Source JSON du pilote | Référence versionnée des tâches et paramètres |
| Générateur | CSV et manifeste dérivés sous `data/generated/` |
| Middleware Vite de développement | Routes `/local-planning/`, absentes du build publié |

L'import est lu et validé avant de remplacer le planning. Une erreur conserve
l'état courant. Un remplacement valide reste soumis à confirmation lorsqu'un
planning existe déjà. L'état accepté alimente le calcul, les vues puis la
sauvegarde navigateur. Une erreur de quota laisse la modification en mémoire
et affiche explicitement que la sauvegarde a échoué.

Le schéma JSON porte `schemaVersion: 1`. Le brouillon utilise la clé
`avereo.projet.planning.v1` ; la copie précédente utilise
`avereo.projet.planning.previous.v1` lors d'un remplacement. Un brouillon
illisible reste exportable en brut. Le contrôleur refuse une écriture si un
autre onglet a changé le stockage : exporter puis recharger avant de poursuivre.
Il n'effectue aucune fusion automatique. La copie précédente n'est pas un
historique de toutes les modifications.

Le pilote est chargé uniquement sur les hôtes locaux autorisés, en l'absence
d'un brouillon. Les fichiers se trouvent hors de `frontend/public/` :
le contrôle du hostname est complété par l'absence de ces données dans
`frontend/dist/`. Le middleware de développement ne crée aucune API métier
hébergée.

## Calendrier et données

Dates de début/cible et capacité sont configurables. Les durées sont des
jours-personne décimaux. Le calendrier utilise lundi–vendredi sans absence
ni jour férié renseigné par défaut. La cible est comparée à la fin calculée ;
elle ne compresse pas artificiellement la charge.

Le mode séquentiel représente une capacité commune, sans parallélisme supposé.
Les prédécesseurs doivent apparaître avant leurs successeurs dans sa liste.
Le mode dépendances autorise les chevauchements du graphe ; il n'effectue
pas de nivellement des ressources. Un jalon garde une durée nulle. Une date
fixée manuellement est une borne minimale, sans contourner les dépendances.

Le JSON de reprise conserve les paramètres et les champs normalisés des tâches.
Le CSV neuf colonnes ne conserve ni les paramètres du projet, ni les dates
fixées manuellement, ni l'état des risques. Le détail est dans l'index des données.

La source du pilote reste le JSON documenté dans [data/](data/README.md).
Les fichiers générés ne sont pas corrigés manuellement. Aucun schéma SQL,
stockage serveur, compte supplémentaire ou secret nouveau n'est introduit.

## Dépendances et limites

Le HTML historique utilise Tailwind, SheetJS, Lucide et une police depuis des
services externes. Leur disponibilité réseau est distincte du stockage local.
La V1 ne fournit ni collaboration, ni synchronisation serveur, ni gestion
multiutilisateur des conflits.

Le build conserve les fichiers publics, les points d'entrée PHP et la garde
CONNECT copiée depuis la plateforme. Configuration réelle et état public
n'ont pas été qualifiés dans ce lot. Voir [publication](docs/deployment.md).
