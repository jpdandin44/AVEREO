# Audit source - AVEREO Collector Recherche

## Source

- Pas de source historique `.txt` : application nouvelle, créée le 24/09/2026.
- Spécification : `04_Proposition_Collector_Recherche-v1.md` et `03_Prompt_AVEREO_Collector_Optimise.md` (§ 20, 21, 25, 29), dans le dossier AVEREO COLLECTOR.

## Intégration CONNECT

- Même schéma que Thermo et Drone : `public/index.php`, `public/connect/entry.php` et `public/connect/logout.php` avec `AVEREO_GATE_APP = 'recherche'`.
- `public/connect/gate.php` est copié depuis `avereo-platform/shared/connect-gate.php` par `prepare-connect-gate.mjs`.
- `public/.htaccess` est identique à celui de Thermo : toutes les pages passent par `index.php`, `/connect` reste accessible.

## Dépendances

- Runtime : react, react-dom, zustand, minisearch (recherche plein texte), idb-keyval (IndexedDB, déjà utilisé par Thermo et Rapport).
- Dev : @vitejs/plugin-react, vite 5, vitest 2.
- Aucun CDN ni police externe : polices système.

## APIs navigateur utilisées

- IndexedDB (corpus), sessionStorage (dernière recherche).
- File API (import), Blob et URL.createObjectURL (sauvegarde).
- navigator.clipboard, avec un repli `execCommand('copy')`.

## Validation

Voir la description de la pull request.
