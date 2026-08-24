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
  'account_activation_secret' =>
    (string) ($connect['IDENTITY_ACCOUNT_ACTIVATION_SECRET'] ?? ''),
  'allowed_return_urls' => [
    'https://connect-preprod.avereo.fr/?logout=1',
  ],
  'logout_ttl_seconds' => 120,
  'request_ttl_seconds' => 120,
  'mail_rate_limit_seconds' => 60,
  'support_email' => 'contact@avereo.fr',
  'connect_activation_complete_url' =>
    'https://connect-preprod.avereo.fr/api/v1/identity/account-activation-complete',
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

L’activation utilise un secret différent du secret de déconnexion :

```text
IDENTITY_ACCOUNT_ACTIVATION_URL=https://auth-next-preprod.avereo.fr/avereo/account/activation
IDENTITY_ACCOUNT_ACTIVATION_SECRET=SECRET_DISTINCT_D_AU_MOINS_32_CARACTERES
SUPPORT_EMAIL=contact@avereo.fr
```

Après l’approbation CONNECT, le pont active le compte d’identité et envoie un
lien personnel à usage unique valable 24 heures. Le mot de passe choisi lors de
l’inscription est conservé. Le formulaire de définition du mot de passe est
réservé aux comptes qui n’en possèdent pas encore ; aucun mot de passe n’est
transmis à CONNECT ni placé dans l’e-mail. Un renvoi invalide le lien précédent
et les demandes sont limitées côté Drupal. Les autres e-mails de gestion des
comptes Drupal reçoivent également `contact@avereo.fr` comme adresse de réponse
et contact d’assistance.

Après chaque remplacement des fichiers du module, reconstruire obligatoirement
le cache de routes et le conteneur Drupal depuis la racine du site :

```bash
php vendor/bin/drush cr
```

Cette étape évite qu’une ancienne déclaration `_controller` continue d’appeler
`ActivationPasswordForm::buildForm` comme un contrôleur. Vérifier ensuite que
la route déployée utilise bien `_form` avant d’émettre un nouveau lien.
