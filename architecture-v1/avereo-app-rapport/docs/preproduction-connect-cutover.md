# Bascule Rapport preproduction vers AVEREO CONNECT

## Objectif

CONNECT devient l'unique point d'authentification. Rapport accepte uniquement
un ticket de lancement signe emis apres approbation du compte et controle de
l'habilitation `rapport`.

La bascule ne modifie ni le secret existant ni la base de donnees. Elle remplace
le second OAuth Rapport par l'identite minimale signee dans le cookie de sas.

## Ordre sans interruption

1. Publier le nouveau code Rapport tout en conservant temporairement
   `auth_mode=drupal_oauth`.
2. Publier le nouveau code CONNECT qui ajoute l'identite au ticket existant.
3. Relancer Rapport depuis CONNECT et verifier que le cookie de sas est renouvele.
4. Modifier la configuration privee Rapport :

```php
'auth_mode' => 'connect_gateway',
'connect_admin_user_ids' => [],
```

5. Ne supprimer aucun parametre Drupal pendant la qualification : ils servent
   de retour arriere technique.

Le fichier detecte en preproduction est normalement :

```text
/home/CPANEL_USERNAME/.avereo/rapport-preprod/config.php
```

Le secret `connect_launch_secret` doit rester identique a
`APP_LAUNCH_RAPPORT_SECRET` dans la configuration privee CONNECT.

## Controles

1. Ouvrir une fenetre privee sur `https://rapport-preprod.avereo.fr/`.
2. Verifier la redirection `303` vers `https://connect-preprod.avereo.fr/`.
3. Se connecter une seule fois sur CONNECT.
4. Ouvrir Rapport depuis le catalogue.
5. Verifier que Rapport s'ouvre sans ecran OAuth Drupal supplementaire.
6. Verifier `/api/auth.php?action=me` dans cette session :

```json
{
  "ok": true,
  "user": {
    "provider": "avereo_connect",
    "id": "ID_CONNECT"
  }
}
```

7. Creer et sauvegarder un rapport, puis verifier qu'un autre compte standard ne
   peut ni le lire ni le modifier.
8. Verifier qu'une ouverture directe de `/auth/callback/` retourne vers la
   racine protegee.
9. Se deconnecter depuis Rapport et verifier le retour vers CONNECT, puis la
   possibilite de choisir un autre compte.

## Administration Rapport

Une habilitation Rapport simple donne uniquement `utilisateur_rapport`. Pour
autoriser explicitement un compte CONNECT a administrer tous les rapports,
ajouter son ID numerique dans la configuration privee :

```php
'connect_admin_user_ids' => ['ID_CONNECT_ADMIN'],
```

Ne jamais deduire ce droit du nom d'utilisateur, de l'adresse e-mail ou du seul
nom `avereo_admin`.

## Retour arriere

1. Remettre temporairement :

```php
'auth_mode' => 'drupal_oauth',
```

2. Restaurer l'artefact Rapport precedent si necessaire.
3. Le ticket CONNECT enrichi reste compatible avec les anciens sas des autres
   applications ; aucun retour arriere CONNECT n'est necessaire pour elles.

