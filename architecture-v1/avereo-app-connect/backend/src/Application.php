<?php

declare(strict_types=1);

namespace Avereo\Connect;

use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Http\Request;
use Avereo\Connect\Http\Response;
use Avereo\Connect\Repository\ConnectRepository;
use Avereo\Connect\Security\AuthContext;
use Avereo\Connect\Security\CsrfGuard;

final class Application
{
    public function __construct(
        private readonly Config $config,
        private readonly ConnectRepository $repository,
    ) {
    }

    /** @param callable(): void $logout */
    public function handle(
        Request $request,
        AuthContext $auth,
        string $csrfToken,
        callable $logout,
        ?callable $beginIdentity = null,
        ?callable $completeIdentity = null,
    ): Response {
        try {
            return $this->route($request, $auth, $csrfToken, $logout, $beginIdentity, $completeIdentity);
        } catch (ApiException $exception) {
            if (str_starts_with($request->path, '/api/v1/auth/')) {
                error_log(json_encode([
                    'event' => 'api.identity_error',
                    'requestId' => $request->requestId,
                    'path' => $request->path,
                    'status' => $exception->status,
                    'code' => $exception->errorCode,
                ], JSON_UNESCAPED_SLASHES));
            }
            return Response::error(
                $exception->status,
                $exception->errorCode,
                $exception->getMessage(),
                $request->requestId,
                $exception->details,
            );
        } catch (\Throwable $exception) {
            error_log(json_encode([
                'event' => 'api.exception',
                'requestId' => $request->requestId,
                'type' => $exception::class,
            ], JSON_UNESCAPED_SLASHES));

            $details = $this->config->debug ? ['type' => $exception::class] : [];
            return Response::error(500, 'INTERNAL_ERROR', 'Une erreur interne est survenue.', $request->requestId, $details);
        }
    }

    /** @param callable(): void $logout */
    private function route(
        Request $request,
        AuthContext $auth,
        string $csrfToken,
        callable $logout,
        ?callable $beginIdentity,
        ?callable $completeIdentity,
    ): Response {
        if ($request->method === 'GET' && $request->path === '/api/v1/health') {
            $database = $this->repository->databaseStatus();
            return Response::success([
                'status' => $database === 'ok' ? 'ok' : 'degraded',
                'service' => 'avereo-connect-api',
                'database' => $database,
                'time' => gmdate('Y-m-d\TH:i:s\Z'),
            ], $request->requestId);
        }

        if ($request->method === 'GET' && $request->path === '/api/v1/session') {
            $session = [
                'authenticated' => $auth->isAuthenticated(),
                'csrfToken' => $csrfToken,
            ];
            return Response::success($session, $request->requestId);
        }

        if (
            in_array($request->method, ['GET', 'POST'], true)
            && $request->path === '/api/v1/auth/login'
        ) {
            if ($beginIdentity === null) {
                throw new ApiException(503, 'IDENTITY_PROVIDER_NOT_CONFIGURED', 'Le fournisseur d’identité Drupal n’est pas encore configuré.');
            }
            if ($request->method === 'POST') {
                CsrfGuard::assertValid($request, $csrfToken);
            }
            return $beginIdentity($request);
        }

        if ($request->method === 'GET' && $request->path === '/api/v1/auth/callback') {
            if ($completeIdentity === null) {
                throw new ApiException(503, 'IDENTITY_PROVIDER_NOT_CONFIGURED', 'Le fournisseur d’identité Drupal n’est pas encore configuré.');
            }
            return $completeIdentity($request);
        }

        if ($request->method === 'POST' && $request->path === '/api/v1/auth/logout') {
            CsrfGuard::assertValid($request, $csrfToken);
            $logout();
            return Response::success(['authenticated' => false], $request->requestId);
        }

        $this->requireAuthenticated($auth);
        if ($request->method === 'GET' && $request->path === '/api/v1/catalog') {
            return Response::success($this->applicationCatalog(), $request->requestId);
        }

        if ($auth->userId === null) {
            throw new ApiException(503, 'CONNECT_ACCOUNT_NOT_PROVISIONED', 'Le compte CONNECT n’est pas encore provisionné.');
        }
        $userId = (int) $auth->userId;

        if ($request->method === 'GET' && $request->path === '/api/v1/me') {
            return Response::success($this->repository->findUserProfile($userId), $request->requestId);
        }

        if ($request->method === 'GET' && $request->path === '/api/v1/organizations') {
            return Response::success($this->repository->listOrganizations($userId), $request->requestId);
        }

        if ($request->method === 'GET' && $request->path === '/api/v1/apps') {
            $organizationId = $this->positiveInt($request->query['organization_id'] ?? null, 'organization_id');
            return Response::success(
                $this->repository->listApplications($userId, $organizationId),
                $request->requestId,
            );
        }

        if (
            $request->method === 'GET'
            && preg_match('#^/api/v1/organizations/([1-9]\d*)/entitlements$#', $request->path, $matches)
        ) {
            return Response::success(
                $this->repository->listEntitlements($userId, (int) $matches[1]),
                $request->requestId,
            );
        }

        if (
            $request->method === 'PUT'
            && preg_match('#^/api/v1/organizations/([1-9]\d*)/entitlements/([a-z0-9][a-z0-9_-]{1,63})$#', $request->path, $matches)
        ) {
            CsrfGuard::assertValid($request, $csrfToken);
            [$status, $validFrom, $validTo] = $this->validateEntitlement($request->body);
            return Response::success(
                $this->repository->upsertEntitlement(
                    $userId,
                    (int) $matches[1],
                    $matches[2],
                    $status,
                    $validFrom,
                    $validTo,
                    $request->requestId,
                ),
                $request->requestId,
            );
        }

        throw new ApiException(404, 'NOT_FOUND', 'La route demandée est introuvable.');
    }

