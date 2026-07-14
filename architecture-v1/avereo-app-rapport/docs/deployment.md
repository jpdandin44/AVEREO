# Deploiement Rapport sur O2Switch

## Cible

- Sous-domaine : `https://rapport.avereo.fr`
- Contenu publie : contenu de `frontend/dist/` uniquement
- Transport : FTPS
- Configuration privee : `/home/CPANEL_USERNAME/.avereo/rapport/config.php`
- Base : `CPANEL_USERNAME_rapport`
- Utilisateur : `CPANEL_USERNAME_rapport_user`

## Workflow

Le workflow `.github/workflows/deploy-rapport-o2switch.yml` s'execute uniquement a la demande avec `workflow_dispatch`. Un merge sur `main` ne declenche aucun deploiement. Il utilise Node.js 20, `npm ci`, le build Vite, la resolution cPanel du document root, le deploiement FTPS et une verification HTTP.

Secrets existants attendus :

- `CPANEL_SERVER`
- `CPANEL_USERNAME`
- `CPANEL_PASSWORD` ou `CPANEL_API_TOKEN` pour la resolution du document root
- facultatifs : `O2SWITCH_FTP_SERVER`, `O2SWITCH_FTP_USER`, `O2SWITCH_FTP_PASSWORD`

Variable facultative : `O2SWITCH_FTP_PORT`.

Le workflow ne cree, ne remplace et ne journalise aucun secret.

## Preparation humaine

### Prerequis Drupal avant OAuth

Ne pas exposer les routes OAuth tant que le rapport d'etat Drupal contient une alerte de securite critique. Avant l'installation de Simple OAuth :

1. Sauvegarder la base, les fichiers publics/prives et la configuration Composer.
2. Mettre a jour Drupal core et tous les modules signales par `/admin/reports/updates` comme mises a jour de securite.
3. Executer les mises a jour de base de donnees et reconstruire les caches.
4. Configurer `trusted_host_patterns` pour `avereo.fr` et ses seuls sous-domaines effectivement utilises.
5. Desactiver le mode de developpement Twig et reactiver les caches de rendu, de page dynamique et de page.
6. Recontroler `/admin/reports/status` et le site public avant d'installer le fournisseur OAuth.

Audit du 13 juillet 2026 : Drupal core 11.2.8 et Paragraphs 8.x-1.19 sont signales comme vulnerables par l'interface d'administration. Les versions de securite affichees sont respectivement Drupal 11.4.2 et Paragraphs 8.x-1.21. Ces numeros doivent etre reverifies au moment de l'intervention Composer.

### Etape 1 - preversion sans donnees partagees

Le frontend peut etre publie avant Drupal OAuth pour faire avancer les validations fonctionnelles. Le build doit definir `VITE_ENABLE_ONLINE_SYNC=false`; le workflow Rapport applique cette valeur explicitement. Dans ce mode, ne configurez pas `api_token` en production et n'utilisez pas la sauvegarde serveur. Les brouillons restent dans le navigateur de l'utilisateur et doivent etre exportes regulierement en JSON.

Le workflow assemble `frontend/deploy-preview/` avec uniquement `index.html`, les assets et un `.htaccess` dedie. Les dossiers PHP `api/` et `auth/` sont exclus du deploiement et leurs routes retournent `404`. Le deploiement FTPS synchronise la cible et supprime les anciens fichiers absents de cet artefact.

Verifier avant publication que l'accueil affiche `Preversion sans compte`, que le parcours ne propose aucune connexion AVEREO et qu'aucune requete vers `/api/auth.php` ou `/api/reports.php` n'est emise pendant la creation et l'export d'un brouillon.

### Etape 2 - ouverture de la persistance

1. Creer la base et l'utilisateur MySQL Rapport dans cPanel, puis limiter ses droits a cette base.
2. Appliquer `database/migrations/001_create_rapport_reports.sql`.
3. Creer le fichier prive depuis `backend/config.example.php`, remplacer tous les placeholders et lui donner des permissions restrictives (`600` recommande lorsque possible).
4. Activer le sous-domaine et HTTPS.
5. Installer Simple OAuth 6.1 et le module `integrations/drupal/avereo_rapport_oauth/`, puis configurer Drupal selon `authentication.md`.
6. Configurer les secrets/variables GitHub sans remplacer ceux d'une autre application.
7. Faire relire et merger la PR humainement.
8. Apres le merge et les derniers controles, lancer humainement `Deploy Rapport to O2Switch` depuis GitHub Actions sur la branche `main`.

9. Passer `VITE_ENABLE_ONLINE_SYNC=true` uniquement apres validation de l'authentification, des roles, de l'isolation des donnees et du retour arriere.

## Verification

- `https://rapport.avereo.fr/` charge l'application.
- `https://rapport.avereo.fr/api/health.php` retourne `app: rapport`.
- `/api/auth.php?action=config` expose uniquement la configuration publique.
- `/oauth/userinfo` retourne `sub`, `client_id` et les roles Rapport pour un bearer valide.
- Un jeton d'un autre client OAuth est refuse par Rapport.
- Un utilisateur standard ne voit que ses rapports.
- Un `administrateur_rapport` peut administrer tous les rapports.

Voir `rollback.md` avant toute mise en production.
