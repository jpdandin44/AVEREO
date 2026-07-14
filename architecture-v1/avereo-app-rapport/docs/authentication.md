# Authentification Rapport

## Cible Drupal

- Issuer : `https://avereo.fr`
- Client public : `avereo_rapport`
- Callback local : `http://rapport.avereo.localhost/auth/callback/`
- Callback de production : `https://rapport.avereo.fr/auth/callback/`
- Scopes : `openid profile email`
- Roles Drupal : `utilisateur_rapport`, `administrateur_rapport`

Le client doit utiliser Authorization Code avec PKCE S256. Il est public, non confidentiel et ne possede aucun secret. L'API echange le code et valide le bearer token avec l'endpoint `userinfo` configure cote serveur.

Rapport exige ce contrat `userinfo` :

```json
{
  "sub": "123",
  "client_id": "avereo_rapport",
  "email": "utilisateur@example.fr",
  "name": "Nom affiche",
  "roles": ["utilisateur_rapport"]
}
```

`sub` est obligatoire et doit rester stable. L'adresse e-mail n'est jamais utilisee comme identifiant de propriete. `client_id` doit correspondre exactement au client configure pour Rapport. Le module fourni dans `integrations/drupal/avereo_rapport_oauth/` ajoute `client_id` et filtre le claim `roles` aux deux roles Rapport.

L'API filtre les lectures, modifications et suppressions avec `owner_provider` et `owner_id`. Le role `administrateur_rapport` peut administrer tous les rapports.

## Mode local api_token

`api_token` est un secours local temporaire. Le script genere le jeton dans `local/.env`, construit `local/config.php` et ne l'affiche pas. L'API le refuse techniquement si `environment` n'est pas `local` ou si l'hote ne se termine pas par `.localhost`.

Une preversion peut etre publiee avant la configuration Drupal : l'interface et les brouillons navigateur restent disponibles, tandis que la sauvegarde serveur reste desactivee. Les donnees reelles et la persistance partagee ne doivent etre ouvertes qu'apres validation OAuth et roles.

La preversion est verrouillee au build avec `VITE_ENABLE_ONLINE_SYNC=false`. La remettre a `true` ne suffit pas a ouvrir la production : la configuration privee, le fournisseur Drupal, le client OAuth, les roles et les tests d'isolation doivent tous etre valides au prealable.

## Actions Drupal manuelles

Prealable obligatoire : appliquer la procedure de securisation de `deployment.md` et obtenir un rapport d'etat sans alerte de securite critique.

1. Installer Simple OAuth `^6.1` avec Composer, puis activer `simple_oauth`.
2. Copier et activer `integrations/drupal/avereo_rapport_oauth/` selon son README.
3. Generer les cles privee/publique depuis `/admin/config/people/simple_oauth` et conserver la cle privee hors du document root lorsque l'hebergeur le permet.
4. Laisser OpenID Connect actif dans `/admin/config/people/simple_oauth/openid-connect`.
5. Verifier les roles Drupal existants `utilisateur_rapport` et `administrateur_rapport`.
6. Creer un Consumer dans `/admin/config/services/consumer/add` : client ID `avereo_rapport`, non confidentiel, Authorization Code actif, PKCE actif, callback exacte `https://rapport.avereo.fr/auth/callback/`.
7. Verifier `/oauth/authorize`, `/oauth/token`, `/oauth/userinfo` et `/oauth/jwks`.
8. Tester successivement un compte sans role, un `utilisateur_rapport` puis un `administrateur_rapport`.

Le client local doit rester distinct : `avereo_rapport_local` avec la callback `http://rapport.avereo.localhost/auth/callback/`. Ne jamais ajouter la callback HTTP locale au client de production.

## Configuration privee Rapport

Le fichier `/home/CPANEL_USERNAME/.avereo/rapport/config.php` doit contenir au minimum :

```php
'environment' => 'production',
'auth_mode' => 'drupal_oauth',
'drupal_issuer' => 'https://avereo.fr',
'drupal_authorize_url' => 'https://avereo.fr/oauth/authorize',
'drupal_token_url' => 'https://avereo.fr/oauth/token',
'drupal_userinfo_url' => 'https://avereo.fr/oauth/userinfo',
'drupal_allowed_hosts' => ['avereo.fr'],
'drupal_client_id' => 'avereo_rapport',
'drupal_client_secret' => '',
'drupal_scope' => 'openid profile email',
'drupal_redirect_uri' => 'https://rapport.avereo.fr/auth/callback/',
'drupal_required_roles' => ['utilisateur_rapport', 'administrateur_rapport'],
'drupal_admin_roles' => ['administrateur_rapport'],
```

En production, Rapport refuse les endpoints non HTTPS, les endpoints hors de l'hote autorise, une callback differente meme d'un caractere, un `sub` manquant et un jeton emis pour un autre client OAuth.

L'installation et la configuration sur le Drupal de production restent des operations d'administration controlees ; aucun secret n'est stocke dans ce depot.
