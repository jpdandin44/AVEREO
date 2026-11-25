---
project: avereo-app-rapport
document_type: test-index
title: Tests Rapport
status: active
version: git
created: 2026-11-02
updated: 2026-11-24
owner: jpdandin
tags: [connect, rga, tests]
---

## Droit de création technique géré par CONNECT — 24 novembre

Depuis `avereo-app-connect/backend/`, `php -d extension_dir=CHEMIN_PHP_EXT -d extension=pdo_sqlite tests/profile-administration.php` vérifie le catalogue et la projection ; `python -X utf8 tests/profiles-http.py --serve --port 5245 --receipt CHEMIN_RECU_JSON` conserve le serveur natif CONNECT avec comptes SQLite fictifs. Pour raccorder Rapport à ce catalogue, lancer depuis Rapport `python -X utf8 tests/report-files-http.py --serve --connect-profile-db CHEMIN_SQLITE_DU_RECU_CONNECT --profile-admin-url http://127.0.0.1:5245 --port 5246 --receipt CHEMIN_RECU_RAPPORT`. Ce second service garde les identités et permissions fictives de sa propre recette. Il exige les prérequis PHP/Docker ci-dessous.

Le test `avereo-app-connect/backend/tests/technical-access.browser.mjs` utilise `CONNECT_RECIPE_ORIGIN=http://127.0.0.1:5245`, `RAPPORT_RECIPE_ORIGIN=http://127.0.0.1:5246` et le compte fictif 2 par défaut. Il teste l’interface native d’administration, puis le vrai lecteur Rapport : création, sauvegarde, retrait, refus d’une copie indépendante et accès/modification/export du dossier existant. `AVEREO_PLAYWRIGHT_PACKAGE` peut pointer le package.json Playwright installé ; `CONNECT_RECIPE_OUTPUT` reçoit le reçu et la capture. Les autres définitions/affectations de profils sont comparées avant/après. Ne pas exécuter sur un compte réel.

