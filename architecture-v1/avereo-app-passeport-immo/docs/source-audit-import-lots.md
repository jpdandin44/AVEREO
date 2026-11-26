---
project: avereo-app-passeport-immo
document_type: source-audit
title: Import des lots selon la limite effective du serveur
status: active
version: git
created: 2026-11-26
updated: 2026-11-26
owner: jpdandin
tags: [passeport, import, volume, integrite]
---

# Correction de l’import des 27 fichiers

Le défaut REC-04 est reproduit le 26 novembre en préproduction : un dossier de 27 fichiers est envoyé en une requête et rejeté sur le contrôle du nombre reçu. La sélection 20+7 réussit. Le front utilisait toujours 100 fichiers alors que la présence de `.user.ini` ne prouve pas la limite effective du handler web. Le seuil exact hébergé reste inconnu ; aucune configuration globale PHP n’est modifiée.

## Écart à la source historique et parité

| Élément | Évolution ciblée | Préservation |
| --- | --- | --- |
| `/api/session` | Retour authentifié `documentUploadLimits.filesPerBatch`, lu depuis `ini_get('max_file_uploads')`, borné à 100, repli 20 si valeur absente/invalide. | Origine, CSRF, identité et contrôles du stockage inchangés ; aucun secret ou chemin renvoyé. |
| `server-store.js` | Le dépôt expose la limite reçue avec sa session. | Mêmes requêtes multipart, attente de sauvegarde et révisions. |
| `import-files.js` | Lots selon la limite annoncée ; repli 20 pour ancien serveur ou IndexedDB, borné à 100. | Taille utile500 Mio, fichiers entiers, ordre et catégorie ; confirmation et reprise seulement après succès du lot. |
| `DocumentsPanel.jsx` | Affiche la même limite que le planificateur. | Sélection multiple/dossier, prévalidation, doublons et reprise existants. |

Le contrôle intégral `tests/check-parity.mjs` réussit : `App.jsx`, calculs et autres comportements historiques restent exacts après les substitutions déclarées. Les audits initiaux et livrables approuvés restent figés ; cette annexe porte le nouvel écart et sa matrice. Pas de migration, droit, propriétaire, suppression, transformation d’image ou modification du circuit Word/PDF.

## Cadrage

Objectif : sélectionner27 fichiers et obtenir leur réception complète malgré une limite PHP 20, sans réduire les originaux. La sélection n’a pas de plafond global20 : elle est répartie automatiquement en requêtes successives. Une interruption conserve les lots confirmés et les doublons sont évités à la reprise. D02/REC-04 reste lié au suivi canonique `rapportV2Technique20261124.importBatchCorrection20261126`.

## Développement local

Deux tests régressifs échouent avant correction : lot27 envoyé en une fois et limite 7 ignorée. Après correction,93 tests frontend réussissent ; build Vite réussi avec l’avertissement de taille des bundles préexistant. Le contrôle de parité et la syntaxe PHP réussissent.

Le vrai service Apache/PHP/MariaDB est lancé avec `max_file_uploads=20` dans une configuration de test isolée.276 assertions réussissent, dont : limite20 annoncée par la session web, requête brute27 refusée sans ajout partiel,27 contenus distincts reçus en 20+7,27téléchargements exacts dans une autre session, réimport dédoublonné et autre compte refusé. Les vérifications de revue privée, validation Word, PDF après approbation, publication distincte et sauvegarde/restauration restent réussies.

Dans le navigateur local,27 PNG distincts sont sélectionnés par **Importer un dossier** : lot 1 sur 2 observé,27 ajouts. Une seconde sélection donne0 ajout/27 doublons. Les documents persistent après rechargement ; un PNG retéléchargé est identique. Ces petites images qualifient le nombre, pas une nouvelle capacité de volume.

Revue locale : [entrée des comptes fictifs](http://127.0.0.1:32768/fixture/) → Déposant/expert A → RECETTE FICTIVE — 27 fichiers distincts. Ce service temporaire doit être revérifié à la reprise. Il contient27 PDF du test API et27 PNG du contrôle navigateur.

Commandes : `npm.cmd test`, `npm.cmd run build` depuis `frontend/` ; `node tests/check-parity.mjs`, `php -l frontend/public/api/index.php` depuis l’application ; `python -X utf8 tests/check-storage-http.py --serve --port 0` pour le service fictif.

## Préproduction

Pas d’installation de ce candidat. Après revue et accord applicable : sauvegarde fraîche, restauration sur copie et inventaire ; vérifier la limite renvoyée par le PHP web réel, importer27 contenus distincts d’un seul geste, interrompre/reprendre et comparer les empreintes après nouvelle session. Rejouer les téléchargements Word/PDF et l’absence de publication implicite. Les preuves du26sur le candidat livré restent historiques et REC-04 demeure ouvert côté hébergé.

## Mise en production

Non engagée. Les accords antérieurs PR202/PR215 ne sont pas étendus à ce candidat. Le JSON réel de Philippe, le plafond100 Mo, le mobile et les droits intercomptes hébergés restent des qualifications distinctes ; aucune clôture R12-18.

## Preuves et suivi

[Suivi canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>), bloc D02 ci-dessus. [Preuves locales](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/passeport-import-lots-20261126/http-local-result.json>) et [contrôle navigateur](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/passeport-import-lots-20261126/browser-result.json>). [Contrat des imports volumineux](import-volumineux.md). La [liaison directe proposée](liaison-directe-rapport.md) reste préparée séparément, sans code dans ce correctif.

[Reçu local versionné](../api/import-lots-observation.json) : empreintes des fichiers testés et artefact construit. Les vérifications locales ne cochent aucune case humaine.
