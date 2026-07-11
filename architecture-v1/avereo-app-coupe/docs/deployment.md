# Deploiement - Coupe AVEREO Reno Pro

## Cible O2Switch

- Sous-domaine : coupe.avereo.fr
- Dossier cible : document root declare dans cPanel pour `coupe.avereo.fr`
- Contenu publie : frontend/dist/

## Procedure

1. Creer le sous-domaine dans cPanel.
2. Associer le sous-domaine au dossier public voulu.
3. Creer une base MySQL et un utilisateur MySQL dans cPanel.
4. Donner tous les droits de cet utilisateur sur la base Coupe.
5. Creer `/home/CPANEL_USERNAME/.avereo/coupe/config.php` avec les identifiants MySQL et, pour la V1 technique, un `api_token` long.
6. Configurer les secrets GitHub du depot.
7. Verifier que `coupe.avereo.fr` resout publiquement et que le certificat HTTPS est actif.
8. Lancer le workflow Deploy Coupe to O2Switch.
9. Ouvrir `https://coupe.avereo.fr/api/health.php` pour verifier l'API.
10. Dans l'application, utiliser `Sauver en ligne`, saisir le jeton API, puis verifier que le projet apparait dans `Ouvrir en ligne`.

## Authentification cible

La cible fonctionnelle est de remplacer le jeton API partage par une authentification centralisee Drupal via OAuth/OpenID Connect.

Voir `auth-drupal.md` pour le chemin de demarrage et les prerequis cote Drupal/O2Switch.

## Base en ligne

L'application ne se connecte jamais directement a MySQL depuis le navigateur. Elle appelle les endpoints PHP `/api/projects.php`, qui utilisent PDO cote serveur.

Pour de bonnes performances sur O2Switch :

- garder InnoDB et `utf8mb4_unicode_ci` ;
- utiliser les index fournis par `database/migrations/001_create_coupe_projects.sql` ;
- eviter d'importer des plans inutilement lourds si le projet doit etre sauvegarde en ligne ;
- augmenter `post_max_size`, `upload_max_filesize` et `memory_limit` dans cPanel si les projets depassent plusieurs dizaines de Mo.

## Rollback manuel

Conserver une archive du precedent contenu public avant de relancer le workflow, puis restaurer cette archive dans le dossier public si necessaire.
