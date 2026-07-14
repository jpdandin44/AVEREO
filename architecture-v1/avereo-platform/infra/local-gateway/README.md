# Gateway HTTP local AVEREO

Ce service Traefik partage le port `127.0.0.1:80` entre les applications du monorepo. Chaque application possede un petit fichier declaratif dans `routes/` et rejoint le reseau externe `avereo-local-gateway`.

```powershell
powershell -ExecutionPolicy Bypass -File .\avereo-local-gateway.ps1 up
powershell -ExecutionPolicy Bypass -File .\avereo-local-gateway.ps1 ps
powershell -ExecutionPolicy Bypass -File .\avereo-local-gateway.ps1 logs
powershell -ExecutionPolicy Bypass -File .\avereo-local-gateway.ps1 down
```

Les scripts applicatifs peuvent executer `up`, mais ne doivent jamais executer `down` sur ce composant partage. Aucun socket Docker n'est monte dans le gateway. Ce service est strictement local et ne participe pas au deploiement de production.
