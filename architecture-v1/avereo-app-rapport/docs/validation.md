# Validation du premier lot

Validation realisee le 13 juillet 2026 dans la branche isolee `feat/rapport-gemini-integration`.

## Resultats

- Installation reproductible avec `npm ci`.
- Build de production Vite 7 reussi.
- `npm audit` : aucune vulnerabilite detectee.
- Syntaxe PHP valide pour tous les points d'entree de l'API.
- Migration MySQL appliquee, reappliquee sans erreur et conteneur sain.
- Healthcheck reel : application `rapport`, base et authentification configurees.
- CRUD API en mode jeton local valide, avec nettoyage de la donnee de test.
- OAuth PKCE valide avec deux utilisateurs standard et un administrateur.
- Callback strictement enregistree et jeton d'un autre client OAuth refuses.
- Isolation validee : le second utilisateur recoit `404` sur le rapport du premier; l'administrateur peut le lire.
- Parcours navigateur valide sur le mock local : chargement, connexion OAuth, creation et sauvegarde en ligne, sans erreur console.
- Artefact verifie : `index.html`, `.htaccess`, `api/` et `auth/callback/` sont presents.
- Build de preversion : `VITE_ENABLE_ONLINE_SYNC=false`, aucune initialisation OAuth ni synchronisation serveur depuis l'interface.
- Controle des secrets generes localement : aucune valeur sensible dans les fichiers suivis ou candidats a Git.
- Gateway partage sain et healthcheck valide sur `http://rapport.avereo.localhost`, sans port explicite.
- La commande Rapport `down` arrete ses conteneurs sans arreter le gateway partage.
- Le gateway utilise des routes fichier et ne monte pas le socket Docker.
- `api_token` retourne HTTP 503 avec l'hote de production, meme lorsque la configuration locale contient un jeton.
- Les payloads mal formes retournent HTTP 422; un autre utilisateur ne peut ni lire ni ecraser le rapport du proprietaire.

## Commandes de reference

```powershell
cd architecture-v1\avereo-app-rapport\frontend
npm ci
npm audit
npm run build

cd ..
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 token-up
powershell -ExecutionPolicy Bypass -File .\tests\api-smoke.ps1
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 oauth-up
powershell -ExecutionPolicy Bypass -File .\tests\oauth-isolation.ps1
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 down
```

## Limites de cette validation

- Aucun deploiement O2Switch n'a ete lance.
- Le module Drupal de claims est fourni dans `integrations/drupal/avereo_rapport_oauth/`; Simple OAuth et le client de production restent a installer/configurer puis a tester sur `avereo.fr`.
- La reouverture d'un rapport depuis une liste serveur est differee au lot de consolidation OAuth; le brouillon local reste le parcours principal de la preversion.
- Dans la console automatisee Codex, `token-up` et `oauth-up` ont demarre des services sains mais le processus de capture Docker Desktop n'a pas toujours rendu la main avant son timeout. Les memes etapes Compose directes, les healthchecks et les tests fonctionnels ont reussi; refaire un lancement interactif PowerShell fait partie de la validation humaine.
