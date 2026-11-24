<?php

declare(strict_types=1);

/** Tableau unique des droits : rôle => liste d'actions autorisées. */
function vision_droits(): array
{
    $conseiller = [
        'project.create',
        'project.read_own',
        'project.update_own',
        'project.archive_own',
    ];

    return [
        'conseiller' => $conseiller,
        'fondateur' => [
            ...$conseiller,
            'project.read_any',
            'project.update_any',
            'project.archive_any',
        ],
    ];
}

/** Rôle ou action inconnus : accès refusé. Le tableau peut être injecté pour les tests. */
function vision_can(string $role, string $action, ?array $droits = null): bool
{
    $tableau = $droits ?? vision_droits();

    return in_array($action, $tableau[$role] ?? [], true);
}

/** Détermine le rôle à partir du fournisseur et des identifiants administrateurs configurés. */
function vision_role_for_identity(array $identity, array $config): string
{
    if (!isset($identity['provider'], $identity['id'])) {
        throw new InvalidArgumentException('Une identité doit contenir provider et id.');
    }

    $providerAutorise = $identity['provider'] === 'avereo_connect'
        || ($identity['provider'] === 'local' && ($config['environment'] ?? null) === 'local');

    if ($providerAutorise
        && is_string($identity['id'])
        && in_array($identity['id'], $config['admin_user_ids'] ?? [], true)
    ) {
        return 'fondateur';
    }

    return 'conseiller';
}

/** Autorise read, update ou archive selon les droits _any ou _own et la propriété stricte. */
function vision_can_on_project(string $role, string $action, array $identity, array $project, ?array $droits = null): bool
{
    if (!in_array($action, ['read', 'update', 'archive'], true)) {
        return false;
    }

    if (vision_can($role, 'project.' . $action . '_any', $droits)) {
        return true;
    }

    return vision_can($role, 'project.' . $action . '_own', $droits)
        && isset($identity['provider'], $identity['id'], $project['owner_provider'], $project['owner_id'])
        && $project['owner_provider'] === $identity['provider']
        && $project['owner_id'] === $identity['id'];
}
