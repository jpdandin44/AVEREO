# Pont d'identité AVEREO

Le module `avereo_identity_bridge` ferme la session du fournisseur d'identité
sans exposer son interface de déconnexion. CONNECT signe chaque demande avec un
secret indépendant du client OAuth. Le module vérifie la signature, la durée de
vie, l'URL de retour autorisée et le rejeu du nonce avant de fermer la session.

Configuration à placer dans `sites/default/settings.php` sans versionner le
secret :

```php
$settings['avereo_identity_bridge'] = [
  'logout_secret' => getenv('IDENTITY_LOGOUT_SECRET') ?: '',
  'allowed_return_urls' => [
    'https://connect-preprod.avereo.fr/?logout=1',
  ],
  'logout_ttl_seconds' => 120,
];
```

Le même secret doit être fourni à CONNECT via `IDENTITY_LOGOUT_SECRET`, avec :

```text
IDENTITY_LOGOUT_URL=https://auth-next-preprod.avereo.fr/avereo/session/logout
```
