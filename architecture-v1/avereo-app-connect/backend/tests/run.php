<?php

declare(strict_types=1);

use Avereo\Connect\Application;
use Avereo\Connect\Config;
use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Http\Request;
use Avereo\Connect\Http\Response;
use Avereo\Connect\Repository\ConnectRepository;
use Avereo\Connect\Security\AuthContext;
use Avereo\Connect\Security\OAuthTransactionStore;

require dirname(__DIR__) . '/src/autoload.php';

final class FakeRepository implements ConnectRepository
{
    public bool $allowMutation = true;
    public int $auditCount = 0;

    public function databaseStatus(): string
    {
        return 'ok';
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
$authenticated = new AuthContext(42, time(), 'drupal-test');
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
    assertSameValue('csrf-test', $response->payload['data']['csrfToken'], 'csrf token');
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
    assertSameValue(5, count($response->payload['data']), 'catalog size');
    assertSameValue('rapport', $response->payload['data'][0]['code'], 'first catalog app');
    assertSameValue(true, $response->payload['data'][0]['available'], 'rapport available');
    assertSameValue(false, $response->payload['data'][2]['available'], 'projet unavailable');
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
