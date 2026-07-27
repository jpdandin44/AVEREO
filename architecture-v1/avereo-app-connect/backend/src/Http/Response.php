<?php

declare(strict_types=1);

namespace Avereo\Connect\Http;

final class Response
{
    /** @param array<string, mixed> $payload */
    public function __construct(
        public readonly int $status,
        public readonly array $payload,
        public readonly string $requestId,
        public readonly array $headers = [],
    ) {
    }

    /** @param array<string, mixed>|list<mixed> $data */
    public static function success(array $data, string $requestId, int $status = 200): self
    {
        return new self($status, ['data' => $data, 'meta' => ['requestId' => $requestId]], $requestId);
    }

    /** @param array<string, mixed> $details */
    public static function error(
        int $status,
        string $code,
        string $message,
        string $requestId,
        array $details = [],
    ): self {
        $error = ['code' => $code, 'message' => $message];
        if ($details !== []) {
            $error['details'] = $details;
        }

        return new self($status, ['error' => $error, 'meta' => ['requestId' => $requestId]], $requestId);
    }

    public static function redirect(string $location, string $requestId): self
    {
        return new self(
            303,
            ['data' => ['redirect' => $location], 'meta' => ['requestId' => $requestId]],
            $requestId,
            ['Location' => $location],
        );
    }

    public function emit(): never
    {
        http_response_code($this->status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: no-referrer');
        header('X-Request-ID: ' . $this->requestId);
        foreach ($this->headers as $name => $value) {
            header($name . ': ' . $value);
        }
        echo json_encode($this->payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        exit;
    }
}