La revue déjà démarrée conserve l’ancien service Rapport `http://127.0.0.1:5240/fixture/` et ses dossiers, raccordés au même catalogue CONNECT : A est explicitement autorisé, B ne l’est pas. Cette préparation locale n’attribue aucun droit hébergé. [Règle et limites](../../avereo-app-connect/docs/profils-et-droits.md#droit-de-création-rapport-technique--complément-du-24-novembre).

## Rapport Technique — 24 novembre

Depuis `frontend/`, `npm test` inclut les tests de création, compatibilité et confidentialité techniques ; `npm run build` prépare la compilation. Depuis la racine de l’application, `python tests/report-files-http.py --technical --serve --port 5240 --receipt CHEMIN_RECU_JSON` rejoue les contrôles PHP/MariaDB puis conserve la revue sur `http://127.0.0.1:5240/fixture/`. PHP avec PDO MySQL, Docker actif et l’image existante `mariadb:11.4` sont requis. Les comptes A/B et la base sont fictifs ; aucun accès hébergé n’est utilisé. Fermer le service supprime la base temporaire.

Sur ce service, `node tests/technical-report.browser.mjs` teste mission/constats/photo/plan/repère/signature/Word, sauvegarde et réouverture dans un nouveau contexte sans brouillon. `RAPPORT_RECIPE_ORIGIN` doit rester sur 127.0.0.1 ; `RAPPORT_RECIPE_OUTPUT` choisit le dossier des preuves. Playwright doit être disponible via le paquet Saisie unique, `NODE_PATH` ou `RAPPORT_PLAYWRIGHT_PACKAGE` pointant son package.json ; `PLAYWRIGHT_CHANNEL` vaut chrome par défaut. Les fichiers DOCX sont contrôlés par leur contenu et leurs médias, sans prétendre à une revue native Word. [Contrat et limites](../docs/rapport-technique.md#qualification-locale).

`python tests/trial-http.py` contrôle aussi 30 cas d’accès, d’essai, d’expiration et de révocation. Sa substitution SQLite ne retire que le connecteur PDO, conserve le garde-fou mémoire et ferme les connexions avant nettoyage Windows. Les nouveaux dossiers des recettes génériques et de seuil choisissent explicitement Visite Globale.

## Fermeture de l’aperçu — 18 novembre

Après une compilation connectée (`VITE_ENABLE_ONLINE_SYNC=true`), `node --test tests/report-preview.browser.mjs` depuis la racine de l’application vérifie huit parcours expert/client sur quatre tailles d’écran. Playwright déjà installé doit être résolvable depuis le paquet Saisie unique ou `NODE_PATH` ; `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` permet d’utiliser le navigateur déjà installé. Aucun téléchargement de dépendance n’est requis par le test. `RAPPORT_TEST_DIST` permet de contrôler une compilation antérieure, notamment celle qui reproduit le défaut. Toutes les données sont fictives, les appels externes sont bloqués et aucune écriture hébergée n’est faite. [Résultats, clavier et portée](../docs/source-audit.md#fermeture-de-laperçu--candidat-local-du-18-novembre).

## Terrain horizontal — révision locale du 14 novembre

frontend/src/terrainObservations.test.js ajoute huit tests métier : Tn sans décaler le bâti, déplacement dans son groupe, Word/client, suspension du protocole, copie expurgée, cadrage des tuiles/zoom 20 natif 19, bornes et rattachement tardif. Total Node : 202 réussis. php tests/observation-plans-validation.php : 13 cas, dont cadastre ; php tests/report-download.php : octets et compteurs réussis. Deux builds sync=false/true, 150 fichiers.

Le script HTTP accepte --fixture CHEMIN_JSON_FICTIF et rejoue 38 contrôles PHP/MariaDB avec comptes signés fictifs. La fixture de révision comporte 14 constats/4 photos/2 plans ; la recette navigateur ajoute une troisième vue cadastrale réelle, vérifie reprise serveur et source, puis deux Word. Service de revue --serve --port 5191 ; préconditions ci-dessous. [Scénario, lecture native et limites](../docs/environnement-terrain.md#qualification-effectuée). Les preuves Site suivantes sont historiques.

## Contexte extérieur — recette locale du 14 novembre

Les huit cas de `frontend/src/environmentContext.test.js` vérifient compatibilité, numérotation/repères, choix client indépendant, persistance, résultat tardif, vue retirée, confidentialité de la structure de test et entrées invalides. `php tests/report-download.php` inclut le compteur photo du contexte et l'empreinte des octets.

Le script HTTP existant accepte `--fixture CHEMIN_JSON_FICTIF` : il rejoue le dossier complet avec le contexte, ses compteurs et trois vérifications complémentaires de réouverture/propriété (38 contrôles). Avec `--serve --port 5190`, il conserve la revue locale ; les prérequis PHP/Docker et limites ci-dessous s'appliquent. [Scénario navigateur, Word et preuves](../docs/environnement-terrain.md#qualification-effectuée).


## Dossiers complets — recette du 13 novembre

`npm.cmd test` dans `frontend` couvre contenu vs métadonnées, copies de structure actuelles/historiques, import indépendant, octets vérifiés et requêtes API. `php tests/report-download.php` vérifie validation, compteurs et conservation des octets. `python -X utf8 tests/report-files-http.py --receipt CHEMIN_JSON` exerce le vrai PHP et la migration 001 dans MariaDB éphémère locale, avec comptes fictifs, refus inter-comptes, téléchargement exact et réouverture.

PHP et Docker doivent être déjà installés, Docker démarré et `mariadb:11.4` disponible ; aucun téléchargement d’image ou de dépendance. Sous Windows le processus utilise la DLL `pdo_mysql` fournie avec PHP, sans modifier `php.ini`. `--serve --port 5186` conserve la revue sur `http://127.0.0.1:5186/fixture/`, uniquement sur cet ordinateur. Ctrl+C nettoie les processus et le conteneur propres au script. La fixture JSON est synthétique ; aucun dossier réel. [Portée et limites](../docs/partage-tests-et-stockage.md).

## Originaux privés — recette locale

Depuis `frontend/`, `npm.cmd test` exécute les règles client, notamment accusé d’envoi, contrôle des octets et résultat tardif. `npm.cmd run build` vérifie l’assemblage. Sous Windows avec PHP déjà installé :

```powershell
php -d extension_dir="C:\Users\examg\AppData\Local\Programs\PHP\ext" -d extension=pdo_sqlite -d extension=sqlite3 tests/photo-originals.php
python -X utf8 tests/photo-originals-http.py --receipt CHEMIN_RECU_JSON
```

Le premier test utilise SQLite et des fichiers temporaires ; il couvre propriétaire, intégrité, limites/quota, concurrence, panne et restauration à blanc. Le second requiert Docker déjà démarré, l’image **déjà disponible** `mariadb:11.4` et `pdo_mysql` ; il ne télécharge rien. Il crée uniquement un conteneur éphémère local dédié, applique les vraies migrations et vérifie HTTP multipart, deux identités fictives, lecture dans une nouvelle session et sauvegarde/restauration indépendante. Il arrête son conteneur à la fin.

Pour la revue navigateur : `python -X utf8 tests/photo-originals-http.py --serve --port 5185`. Entrée : `http://127.0.0.1:5185/fixture/`. Le service doit rester actif ; Ctrl+C termine ses seuls processus et son conteneur. La base de recette est temporaire, sans lien avec les données hébergées. Les limites fictives de 1 Mio/photo et 2 Mio/compte ne sont pas des réglages d’hébergement. Le sas réel de Rapport consomme des tickets locaux fictifs ; ce test ne vérifie pas le fournisseur CONNECT/OAuth hébergé. Test PHP non ajouté à la CI dans cette tranche (périmètre local).


# Tests Rapport

Les tests `frontend/src/georisquesRiskSummary.test.js`, exécutés par `npm test`,
simulent les interruptions, les erreurs HTTP et JSON, les délais de quota,
l'annulation et la conservation d'une synthèse au même point. Ils ne prouvent
pas la disponibilité réelle du service. [Diagnostic et qualification](../api/georisques.md).

Apres `token-up` :

```powershell
powershell -ExecutionPolicy Bypass -File .\tests\api-smoke.ps1
```

Apres `oauth-up` :

```powershell
powershell -ExecutionPolicy Bypass -File .\tests\oauth-isolation.ps1
```

Les deux scripts utilisent uniquement des donnees factices, suppriment le rapport cree et n'affichent aucun jeton.


## Sas RGA indépendant

Après construction du frontend : `php tests/rga-gate.php` et `python tests/rga-http.py`. Le second lance temporairement le vrai serveur PHP sur un port local libre et utilise des clés fictives. Il contrôle les tickets valides, expirés, rejoués, mal signés ou destinés à une autre application ; Rapport seul ne donne pas accès à RGA, et réciproquement. Il supprime ensuite ses fichiers temporaires. Les deux contrôles tournent en CI.
