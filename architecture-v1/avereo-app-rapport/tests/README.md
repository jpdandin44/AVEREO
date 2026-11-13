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
