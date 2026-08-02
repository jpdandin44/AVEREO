<?php

declare(strict_types=1);

use Avereo\Connect\Application;
use Avereo\Connect\Config;
use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Http\Request;
use Avereo\Connect\Http\Response;
use Avereo\Connect\Repository\ConnectRepository;
use Avereo\Connect\Security\AppLaunchTicketIssuer;
use Avereo\Connect\Security\AuthContext;
use Avereo\Connect\Security\OAuthTransactionStore;

require dirname(__DIR__) . '/src/autoload.php';

final class FakeRepository implements ConnectRepository
{
    public bool $allowMutation = true;
    public int $auditCount = 0;
    public int $accountAuditCount = 0;
    /** @var list<string> */
    public array $allowedApps = ['rapport', 'coupe'];

    public function databaseStatus(): string
    {
        return 'ok';
    }

    public function findUserIdByDrupalSubject(string $drupalSubject): ?int
    {
        return match ($drupalSubject) {
            'drupal-test' => 42,
            'drupal-member' => 43,
            'drupal-suspended' => 52,
            default => null,
        };
    }

    public function findIdentityStatusByDrupalSubject(string $drupalSubject): ?string
    {
        return match ($drupalSubject) {
            'drupal-test' => 'active',
            'drupal-member' => 'active',
            'drupal-suspended' => 'suspended',
            'drupal-rejected' => 'rejected',
            default => null,
        };
    }

    public function registerPendingIdentity(
        string $drupalSubject,
        ?string $email,
        ?string $displayName,
    ): void {
    }

    public function canLaunchApplication(int $userId, string $applicationCode): bool
    {
        return $userId === 42 && in_array($applicationCode, $this->allowedApps, true);
    }

    public function listCatalog(int $userId): array
    {
        if ($userId !== 42) {
            return [];
        }
        return array_map(
            static fn (string $code): array => [
                'code' => $code,
                'name' => ucfirst($code),
                'description' => 'Application de test ' . $code,
                'displayOrder' => 10,
            ],
            $this->allowedApps,
        );
    }

    public function findUserProfile(int $userId): array
    {
        return ['id' => $userId, 'displayName' => 'Test AVEREO', 'status' => 'active'];
    }

    public function listOrganizations(int $userId): array
    {
        return [['id' => 7, 'name' => 'Espace test', 'slug' => 'espace-test', 'role' => 'owner']];
    }

    public function listApplications(int $userId, int $organizationId): array
    {
        return [['code' => 'rapport', 'name' => 'Rapport', 'entitlementStatus' => 'active']];
    }

    public function listEntitlements(int $userId, int $organizationId): array
    {
        return [['applicationCode' => 'rapport', 'status' => 'active']];
    }

    public function upsertEntitlement(
        int $actorUserId,
        int $organizationId,
        string $applicationCode,
        string $status,
        ?string $validFrom,
        ?string $validTo,
        string $requestId,
    ): array {
        if (!$this->allowMutation) {
            $this->auditCount++;
            throw new ApiException(403, 'FORBIDDEN', 'Mutation refusée.');
        }
        $this->auditCount++;
        return [
            'applicationCode' => $applicationCode,
            'status' => $status,
            'validFrom' => $validFrom,
            'validTo' => $validTo,
        ];
    }

    public function getAccountAdministration(int $actorUserId, int $organizationId): array
    {
        if ($actorUserId !== 42 || $organizationId !== 7) {
            throw new ApiException(403, 'ACCOUNT_ADMINISTRATION_DENIED', 'Administration refusee.');
        }
        return [
            'organization' => ['id' => 7, 'name' => 'Espace test', 'slug' => 'espace-test'],
            'actorRole' => 'owner',
            'assignableRoles' => ['owner', 'admin', 'member', 'viewer'],
            'applications' => [['code' => 'rapport', 'name' => 'Rapport']],
            'pendingIdentities' => [[
                'id' => 9,
                'email' => 'pending@example.invalid',
                'displayName' => 'Pending Test',
            ]],
            'users' => [[
                'id' => 42,
                'email' => 'owner@example.invalid',
                'displayName' => 'Owner Test',
                'status' => 'active',
                'role' => 'owner',
                'canChangeStatus' => false,
            ]],
        ];
    }

