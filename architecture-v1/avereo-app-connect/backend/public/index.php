<?php

declare(strict_types=1);

use Avereo\Connect\Application;
use Avereo\Connect\Config;
use Avereo\Connect\Database;
use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Http\Request;
use Avereo\Connect\Http\Response;
use Avereo\Connect\Identity\IdentityAccountActivationClient;
use Avereo\Connect\Identity\OAuthFlow;
use Avereo\Connect\Repository\PdoConnectRepository;
use Avereo\Connect\Repository\UnavailableRepository;
use Avereo\Connect\Security\AppLaunchTicketIssuer;
use Avereo\Connect\Security\IdentityAccountActivationCompletionVerifier;
use Avereo\Connect\Security\IdentityLogoutUrlSigner;
use Avereo\Connect\Security\OAuthTransactionStore;
use Avereo\Connect\Security\SessionManager;

require dirname(__DIR__) . '/src/autoload.php';

$requestId = bin2hex(random_bytes(16));

try {
    $documentRoot = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), '/\\');
    $privateConfigPath = getenv('AVEREO_PRIVATE_CONFIG');
    if ($privateConfigPath === false || $privateConfigPath === '') {
        $deploymentName = str_contains(strtolower(dirname($documentRoot)), 'preprod')
            ? 'connect-preprod'
            : 'connect-production';
        $privateConfigPath = dirname($documentRoot, 2) . '/private/' . $deploymentName . '/config.php';
        $legacyPreproductionPath = dirname($documentRoot, 2) . '/private/connect/config.php';
        if (
            $deploymentName === 'connect-preprod'
            && !is_readable($privateConfigPath)
            && is_readable($legacyPreproductionPath)
        ) {
            $privateConfigPath = $legacyPreproductionPath;
        }
    }
    if (is_readable($privateConfigPath)) {
        $privateValues = require $privateConfigPath;
        $allowedPrivateKeys = [
            'DEVELOPMENTS_PRIVATE_CONFIG', 'APPEARANCE_ADMIN_ORGANIZATION_ID', 'APPLICATION_ACCESS_DELEGATIONS_ENABLED',
            'APP_ENV', 'APP_DEBUG', 'DB_DSN', 'DB_USER', 'DB_PASSWORD',
            'SESSION_COOKIE_NAME', 'SESSION_IDLE_SECONDS', 'SESSION_ABSOLUTE_SECONDS',
            'OAUTH_ISSUER', 'OAUTH_AUTHORIZE_URL', 'OAUTH_TOKEN_URL', 'OAUTH_USERINFO_URL',
            'OAUTH_CLIENT_ID', 'OAUTH_CLIENT_SECRET', 'OAUTH_REDIRECT_URI', 'OAUTH_SUCCESS_URL',
            'OAUTH_SCOPES', 'OAUTH_PUBLIC_KEY_PATH', 'OAUTH_TRANSACTION_DIRECTORY',
            'OAUTH_TRANSACTION_TTL_SECONDS', 'IDENTITY_LOGOUT_URL', 'IDENTITY_LOGOUT_SECRET',
            'IDENTITY_ACCOUNT_ACTIVATION_URL', 'IDENTITY_ACCOUNT_ACTIVATION_SECRET',
            'SUPPORT_EMAIL',
            'IDENTITY_ACCOUNT_PROVISIONING_URL', 'IDENTITY_ACCOUNT_PROVISIONING_SECRET', 'TRIAL_ACCESS_POLICY_FILE',
            'ACCOUNT_LIFECYCLE_ENABLED', 'IDENTITY_ACCOUNT_DELETION_URL', 'IDENTITY_ACCOUNT_DELETION_SECRET',
            'ACCOUNT_LIFECYCLE_REPORT_CONFIG', 'ACCOUNT_LIFECYCLE_PASSEPORT_CONFIG',
            'APP_LAUNCH_RAPPORT_URL', 'APP_LAUNCH_RAPPORT_SECRET',
            'APP_LAUNCH_RGA_URL', 'APP_LAUNCH_RGA_SECRET',
            'APP_LAUNCH_COUPE_URL', 'APP_LAUNCH_COUPE_SECRET',
            'APP_LAUNCH_PROJET_URL', 'APP_LAUNCH_PROJET_SECRET',
            'APP_LAUNCH_THERMO_URL', 'APP_LAUNCH_THERMO_SECRET',
            'APP_LAUNCH_DRONE_URL', 'APP_LAUNCH_DRONE_SECRET',
            'APP_LAUNCH_RECHERCHE_URL', 'APP_LAUNCH_RECHERCHE_SECRET',
            'APP_LAUNCH_PASSEPORT_IMMO_URL', 'APP_LAUNCH_PASSEPORT_IMMO_SECRET',
            'APP_LAUNCH_TTL_SECONDS',
        ];
        if (!is_array($privateValues)) {
            throw new RuntimeException('Configuration privée invalide.');
        }
        foreach ($allowedPrivateKeys as $privateKey) {
            $privateValue = $privateValues[$privateKey] ?? null;
            if ($privateKey === 'APPEARANCE_ADMIN_ORGANIZATION_ID' && is_int($privateValue)) {
                $privateValue = (string) $privateValue;
            }
            if (is_string($privateValue)) {
                putenv($privateKey . '=' . $privateValue);
            }
        }
    }

    $appearance = new \Avereo\Connect\Administration\Appearance(
        dirname($privateConfigPath) . '/appearance.json',
        (int) getenv('APPEARANCE_ADMIN_ORGANIZATION_ID'),
    );
    // Public projection contains only the shared appearance settings. No account session or DB is needed.
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET'
        && parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) === '/api/v1/appearance') {
        header('Access-Control-Allow-Origin: *');
        Response::success($appearance->read(), $requestId)->emit();
    }

    $config = Config::fromEnvironment();
    $session = new SessionManager($config);
    $session->start();
    $request = Request::fromGlobals();
    $requestId = $request->requestId;

    $pdo = null;
    $delegations = null;
    try {
        $pdo = Database::connect($config);
        if ($pdo !== null && getenv('APPLICATION_ACCESS_DELEGATIONS_ENABLED') === 'true') {
            $delegations = new \Avereo\Connect\Administration\ApplicationAccessDelegations($pdo);
        }
        $repository = $pdo === null
            ? new UnavailableRepository('not_configured')
            : new PdoConnectRepository($pdo, $delegations);
    } catch (Throwable) {
        $repository = new UnavailableRepository('unavailable');
    }

    $identityLogout = $config->isIdentityLogoutConfigured()
        ? new IdentityLogoutUrlSigner(
            $config->identityLogoutUrl,
            $config->identityLogoutSecret,
            $config->oauthRedirectUri,
        )
        : null;
    $accountActivation = $config->isIdentityAccountActivationConfigured()
        ? new IdentityAccountActivationClient(
            $config->identityAccountActivationUrl,
            $config->identityAccountActivationSecret,
            $config->supportEmail,
        )
        : null;
    $activationCompletion = $config->isIdentityAccountActivationConfigured()
        ? new IdentityAccountActivationCompletionVerifier(
            $config->identityAccountActivationSecret,
        )
        : null;
    $accountAdministration = null;
    $accountLifecycle = null;
    $provisionUrl = trim((string)getenv('IDENTITY_ACCOUNT_PROVISIONING_URL'));
    $provisionSecret = trim((string)getenv('IDENTITY_ACCOUNT_PROVISIONING_SECRET'));
    $trialPolicy = trim((string)getenv('TRIAL_ACCESS_POLICY_FILE'));
    if ($pdo !== null && $repository instanceof PdoConnectRepository && $provisionUrl!=='' && $provisionSecret!=='' && $trialPolicy!=='') {
        $policyStore = new \Avereo\Connect\Administration\TrialPolicyStore($trialPolicy);
        $accountAdministration = new \Avereo\Connect\Administration\AccountAdministration($pdo,
            new \Avereo\Connect\Identity\IdentityAccountProvisioningClient($provisionUrl,$provisionSecret),
            $policyStore, $delegations);
        if (getenv('ACCOUNT_LIFECYCLE_ENABLED') === 'true') {
            $deletionUrl = trim((string) getenv('IDENTITY_ACCOUNT_DELETION_URL'));
            $deletionSecret = trim((string) getenv('IDENTITY_ACCOUNT_DELETION_SECRET'));
            if ($deletionSecret !== '' && ($deletionSecret === $provisionSecret
                || $deletionSecret === $config->identityAccountActivationSecret)) {
                throw new RuntimeException('La suppression exige un secret dédié.');
            }
            $identityDeletion = $deletionUrl !== '' && $deletionSecret !== ''
                ? new \Avereo\Connect\Identity\IdentityAccountDeletionClient($deletionUrl, $deletionSecret)
                : null;
            $reportConfigPath = trim((string) getenv('ACCOUNT_LIFECYCLE_REPORT_CONFIG'));
            $reports = $reportConfigPath === '' ? null : static function () use ($reportConfigPath, $trialPolicy, $documentRoot, $config): PDO {
                $path = realpath($reportConfigPath);
                $root = realpath($documentRoot);
                if ($path === false || !is_file($path) || $root === false
                    || str_starts_with($path, $root . DIRECTORY_SEPARATOR)) {
                    throw new RuntimeException('Configuration Rapport privée requise.');
                }
                $rapport = require $path;
                $expected = $config->environment === 'preprod' ? ['preprod', 'preproduction'] : [$config->environment];
                if (!is_array($rapport) || !in_array($rapport['environment'] ?? null, $expected, true)
                    || ($rapport['connect_trial_access_file'] ?? null) !== $trialPolicy
                    || ($rapport['auth_mode'] ?? null) !== 'connect_gateway') {
                    throw new RuntimeException('Rapport ne correspond pas à cet environnement CONNECT.');
                }
                return new PDO(
                    'mysql:host=' . $rapport['db_host'] . ';port=' . (int) ($rapport['db_port'] ?? 3306)
                        . ';dbname=' . $rapport['db_name'] . ';charset=utf8mb4',
                    $rapport['db_user'], $rapport['db_password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
                );
            };
            $passeportReady = false;
            $passeportPath = trim((string) getenv('ACCOUNT_LIFECYCLE_PASSEPORT_CONFIG'));
            if ($passeportPath !== '' && is_file($passeportPath) && realpath($passeportPath) === $passeportPath
                && realpath($documentRoot) !== false
                && !str_starts_with($passeportPath, realpath($documentRoot) . DIRECTORY_SEPARATOR)) {
                $passeport = require $passeportPath;
                $passeportReady = is_array($passeport)
                    && ($passeport['environment'] ?? null) === $config->environment
                    && ($passeport['connect_trial_access_file'] ?? null) === $trialPolicy
                    && rtrim((string) ($passeport['connect_portal_url'] ?? ''), '/')
                        === preg_replace('~/api/v1/auth/callback$~', '', $config->oauthRedirectUri);
            }
            $accountLifecycle = new \Avereo\Connect\Administration\AccountLifecycle(
                $pdo, $accountAdministration, $policyStore, $identityDeletion, $reports, $passeportReady,
            );
        }
    }
    $developmentAuthorization = null;
    $developmentConfig = trim((string)getenv('DEVELOPMENTS_PRIVATE_CONFIG'));
    if ($developmentConfig !== '') {
        try { $developmentAuthorization = \Avereo\Connect\Developments\PrivateFactory::create($developmentConfig, $documentRoot, $repository,
            [...array_values($config->appLaunchSecrets),$config->oauthClientSecret,$config->identityLogoutSecret,$config->identityAccountActivationSecret,
                (string)getenv('IDENTITY_ACCOUNT_PROVISIONING_SECRET'),(string)getenv('IDENTITY_ACCOUNT_DELETION_SECRET')]); }
        catch (Throwable) { error_log('{"event":"developments.configuration_unavailable"}'); }
    }
    $application = new Application(
        $config,
        $repository,
        new AppLaunchTicketIssuer($config),
        $identityLogout,
        $accountActivation,
        $activationCompletion,
        $accountAdministration,
        $accountActivation,
        $accountLifecycle,
        $developmentAuthorization,
        $appearance,
        new \Avereo\Connect\Account\Preferences(dirname($privateConfigPath) . '/account-preferences'),
    );
    $oauth = null;
    if ($config->isIdentityProviderConfigured()) {
        $transactionDirectory = getenv('OAUTH_TRANSACTION_DIRECTORY');
        if ($transactionDirectory === false || trim($transactionDirectory) === '') {
            $transactionDirectory = dirname($privateConfigPath) . '/oauth-transactions';
        }
        $oauth = new OAuthFlow(
            $config,
            $session,
            new OAuthTransactionStore($transactionDirectory, $config->oauthClientSecret),
            static function (string $subject, array $profile) use ($repository): ?int {
                $userId = $repository->findUserIdByDrupalSubject($subject);
                if ($userId !== null) {
                    return $userId;
                }
                $email = isset($profile['email']) && is_string($profile['email'])
                    ? strtolower(trim($profile['email']))
                    : null;
                if (
                    $email !== null
                    && (strlen($email) > 254 || filter_var($email, FILTER_VALIDATE_EMAIL) === false)
                ) {
                    $email = null;
                }
                $displayName = null;
                foreach (['name', 'preferred_username'] as $field) {
                    $candidate = isset($profile[$field]) && is_string($profile[$field])
                        ? trim($profile[$field])
                        : '';
                    if ($candidate !== '' && strlen($candidate) <= 191) {
                        $displayName = $candidate;
                        break;
                    }
                }
                $repository->registerPendingIdentity($subject, $email, $displayName);
                return null;
            },
        );
    }
    $application->handle(
        $request,
        $session->context(),
        $session->csrfToken(),
        static fn () => $session->destroy(),
        $oauth === null ? null : static fn (Request $request) => $oauth->begin($request),
        $oauth === null ? null : static fn (Request $request) => $oauth->complete($request),
    )->emit();
} catch (ApiException $exception) {
    Response::error(
        $exception->status,
        $exception->errorCode,
        $exception->getMessage(),
        $requestId,
        $exception->details,
    )->emit();
} catch (Throwable $exception) {
    error_log(json_encode([
        'event' => 'bootstrap.exception',
        'requestId' => $requestId,
        'type' => $exception::class,
    ], JSON_UNESCAPED_SLASHES));
    Response::error(500, 'INTERNAL_ERROR', 'Une erreur interne est survenue.', $requestId)->emit();
}
