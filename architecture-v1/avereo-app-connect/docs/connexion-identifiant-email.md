---
project: avereo-connect
document_type: functional-specification
title: Connexion par identifiant ou adresse e-mail
status: active
version: git
created: 2026-11-03
updated: 2026-11-03
owner: jpdandin
tags: [connect, identite, connexion, preproduction]
---

# Connexion par identifiant ou adresse e-mail

## État et périmètre

Candidat local sur `fix/connect-login-email-language`, à partir de la tête documentaire `3909fbf` de la PR #97. Aucune installation de ce lot en préproduction. Le runtime antérieur et les preuves du reset restent distincts. Le cockpit privé porte le candidat, la PR, l’artefact et les résultats exacts de qualification.

Le formulaire natif Drupal affiche « Identifiant ou adresse e-mail ». Un identifiant natif existant continue de fonctionner ; une adresse e-mail unique est résolue vers le nom natif du même compte avant validation. Le mot de passe, le compte bloqué et les limites de tentatives restent vérifiés par les validateurs Drupal existants, dans leur ordre initial. Les tentatives par login et par e-mail utilisent ainsi le même identifiant de contrôle natif.

Le champ accepte jusqu’à 254 caractères pour une adresse complète. La casse et les espaces de bord de l’adresse sont pris en charge. Une adresse inconnue reste soumise au refus natif. Une adresse en doublon ou qui correspond au login d’un autre compte est refusée sans choisir une identité arbitraire. Le résolveur ne lit pas le mot de passe, ne sauvegarde aucun compte et ne modifie aucun rôle.

Cette adaptation concerne `user_login_form`, donc le parcours web CONNECT → Identité. Le service natif `user.auth` continue de travailler avec le nom Drupal ; aucun autre protocole d’authentification n’est remplacé. Aucun fournisseur externe ou module de double authentification n’a été qualifié dans cette recette.

## Login lisible d’un compte existant

Le nom affiché dans CONNECT n’est pas automatiquement un alias d’authentification. Pour le compte demandé, une opération séparée prépare le remplacement du nom technique par le login lisible choisi. Les valeurs réelles UID/UUID/e-mail et chemins sont conservées dans un plan privé hors Git et hors racine publique.

`integrations/drupal/operations/reconcile-login.php`, exécuté avec Drush, propose les modes explicites `check`, `apply` et `rollback`. Le mode par défaut est une vérification sans écriture applicative. Le plan impose la racine Drupal, l’UUID du site, l’UID et l’UUID du compte, son e-mail, son ancien nom et le nouveau. Le script refuse le compte UID 1, une identité différente, une collision login/e-mail et un état courant divergent.

Au mode `apply`, il sauvegarde uniquement les métadonnées nécessaires au retour du nom dans un fichier privé de mode 0600. Il utilise une transaction et un verrou, valide l’entité et vérifie la conservation UID/UUID/e-mail/mot de passe/statut/rôles/dates/fuseau/langues. Le retour arrière remet seulement le nom précédent ; un mot de passe changé depuis la livraison est conservé. Aucune restauration de base ni mail de réinitialisation. Les droits et dossiers CONNECT restent attachés à la même identité.

## Langue au provisionnement

La création prend désormais la langue par défaut du site Drupal, au lieu d’imposer `fr`. Cela évite de créer une entité invalide lorsque seule une autre langue est configurée. Ce changement ne traduit pas le site, n’installe pas de langue et ne corrige pas automatiquement les profils historiques. La réparation opérationnelle de langue effectuée sur le compte personnel pendant le test du reset reste documentée dans [la recette précédente](reinitialisation-mot-de-passe.md).

## Vérifications

- 18 contrôles du résolveur et du raccordement au formulaire, avec doubles Drupal : identification, collisions, ordre natif, mot de passe et soumission inchangés.
- 12 contrôles de provisionnement, dont langue configurée anglaise ou française ; 15 régressions reset et parcours d’activation conservés.
- Instance Drupal locale isolée : 10 contrôles HTTP natifs (trois identifiants vers le même compte, mauvais secret, compte bloqué et limite partagée des tentatives) ; 11 contrôles de réconciliation transactionnelle et de retour arrière, dont conservation d’un mot de passe changé après la livraison.
- Huit contrôles de l’installateur sur copies Linux privées : empreinte, sauvegarde/restauration, permissions, échec de cache et refus d’écraser une modification concurrente. Les commandes PHP/cache sont doublées dans ce seul test de fichiers ; les contrôles Drupal ci-dessus utilisent le cœur réel.
- Première recette native sur Drupal 11.3.2, puis mêmes 10 contrôles HTTP et 11 contrôles d’opération réussis sur Drupal 11.4.10, version exacte observée en préproduction. La mise à niveau du conteneur de recette ne change aucune dépendance du livrable. Les versions et reçus finaux sont dans le cockpit. La base SQLite et les comptes `example.invalid` sont propres à cette recette locale ; aucune base hébergée n’est importée.

