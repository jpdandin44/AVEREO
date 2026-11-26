---
project: avereo-app-vision
document_type: verification
title: T-10 — Données terrain et médias privés
status: active
version: git
created: 2026-11-26
updated: 2026-11-26
owner: jpdandin
tags: [vision, terrain, synchronisation, tests]
---

# T-10 — État de remise

Branche : `vision/lot-3a-terrain`. Contrat : [brief T-10](codex/briefs/T-10-terrain-donnees.md). Phase : Développement local. Aucun écran créé. Les phases Préproduction et Mise en production ne sont pas engagées par cette intervention.

## Résultat et points d'entrée

Le domaine, la validation serveur, la synchronisation des photos et commentaires, les médias privés et la file locale sont implémentés. Les signatures destinées aux écrans sont dans [synchronisation](synchronisation.md#8-contrat-terrain-t-10). Les tests T-10 sont `frontend/tests/terrain.test.mjs` et `tests/api/terrain_test.php`. La fixture REF-2 reste inchangée : sa compatibilité est conservée.

La migration 003 crée seulement `vision_media`. La migration 004 étend seulement les deux ENUM `kind`, avec les nouvelles valeurs à la fin. L'exception a été autorisée explicitement le 26/11/2026 par le responsable : « Oui, étendre ». Voir [la décision](adr/0002-medias-prives.md).

## Contrôles réellement exécutés

- `npm test` : 284 tests réussis, aucun échec ni test ignoré, dont valeurs laser, positions et suppression des commentaires, compression pure, empreinte connue, protocole terrain, stockage mémoire/Dexie, migration Dexie v1 vers v2, envoi après acquittement, reprise, refus 4xx et reconnexion.
- `node --test deploiement/*.test.mjs` : 25 tests réussis, dont le contrôle des dépendances du paquet de migration. `database/migrations` est déjà transmis intégralement : aucune liste de fichiers SQL à compléter.
- `npm run build` : bloqué par les permissions Windows du chargeur de configuration ; `npm run build -- --configLoader runner` réussit, service worker généré. Avertissement Vite sur le poids du bundle existant.
- `bash -n deploiement/transmettre-migrations.sh` avec Git Bash : réussi. Le script n'a pas changé.
- Socle documentaire à la racine du dépôt : six fichiers et six répertoires requis présents. Sources Vision conservées sous `docs/`, suivi canonique `data/suivi-vision.json`.
- Contrôle documentaire : métadonnées et liens locaux de neuf documents vérifiés, aucun lien manquant ; JSON du suivi valide, décisions et accords historiques inchangés. Syntaxe des deux scripts PowerShell contrôlée avec le parseur natif.

## Réserves bloquantes de qualification

Commit demandé : staging refusé par les permissions de la session (`index.lock` du worktree partagé non accessible en écriture). Aucun commit ni push. Les changements restent dans l'arbre de travail ; après qualification PHP/MySQL dans une session disposant de l'accès Git, créer le commit français avec `Co-Authored-By: Codex <noreply@openai.com>`.

`php tests/api/run.php` et `php -l` : non exécutables dans cette session (PHP absent du PATH et aucun exécutable trouvé dans les emplacements locaux examinés). Docker refuse l'accès au moteur ; WSL refuse l'accès aux distributions. Aucun contournement de permissions ni installation n'a été tenté. Les tests PHP sont écrits mais ne constituent donc pas une preuve de réussite. Claude Code doit les exécuter sous PHP 8.3/MySQL, en mode strict, avec les migrations 003 et 004.

Le test de migration rejoue chaque SQL deux fois et contrôle le maintien des données et des autres colonnes. Les tests HTTP couvrent envoi, rejeu, conflit, contenu binaire lu, faux type, taille, empreinte incorrecte, UUID et traversée de chemin, droits propriétaire/fondateur, identité attendue, absence de session, archivage, suppression logique et journalisation d'un conflit de commentaire. Ils restent À VÉRIFIER sur la pile PHP/MySQL réelle.

À VÉRIFIER : compression canvas et capture/import sur Android et iPhone ; quota/éviction iOS ; concurrence réelle entre appareils ; permissions POSIX 700 et écriture sur O2Switch, uniquement lors d'une intervention ultérieure autorisée. L'affichage hors ligne d'une photo prise sur un autre appareil n'est pas garanti en 3A. Aucun déploiement, accès serveur, réglage GitHub, secret, vidéo, purge ou changement d'un autre sous-projet.
