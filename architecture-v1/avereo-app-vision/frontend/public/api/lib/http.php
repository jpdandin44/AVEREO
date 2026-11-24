<?php

declare(strict_types=1);

// Réponses JSON et lecture du corps des requêtes. Toute réponse est du JSON {ok: bool, ...}.

final class VisionHttpException extends RuntimeException
{
    public function __construct(public readonly int $status, public readonly string $errorCode, string $message)
    {
        parent::__construct($message);
    }
}

function vision_send_headers(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
}

/** Envoie une réponse JSON et termine. */
function vision_json_response(int $status, array $payload): never
{
    http_response_code($status);
    vision_send_headers();
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

/** Réponse d'erreur : code court stable, message en français sans détail interne. */
function vision_error(int $status, string $code, string $message, array $extra = []): never
{
    vision_json_response($status, ['ok' => false, 'error' => $code, 'message' => $message] + $extra);
}

/** Exige l'une des méthodes données ; sinon 405 avec l'en-tête Allow. */
function vision_require_method(array $allowed): string
{
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if (!in_array($method, $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        vision_error(405, 'method_not_allowed', 'Méthode non autorisée.');
    }
    return $method;
}

/**
 * Corps JSON d'une requête : taille limitée (413), type JSON (415), objet JSON valide (400).
 * @return array<string, mixed>
 */
function vision_read_json_body(int $maxBytes, ?string $raw = null, ?string $contentType = null): array
{
    $contentType ??= (string) ($_SERVER['CONTENT_TYPE'] ?? '');
    if (!str_starts_with(strtolower(trim($contentType)), 'application/json')) {
        throw new VisionHttpException(415, 'unsupported_media_type', 'Le corps doit être du JSON (application/json).');
    }
    $raw ??= (string) file_get_contents('php://input', false, null, 0, $maxBytes + 1);
    if (strlen($raw) > $maxBytes) {
        throw new VisionHttpException(413, 'payload_too_large', 'Corps de requête trop volumineux.');
    }
    try {
        $decoded = json_decode($raw, true, 8, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        throw new VisionHttpException(400, 'invalid_json', 'Corps JSON invalide.');
    }
    if (!is_array($decoded) || array_is_list($decoded) && $decoded !== []) {
        throw new VisionHttpException(400, 'invalid_json', 'Le corps doit être un objet JSON.');
    }
    return $decoded;
}
