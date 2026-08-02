# Bascule Coupe preproduction vers AVEREO CONNECT

## Objectif

CONNECT devient l'unique point d'authentification. Coupe accepte uniquement un
ticket signe emis apres approbation du compte et controle de l'habilitation
`coupe`.

## Ordre sans interruption

1. Publier le nouveau code Coupe en conservant temporairement l'ancien
   `auth_mode`.
2. Publier le nouveau code CONNECT qui ajoute l'identite au ticket existant.
3. Relancer Coupe depuis CONNECT et verifier le renouvellement du cookie de sas.
4. Modifier la configuration privee Coupe :

```php
'auth_mode' => 'connect_gateway',
'connect_admin_user_ids' => [],
```

Le fichier detecte en preproduction est normalement :

```text
/home/CPANEL_USERNAME/.avereo/coupe-preprod/config.php
```

Le secret `connect_launch_secret` doit rester identique a
`APP_LAUNCH_COUPE_SECRET` dans la configuration privee CONNECT.

## Controles

1. Ouvrir `https://coupe-preprod.avereo.fr/` dans une fenetre privee.
2. Verifier la redirection `303` vers CONNECT.
3. Se connecter une seule fois puis ouvrir Coupe depuis le catalogue.
4. Verifier l'absence de second ecran OAuth et de demande de jeton API.
5. Verifier `/api/auth.php?action=me` :

```json
{
  "ok": true,
  "user": {
    "provider": "avereo_connect",
    "id": "ID_CONNECT"
  }
}
```

6. Sauvegarder un projet en ligne sans en-tete `Authorization`.
7. Verifier l'isolation avec un second compte standard.
8. Verifier que `/auth/callback/` retourne vers la racine protegee.
9. Se deconnecter depuis Coupe et verifier le retour vers CONNECT, puis la
   possibilite de choisir un autre compte.

## Administration Coupe

Une habilitation Coupe simple donne uniquement `coupe_user`. Pour autoriser un
compte a administrer tous les projets :

```php
'connect_admin_user_ids' => ['ID_CONNECT_ADMIN'],
```

Le droit ne doit jamais etre deduit du nom `avereo_admin` ou de l'adresse e-mail.

## Retour arriere

1. Remettre l'ancien `auth_mode` dans la configuration privee.
2. Restaurer l'artefact Coupe precedent si necessaire.
3. Le ticket CONNECT enrichi reste compatible avec les autres applications.
