# Architecture Rapport

## Decision monorepo

Rapport reste dans le monorepo AVEREO. Ce choix permet de reutiliser les controles CI et les scripts FTPS, de faire evoluer le contrat OAuth de facon coherente et de garder une seule politique de securite.

L'isolation ne repose pas sur le nombre de depots : Rapport possede son dossier, son workflow, son sous-domaine, ses ports, sa base, son utilisateur MySQL, sa configuration, ses roles, ses migrations et ses tests.

Un depot separe ne deviendrait pertinent que si Rapport avait une equipe et des droits Git distincts, un cycle de version autonome incompatible avec le monorepo, des exigences legales d'acces separees, ou si la taille/CI du monorepo devenait un frein mesure.

## Flux cible

1. Le navigateur charge le build Vite depuis `rapport.avereo.fr`.
2. Il utilise `/api/auth.php` pour connaitre le mode d'authentification public.
3. Drupal fournit l'identite et les roles via OAuth/OpenID Connect avec PKCE.
4. Le navigateur appelle `/api/reports.php` avec un bearer token.
5. L'API PHP valide l'identite, les roles, la propriete et le payload.
6. PDO accede uniquement a la base MySQL Rapport.

La configuration sensible est chargee depuis `/home/CPANEL_USERNAME/.avereo/rapport/config.php`, hors de `frontend/dist`.

## Structure

- `frontend/src/` : interface et mode brouillon local.
- `frontend/public/api/` : API PHP publiee au build.
- `frontend/public/auth/callback/` : callback OAuth.
- `backend/config.example.php` : modele de configuration sans secret.
- `database/migrations/` : schema versionne.
- `local/` et `docker-compose.local.yml` : environnement prod-like isole.
- `docs/` : audit, architecture, auth, exploitation et rollback.

## Plan d'integration

- Conserver la refonte React existante et son build Vite.
- Ajouter l'API PHP et la table `rapport_reports`.
- Garder IndexedDB comme brouillon hors ligne et ajouter la sauvegarde authentifiee par etapes.
- Utiliser le mock OAuth local avant l'activation Drupal.
- Publier uniquement `frontend/dist/` en FTPS.
- Revenir au commit/deploiement precedent en cas de probleme et restaurer une sauvegarde MySQL si une migration est impliquee.

## Routage local partage

Le compose isole conserve le port technique `8100` pour le diagnostic. Le gateway HTTP partage dans `avereo-platform/infra/local-gateway/` ecoute sur `127.0.0.1:80`, charge une route fichier propre a Rapport sans acces au socket Docker et transmet `http://rapport.avereo.localhost` vers le conteneur applicatif. La commande `down` de Rapport ne touche pas ce composant partage.
