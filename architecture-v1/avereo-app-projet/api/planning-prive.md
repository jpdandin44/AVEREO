---
project: avereo-app-projet
document_type: api-contract
title: Sauvegarde privee du planning
status: active
version: git
created: 2026-11-05
updated: 2026-11-06
owner: jpdandin
tags: [projet, api, stockage]
---

# Contrat de sauvegarde privée

## Préférences étendues — candidat local du 6 novembre 2026

L’action `preferences` de `workspace.php` accepte `zoom` (`days`, `weeks`, `months`, `years`) et `collapsed` (booléen), ainsi que `verifyResults` (booléen, défaut false), `manualStart` (booléen, défaut false) et `density` (`comfortable`, défaut, ou `compact`). Les valeurs invalides sont refusées avec 422. La lecture d’un ancien catalogue complète les champs absents en mémoire, sans écriture ; un ancien client envoyant seulement zoom/collapsed conserve les autres préférences déjà enregistrées.

Ces préférences n’écrivent pas dans les documents de planning. Le contrat `checklist` reste identique : une réalisation simple n’est pas une valeur `validated=true` sans preuve, vérificateur et date. Les dates `manualStart` des tâches gardent leur effet même lorsque leur saisie est masquée. En mode navigateur local, les préférences utilisent `avereo.projet.preferences.v1`, distinct de la sauvegarde projet.

**Retour arrière :** le lecteur PHP antérieur refuse `months` et `years`. Après utilisation de ces valeurs, conserver un lecteur compatible ou préparer une conversion ciblée et autorisée de la seule préférence zoom. Ne jamais remplacer le catalogue entier par une copie ancienne au détriment de nouveaux projets, archives ou références client.


## Métadonnées optionnelles de classement — 6 novembre 2026

Dans chaque tâche, `subject` est un texte non vide de 80 caractères maximum et `priority` vaut `haute`, `normale` ou `basse`. Chaque champ peut être absent ; `null` et les valeurs invalides sont refusés (422). Le schéma reste en version 1. Les anciennes tâches sans ces clés sont conservées ainsi ; les suggestions visuelles ne sont pas envoyées automatiquement.

Ces champs suivent le document complet et ses révisions existantes, sans nouvelle route, migration ou modification des droits. Les filtres et largeurs ne sont pas des données serveur. Recharger les anciens onglets avant de confirmer un classement : un ancien client ne garantit pas la conservation de ces nouvelles clés à la réécriture. Qualifier cette extension sur le candidat exact avant toute installation.


## Extension catalogue et préférences du compte

Toutes les routes ci-dessous appliquent la même identité du propriétaire, la
période d’accès, l’origine et le CSRF. Aucun identifiant propriétaire n’est accepté
comme autorisation dans le corps ou l’URL. Les réponses privées sont sans cache.

- `/api/planning.php?project=ID` : contrat GET/PUT ci-dessous, révision propre au
  projet. L’absence d’ID désigne `principal` pour préserver les anciens onglets.
  `version=previous` lit la précédente version du projet sélectionné.
- `GET /api/workspace.php` : `{revision, preferences, projects, csrf, scope}`.
  Chaque entrée contient `id`, `name`, `client`, `savedAt`, `taskCount`,
  `revision`, `archivedAt`. Le document complet n’est pas exposé dans cette liste.
- `POST /api/workspace.php` : `{revision, action, ...}` avec CSRF et JSON comme
  pour le planning. Actions : `create` (`project`, `client` facultatif), `client`
  (`id`, `client`), `archive`/`restore` (`id`), `preferences` (`preferences`).
  Les préférences sont `{zoom: "days"|"weeks", collapsed: boolean}`.
  Réponse : catalogue actualisé et `createdId` pour une création.
- 404 : identifiant absent/invalide ; 409 : catalogue périmé ou écriture sur un
  projet archivé ; 422 : action/préférence/document invalide ou quota atteint.
  Les refus 401/403/413/503 et le contrat principal restent applicables.

Le serveur génère les identifiants `p-` suivis de 32 caractères hexadécimaux ;
aucun chemin fourni par le navigateur n’est utilisé. Les projets archivés sont
lisibles mais non modifiables avant restauration. L’ancien stockage devient
virtuellement `principal` ; GET ne crée ni catalogue ni document de planning.
Les verrous privés peuvent être créés par une lecture.

`workspace.json` garde une révision et `workspace.previous.json` sa copie précédente.
Les nouveaux projets sont dans `projects/ID/`. Chaque répertoire est privé (0700),
les fichiers 0600. Pas de suppression ni de partage. Limite : 100 entrées incluant
`principal` et les archives ; 5 Mo par requête. En cas de réponse incertaine à une
création, actualiser la liste avant de recommencer afin d’éviter un doublon.


`/api/planning.php` requiert une session Projet valide issue de CONNECT et
l'identité du propriétaire de la configuration privée. Refus 401 si session
absente/expirée, 403 pour un autre compte. Aucune liste de projets d'un tiers.

- GET : `{revision, savedAt, project, csrf, scope}` ; projet nul et révision zéro
  lorsqu'aucune sauvegarde n'existe. `?version=previous` lit la copie précédente.
- PUT : JSON `{revision, project}` et en-tête `X-Projet-CSRF` obtenu par GET ;
  origine strictement égale à la configuration. La révision doit être la dernière
  lue. Une réussite renvoie le document complet et sa nouvelle révision datée.
- 409 : modification concurrente ; aucune écriture. 422 : document/révision
  invalide. 413 : plus de 5 Mo. 503 : stockage indisponible ou corrompu, sans
  remplacement automatique. Toute autre méthode renvoie 405.

La validation serveur vérifie enveloppe, dates, tâches, bornes, identifiants,
dépendances et structures détaillées ; le moteur navigateur valide aussi les
règles métier et l'horizon affichable avant envoi. Les champs complets sont
conservés, sans reconstruction des preuves. La signature CONNECT et les périodes
d'accès sont relues à chaque requête. Aucune origine CORS n'est autorisée.

Configuration privée PHP : `owner_connect_id`, `origin`, `directory` ; pour les
tests seulement, `AVEREO_PLANNING_CONFIG` indique un autre fichier. Aucune valeur
secrète n'est fournie au navigateur. `scope` est un identifiant opaque qui sépare
la copie en attente de chaque propriétaire ; `csrf` est lié à la session signée.

Stockage : `current.json`, `previous.json`, vingt `history-N.json`, verrou exclusif.
Le remplacement est atomique après écriture et synchronisation du fichier.
Le répertoire est privé (0700), les documents 0600. Récupérer une copie et la
réimporter produit une nouvelle révision. Pas de suppression ni de fusion API.
