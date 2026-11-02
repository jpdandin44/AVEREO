---
project: avereo-app-rapport
document_type: test-index
title: Tests Rapport
status: active
version: git
created: 2026-11-02
updated: 2026-11-02
owner: jpdandin
tags: [connect, rga, tests]
---

# Tests Rapport

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
