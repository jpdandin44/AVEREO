# Authentification Rapport

## Cible AVEREO CONNECT

- Portail de preproduction : `https://connect-preprod.avereo.fr/`
- Point d'entree Rapport : `https://rapport-preprod.avereo.fr/connect/entry.php`
- Fournisseur amont : Drupal, utilise uniquement par CONNECT
- Identite applicative : `provider=avereo_connect` et ID CONNECT signe
- Roles Drupal : `utilisateur_rapport`, `administrateur_rapport`

CONNECT utilise Authorization Code avec PKCE S256 pour identifier l'utilisateur
aupres de Drupal. Rapport ne possede plus de parcours OAuth navigateur
independant : il consomme le ticket HMAC applicatif emis par CONNECT apres les
controles d'approbation et d'habilitation.

Le ticket Rapport exige ce contrat minimal :

```json
{
  "identity": {
    "provider": "avereo_connect",
    "id": "123"
  }
}
```

L'ID CONNECT est obligatoire, numerique, signe et stable. Le ticket ne contient
ni adresse e-mail, ni nom, ni secret, ni jeton Drupal. L'application transforme
ce ticket a usage unique en cookie local `Secure`, `HttpOnly` et `SameSite=Lax`.

L'API filtre les lectures, modifications et suppressions avec `owner_provider` et `owner_id`. Le role `administrateur_rapport` peut administrer tous les rapports.
Un utilisateur habilite recoit le role `utilisateur_rapport`. Les IDs CONNECT
autorisant `administrateur_rapport` sont listes explicitement dans
`connect_admin_user_ids` dans la configuration privee Rapport.

## Barriere d'acces applicative

Lorsque le frontend est construit avec `VITE_ENABLE_ONLINE_SYNC=true`, aucun
ecran metier Rapport n'est affiche avant la validation du cookie CONNECT et de
son identite signee. L'inscription, l'approbation du compte et la connexion
restent centralisees dans CONNECT et Drupal. L'API `reports.php` refuse les
requetes sans sas avec `403` et les cookies sans identite avec `401`.

## Mode local api_token

`api_token` est un secours local temporaire. Le script genere le jeton dans `local/.env`, construit `local/config.php` et ne l'affiche pas. L'API le refuse techniquement si `environment` n'est pas `local` ou si l'hote ne se termine pas par `.localhost`.

Le mode heberge utilise `connect_gateway`. Le mode `drupal_oauth` reste
temporairement disponible pour retour arriere technique, mais ne constitue plus
le parcours cible.

## Actions Drupal manuelles

Drupal reste le fournisseur d'identite de CONNECT. Aucun Consumer OAuth Rapport
supplementaire n'est requis pour le parcours cible. Il faut maintenir le client
CONNECT, Simple OAuth, PKCE, les callbacks CONNECT et les controles
d'approbation deja documentes dans l'application CONNECT.

## Configuration privee Rapport

Le fichier `/home/CPANEL_USERNAME/.avereo/rapport/config.php` doit contenir au minimum :

```php
'environment' => 'production',
'auth_mode' => 'connect_gateway',
'connect_portal_url' => 'https://connect.avereo.fr/',
'connect_launch_secret' => 'SECRET_DISTINCT_PARTAGE_AVEC_CONNECT',
'connect_launch_nonce_directory' => '/home/CPANEL_USERNAME/private/rapport/launch-nonces',
'connect_launch_max_seconds' => 300,
'connect_gate_cookie' => 'AVEREO_RAPPORT_GATE',
'connect_gate_session_seconds' => 1800,
'connect_admin_user_ids' => [],
```

En production, Rapport refuse un secret de moins de 32 caracteres, un ticket
expire, modifie, rejoue, destine a une autre application ou portant une identite
non conforme. Aucun secret n'est stocke dans ce depot.
