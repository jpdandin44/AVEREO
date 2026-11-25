<?php

declare(strict_types=1);

header('Cache-Control: no-store');
try {
    require_once '/opt/vision/frontend/public/api/lib/config.php';
    require_once __DIR__ . '/lib.php';
    // Une configuration mal typée ne doit pas ajouter d'avertissement PHP à la réponse de refus.
    $config = @vision_config();
    $autorise = vision_revue_autorise($config);
} catch (Throwable) {
    $autorise = false;
}
if (!$autorise) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Page de revue disponible uniquement en environnement local.';
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$comptes = vision_revue_comptes();
if ($method === 'POST') {
    $compte = $_POST['compte'] ?? null;
    if (!is_string($compte) || !isset($comptes[$compte])) {
        http_response_code(400);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Compte fictif inconnu.';
        exit;
    }
    $ticket = vision_revue_ticket($config['connect_launch_secret'], $comptes[$compte]['id'], time());
    header('Location: /connect/entry.php?ticket=' . rawurlencode($ticket), true, 303);
    exit;
}
if ($method !== 'GET') {
    http_response_code(405);
    header('Allow: GET, POST');
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Méthode non autorisée.';
    exit;
}

$nom = getenv('VISION_REVUE_NOM');
$nom = is_string($nom) && $nom !== '' ? $nom : 'local';
$escape = static fn (string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Choisir un compte fictif — AVEREO Vision</title>
    <style>
        :root {
            --brand-primary: #002B45;
            --brand-accent: #FF6600;
            --surface-muted: #EEF3F6;
            --text-primary: #263238;
            --radius: 8px;
            --surface: #FFFFFF;
        }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 24px; background: var(--surface-muted); color: var(--text-primary); font-family: Inter, Arial, sans-serif; line-height: 1.5; }
        main { max-width: 720px; margin: 24px auto; padding: 28px; background: var(--surface); border-radius: var(--radius); }
        .logo { display: block; width: 220px; height: auto; margin: 16px 0 28px; }
        h1, h2 { color: var(--brand-primary); line-height: 1.25; }
        h1 { font-size: 1.6rem; }
        h2 { font-size: 1.2rem; }
        .avertissement { padding: 16px; background: var(--surface-muted); border-left: 3px solid var(--brand-accent); border-radius: var(--radius); }
        form { margin: 12px 0; }
        button { width: 100%; min-height: 48px; padding: 12px 16px; border: 0; border-radius: var(--radius); background: var(--brand-primary); color: var(--surface); font: inherit; cursor: pointer; }
        button:focus-visible { outline: 3px solid var(--brand-accent); outline-offset: 3px; }
        @media (max-width: 480px) { body { padding: 12px; } main { margin: 12px auto; padding: 20px; } }
    </style>
</head>
<body>
<main>
    <img class="logo" src="/branding/logo-avereo.png" width="220" alt="AVEREO">
    <h1>AVEREO Vision — environnement de revue locale</h1>
    <p class="avertissement">Données fictives, environnement local : n'y saisissez aucune donnée réelle</p>
    <p>Environnement : <strong><?= $escape($nom) ?></strong></p>
    <h2>Choisir un compte fictif</h2>
    <?php foreach ($comptes as $cle => $compte): ?>
        <form method="post" action="/revue/">
            <input type="hidden" name="compte" value="<?= $escape($cle) ?>">
            <button type="submit"><?= $escape('Entrer comme ' . $compte['libelle']) ?></button>
        </form>
    <?php endforeach; ?>
    <p>Pour changer de compte : Se déconnecter dans l'application, puis revenir sur /revue/</p>
</main>
</body>
</html>
