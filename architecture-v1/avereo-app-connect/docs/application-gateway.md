# Sas applicatif AVEREO CONNECT

## Objectif

Rapport, Coupe, Projet, Thermo et Drone ne doivent pas être ouverts depuis leur URL publique sans un
passage préalable par AVEREO CONNECT. Une simple redirection ou un paramètre
`from=connect` serait falsifiable ; le passage est donc prouvé par un ticket
signé côté serveur.

## Parcours

1. Drupal identifie l'utilisateur et CONNECT établit sa session.
2. Le catalogue appelle `/api/v1/apps/{code}/launch`.
3. CONNECT vérifie la session et l'approbation du compte.
4. CONNECT émet un ticket HMAC de 90 secondes, lié à une seule application et
   à l'identifiant interne minimal du compte approuvé.
5. `/connect/entry.php` vérifie la signature, l'expiration et le code
   d'application, puis consomme le nonce à usage unique.
6. L'application crée un cookie de sas sécurisé et redirige vers `/`.
7. La page et les API métier exigent ce cookie ; seul
   l'endpoint de santé reste public.
8. Rapport et Coupe dérivent leur identité métier du cookie signé et ne
   redemandent pas une authentification Drupal. La propriété des données reste
   isolée par l'identifiant CONNECT.

## Credentials

Les cinq secrets doivent être aléatoires, faire au moins 32 caractères et rester
hors document root :

- `APP_LAUNCH_RAPPORT_SECRET` dans la configuration privée CONNECT correspond à
  `connect_launch_secret` dans la configuration privée Rapport ;
- `APP_LAUNCH_COUPE_SECRET` dans la configuration privée CONNECT correspond à
  `connect_launch_secret` dans la configuration privée Coupe.
- le même contrat s'applique à `APP_LAUNCH_PROJET_SECRET`,
  `APP_LAUNCH_THERMO_SECRET` et `APP_LAUNCH_DRONE_SECRET`.

Les secrets sont différents. Ils ne sont ni partagés avec le navigateur, ni
commités, ni affichés dans le catalogue.

Le ticket transporte uniquement `provider=avereo_connect` et l'identifiant
interne numérique du compte. Les attributs Drupal et les secrets ne quittent
jamais CONNECT. Les administrateurs Rapport et Coupe sont désignés explicitement
dans la configuration privée de chaque application ; une habilitation simple ne
donne jamais automatiquement les droits d'administration.

## Refus par défaut

- secret ou URL d'entrée absent : application indisponible dans le catalogue ;
- session CONNECT absente : `401` ;
- compte Drupal non approuvé dans CONNECT : `403` ;
- ticket modifié, expiré, rejoué ou destiné à une autre application : `403` ;
- identité CONNECT absente ou mal formée : renouvellement obligatoire depuis
  CONNECT ;
- appel direct d'une API métier ou OAuth sans cookie de sas : `403` ;
- accès direct à une application : redirection `303` vers
  `https://connect.avereo.fr/`.

## Déploiement

Le cookie de sas est limité à 30 minutes par défaut. Les trois applications
doivent être qualifiées ensemble en préproduction. En
production, configurer les secrets et répertoires anti-rejeu avant le code, puis
déployer dans cet ordre :

1. Rapport et Coupe avec lecture compatible des anciens tickets ;
2. CONNECT avec l'identité minimale signée ;
3. bascule des configurations Rapport et Coupe sur
   `auth_mode=connect_gateway` ;
4. qualification fonctionnelle des cinq applications.

Ainsi, les applications savent déjà consommer les tickets lorsque CONNECT
commence à les émettre. Les workflows de production sont exclusivement manuels,
refusent une branche autre que `main`, exigent une confirmation explicite et
archivent le contenu précédent comme artefact de retour arrière avant transfert.
