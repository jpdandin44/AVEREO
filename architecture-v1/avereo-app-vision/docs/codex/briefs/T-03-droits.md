# Brief Codex T-03 — droits centralisés (R02)

Lot : 2A — Branche : vision/lot-2a-api-projets — Rédigé par Claude Code le 24/11/2026

## Contexte
Lis `architecture-v1/avereo-app-vision/AGENTS.md` (règles permanentes), puis uniquement les fichiers listés ci-dessous.
AVEREO Vision a aujourd'hui deux rôles : `fondateur` et `conseiller`. Un rôle « artisan partenaire » viendra plus tard **sans être construit maintenant** : les droits doivent donc passer par une seule fonction `vision_can(role, action)` et un seul tableau, de sorte qu'ajouter un rôle ne demande de modifier que ce tableau (R02). Code PHP 8.4, `declare(strict_types=1)`, **sans aucune dépendance** (pas de Composer).

## Ce que tu fais
Crée `frontend/public/api/lib/droits.php` et `tests/api/droits_test.php`.

### API de `droits.php` (fonctions globales, préfixe `vision_`)
```php
/** Tableau des droits : rôle => liste d'actions autorisées. */
function vision_droits(): array
// 'conseiller' => ['project.create','project.read_own','project.update_own','project.archive_own']
// 'fondateur'  => les droits du conseiller + ['project.read_any','project.update_any','project.archive_any']

/** Un rôle peut-il faire une action ? Rôle ou action inconnus : false (jamais d'exception). $droits permet de tester avec un autre tableau. */
function vision_can(string $role, string $action, ?array $droits = null): bool

/**
 * Rôle d'une identité authentifiée. $identity = ['provider' => string, 'id' => string].
 * $config['admin_user_ids'] est une liste de chaînes (par exemple ['12', '40']).
 * 'fondateur' si $identity['provider'] === 'avereo_connect' ET $identity['id'] figure dans $config['admin_user_ids'] (comparaison stricte de chaînes),
 * ou si $identity['provider'] === 'local' ET $identity['id'] figure dans $config['admin_user_ids'] ET $config['environment'] === 'local'.
 * Sinon 'conseiller'. Une identité sans provider ou sans id : lève InvalidArgumentException.
 */
function vision_role_for_identity(array $identity, array $config): string

/** Une action sur un projet : true si le rôle a le droit « _any » ou si le rôle a le droit « _own » et que l'identité est propriétaire. */
function vision_can_on_project(string $role, string $action, array $identity, array $project, ?array $droits = null): bool
// $action est « read », « update » ou « archive » (sans préfixe). $project contient owner_provider et owner_id (chaînes).
// Propriétaire = owner_provider === $identity['provider'] ET owner_id === $identity['id'] (stricts).
```

### Tests obligatoires (`tests/api/droits_test.php`, avec `vision_test('nom', function () {…});` du lanceur `tests/api/support.php`)
- Le conseiller peut créer et lire/modifier/archiver ses projets, et ne peut pas `project.read_any`, `project.update_any`, `project.archive_any`.
- Le fondateur a tous les droits du conseiller plus les trois droits `_any`.
- Rôle inconnu (`artisan`, chaîne vide) et action inconnue : `false`.
- **Extensibilité (R02)** : avec un tableau passé en paramètre contenant un rôle `artisan` => `['project.read_own']`, `vision_can('artisan', 'project.read_own', $tableau)` vaut true et `vision_can('artisan', 'project.create', $tableau)` vaut false, sans modifier aucune autre fonction.
- `vision_role_for_identity` : un identifiant listé donne `fondateur` ; non listé `conseiller` ; `'12'` et `12` (entier) ne sont pas équivalents (ids toujours des chaînes : l'entier n'est pas dans une liste de chaînes) ; provider `local` et environnement `local` listé : fondateur ; provider `local` en `production` : conseiller même si listé ; identité sans provider : exception.
- `vision_can_on_project` : le conseiller propriétaire lit, modifie, archive ; un conseiller non propriétaire ne peut rien ; le fondateur peut tout sur un projet d'autrui ; même id mais autre provider : non propriétaire.

## Périmètre
- Fichiers à créer : `architecture-v1/avereo-app-vision/frontend/public/api/lib/droits.php`, `architecture-v1/avereo-app-vision/tests/api/droits_test.php`.
- Fichiers à lire : `tests/api/support.php`, `tests/api/run.php`, `docs/exigences.md` (R02), `docs/architecture.md` (§4 et §8).
- Tu ne touches à aucun autre fichier, et jamais à `data/suivi-vision.json` ni à `docs/plan-lots.md`.
- Aucune nouvelle dépendance.

## Terminé quand
- `php tests/api/run.php droits` (depuis `architecture-v1/avereo-app-vision/`) passe, sans base de données.
- `php -l` réussit sur les deux fichiers ; ajouter un rôle ne demande de modifier que `vision_droits()` (un test le prouve).
- Tu as relu ton diff.

## Ce que tu rends
- Liste des fichiers créés ou modifiés ; commandes lancées et leur résultat ; « À VÉRIFIER » éventuels.
Tu ne commites pas, tu ne pousses pas, tu ne merges pas : Claude Code vérifie puis commite.
