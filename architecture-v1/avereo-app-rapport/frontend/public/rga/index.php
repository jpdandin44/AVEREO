<?php require __DIR__ . '/guard.php'; ?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Carte RGA 2026 — Rapport AVEREO</title>
  <style>
    body{margin:0;font:16px/1.5 system-ui,sans-serif;color:#183344;background:#f4f6f5}
    main{max-width:1440px;margin:auto;padding:24px}h1{margin:.3em 0}
    nav{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0}a{color:#075c69}
    nav a{background:white;padding:10px 16px;border:1px solid #b6c7ca;border-radius:8px}
    iframe{width:100%;height:72vh;min-height:420px;border:1px solid #b6c7ca;background:white}
    .notice{padding:16px;border-left:4px solid #bd8524;background:#fff8e8}small{display:block}
  </style>
    <script defer src="/account-menu.js"></script>
  <meta name="avereo-connect-portal" content="<?= htmlspecialchars(avereo_gate_portal($config), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>">
<script type="module" src="workspace.js"></script>
</head>
<body><main>
  <avereo-account-menu logout-path="/rga/logout.php" style="float:right"><a slot="items" href="carte.php#projects" target="rga-map">Mes projets</a></avereo-account-menu>
  <a href="/">← Retour à Rapport</a>
  <h1>RGA — Rechercher un bien</h1>
  <p>Retrait-gonflement des argiles — préqualification territoriale.</p>
  <p class="notice">Cette carte décrit un contexte territorial. Elle ne permet pas de conclure au risque d’une parcelle, ne remplace pas une étude de sol et ne constitue pas un diagnostic. Le statut à l’adresse reste consultable dans la synthèse Géorisques du rapport.</p>
  <nav aria-label="Choisir une carte">
    <a href="carte.php" target="rga-map">Nouvelle carte · recherche d’adresse</a>
    <a href="france.php" target="rga-map">France</a>
    <a href="haute-garonne.php" target="rga-map">Haute-Garonne</a>
  </nav>
  <iframe name="rga-map" src="carte.php" title="Carte interactive RGA 2026" referrerpolicy="no-referrer" allowfullscreen></iframe>
  <p>Dans Rapport, rechercher l’adresse dans Site puis ouvrir Rapport des risques et la nouvelle carte. « Utiliser dans ce rapport » reprend la consultation pour le même point, avec sa source et sa date.</p>
  <p><a href="carte.php" target="_blank" rel="noopener noreferrer">Nouvelle carte en plein écran</a></p>
  <p><a href="france.php" target="_blank" rel="noopener noreferrer">France en plein écran</a> · <a href="haute-garonne.php" target="_blank" rel="noopener noreferrer">Haute-Garonne en plein écran</a></p>
  <small>Cartes issues de l’application AVEREO RGA, données de janvier 2026, traitement du 19 mai 2026. Fonds cartographiques et bibliothèques externes : une connexion Internet est nécessaire.</small>
</main></body></html>
