<?php

declare(strict_types=1);

namespace Avereo\Connect\Http;

final class Request
{
    /**
     * @param array<string, string> $headers
     * @param array<string, mixed> $query
     * @param array<string, mixed> $body
     */
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $headers,
        public readonly array $query,
        public readonly array $body,
        public readonly string $requestId,
    ) {
    }

    public static function fromGlobals(): self
    {
        $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
        $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        $headers = [];

        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$name] = (string) $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = (string) $_SERVER['CONTENT_TYPE'];
        }

        $body = [];
        if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            $raw = file_get_contents('php://input');
            if ($raw !== false && trim($raw) !== '') {
                if (!str_contains(strtolower($headers['content-type'] ?? ''), 'application/json')) {
                    throw new ApiException(415, 'UNSUPPORTED_MEDIA_TYPE', 'Le corps doit être en JSON.');
                }
                try {
                    $decoded = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
                } catch (\JsonException) {
                    throw new ApiException(400, 'INVALID_JSON', 'Le document JSON est invalide.');
                }
                if (!is_array($decoded)) {
                    throw new ApiException(400, 'INVALID_JSON', 'Un objet JSON est attendu.');
                }
                $body = $decoded;
            }
        }

        $candidate = $headers['x-request-id'] ?? '';
        $requestId = preg_match('/^[A-Za-z0-9._-]{8,64}$/', $candidate)
            ? $candidate
            : bin2hex(random_bytes(16));

        return new self($method, rtrim($path, '/') ?: '/', $headers, $_GET, $body, $requestId);
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }
}