    public function approvePendingIdentity(
        int $actorUserId,
        int $organizationId,
        int $pendingIdentityId,
        string $role,
        string $requestId,
    ): array {
        if ($actorUserId !== 42 || $organizationId !== 7) {
            throw new ApiException(403, 'ACCOUNT_ADMINISTRATION_DENIED', 'Administration refusee.');
        }
        $this->accountAuditCount++;
        return [
            'id' => 51,
            'email' => 'pending@example.invalid',
            'displayName' => 'Pending Test',
            'status' => 'active',
            'role' => $role,
        ];
    }

    public function rejectPendingIdentity(
        int $actorUserId,
        int $organizationId,
        int $pendingIdentityId,
        string $requestId,
    ): array {
        if ($actorUserId !== 42 || $organizationId !== 7) {
            throw new ApiException(403, 'ACCOUNT_ADMINISTRATION_DENIED', 'Administration refusee.');
        }
        $this->accountAuditCount++;
        return ['id' => $pendingIdentityId, 'status' => 'rejected', 'displayName' => 'Pending Test'];
    }

    public function updateUserStatus(
        int $actorUserId,
        int $organizationId,
        int $targetUserId,
        string $status,
        string $requestId,
    ): array {
        if ($actorUserId !== 42 || $organizationId !== 7) {
            throw new ApiException(403, 'ACCOUNT_ADMINISTRATION_DENIED', 'Administration refusee.');
        }
        if ($targetUserId === $actorUserId) {
            throw new ApiException(409, 'SELF_STATUS_CHANGE_DENIED', 'Statut propre protege.');
        }
        $this->accountAuditCount++;
        return [
            'id' => $targetUserId,
            'email' => 'member@example.invalid',
            'displayName' => 'Member Test',
            'status' => $status,
            'role' => 'member',
        ];
    }
}

function request(string $method, string $path, array $body = [], array $headers = [], array $query = []): Request
{
    return new Request($method, $path, $headers, $query, $body, 'test-request-0001');
}

function assertSameValue(mixed $expected, mixed $actual, string $label): void
{
    if ($expected !== $actual) {
        throw new RuntimeException(
            $label . ' — attendu ' . var_export($expected, true) . ', reçu ' . var_export($actual, true),
        );
    }
}

$config = new Config('test', true, null, '', '', 'AVEREO_TEST', 1800, 43200);
$repository = new FakeRepository();
$application = new Application($config, $repository);
$anonymous = AuthContext::anonymous();
$identified = new AuthContext(null, time(), 'drupal-identified');
$authenticated = new AuthContext(42, time(), 'drupal-test', true);
$logoutCalled = false;
$logout = static function () use (&$logoutCalled): void {
    $logoutCalled = true;
};

$tests = [];

$tests['health'] = static function () use ($application, $anonymous, $logout): void {
    $response = $application->handle(request('GET', '/api/v1/health'), $anonymous, 'csrf-test', $logout);
    assertSameValue(200, $response->status, 'health status');
    assertSameValue('ok', $response->payload['data']['database'], 'health database');
};

$tests['anonymous session'] = static function () use ($application, $anonymous, $logout): void {
    $response = $application->handle(request('GET', '/api/v1/session'), $anonymous, 'csrf-test', $logout);
    assertSameValue(false, $response->payload['data']['authenticated'], 'anonymous');
    assertSameValue(false, $response->payload['data']['approved'], 'anonymous approval');
    assertSameValue(null, $response->payload['data']['accountStatus'], 'anonymous account status');
    assertSameValue('csrf-test', $response->payload['data']['csrfToken'], 'csrf token');
};

$tests['suspended account is refreshed from repository'] = static function () use ($application, $logout): void {
    $response = $application->handle(
        request('GET', '/api/v1/session'),
        new AuthContext(52, time(), 'drupal-suspended'),
        'csrf-test',
        $logout,
    );
    assertSameValue(true, $response->payload['data']['authenticated'], 'suspended authenticated');
    assertSameValue(false, $response->payload['data']['approved'], 'suspended approval');
    assertSameValue('suspended', $response->payload['data']['accountStatus'], 'suspended account status');
};

