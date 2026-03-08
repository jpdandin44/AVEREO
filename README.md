# AVEREO CONNECT

Ce depot contient la base V1 en cours de developpement.

## Contenu actuel

- `avereo-v1-base/`: base V1 issue du POC React fourni
- `avereo-v1-base/rendu-v1.html`: rendu HTML de demonstration V1 (mode serveur)
- `avereo-v1-base/standalone-v1.html`: version autonome React (sans localhost, CDN requis)
- `avereo-v1-base/rendu-v1-static.html`: version statique sans dependances externes (recommandee si page blanche)
- `prototype-v1/`: prototype fonctionnel (HTML/CSS/JS) du tunnel metier
- `scripts/prepare-pages.mjs`: packaging GitHub Pages (landing + V1 + prototype)
- `NEXTCLOUD_INTEGRATION_V1.md`: integration cloud collaborative (Nextcloud/WebDAV)
- `AVEREO_CONNECT_V1_Maquette_Fonctionnelle.md`: cadrage produit V1
- `V2_Preparation_AVEREO.md`: cadre de passage V1 -> V2

## Lancer localement

Prerequis:
- Node.js 20+

Commandes:

```bash
npm run check
npm run dev
```

`npm run dev` lance la base V1 sur `http://localhost:5173`.

Apercu HTML direct:
- `http://localhost:5173/rendu-v1.html` (avec serveur local)
- `avereo-v1-base/standalone-v1.html` (double-clic, sans localhost)
- `avereo-v1-base/rendu-v1-static.html` (double-clic, sans CDN)

## Version en ligne (rapide)

Le workflow `.github/workflows/deploy-pages.yml` publie un mini portail sur GitHub Pages avec:
- `/` : landing de navigation
- `/v1/index.html?preview=1` : app V1 dynamique
- `/v1/rendu-v1-static.html` : rendu statique
- `/prototype/index.html` : prototype historique

URL attendue apres deploy (repo `jpdandin44/AVEREO`):
- `https://jpdandin44.github.io/AVEREO/`

## Politique Pull Request

Regles appliquees automatiquement sur chaque PR:
- Titre PR au format Conventional Commits (`feat: ...`, `fix: ...`, etc.)
- Sections obligatoires dans la description PR
- Checklist obligatoire cochee
- Reviewer par defaut via `CODEOWNERS`

Regles a activer dans GitHub (`Settings > Branches > Branch protection`):
1. Require a pull request before merging
2. Require approvals (au moins 1)
3. Require status checks to pass (`validate`, `policy`)
4. Require conversation resolution before merging
5. Include administrators
