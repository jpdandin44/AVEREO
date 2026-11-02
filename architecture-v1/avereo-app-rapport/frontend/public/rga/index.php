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
</head>
<body><main>
  <a href="/">← Retour à Rapport</a>
  <h1>Carte RGA AVEREO 2026</h1>
  <p>Retrait-gonflement des argiles — préqualification territoriale.</p>
  <p class="notice">Cette carte décrit un contexte territorial. Elle ne permet pas de conclure au risque d’une parcelle, ne remplace pas une étude de sol et ne constitue pas un diagnostic. Le statut à l’adresse reste consultable dans la synthèse Géorisques du rapport.</p>
  <nav aria-label="Choisir une carte">
    <a href="france.php" target="rga-map">France</a>
    <a href="haute-garonne.php" target="rga-map">Haute-Garonne</a>
  </nav>
  <iframe name="rga-map" src="france.php" title="Carte interactive RGA 2026" referrerpolicy="no-referrer" allowfullscreen></iframe>
  <p><a href="france.php" target="_blank" rel="noopener noreferrer">France en plein écran</a> · <a href="haute-garonne.php" target="_blank" rel="noopener noreferrer">Haute-Garonne en plein écran</a></p>
  <small>Cartes issues de l’application AVEREO RGA, données de janvier 2026, traitement du 19 mai 2026. Fonds cartographiques et bibliothèques externes : une connexion Internet est nécessaire.</small>
</main></body></html>
