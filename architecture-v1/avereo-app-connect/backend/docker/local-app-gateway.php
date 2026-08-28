<?php

declare(strict_types=1);

function localAppGatewayConfigureEnvironment(): void
{
    foreach (['rapport', 'coupe', 'projet', 'thermo', 'drone'] as $applicationCode) {
        $prefix = 'APP_LAUNCH_' . strtoupper($applicationCode);
        if (getenv("{$prefix}_URL") === false) {
            putenv("{$prefix}_URL=http://127.0.0.1:8080/local-app/{$applicationCode}");
        }
        if (getenv("{$prefix}_SECRET") === false) {
            putenv("{$prefix}_SECRET=local-demo-only-{$applicationCode}-ticket-key-2026-invalid");
        }
    }
}

/** @return non-empty-string */
function localAppGatewaySecret(string $applicationCode): string
{
    $name = 'APP_LAUNCH_' . strtoupper($applicationCode) . '_SECRET';
    $secret = trim((string) (getenv($name) ?: ''));
    if (strlen($secret) < 32) {
        throw new RuntimeException('Configuration locale du sas indisponible.');
    }

    return $secret;
}

function localAppGatewayBase64UrlEncode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function localAppGatewayBase64UrlDecode(string $value): string
{
    if ($value === '' || !preg_match('/^[A-Za-z0-9_-]+$/', $value)) {
        throw new RuntimeException('Encodage invalide.');
    }
    $padding = (4 - strlen($value) % 4) % 4;
    $decoded = base64_decode(strtr($value . str_repeat('=', $padding), '-_', '+/'), true);
    if ($decoded === false) {
        throw new RuntimeException('Encodage invalide.');
    }

    return $decoded;
}

/** @return array<string, mixed> */
function localAppGatewayDecodeSigned(string $value, string $secret): array
{
    if (strlen($value) > 4096 || substr_count($value, '.') !== 1) {
        throw new RuntimeException('Jeton invalide.');
    }
    [$encodedPayload, $encodedSignature] = explode('.', $value, 2);
    $providedSignature = localAppGatewayBase64UrlDecode($encodedSignature);
    $expectedSignature = hash_hmac('sha256', $encodedPayload, $secret, true);
    if (!hash_equals($expectedSignature, $providedSignature)) {
        throw new RuntimeException('Signature invalide.');
    }
    $payload = json_decode(
        localAppGatewayBase64UrlDecode($encodedPayload),
        true,
        16,
        JSON_THROW_ON_ERROR,
    );
    if (!is_array($payload)) {
        throw new RuntimeException('Contenu invalide.');
    }

    return $payload;
}

/** @param array<string, mixed> $payload */
function localAppGatewayAssertIdentity(array $payload): void
{
    $identity = $payload['identity'] ?? null;
    if (
        !is_array($identity)
        || ($identity['provider'] ?? null) !== 'avereo_connect'
        || !preg_match('/^[1-9][0-9]{0,18}$/', (string) ($identity['id'] ?? ''))
        || array_diff(array_keys($identity), ['provider', 'id']) !== []
    ) {
        throw new RuntimeException('Identite locale invalide.');
    }
}

/** @param array<string, mixed> $payload */
function localAppGatewayAssertTicket(array $payload, string $applicationCode): void
{
    $issuedAt = filter_var($payload['iat'] ?? null, FILTER_VALIDATE_INT);
    $expiresAt = filter_var($payload['exp'] ?? null, FILTER_VALIDATE_INT);
    $nonce = (string) ($payload['nonce'] ?? '');
    $now = time();
    if (
        ($payload['v'] ?? null) !== 1
        || ($payload['app'] ?? null) !== $applicationCode
        || $issuedAt === false
        || $expiresAt === false
        || $issuedAt > $now + 30
        || $issuedAt < $now - 300
        || $expiresAt <= $now
        || $expiresAt - $issuedAt > 300
        || !is_bool($payload['remembered'] ?? null)
        || !preg_match('/^[A-Za-z0-9_-]{24,128}$/', $nonce)
    ) {
        throw new RuntimeException('Ticket local expire ou non conforme.');
    }
    localAppGatewayAssertIdentity($payload);
}

function localAppGatewayConsumeNonce(string $applicationCode, string $nonce, int $expiresAt): void
{
    $directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'avereo-connect-local-nonces';
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('Stockage anti-rejeu local indisponible.');
    }
    $path = $directory . DIRECTORY_SEPARATOR . hash('sha256', $applicationCode . ':' . $nonce) . '.used';
    $handle = @fopen($path, 'x');
    if ($handle === false) {
        throw new RuntimeException('Ticket local deja utilise.');
    }
    fwrite($handle, (string) $expiresAt);
    fclose($handle);
    @chmod($path, 0600);

    foreach (glob($directory . DIRECTORY_SEPARATOR . '*.used') ?: [] as $candidate) {
        if (is_file($candidate) && filemtime($candidate) < time() - 600) {
            @unlink($candidate);
        }
    }
}