    /** @return list<array{code: string, name: string, description: string, launchUrl: string, available: bool, status: string}> */
    private function applicationCatalog(): array
    {
        return [
            [
                'code' => 'rapport',
                'name' => 'Rapport AVEREO Pro',
                'description' => 'Créer et gérer les rapports professionnels AVEREO.',
                'launchUrl' => 'https://rapport.avereo.fr/',
                'available' => true,
                'status' => 'available',
            ],
            [
                'code' => 'coupe',
                'name' => 'Coupe AVEREO Reno Pro',
                'description' => 'Préparer les métrés et les dossiers de coupe.',
                'launchUrl' => 'https://coupe.avereo.fr/',
                'available' => true,
                'status' => 'available',
            ],
            [
                'code' => 'projet',
                'name' => 'Projet AVEREO Pro',
                'description' => 'Piloter les projets et leurs données métier.',
                'launchUrl' => 'https://projet.avereo.fr/',
                'available' => false,
                'status' => 'coming_soon',
            ],
            [
                'code' => 'thermo',
                'name' => 'Thermo AVEREO Pro',
                'description' => 'Réaliser les études et simulations thermiques.',
                'launchUrl' => 'https://thermo.avereo.fr/',
                'available' => false,
                'status' => 'coming_soon',
            ],
            [
                'code' => 'drone',
                'name' => 'Drone AVEREO Pro',
                'description' => 'Organiser les missions et relevés par drone.',
                'launchUrl' => 'https://drone.avereo.fr/',
                'available' => false,
                'status' => 'coming_soon',
            ],
        ];
    }

    private function requireAuthenticated(AuthContext $auth): void
    {
        if (!$auth->isAuthenticated()) {
            throw new ApiException(401, 'AUTHENTICATION_REQUIRED', 'Une session CONNECT valide est requise.');
        }
    }

    private function positiveInt(mixed $value, string $field): int
    {
        $validated = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($validated === false) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Un paramètre est invalide.', ['field' => $field]);
        }
        return (int) $validated;
    }

    /**
     * @param array<string, mixed> $body
     * @return array{string, ?string, ?string}
     */
    private function validateEntitlement(array $body): array
    {
        $unknownFields = array_values(array_diff(array_keys($body), ['status', 'validFrom', 'validTo']));
        if ($unknownFields !== []) {
            throw new ApiException(
                422,
                'VALIDATION_ERROR',
                'Le corps contient un champ inconnu.',
                ['field' => (string) $unknownFields[0]],
            );
        }

        $status = $body['status'] ?? null;
        if (!is_string($status) || !in_array($status, ['active', 'suspended', 'revoked'], true)) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Le statut d’habilitation est invalide.', ['field' => 'status']);
        }

        $validFrom = $this->normalizeDate($body['validFrom'] ?? null, 'validFrom');
        $validTo = $this->normalizeDate($body['validTo'] ?? null, 'validTo');
        if ($validFrom !== null && $validTo !== null && $validTo <= $validFrom) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'validTo doit être postérieur à validFrom.', ['field' => 'validTo']);
        }

        return [$status, $validFrom, $validTo];
    }

    private function normalizeDate(mixed $value, string $field): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (!is_string($value) || strlen($value) > 40) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'La date est invalide.', ['field' => $field]);
        }
        $date = \DateTimeImmutable::createFromFormat(DATE_RFC3339_EXTENDED, $value)
            ?: \DateTimeImmutable::createFromFormat(DATE_RFC3339, $value);
        if (!$date instanceof \DateTimeImmutable) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'La date est invalide.', ['field' => $field]);
        }

        return $date->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d H:i:s.u');
    }
}