$tests['approved account is refreshed without reconnecting'] = static function () use ($application, $logout): void {
    $response = $application->handle(
        request('GET', '/api/v1/session'),
        new AuthContext(null, time(), 'drupal-test'),
        'csrf-test',
        $logout,
    );
    assertSameValue(true, $response->payload['data']['approved'], 'refreshed approval');
    assertSameValue('active', $response->payload['data']['accountStatus'], 'refreshed account status');
};

$tests['protected route denied'] = static function () use ($application, $anonymous, $logout): void {
    $response = $application->handle(request('GET', '/api/v1/organizations'), $anonymous, 'csrf-test', $logout);
    assertSameValue(401, $response->status, 'protected status');
    assertSameValue('AUTHENTICATION_REQUIRED', $response->payload['error']['code'], 'protected code');
};

$tests['anonymous catalog denied'] = static function () use ($application, $anonymous, $logout): void {
    $response = $application->handle(request('GET', '/api/v1/catalog'), $anonymous, 'csrf-test', $logout);
    assertSameValue(401, $response->status, 'anonymous catalog status');
    assertSameValue('AUTHENTICATION_REQUIRED', $response->payload['error']['code'], 'anonymous catalog code');
};

$tests['identified catalog'] = static function () use ($application, $identified, $logout): void {
    $response = $application->handle(request('GET', '/api/v1/catalog'), $identified, 'csrf-test', $logout);
    assertSameValue(200, $response->status, 'catalog status');
    assertSameValue(0, count($response->payload['data']), 'unapproved catalog is empty');
};

$tests['preproduction catalog'] = static function () use ($repository, $identified, $logout): void {
    $preproductionConfig = new Config(
        'preprod',
        false,
        null,
        '',
        '',
        'AVEREO_PREPROD_TEST',
        1800,
        43200,
        'https://auth-preprod.avereo.fr/',
    );
    $preproductionApplication = new Application($preproductionConfig, $repository);
    $response = $preproductionApplication->handle(
        request('GET', '/api/v1/catalog'),
        new AuthContext(42, time(), 'drupal-test'),
        'csrf-test',
        $logout,
    );
    assertSameValue(
        '/api/v1/apps/rapport/launch',
        $response->payload['data'][0]['launchUrl'],
        'preproduction catalog url',
    );
    assertSameValue(
        '/api/v1/apps/coupe/launch',
        $response->payload['data'][1]['launchUrl'],
        'preproduction coupe url',
    );
    assertSameValue(false, $response->payload['data'][1]['available'], 'preproduction coupe fail closed');
    $sessionResponse = $preproductionApplication->handle(
        request('GET', '/api/v1/session'),
        $identified,
        'csrf-test',
        $logout,
    );
    assertSameValue(
        'https://auth-preprod.avereo.fr/user/register',
        $sessionResponse->payload['data']['registrationUrl'],
        'preproduction registration url',
    );
};

$tests['launch requires approved CONNECT account'] = static function () use (
    $application,
    $identified,
    $logout,
): void {
    $response = $application->handle(
        request('GET', '/api/v1/apps/rapport/launch'),
        $identified,
        'csrf-test',
        $logout,
    );
    assertSameValue(403, $response->status, 'unprovisioned launch status');
    assertSameValue(
        'CONNECT_ACCOUNT_NOT_PROVISIONED',
        $response->payload['error']['code'],
        'unprovisioned launch code',
    );
};

