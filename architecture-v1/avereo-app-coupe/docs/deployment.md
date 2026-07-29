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
8. Depuis `main`, lancer manuellement le workflow Deploy Coupe to O2Switch,
   confirmer la production et conserver l'artefact de sauvegarde créé avant le
   transfert.
9. Configurer hors document root `connect_portal_url`,
   `connect_launch_secret` et `connect_launch_nonce_directory`.
10. Verifier que l'acces direct retourne `303` vers CONNECT, qu'un ticket signe
    ouvre Coupe et qu'un ticket rejoue retourne `403`.
11. Ouvrir `https://coupe.avereo.fr/api/health.php` pour verifier l'API.
12. Verifier que `/api/auth.php?action=config` et `/api/projects.php` retournent
    `403` sans cookie de sas.

## Authentification cible

La cible fonctionnelle utilise deux niveaux complementaires :

- CONNECT est le seul point d'entree et emet un ticket serveur signe pour Coupe ;
- Coupe conserve un client Drupal OAuth distinct pour proteger son API et ses
  donnees metier.

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
