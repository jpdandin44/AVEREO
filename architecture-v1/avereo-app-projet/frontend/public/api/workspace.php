<?php
declare(strict_types=1);
require __DIR__ . '/planning-auth.php';
require __DIR__ . '/workspace-store.php';

planning_response(function (array $auth): array {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') return workspace_locked($auth['directory'], LOCK_SH,
        fn(): array => workspace_listing($auth['directory'], workspace_read($auth['directory'])));
    if ($_SERVER['REQUEST_METHOD'] === 'POST') return workspace_change($auth['directory'], planning_body($auth));
    header('Allow: GET, POST');
    throw new PlanningFailure(405, 'Méthode non autorisée.');
});
