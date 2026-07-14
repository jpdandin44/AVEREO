# feat(rapport): integrate Gemini application

## Summary

Integre Rapport dans le monorepo AVEREO avec un frontend Vite, une API PHP preparee pour la suite, une base MySQL dediee, un environnement local prod-like et un deploiement FTPS. La production publie d'abord une preversion statique avec brouillons navigateur, sans OAuth, API publique ni donnees partagees.

## Gemini source

Archive locale `architecture-v1/avereo-app-rapport.zip`, SHA-256 `A54889BD6A11E58ADD977034970EA0BD39A591AD96098318D1E517FBDBFF27BF`. Le ZIP et son extraction d'audit sont exclus de Git.

## Functional scope

Conserve l'assistant, les brouillons, photos, dictee, cadastre, protocoles, observations, signature, apercu et exports. Prepare une sauvegarde serveur authentifiee sans l'activer dans la preversion. La reouverture depuis une liste serveur est differee au lot de consolidation OAuth.

## Architecture

Application isolee sous `architecture-v1/avereo-app-rapport`, frontend React/Vite 7, API PHP sous `/api`, configuration privee hors document root et gateway HTTP local partage sans socket Docker.

## Frontend changes

Ajout d'un mode de build explicite sans synchronisation, correction de la dictee et de ses erreurs de permission, centralisation du client API futur, callback OAuth PKCE, limite d'import, apercu sandboxe et images d'export filtrees.

## PHP API changes

Ajout de `health.php`, `auth.php` et `reports.php` avec PDO natif, requetes preparees, limites de payload, validation des types, erreurs JSON generiques, controles de roles et propriete.

## Database changes

Ajout de la migration idempotente `001_create_rapport_reports.sql` en InnoDB/utf8mb4, avec identifiants publics, proprietaire, index et dates. Aucun DDL n'est execute par l'API runtime.

## Local subdomain

`http://rapport.avereo.localhost`, route par le gateway partage vers le port technique `8100`.

## Production subdomain

`https://rapport.avereo.fr`.

## Authentication

Drupal OAuth/OIDC est prepare mais differe, avec Authorization Code et PKCE S256, client `avereo_rapport` et roles `utilisateur_rapport`/`administrateur_rapport`. Le mock local utilise des codes aleatoires, expirants et a usage unique. Le build de preversion utilise `VITE_ENABLE_ONLINE_SYNC=false` et n'initialise pas OAuth.

## Security review

Le mode `api_token` exige `environment=local` et un hote `.localhost`; les modes inconnus sont refuses. Aucun secret genere localement n'est present dans les fichiers candidats a Git ou le bundle.

## GitHub Actions and FTPS

Le workflow racine est exclusivement manuel. Il construit avec `npm ci`, assemble `frontend/deploy-preview/`, exclut `api/` et `auth/`, resout le document root, publie en FTPS puis controle la SPA et le blocage HTTP 404 des endpoints prives.

## Validation

- Build Vite 7 reussi et `npm audit` sans vulnerabilite.
- Compose Rapport et gateway valides.
- Syntaxe PHP valide.
- Migration appliquee puis reappliquee.
- CRUD jeton local, mise a jour et nettoyage valides.
- OAuth PKCE, roles, payload HTTP 422 et isolation lecture/ecriture valides.
- URL sans port, fallback SPA, callback et healthcheck valides.
- Aucun secret, ZIP, `.env`, `node_modules` ou `dist` candidat a Git.

## Failed or skipped checks

- Aucun deploiement O2Switch n'a ete declenche; le workflow ne se lance pas au merge.
- Le fournisseur Drupal reel n'est pas encore configure ni teste.
- Dans la console automatisee Codex, les wrappers `token-up`/`oauth-up` ont parfois depasse le timeout de capture apres avoir demarre des services sains; les commandes Compose directes et les tests ont reussi.

## Deployment prerequisites

Creer le sous-domaine et configurer les secrets FTPS pour la preversion. La base, sa migration, la configuration privee et Drupal OAuth ne deviennent necessaires qu'au lot de synchronisation serveur.

## Rollback

Revert par PR, redeploiement humain du dernier artefact valide et restauration de la sauvegarde MySQL uniquement si une migration l'exige. Voir `rollback.md`.

## Risks

Le vrai contrat Drupal reste a valider. La liste de reouverture des rapports serveur est differee. La preversion ne doit pas utiliser de donnees partagees avant OAuth.

## Manual actions required

- Renseigner les secrets cPanel/FTPS de l'environnement GitHub `rapport`.
- Valider la preversion dans la PR, puis merger humainement.
- Lancer manuellement le workflow `Deploy Rapport to O2Switch` depuis `main` uniquement apres validation.
- Configurer plus tard le client Drupal, ses callbacks et les roles avant d'activer la synchronisation.
- Effectuer la review humaine; ne pas merger ou deployer automatiquement.
- Apres le merge, laisser le proprietaire lancer manuellement le workflow `Deploy Rapport to O2Switch` depuis `main`.

## Checklist

- [ ] The Gemini ZIP was audited before execution.
- [ ] No secret is present in the diff.
- [ ] The application uses its dedicated local subdomain.
- [ ] The application uses its dedicated production subdomain.
- [ ] The application has an isolated MySQL schema.
- [ ] The future PHP API is isolated under `/api` and excluded from the preview deployment.
- [ ] Drupal OAuth is prepared.
- [ ] `api_token` is restricted to temporary local use.
- [ ] The production build succeeds.
- [ ] The local prod-like environment was tested.
- [ ] The health endpoint was tested.
- [ ] The critical functional flows were tested.
- [ ] The FTPS workflow is limited to this application.
- [ ] The documentation was updated.
- [ ] The changes are scoped and reviewable.
- [ ] Auto-merge is disabled.
- [ ] No production deployment was triggered.
- [ ] Human review is required before merge.
