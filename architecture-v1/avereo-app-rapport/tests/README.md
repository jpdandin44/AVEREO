---
project: avereo-app-rapport
document_type: test-index
title: Tests Rapport
status: active
version: git
created: 2026-11-02
updated: 2026-11-13
owner: jpdandin
tags: [connect, rga, tests]
---

## Dossiers complets — recette du 13 novembre

`npm.cmd test` dans `frontend` couvre contenu vs métadonnées, copies de structure actuelles/historiques, import indépendant, octets vérifiés et requêtes API. `php tests/report-download.php` vérifie validation, compteurs et conservation des octets. `python -X utf8 tests/report-files-http.py --receipt CHEMIN_JSON` exerce le vrai PHP et la migration 001 dans MariaDB éphémère locale, avec comptes fictifs, refus inter-comptes, téléchargement exact et réouverture.

PHP et Docker doivent être déjà installés, Docker démarré et `mariadb:11.4` disponible ; aucun téléchargement d’image ou de dépendance. Sous Windows le processus utilise la DLL `pdo_mysql` fournie avec PHP, sans modifier `php.ini`. `--serve --port 5186` conserve la revue sur `http://127.0.0.1:5186/fixture/`, uniquement sur cet ordinateur. Ctrl+C nettoie les processus et le conteneur propres au script. La fixture JSON est synthétique ; aucun dossier réel. [Portée et limites](../docs/partage-tests-et-stockage.md).


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