$tests['launch ticket is signed and application bound'] = static function () use (
    $repository,
    $authenticated,
    $logout,
): void {
    $secret = str_repeat('launch-secret-', 4);
    $launchConfig = new Config(
        environment: 'preprod',
        debug: false,
        databaseDsn: null,
        databaseUser: '',
        databasePassword: '',
        sessionCookieName: 'AVEREO_LAUNCH_TEST',
        sessionIdleSeconds: 1800,
        sessionAbsoluteSeconds: 43200,
        appLaunchEntryUrls: [
            'rapport' => 'https://rapport-preprod.avereo.fr/connect/entry.php',
            'coupe' => 'https://coupe-preprod.avereo.fr/connect/entry.php',
        ],
        appLaunchSecrets: [
            'rapport' => $secret,
            'coupe' => str_repeat('coupe-secret-', 4),
        ],
        appLaunchTtlSeconds: 90,
    );
    $launchApplication = new Application(
        $launchConfig,
        $repository,
        new AppLaunchTicketIssuer($launchConfig),
    );
    $catalogResponse = $launchApplication->handle(
        request('GET', '/api/v1/catalog'),
        $authenticated,
        'csrf-test',
        $logout,
    );
    assertSameValue(true, $catalogResponse->payload['data'][0]['available'], 'rapport gate available');
    assertSameValue(true, $catalogResponse->payload['data'][1]['available'], 'coupe gate available');

    $response = $launchApplication->handle(
        request('GET', '/api/v1/apps/rapport/launch'),
        $authenticated,
        'csrf-test',
        $logout,
    );
    assertSameValue(303, $response->status, 'launch redirect status');

    $location = (string) ($response->headers['Location'] ?? '');
    $parts = parse_url($location);
    parse_str((string) ($parts['query'] ?? ''), $query);
    $ticket = (string) ($query['ticket'] ?? '');
    [$encodedPayload, $encodedSignature] = explode('.', $ticket, 2);
    $expectedSignature = rtrim(
        strtr(base64_encode(hash_hmac('sha256', $encodedPayload, $secret, true)), '+/', '-_'),
        '=',
    );
    assertSameValue($expectedSignature, $encodedSignature, 'launch signature');

    $padding = (4 - strlen($encodedPayload) % 4) % 4;
    $payload = json_decode(
        base64_decode(strtr($encodedPayload . str_repeat('=', $padding), '-_', '+/'), true),
        true,
        16,
        JSON_THROW_ON_ERROR,
    );
    assertSameValue('rapport', $payload['app'] ?? null, 'launch application binding');
    assertSameValue(1, $payload['v'] ?? null, 'launch ticket version');
    assertSameValue(true, $payload['remembered'] ?? null, 'launch remember binding');
    assertSameValue('avereo_connect', $payload['identity']['provider'] ?? null, 'launch identity provider');
    assertSameValue('42', $payload['identity']['id'] ?? null, 'launch identity id');
    assertSameValue(true, ($payload['exp'] ?? 0) > ($payload['iat'] ?? 0), 'launch expiry');

    $repository->allowedApps = ['rapport'];
    $denied = $launchApplication->handle(
        request('GET', '/api/v1/apps/coupe/launch'),
        $authenticated,
        'csrf-test',
        $logout,
    );
    assertSameValue(403, $denied->status, 'application entitlement status');
    assertSameValue(
        'APPLICATION_ACCESS_DENIED',
        $denied->payload['error']['code'],
        'application entitlement code',
    );
    $repository->allowedApps = ['rapport', 'coupe'];
};

$tests['identity disabled'] = static function () use ($application, $anonymous, $logout): void {
    $response = $application->handle(request('GET', '/api/v1/auth/login'), $anonymous, 'csrf-test', $logout);
    assertSameValue(503, $response->status, 'identity status');
    assertSameValue('IDENTITY_PROVIDER_NOT_CONFIGURED', $response->payload['error']['code'], 'identity code');
};

$tests['identity navigation'] = static function () use ($application, $anonymous, $logout): void {
    $response = $application->handle(
        request('GET', '/api/v1/auth/login'),
        $anonymous,
        'csrf-test',
        $logout,
        static fn (Request $request): Response => Response::redirect(
            'https://avereo.fr/oauth/authorize',
            $request->requestId,
        ),
    );
    assertSameValue(303, $response->status, 'identity redirect status');
    assertSameValue('https://avereo.fr/oauth/authorize', $response->headers['Location'] ?? null, 'identity redirect');
};

$tests['organizations'] = static function () use ($application, $authenticated, $logout): void {
    $response = $application->handle(request('GET', '/api/v1/organizations'), $authenticated, 'csrf-test', $logout);
    assertSameValue(200, $response->status, 'organizations status');
    assertSameValue('owner', $response->payload['data'][0]['role'], 'organization role');
};

$tests['missing organization parameter'] = static function () use ($application, $authenticated, $logout): void {
    $response = $application->handle(request('GET', '/api/v1/apps'), $authenticated, 'csrf-test', $logout);
    assertSameValue(422, $response->status, 'apps validation status');
};

