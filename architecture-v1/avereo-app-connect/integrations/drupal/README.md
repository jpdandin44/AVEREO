# Pont d'identité AVEREO

Le module `avereo_identity_bridge` ferme la session du fournisseur d'identité
sans exposer son interface de déconnexion. CONNECT signe chaque demande avec un
secret indépendant du client OAuth. Le module vérifie la signature, la durée de
vie, l'URL de retour autorisée et le rejeu du nonce avant de fermer la session.

Par défaut, le module lit une configuration privée hors racine web dans
`/home/CPANEL_USERNAME/private/avereo-identity-bridge.php` :

```php
<?php
$connect = require '/home/CPANEL_USERNAME/private/connect-preprod/config.php';

return [
  'logout_secret' => (string) ($connect['IDENTITY_LOGOUT_SECRET'] ?? ''),
  'allowed_return_urls' => [
    'https://connect-preprod.avereo.fr/?logout=1',
  ],
  'logout_ttl_seconds' => 120,
];
```

Un autre emplacement peut être choisi dans `sites/default/settings.php` :

```php
$settings['avereo_identity_bridge_config_path'] =
  '/home/CPANEL_USERNAME/private/avereo-identity-bridge-preprod.php';
```

Le même secret doit être fourni à CONNECT via `IDENTITY_LOGOUT_SECRET`, avec :

```text
IDENTITY_LOGOUT_URL=https://auth-next-preprod.avereo.fr/avereo/session/logout
```
