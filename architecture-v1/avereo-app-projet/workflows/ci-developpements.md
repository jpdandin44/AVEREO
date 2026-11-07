---
project: avereo-app-projet
document_type: workflow
title: Contrôles CI du module Développements privé
status: active
version: git
created: 2026-11-07
updated: 2026-11-07
owner: jpdandin
tags: [projet, developpements, ci, prive, lecture-seule]
---

# CI du module Développements

## Objet et périmètre

Le job `developments-private` du [workflow CI](../../../.github/workflows/ci.yml) qualifie le code du module consultatif et de son pont Drupal/CONNECT sur fixtures. Il ne déploie pas, ne contacte pas l'hébergement, ne modifie aucun compte et ne consomme ni secret réel, ni registre ou projection du responsable. Son jeton GitHub est limité à `contents:read` ; aucun environnement de livraison ou secret O2Switch n'est utilisé.

L'accès du candidat demeure réservé au propriétaire CONNECT exact, administrateur global Drupal attesté à chaque requête. Les tests refusent aussi un autre administrateur global. La qualification sur fixtures ne prouve pas le fonctionnement de la vraie session hébergée.

## Entrées et dépendances

- Checkout du SHA de tête exact du candidat, y compris pour une PR ; les autres jobs de CI peuvent tester la fusion proposée, ce qui reste une preuve distincte.
- Node.js 22, PHP 8.3, cURL/OpenSSL/PDO SQLite ; dépendances Projet installées par `npm ci` depuis le verrou existant.
- Code Projet, broker CONNECT et contrôleur Drupal avec doubles de services ; uniquement données, identités et clés fictives.
- Répertoire de sortie neuf dans l'espace temporaire du runner, hors dépôt et racines publiques.

## Contrôles exécutés

| Contrôle | Commande ou source | Ce qu'il établit |
| --- | --- | --- |
| Syntaxe PHP explicite | Runtime privé Projet, fixtures PHP, classes CONNECT/Drupal et suites dédiées | Ces fichiers sont réellement inclus dans le lint |
| Broker CONNECT | `php architecture-v1/avereo-app-connect/backend/tests/development-authorization.php` | Propriétaire, signatures, rôle, temps, nonces et défaut fermé sur fixtures |
| Contrôleur Drupal | `php architecture-v1/avereo-app-connect/integrations/drupal/avereo_identity_bridge/tests/development-authorization-controller.php` | Décisions et refus avec doubles ; pas de vrai noyau Drupal |
| Régression CONNECT | `php architecture-v1/avereo-app-connect/backend/tests/run.php` | Parcours backend existants sur fixtures |
| Module Projet | `npm run test:developments`, depuis `frontend/` | Session native, refus des profils, API consultative, intégrité, corruption, preuves, paquet/menu et absence d'écriture des sources réelles |
| Build normal | `npm run build`, depuis `frontend/` | Régressions complètes, Gantt conservé et module privé exclu de la distribution publique |
| Paquet privé | `verify-development-ci.mjs` | Source propre exacte, empreintes, configuration inactive, seuls points d'entrée sous `public/`, données et planning inchangés |

Le sas natif généré est préparé **avant** les tests qui l'utilisent, aussi sur checkout neuf. La construction publique reste séparée de celle du module privé.

## Identité de source et sorties

Le constructeur [prepare-development-preproduction.mjs](prepare-development-preproduction.mjs) relève HEAD et l'état Git avant/après construction. Si la source est propre et le HEAD inchangé, `sourceSha` vaut ce SHA et `localUncommitted:false`. Sinon `sourceSha:null` et `localUncommitted:true` ; aucune version propre n'est inventée.

Le contrôleur [verify-development-ci.mjs](verify-development-ci.mjs) exige le SHA attendu et un checkout propre. Il refuse une source sale, un autre SHA, un paquet déclaré installé ou prêt à déployer. Les refus de cette identité sont également couverts par un test unitaire.

Sorties conservées quatorze jours par le job :

- `manifest.json` : liste de fichiers de code, empreinte et SHA exact ;
- `ci-verification.json` : résultat de séparation public/privé et de conservation, sans données réelles.

Ni clé, cookie, vraie preuve, planning, registre privé ou projection réelle ne doivent être joints. Le paquet de code lui-même n'est pas publié comme service par cette CI. Des octets construits sur des systèmes différents peuvent donner des empreintes distinctes : comparer les manifestes, ne pas réattribuer l'empreinte Linux à une copie Windows ni promouvoir un paquet reconstruit sans contrôle.

## Recette locale

Depuis `frontend/` :

```powershell
npm.cmd ci --no-audit --no-fund
npm.cmd run test:developments
npm.cmd run build
```

Depuis la racine Git, **après commit et sur source propre**, choisir un dossier neuf hors dépôt :

```powershell
node architecture-v1/avereo-app-projet/workflows/verify-development-ci.mjs --output DOSSIER_NEUF_HORS_DEPOT --expected-source SHA_COMPLET_TESTE
```

Les tests créent et nettoient seulement leurs fixtures temporaires. La vérification du paquet ne publie rien et garde sa sortie locale pour examen. Ne pas employer un registre ou cookie réel pour ces commandes.

## Phases et limites

**Cadrage → Développement local → Préproduction → Mise en production.** Ce lot reste en Développement local. Une CI réussie n'approuve aucun critère humain et ne donne aucun accord de merge, installation, production ou ouverture.

Restent séparés : vrai noyau Drupal et révocation, identité réelle, configuration/ACL/quotas, sauvegarde fraîche et restauration sur copie, canal de publication privé et recette hébergée. Le [guide de préproduction](../docs/preproduction-developpements.md) décrit ces prérequis. Les observations privées du portefeuille restent dans le suivi canonique de pilotage, hors de cette PR publique.
