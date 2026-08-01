# Deploiement Rapport sur O2Switch

## Cible

- Sous-domaine : `https://rapport.avereo.fr`
- Contenu publie : contenu de `frontend/dist/` uniquement
- Transport : FTPS
- Configuration privee : `/home/CPANEL_USERNAME/.avereo/rapport/config.php`
- Base : `CPANEL_USERNAME_rapport`
- Utilisateur : `CPANEL_USERNAME_rapport_user`

## Workflow

Le workflow `.github/workflows/deploy-rapport-o2switch.yml` s'execute uniquement a la demande avec `workflow_dispatch`, exige la branche `main` et une confirmation de production explicite. Un merge sur `main` ne declenche aucun deploiement. Il utilise Node.js 20.19, `npm ci`, le build Vite avec `VITE_ENABLE_ONLINE_SYNC=true`, la resolution cPanel du document root, une sauvegarde FTPS conservee 30 jours comme artefact, le deploiement FTPS et une verification du sas CONNECT.

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

### Etape 1 - ancienne preversion sans donnees partagees

Cette etape est conservee uniquement comme historique et solution de retour
arriere. Le workflow de production courant ne construit plus la preversion
statique : il publie l'application authentifiee et son sas CONNECT.

L'ancien artefact `frontend/deploy-preview/` excluait `api/` et `auth/`. Il ne
doit plus etre utilise pour la cible securisee.

Verifier avant publication que l'accueil affiche `Preversion sans compte`, que le parcours ne propose aucune connexion AVEREO et qu'aucune requete vers `/api/auth.php` ou `/api/reports.php` n'est emise pendant la creation et l'export d'un brouillon.

### Etape 2 - ouverture de la persistance

1. Creer la base et l'utilisateur MySQL Rapport dans cPanel, puis limiter ses droits a cette base.
2. Appliquer `database/migrations/001_create_rapport_reports.sql`.
3. Creer le fichier prive depuis `backend/config.example.php`, remplacer tous les placeholders et lui donner des permissions restrictives (`600` recommande lorsque possible).
4. Activer le sous-domaine et HTTPS.
5. Configurer `auth_mode=connect_gateway`, le secret de lancement Rapport et
   le repertoire anti-rejeu selon `authentication.md`.
6. Configurer les secrets/variables GitHub sans remplacer ceux d'une autre application.
7. Faire relire et merger la PR humainement.
8. Apres le merge et les derniers controles, lancer humainement `Deploy Rapport to O2Switch` depuis GitHub Actions sur la branche `main`.

9. Configurer `connect_portal_url`, `connect_launch_secret` et
   `connect_launch_nonce_directory` hors document root.
10. Verifier que l'acces direct retourne `303` vers CONNECT, qu'un ticket signe
    ouvre Rapport et qu'un ticket rejoue retourne `403`.

## Verification

- `https://rapport.avereo.fr/` redirige vers CONNECT sans cookie de sas.
- Un lancement depuis CONNECT charge l'application.
- `https://rapport.avereo.fr/api/health.php` retourne `app: rapport`.
- `/api/auth.php?action=config` retourne `403` sans cookie de sas et expose
  `mode=connect_gateway` apres un lancement CONNECT.
- `/api/reports.php` retourne `403` sans cookie de sas.
- L'ancien chemin `/auth/callback/` retourne `303` vers la racine protegee.
- `/api/auth.php?action=me` retourne `provider=avereo_connect` sans bearer
  OAuth supplementaire.
- Une session de sas historique sans identite demande un nouveau lancement
  depuis CONNECT.
- Un utilisateur standard ne voit que ses rapports.
- Seuls les IDs presents dans `connect_admin_user_ids` peuvent administrer tous
  les rapports.

Voir `rollback.md` avant toute mise en production.
