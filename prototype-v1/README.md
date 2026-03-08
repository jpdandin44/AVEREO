# Prototype V1 - AVEREO CONNECT

## Ce qui est deja developpe

- Interface responsive (desktop + mobile)
- Connexion simulee avec roles (`Owner`, `Editor`, `Viewer`, `Admin`)
- Gestion des biens
- Creation dossier + pieces
- Chiffrage live (HT, TVA, TTC, encadrement)
- Synthese et export JSON
- Export PDF via impression navigateur
- Admin catalogue (ajout, edition, suppression, publication de version)
- Persistance locale via `localStorage`

## Ouvrir le prototype

1. Ouvrir `index.html` dans un navigateur moderne.
2. Creer une session (role `Admin` recommande pour tester toutes les fonctions).
3. Suivre le tunnel: `Biens -> Dossier -> Chiffrage -> Synthese -> Admin`.

## Fichiers

- `index.html`: structure des ecrans
- `styles.css`: design system et responsive
- `app.js`: logique metier et interactions

## Limites actuelles (normal pour ce jalon)

- Aucune API distante (tout est front/localStorage)
- Aucune authentification reelle
- Aucun stockage cloud de documents
- Aucun webhook Stripe

## Prochaine etape dev (Sprint API)

1. Creer une API dediee (`/auth`, `/properties`, `/projects`, `/quotes`, `/catalog`).
2. Migrer la logique de calcul dans un service serveur versionne.
3. Ajouter persistence Postgres + RBAC serveur.
4. Brancher Stripe webhooks et gestion des droits.
5. Brancher upload documents et partage securise.
