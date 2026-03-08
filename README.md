# AVEREO CONNECT

Ce depot contient la V1 en cours de developpement.

## Contenu actuel

- `prototype-v1/`: prototype fonctionnel (HTML/CSS/JS) du tunnel metier
- `AVEREO_CONNECT_V1_Maquette_Fonctionnelle.md`: cadrage produit V1
- `.github/workflows/ci.yml`: verification automatique des fichiers de base
- `.github/workflows/deploy-pages.yml`: deploiement automatique du prototype sur GitHub Pages

## Lancer localement

Prerequis:
- Node.js 20+

Commandes:

```bash
npm run check
npm run dev
```

Puis ouvrir `http://localhost:5173`.

## Activer GitHub Pages

1. Aller dans `Settings > Pages` du repo.
2. S'assurer que la source est `GitHub Actions`.
3. Push sur `main` pour declencher le workflow `Deploy Prototype To GitHub Pages`.

## Prochain jalon

- Ajouter API dediee (auth, biens, dossiers, devis, catalogue)
- Migrer le moteur de chiffrage cote serveur
- Brancher Stripe webhooks et RBAC serveur