Commandes ciblées depuis la racine du dépôt :

```text
php architecture-v1/avereo-app-connect/integrations/drupal/avereo_identity_bridge/tests/login-identifier-flow.php
php architecture-v1/avereo-app-connect/integrations/drupal/avereo_identity_bridge/tests/provisioning-flow.php
php architecture-v1/avereo-app-connect/integrations/drupal/avereo_identity_bridge/tests/password-reset-flow.php
```

Pour la recette native, utiliser un conteneur Drupal jetable lié à `127.0.0.1:8093`, Drupal 11.4.10 et Drush 13.8.0, une installation minimale avec la base SQLite `/tmp/identity-fixture.sqlite`, et le module candidat activé. Les paquets de cette fixture ne sont pas des dépendances ajoutées au livrable. Copier l’opération de réconciliation dans `/tmp/reconcile-login.php` du conteneur. Exécuter ensuite les fixtures avec `AVEREO_IDENTITY_LOCAL_FIXTURE=1` et Drush `php:script`. Elles créent un plan privé `/tmp/identity-login-fixture-plan.json` ; les modes `check`, `apply` puis `rollback` de l’opération se sélectionnent avec `AVEREO_LOGIN_RECONCILE_MODE`, le chemin du plan avec `AVEREO_LOGIN_RECONCILE_PLAN`. Après `apply`, lancer la recette HTTP Python depuis l’hôte avec `AVEREO_IDENTITY_LOCAL_FIXTURE=1`. Les comptes et mots de passe du script sont exclusivement synthétiques.

Les scripts `login-native-fixtures.php`, `login-native-reconcile.php` et `login-native-http.py` refusent une recette hors de la base SQLite ou de l’URL locale explicitement attendue. La recette utilise un conteneur jetable, des comptes synthétiques et aucun envoi de mail. Le manifeste de livraison ne contient pas ces fixtures.

## Préparation de la préproduction

Patch limité à trois fichiers de module : `.module`, `AccountProvisioningController.php` et le nouveau `LoginIdentifierResolver.php`. Les scripts de réconciliation et d’installation restent dans le dossier privé d’opérations. L’installateur vérifie l’empreinte de l’archive et sa propre empreinte, contrôle le baseline avant écriture, sauvegarde et restaure sur copie, puis propose une installation ou un retour arrière explicites. Il refuse une autre racine que la préproduction et le mode Python optimisé. Le plan cible un seul compte existant ; il n’applique pas le nom affiché comme login à tous les utilisateurs.

Après accord sur le candidat : revalider cible et empreintes, sauvegarder les deux fichiers existants, vérifier leur restauration sur copie privée, installer le patch et reconstruire le cache Drupal. Exécuter `check`, puis l’ajustement de nom autorisé avec sa sauvegarde. Vérifier les deux connexions avec le titulaire, le même compte CONNECT et ses applications. Aucun nouveau mot de passe à définir ; aucun secret ne doit être collecté par l’agent. En cas d’échec, remettre le nom via `rollback`, puis les seuls fichiers du patch, avec cache reconstruit. Préserver données et mots de passe récents.

| Phase | État |
| --- | --- |
| Cadrage | Login lisible ou e-mail, compte et secret conservés |
| Développement local | Implémenté, contrôles ciblés et recette native ; candidat/CI reliés au cockpit |
| Préproduction | Préparée, non installée ; sauvegarde fraîche et accord exact requis |
| Mise en production | Non autorisée |

## Références natives

Le [formulaire Drupal](https://api.drupal.org/api/drupal/core%21modules%21user%21src%21Form%21UserLoginForm.php/function/UserLoginForm%3A%3AbuildForm/11.x) expose les validateurs d’authentification et de validation finale. La [validation native](https://api.drupal.org/api/drupal/core%21modules%21user%21src%21Form%21UserLoginForm.php/function/UserLoginForm%3A%3AvalidateAuthentication/11.x) garde le contrôle du statut, du mot de passe et des limites de tentatives. Ces références ne constituent pas une preuve de recette hébergée du candidat.