function localAppGatewayCookieName(string $applicationCode): string
{
    return 'AVEREO_LOCAL_GATE_' . strtoupper($applicationCode);
}

/** @param array<string, mixed> $ticketPayload */
function localAppGatewayIssueCookie(string $applicationCode, array $ticketPayload, string $secret): void
{
    $issuedAt = time();
    $payload = localAppGatewayBase64UrlEncode(json_encode([
        'v' => 1,
        'app' => $applicationCode,
        'iat' => $issuedAt,
        'exp' => $issuedAt + 1800,
        'identity' => $ticketPayload['identity'],
    ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    $value = $payload . '.' . localAppGatewayBase64UrlEncode(
        hash_hmac('sha256', $payload, $secret, true),
    );
    setcookie(localAppGatewayCookieName($applicationCode), $value, [
        'expires' => ($ticketPayload['remembered'] ?? false) === true ? $issuedAt + 1800 : 0,
        'path' => '/local-app/' . $applicationCode,
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

/** @return array<string, mixed> */
function localAppGatewaySession(string $applicationCode, string $secret): array
{
    $cookie = (string) ($_COOKIE[localAppGatewayCookieName($applicationCode)] ?? '');
    $payload = localAppGatewayDecodeSigned($cookie, $secret);
    $issuedAt = filter_var($payload['iat'] ?? null, FILTER_VALIDATE_INT);
    $expiresAt = filter_var($payload['exp'] ?? null, FILTER_VALIDATE_INT);
    $now = time();
    if (
        ($payload['v'] ?? null) !== 1
        || ($payload['app'] ?? null) !== $applicationCode
        || $issuedAt === false
        || $expiresAt === false
        || $issuedAt > $now + 30
        || $issuedAt < $now - 1800
        || $expiresAt <= $now
        || $expiresAt - $issuedAt > 1800
    ) {
        throw new RuntimeException('Session locale expiree ou non conforme.');
    }
    localAppGatewayAssertIdentity($payload);

    return $payload;
}

function localAppGatewayRender(string $applicationCode, string $userId): void
{
    $names = [
        'rapport' => 'Rapport AVEREO Pro',
        'coupe' => 'Coupe AVEREO Reno Pro',
        'projet' => 'Projet AVEREO',
        'thermo' => 'Thermo AVEREO',
        'drone' => 'Drone AVEREO',
    ];
    $name = htmlspecialchars($names[$applicationCode] ?? $applicationCode, ENT_QUOTES, 'UTF-8');
    $code = htmlspecialchars(strtoupper($applicationCode), ENT_QUOTES, 'UTF-8');
    $identity = htmlspecialchars($userId, ENT_QUOTES, 'UTF-8');
    header('Content-Type: text/html; charset=utf-8');
    echo <<<HTML
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{$name} — démonstration locale</title>
  <style>
    :root { color-scheme: light; font-family: Inter, system-ui, sans-serif; color: #17223b; background: #f3f6fb; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; }
    main { width: min(720px, calc(100% - 3rem)); padding: 2.5rem; border: 1px solid #d7e1ef; border-radius: 20px; background: white; box-shadow: 0 24px 70px rgba(23, 34, 59, .12); }
    small { color: #155eef; font-weight: 800; letter-spacing: .12em; }
    h1 { margin: .8rem 0; font-size: clamp(2rem, 6vw, 3.5rem); }
    .status { padding: 1rem; border-radius: 12px; background: #edf4ff; }
    a { display: inline-block; margin-top: 1.5rem; padding: .85rem 1.1rem; border-radius: 10px; color: white; background: #155eef; text-decoration: none; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <small>{$code} · MODE LOCAL DOCKER</small>
    <h1>{$name}</h1>
    <p class="status">Sas AVEREO CONNECT validé pour le compte local n° {$identity}.</p>
    <p>Cette page confirme le ticket signé, sa durée de vie et son usage unique. Elle ne contacte aucune application hébergée.</p>
    <a href="/">Retour à AVEREO CONNECT</a>
  </main>
</body>
</html>
HTML;
}

function localAppGatewayHandle(string $applicationCode, string $ticket): void
{
    try {
        $secret = localAppGatewaySecret($applicationCode);
        if ($ticket !== '') {
            $payload = localAppGatewayDecodeSigned($ticket, $secret);
            localAppGatewayAssertTicket($payload, $applicationCode);
            localAppGatewayConsumeNonce(
                $applicationCode,
                (string) $payload['nonce'],
                (int) $payload['exp'],
            );
            localAppGatewayIssueCookie($applicationCode, $payload, $secret);
            header('Location: /local-app/' . rawurlencode($applicationCode), true, 303);
            return;
        }

        $session = localAppGatewaySession($applicationCode, $secret);
        localAppGatewayRender($applicationCode, (string) $session['identity']['id']);
    } catch (Throwable) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Acces local refuse. Revenez dans AVEREO CONNECT pour ouvrir cette application.';
    }
}