$tests['csrf denied'] = static function () use ($application, $authenticated, $logout, $repository): void {
    $response = $application->handle(
        request('PUT', '/api/v1/organizations/7/entitlements/rapport', ['status' => 'active']),
        $authenticated,
        'csrf-test',
        $logout,
    );
    assertSameValue(403, $response->status, 'csrf status');
    assertSameValue(0, $repository->auditCount, 'no audit on rejected csrf');
};

$tests['invalid entitlement'] = static function () use ($application, $authenticated, $logout): void {
    $response = $application->handle(
        request(
            'PUT',
            '/api/v1/organizations/7/entitlements/rapport',
            ['status' => 'unknown'],
            ['x-csrf-token' => 'csrf-test'],
        ),
        $authenticated,
        'csrf-test',
        $logout,
    );
    assertSameValue(422, $response->status, 'entitlement validation status');
};

$tests['role denied'] = static function () use ($application, $authenticated, $logout, $repository): void {
    $repository->allowMutation = false;
    $response = $application->handle(
        request(
            'PUT',
            '/api/v1/organizations/7/entitlements/rapport',
            ['status' => 'active'],
            ['x-csrf-token' => 'csrf-test'],
        ),
        $authenticated,
        'csrf-test',
        $logout,
    );
    assertSameValue(403, $response->status, 'role status');
    assertSameValue(1, $repository->auditCount, 'one denied audit');
    $repository->allowMutation = true;
};

$tests['entitlement audited once'] = static function () use ($application, $authenticated, $logout, $repository): void {
    $response = $application->handle(
        request(
            'PUT',
            '/api/v1/organizations/7/entitlements/rapport',
            ['status' => 'active', 'validFrom' => '2026-07-21T00:00:00Z'],
            ['x-csrf-token' => 'csrf-test'],
        ),
        $authenticated,
        'csrf-test',
        $logout,
    );
    assertSameValue(200, $response->status, 'entitlement status');
    assertSameValue(2, $repository->auditCount, 'one event per attempted mutation');
};

$tests['account administration owner snapshot'] = static function () use (
    $application,
    $authenticated,
    $logout,
): void {
    $response = $application->handle(
        request('GET', '/api/v1/admin/organizations/7/accounts'),
        $authenticated,
        'csrf-test',
        $logout,
    );
    assertSameValue(200, $response->status, 'account administration status');
    assertSameValue('owner', $response->payload['data']['actorRole'], 'account administration role');
    assertSameValue(1, count($response->payload['data']['pendingIdentities']), 'pending identity count');
};

$tests['account administration denied to member'] = static function () use ($application, $logout): void {
    $response = $application->handle(
        request('GET', '/api/v1/admin/organizations/7/accounts'),
        new AuthContext(43, time(), 'drupal-member'),
        'csrf-test',
        $logout,
    );
    assertSameValue(403, $response->status, 'member account administration status');
    assertSameValue(
        'ACCOUNT_ADMINISTRATION_DENIED',
        $response->payload['error']['code'],
        'member account administration code',
    );
};

$tests['account approval denied to member'] = static function () use ($application, $logout): void {
    $response = $application->handle(
        request(
            'POST',
            '/api/v1/admin/organizations/7/pending-identities/9/approve',
            ['role' => 'member'],
            ['x-csrf-token' => 'csrf-test'],
        ),
        new AuthContext(43, time(), 'drupal-member'),
        'csrf-test',
        $logout,
    );
    assertSameValue(403, $response->status, 'member account approval status');
    assertSameValue(
        'ACCOUNT_ADMINISTRATION_DENIED',
        $response->payload['error']['code'],
        'member account approval code',
    );
};

$tests['account approval requires csrf'] = static function () use (
    $application,
    $authenticated,
    $logout,
    $repository,
): void {
    $response = $application->handle(
        request(
            'POST',
            '/api/v1/admin/organizations/7/pending-identities/9/approve',
            ['role' => 'member'],
        ),
        $authenticated,
        'csrf-test',
        $logout,
    );
    assertSameValue(403, $response->status, 'approval csrf status');
    assertSameValue(0, $repository->accountAuditCount, 'approval csrf audit count');
};

$tests['account approval is audited'] = static function () use (
    $application,
    $authenticated,
    $logout,
    $repository,
): void {
    $response = $application->handle(
        request(
            'POST',
            '/api/v1/admin/organizations/7/pending-identities/9/approve',
            ['role' => 'member'],
            ['x-csrf-token' => 'csrf-test'],
        ),
        $authenticated,
        'csrf-test',
        $logout,
    );
    assertSameValue(200, $response->status, 'approval status');
    assertSameValue('member', $response->payload['data']['role'], 'approval role');
    assertSameValue(1, $repository->accountAuditCount, 'approval audit count');
};

