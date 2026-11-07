---
project: avereo-connect
document_type: api-contract
title: Autorisation privée des développements — candidat local
status: active
version: git
created: 2026-11-07
updated: 2026-11-07
owner: jpdandin
tags: [connect, drupal, developpements, autorisation, local]
---

# Autorisation privée des développements

## État et portée

Implémentation locale, désactivée par défaut, sans déploiement. Ce contrat ne modifie pas les tickets de lancement, les rôles, les comptes ou les permissions d'autres applications. Le lecteur privé Node reste disponible ; le [lecteur PHP consommant la session native Projet](../../avereo-app-projet/docs/preproduction-developpements.md) est maintenant codé et testé sur fixtures, mais non installé sur la cible réelle.

| Producteur | Route POST | Autorité |
| --- | --- | --- |
| CONNECT | `/api/v1/developments/authorize` | propriétaire CONNECT exact, compte lié actif, session non révoquée, accès Projet, puis décision Drupal |
| Drupal Identité | `/avereo/developments/authorization` | sujet propriétaire exact, utilisateur actif, rôle défini comme rôle administrateur global et réellement affecté |

Les endpoints ne prennent pas un rôle ou un sujet arbitraire du navigateur. La route Drupal utilise son authentification machine signée dédiée ; `_access:true` ne dispense pas du contrôle HMAC dans son contrôleur. Le refus ou l'indisponibilité restent fermés et ne retournent ni titre de suivi ni preuve.

## Enveloppe commune exécutable

Objet JSON exactement `{"payload":"BASE64URL_JSON","signature":"HMAC_SHA256_HEX"}`. Le HMAC est calculé sur la chaîne `payload`, sans secret dans le navigateur/URL/log. Les messages `v:1` portent émetteur `iss`, destinataire `aud`, type, `iat`, `exp`, nonce aléatoire de 48 caractères hexadécimaux et champs métier. Durée maximale 30 secondes, tolérance de 5 secondes sur l'horloge future ; signature, portée, identité, nonce et fraîcheur vérifiés. Charge encodée limitée à 8192 caractères, requête HTTP à 16 Kio.

Projet → CONNECT : `iss:avereo-projet-developments`, `aud:avereo-connect-developments`, `type:request`, `connectId` exact et `sessionIssuedAt` entier. Le client local est un service de confiance protégé par sa propre capacité ; cette signature ne constitue pas une authentification navigateur CONNECT. Le futur lecteur hébergé devra fournir l'identité depuis la vraie session Projet, pas depuis du JSON utilisateur.

CONNECT → Drupal : `iss:avereo-connect-developments`, `aud:<issuer Drupal configuré>`, `type:request`, sujet stable du compte relu par CONNECT et nouveau nonce. Drupal → CONNECT : message `type:response`, `requestNonce`, sujet, `active`, `globalAdmin` et rôle courant ; CONNECT exige une décision positive cohérente, liée au nonce.

CONNECT → Projet : `iss:avereo-connect-developments`, `aud:avereo-projet-developments`, `type:response`, `connectId`, `active`, `globalAdmin`, `scope:developments:read` et `requestNonce` égal au nonce initial (plus un nonce de réponse distinct). Aucune autorisation durable n'est stockée. Le compte CONNECT est relu après l'appel Drupal pour détecter une révocation pendant l'appel. Tous les accès protégés renouvellent le contrôle ; une panne ne réutilise pas le dernier accord.

## Configuration CONNECT — privée et inactive ici

Variable `DEVELOPMENTS_PRIVATE_CONFIG` : chemin d'un fichier PHP privé hors document root, renvoyant :

```php
<?php
return [
  'enabled' => false,
  'owner_connect_id' => 'ID_STABLE_A_QUALIFIER',
  'project_key' => 'CLE_DEDIEE_PROJET_CONNECT_A_GENERER_EN_PRIVE',
  'identity_key' => 'AUTRE_CLE_DEDIEE_CONNECT_DRUPAL',
  'identity_issuer' => 'https://IDENTITE_A_QUALIFIER',
  'identity_url' => 'https://IDENTITE_A_QUALIFIER/avereo/developments/authorization',
  'nonce_directory' => '/CHEMIN_PRIVE_A_QUALIFIER/nonces',
];
```

Configuration active seulement si `enabled===true`, repository PDO réel et paramètres strictement valides. Clés d'au moins 32 caractères, différentes entre elles et des secrets existants fournis au contrôle. Une erreur ferme cette seule route (503) et ne coupe pas les autres fonctionnalités CONNECT. Aucune valeur réelle/configuration active n'est créée par ce lot.

HTTPS obligatoire, origine/port de l'autorité identiques à l'issuer, chemin exact, sans query/fragment/identifiants ; certificat vérifié, aucun redirect, délais connexion 3 s/total 5 s, réponse bornée à 16 Kio. Épinglage certificat spécifique non implémenté ; validation TLS standard. Dépendance cURL à vérifier sur la cible.

Les nonces sont consommés par création exclusive d'un fichier privé sous un dossier existant hors webroot (0700 sur POSIX). Limite 4096 fichiers : refus quand pleine, pas de purge automatique. Qualifier une maintenance privée des nonces expirés et les protections des fichiers de configuration avant installation. Aucun fichier ne doit être publié ou synchronisé par le frontend.

## Configuration Drupal — privée et inactive ici

Dans les paramètres privés de Drupal, clé de configuration `avereo_developments_authority` :

```php
$settings['avereo_developments_authority'] = [
  'enabled' => false,
  'secret' => 'MEME_CLE_DEDIEE_CONNECT_DRUPAL_A_GENERER_EN_PRIVE',
  'issuer' => 'https://IDENTITE_A_QUALIFIER',
  'owner_subject' => 'SUJET_DRUPAL_EXACT_A_QUALIFIER',
];
```

Le contrôleur relit utilisateur, `user.settings.admin_role` et définition du rôle après invalidation des caches locaux d'entités/configuration. L'utilisateur doit être actif, avoir le rôle configuré, et ce rôle doit satisfaire `isAdmin()`. Ni UID 1, ni nom/e-mail, ni rôle d'organisation ne donnent un accès implicite. Cache et verrou Drupal consomment le nonce avec exclusion mutuelle ; seules ces écritures techniques de fonctionnement sont nécessaires, aucun compte/rôle n'est enregistré ou modifié.

Sans activation explicite : 503. Paramètres invalides, entrée malformée, signature/rejeu/identité invalide : refus (403). Réponses `no-store, private`. La définition du rôle global doit être réellement renseignée : aucune attribution/migration automatique n'est exécutée.

## Recette locale et limites

```powershell
php backend/tests/development-authorization.php
php integrations/drupal/avereo_identity_bridge/tests/development-authorization-controller.php
php backend/tests/run.php
```

Le fournisseur pur et le broker sont exercés ensemble ; le contrôleur utilise des doubles de services Drupal/Symfony, pas un kernel Drupal installé. L'interopérabilité Node/PHP est testée depuis Projet. Comptes/IDs/clés de recette sont fictifs ; aucune suspension ou suppression du rôle du vrai propriétaire n'est utilisée pour tester la révocation.

[Guide Projet, copie privée, modes d'accès et suite](../../avereo-app-projet/docs/pont-stockage-local.md). Avant tout déploiement : vérifier vraie session, mappage propriétaire/sujet, runtime, HTTPS, répertoires et ACL, configuration privée, horloges, cache/lock réels, révocation et profils tiers sur fixtures hébergées. Les réussites locales ne valent ni validation humaine, ni raccordement réel, ni accord de livraison.
