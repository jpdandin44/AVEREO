# AVEREO V1 Base (depuis POC)

Cette base est derivee de `POC_Avereo_Connect_V0.txt` et sert de socle V1.

## Demarrage rapide

Option 1 (simple):
- Ouvrir `index.html` dans un navigateur.

Option 2 (serveur local):
- Depuis la racine du repo: `npm run dev`
- Ouvrir `http://localhost:5173`

Option 3 (autonome, sans localhost):
- Ouvrir directement `standalone-v1.html`
- Si page blanche (reseau/CDN bloque): ouvrir `rendu-v1-static.html`

Apercu HTML V1 avec serveur:
- Ouvrir `http://localhost:5173/rendu-v1.html`
- Cette page charge automatiquement le dashboard et le dossier bien #1

Version en ligne cible via GitHub Pages:
- `https://jpdandin44.github.io/AVEREO/v1/index.html?preview=1`

## Ce qui est inclus

- Store Zustand (auth, biens, dossier, tarifs)
- Dashboard biens et edition
- Recherche + filtre type sur dashboard
- Cartes de pilotage V1 (biens, surfaces, pieces, fichiers, cloud)
- Gestion des pieces et interventions
- Chiffrage selon tier (`eco/std/premium`)
- Admin tarifs (CSV, export/import)
- Export PDF/partage demo
- Upload de pieces jointes avec mode cloud Nextcloud (WebDAV)

## Cloud collaboratif V1

- Configuration cloud dans l'app (bloc `Configurer cloud`)
- Creation automatique des dossiers WebDAV (MKCOL)
- Upload fichier dossier dans Nextcloud
- Fallback local si le cloud est indisponible

Voir aussi `../NEXTCLOUD_INTEGRATION_V1.md`.

## Limites actuelles (assumees en V1 base)

- Donnees persistees en `localStorage`
- Authentification simulee
- Pas de backend/API dediee
- Identifiants cloud stockes localement (V1 demo)
- Librairies chargees via CDN

## Objectif de cette base

Garder l'UX et la logique metier du POC comme reference, puis migrer progressivement vers une architecture robuste (API + DB + auth + paiements).