$tests['account rejection is audited'] = static function () use (
    $application,
    $authenticated,
    $logout,
    $repository,
): void {
    $response = $application->handle(
        request(
            'POST',
            '/api/v1/admin/organizations/7/pending-identities/9/reject',
            [],
            ['x-csrf-token' => 'csrf-test'],
        ),
        $authenticated,
        'csrf-test',
        $logout,
    );
    assertSameValue(200, $response->status, 'rejection status');
    assertSameValue('rejected', $response->payload['data']['status'], 'rejection result');
    assertSameValue(2, $repository->accountAuditCount, 'rejection audit count');
};

$tests['account status validation'] = static function () use ($application, $authenticated, $logout): void {
    $response = $application->handle(
        request(
            'PATCH',
            '/api/v1/admin/organizations/7/users/51/status',
            ['status' => 'deleted'],
            ['x-csrf-token' => 'csrf-test'],
        ),
        $authenticated,
        'csrf-test',
        $logout,
    );
    assertSameValue(422, $response->status, 'account status validation');
};

$tests['account suspension is audited'] = static function () use (
    $application,
    $authenticated,
    $logout,
    $repository,
): void {
    $response = $application->handle(
        request(
            'PATCH',
            '/api/v1/admin/organizations/7/users/51/status',
            ['status' => 'suspended'],
            ['x-csrf-token' => 'csrf-test'],
        ),
        $authenticated,
        'csrf-test',
        $logout,
    );
    assertSameValue(200, $response->status, 'account suspension status');
    assertSameValue('suspended', $response->payload['data']['status'], 'account suspension result');
    assertSameValue(3, $repository->accountAuditCount, 'account suspension audit count');
};

$tests['logout csrf'] = static function () use ($application, $authenticated, $logout, &$logoutCalled): void {
    $response = $application->handle(
        request('POST', '/api/v1/auth/logout', [], ['x-csrf-token' => 'csrf-test']),
        $authenticated,
        'csrf-test',
        $logout,
    );
    assertSameValue(200, $response->status, 'logout status');
    assertSameValue(true, $logoutCalled, 'logout callback');
};

$tests['oauth transaction fallback is one-time and bound'] = static function (): void {
    $directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'avereo-oauth-' . bin2hex(random_bytes(8));
    $store = new OAuthTransactionStore($directory, 'test-integrity-key');
    $binding = str_repeat('a', 64);
    $store->save('state-test', 'nonce-test', 'verifier-test', $binding);

    $transaction = $store->consume('state-test', $binding);
    assertSameValue('nonce-test', $transaction['nonce'], 'oauth fallback nonce');
    assertSameValue('verifier-test', $transaction['verifier'], 'oauth fallback verifier');

    try {
        $store->consume('state-test', $binding);
        throw new RuntimeException('La transaction OAuth a été rejouée.');
    } catch (ApiException $exception) {
        assertSameValue('OAUTH_TRANSACTION_MISSING', $exception->errorCode, 'oauth replay denied');
    }

    rmdir($directory);
};

$tests['oauth transaction fallback rejects another browser'] = static function (): void {
    $directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'avereo-oauth-' . bin2hex(random_bytes(8));
    $store = new OAuthTransactionStore($directory, 'test-integrity-key');
    $store->save(
        'state-bound',
        'nonce-bound',
        'verifier-bound',
        str_repeat('b', 64),
    );

    try {
        $store->consume('state-bound', str_repeat('c', 64));
        throw new RuntimeException('La liaison navigateur OAuth n’a pas été contrôlée.');
    } catch (ApiException $exception) {
        assertSameValue('OAUTH_TRANSACTION_INVALID', $exception->errorCode, 'oauth binding denied');
    }

    rmdir($directory);
};

$passed = 0;
foreach ($tests as $name => $test) {
    $test();
    fwrite(STDOUT, "PASS {$name}\n");
    $passed++;
}

fwrite(STDOUT, "Tests réussis : {$passed}/" . count($tests) . "\n");
