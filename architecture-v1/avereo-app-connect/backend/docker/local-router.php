<?php

declare(strict_types=1);

$publicDirectory = realpath(dirname(__DIR__) . '/public');
if ($publicDirectory === false) {
    http_response_code(500);
    echo 'Local public directory is unavailable.';
    return true;
}

$requestUri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
$requestPath = rawurldecode((string) (parse_url($requestUri, PHP_URL_PATH) ?: '/'));
$localDemoEnabled = getenv('APP_ENV') === 'local'
    && filter_var(getenv('LOCAL_DEMO_ENABLED') ?: 'false', FILTER_VALIDATE_BOOL) === true;
if ($localDemoEnabled) {
    require_once __DIR__ . '/local-app-gateway.php';
    localAppGatewayConfigureEnvironment();
}

if (str_contains($requestPath, "\0")) {
    http_response_code(400);
    echo 'Invalid local request path.';
    return true;
}

header('Cache-Control: no-store');
header('Content-Security-Policy: default-src \'self\'; style-src \'self\' \'unsafe-inline\'; script-src \'self\' \'unsafe-inline\'; connect-src \'self\'; form-action \'self\'; frame-ancestors \'none\'; base-uri \'none\'');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');

if (
    $localDemoEnabled
    && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET'
    && in_array($requestPath, ['/api/v1/auth/login', '/api/v1/local/login'], true)
) {
    require dirname(__DIR__) . '/src/autoload.php';
    parse_str((string) (parse_url($requestUri, PHP_URL_QUERY) ?: ''), $query);
    $account = is_string($query['account'] ?? null) ? $query['account'] : 'owner';
    $subjects = ['owner' => 'local-owner', 'client' => 'local-client'];
    if (!isset($subjects[$account])) {
        http_response_code(400);
        echo 'Profil local inconnu.';
        return true;
    }

    $config = \Avereo\Connect\Config::fromEnvironment();
    $pdo = \Avereo\Connect\Database::connect($config);
    if (!$pdo instanceof PDO) {
        http_response_code(503);
        echo 'Base locale CONNECT indisponible.';
        return true;
    }
    $statement = $pdo->prepare(
        'SELECT id FROM users WHERE drupal_subject = :subject '
        . 'AND status = \'active\' AND onboarding_status = \'completed\'',
    );
    $statement->execute(['subject' => $subjects[$account]]);
    $userId = filter_var($statement->fetchColumn(), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($userId === false) {
        http_response_code(503);
        echo 'Profil local CONNECT non initialise.';
        return true;
    }

    $session = new \Avereo\Connect\Security\SessionManager($config);
    $session->start();
    $session->establishIdentity($subjects[$account], (int) $userId);
    header('Location: /', true, 303);
    return true;
}

if (
    $localDemoEnabled
    && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET'
    && preg_match('#^/local-app/(rapport|coupe|projet|thermo|drone|recherche)$#', $requestPath, $matches)
) {
    parse_str((string) (parse_url($requestUri, PHP_URL_QUERY) ?: ''), $query);
    $ticket = is_string($query['ticket'] ?? null) ? $query['ticket'] : '';
    localAppGatewayHandle($matches[1], $ticket);
    return true;
}

if ($requestPath === '/' || $requestPath === '/index.html') {
    header('Content-Type: text/html; charset=utf-8');
    $html = file_get_contents($publicDirectory . '/index.html');
    if ($html === false) {
        http_response_code(500);
        echo 'Local portal is unavailable.';
        return true;
    }
    if ($localDemoEnabled) {
        $banner = <<<'HTML'
    <aside style="margin-bottom:1rem;padding:.9rem 1rem;border:1px solid #f0cf72;border-radius:10px;background:#fff8df;color:#5c4300">
      <strong>Mode local Docker</strong> — ouvrir une session fictive :
      <a href="/api/v1/local/login?account=owner">Administrateur local</a>
      · <a href="/api/v1/local/login?account=client">Client local</a>
    </aside>
HTML;
        $html = str_replace('  <main>', "  <main>\n{$banner}", $html, $count);
        if ($count !== 1) {
            http_response_code(500);
            echo 'Local portal injection point is unavailable.';
            return true;
        }
    }
    echo $html;
    return true;
}

$candidate = realpath($publicDirectory . DIRECTORY_SEPARATOR . ltrim($requestPath, '/'));
$allowedStaticExtensions = ['css', 'gif', 'html', 'ico', 'jpeg', 'jpg', 'js', 'png', 'svg', 'webp', 'woff', 'woff2'];

if (
    $candidate !== false
    && str_starts_with($candidate, $publicDirectory . DIRECTORY_SEPARATOR)
    && is_file($candidate)
    && in_array(strtolower((string) pathinfo($candidate, PATHINFO_EXTENSION)), $allowedStaticExtensions, true)
) {
    return false;
}

require $publicDirectory . '/index.php';
return true;
