<?php

declare(strict_types=1);

use Avereo\Connect\Application;
use Avereo\Connect\Config;
use Avereo\Connect\Database;
use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Http\Request;
use Avereo\Connect\Http\Response;
use Avereo\Connect\Identity\OAuthFlow;
use Avereo\Connect\Repository\PdoConnectRepository;
use Avereo\Connect\Repository\UnavailableRepository;
use Avereo\Connect\Security\AppLaunchTicketIssuer;
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
            'APP_ENV', 'APP_DEBUG', 'DB_DSN', 'DB_USER', 'DB_PASSWORD',
            'SESSION_COOKIE_NAME', 'SESSION_IDLE_SECONDS', 'SESSION_ABSOLUTE_SECONDS',
            'OAUTH_ISSUER', 'OAUTH_AUTHORIZE_URL', 'OAUTH_TOKEN_URL', 'OAUTH_USERINFO_URL',
            'OAUTH_CLIENT_ID', 'OAUTH_CLIENT_SECRET', 'OAUTH_REDIRECT_URI', 'OAUTH_SUCCESS_URL',
            'OAUTH_SCOPES', 'OAUTH_PUBLIC_KEY_PATH', 'OAUTH_TRANSACTION_DIRECTORY',
            'OAUTH_TRANSACTION_TTL_SECONDS', 'IDENTITY_LOGOUT_URL', 'IDENTITY_LOGOUT_SECRET',
            'APP_LAUNCH_RAPPORT_URL', 'APP_LAUNCH_RAPPORT_SECRET',
            'APP_LAUNCH_COUPE_URL', 'APP_LAUNCH_COUPE_SECRET',
            'APP_LAUNCH_PROJET_URL', 'APP_LAUNCH_PROJET_SECRET',
            'APP_LAUNCH_THERMO_URL', 'APP_LAUNCH_THERMO_SECRET',
            'APP_LAUNCH_DRONE_URL', 'APP_LAUNCH_DRONE_SECRET',
            'APP_LAUNCH_TTL_SECONDS',
        ];
        if (!is_array($privateValues)) {
            throw new RuntimeException('Configuration privée invalide.');
        }
        foreach ($allowedPrivateKeys as $privateKey) {
            $privateValue = $privateValues[$privateKey] ?? null;
            if (is_string($privateValue)) {
                putenv($privateKey . '=' . $privateValue);
            }
        }
    }

    $config = Config::fromEnvironment();
    $session = new SessionManager($config);
    $session->start();
    $request = Request::fromGlobals();
    $requestId = $request->requestId;

    try {
        $pdo = Database::connect($config);
        $repository = $pdo === null
            ? new UnavailableRepository('not_configured')
            : new PdoConnectRepository($pdo);
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
    $application = new Application(
        $config,
        $repository,
        new AppLaunchTicketIssuer($config),
        $identityLogout,
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
