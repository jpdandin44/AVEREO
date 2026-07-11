# Authentification Drupal - Coupe AVEREO

## Objectif

Utiliser `avereo.fr` comme source centrale des comptes, mots de passe et roles, tout en gardant les donnees metier Coupe dans la base MySQL de l'application Coupe.

Le navigateur ne doit pas connaitre les identifiants MySQL. Il doit seulement recevoir une session utilisateur Drupal ou un jeton OAuth valide, puis appeler l'API Coupe.

## Etat verifie le 2026-07-11

- `https://avereo.fr` repond sur O2Switch avec Drupal 11.
- `https://avereo.fr/user/login` est disponible.
- `https://avereo.fr/user/password` est disponible.
- `https://avereo.fr/user/register` repond 403, ce qui indique que l'inscription publique est probablement desactivee.
- `https://avereo.fr/jsonapi` repond 404.
- `https://avereo.fr/oauth/token`, `https://avereo.fr/oauth/authorize` et `https://avereo.fr/.well-known/openid-configuration` repondent 404.

Conclusion : Drupal est bien la bonne brique d'identite, mais OAuth/OpenID Connect n'est pas encore expose publiquement.

## Architecture cible recommandee

1. Drupal gere les utilisateurs AVEREO, les mots de passe, les roles et les permissions.
2. L'application Coupe utilise un flux OAuth2/OpenID Connect avec PKCE.
3. L'API PHP Coupe verifie le jeton Drupal avant toute lecture/ecriture projet.
4. MySQL Coupe stocke les projets et rattache chaque projet a l'identite Drupal.

Le domaine racine `https://avereo.fr` doit rester public. Il ne faut pas activer de regle Drupal globale de type "site prive" ou "connexion obligatoire pour tout le site". Les callbacks OAuth doivent pointer uniquement vers les sous-domaines applicatifs, par exemple `https://coupe.avereo.fr/auth/callback/`.

## Module Drupal requis

Installer et activer Simple OAuth / OpenID Connect sur le Drupal `avereo.fr`.

Configuration attendue pour Coupe :

- issuer : `https://avereo.fr`
- client id public : `avereo_coupe`
- redirect URI : `https://coupe.avereo.fr/auth/callback/`
- scopes minimum : `openid profile email`
- roles suggeres : `coupe_user`, `coupe_admin`

Le client OAuth de Coupe doit etre configure comme client public avec PKCE si l'interface Drupal le permet. Aucun secret OAuth ne doit etre expose dans le JavaScript.

## Evolution API Coupe

Tant que OAuth n'est pas actif, l'API actuelle reste protegee par `api_token`.

Quand OAuth est actif :

- remplacer l'auth partagee `api_token` par `Authorization: Bearer <access_token_drupal>` ;
- valider le jeton cote API Coupe via l'endpoint userinfo/introspection Drupal configure ;
- utiliser les champs `owner_drupal_uid`, `owner_email`, `created_by_drupal_uid`, `updated_by_drupal_uid` ;
- filtrer les listes par proprietaire pour les utilisateurs standards ;
- autoriser les roles admin a voir/supprimer tous les projets.

## Evolution base de donnees

Migration integree par l'API :

```sql
ALTER TABLE coupe_projects
    ADD COLUMN owner_drupal_uid VARCHAR(64) NULL AFTER payload_bytes,
    ADD COLUMN owner_email VARCHAR(190) NOT NULL DEFAULT '' AFTER owner_drupal_uid,
    ADD COLUMN created_by_drupal_uid VARCHAR(64) NULL AFTER owner_email,
    ADD COLUMN updated_by_drupal_uid VARCHAR(64) NULL AFTER created_by_drupal_uid,
    ADD KEY idx_coupe_projects_owner (owner_drupal_uid),
    ADD KEY idx_coupe_projects_owner_updated (owner_drupal_uid, updated_at);
```

Les colonnes sont nullable pour permettre une migration douce des anciens projets sauvegardes avec le jeton technique. L'API verifie et ajoute ces colonnes/index au demarrage si une ancienne table existe deja.

## Configuration serveur cible

Le fichier hors document root pourra evoluer ainsi :

```php
<?php
return [
    'db_host' => 'localhost',
    'db_port' => '3306',
    'db_name' => 'CPANELUSER_coupe',
    'db_user' => 'CPANELUSER_coupe_user',
    'db_password' => 'CHANGE_ME',
    'auth_mode' => 'drupal_oauth',
    'drupal_issuer' => 'https://avereo.fr',
    'drupal_authorize_url' => 'https://avereo.fr/oauth/authorize',
    'drupal_token_url' => 'https://avereo.fr/oauth/token',
    'drupal_userinfo_url' => 'https://avereo.fr/oauth/userinfo',
    'drupal_client_id' => 'avereo_coupe',
    'drupal_client_secret' => '',
    'drupal_scope' => 'openid profile email',
    'drupal_redirect_uri' => 'https://coupe.avereo.fr/auth/callback/',
    'drupal_required_roles' => ['coupe_user', 'coupe_admin'],
    'drupal_admin_roles' => ['administrator', 'admin', 'coupe_admin'],
    'max_payload_bytes' => 50 * 1024 * 1024,
];
```

Le nom exact de l'endpoint userinfo doit etre confirme apres activation du module Drupal.

## Chemin de demarrage

1. Activer Simple OAuth / OpenID Connect dans Drupal.
2. Creer le client OAuth `avereo_coupe`.
3. Renseigner les URLs Drupal OAuth dans `/home/CPANEL_USERNAME/.avereo/coupe/config.php`.
4. Basculer `auth_mode` de `api_token` vers `drupal_oauth`.
5. Deployer, puis verifier `https://coupe.avereo.fr/api/health.php` et une sauvegarde en ligne avec un compte Drupal.
