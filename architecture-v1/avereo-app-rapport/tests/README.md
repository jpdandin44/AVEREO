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
