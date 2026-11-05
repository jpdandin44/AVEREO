---
project: avereo-app-projet
document_type: api-contract
title: Sauvegarde privee du planning
status: active
version: git
created: 2026-11-05
updated: 2026-11-05
owner: jpdandin
tags: [projet, api, stockage]
---

# Contrat de sauvegarde privée

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
