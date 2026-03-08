# AVEREO CONNECT

Ce depot contient la V1 en cours de developpement.

## Contenu actuel

- `prototype-v1/`: prototype fonctionnel (HTML/CSS/JS) du tunnel metier
- `AVEREO_CONNECT_V1_Maquette_Fonctionnelle.md`: cadrage produit V1
- `.github/workflows/ci.yml`: verification automatique des fichiers de base
- `.github/workflows/deploy-pages.yml`: deploiement automatique du prototype sur GitHub Pages
- `.github/workflows/pr-policy.yml`: validation automatique de la politique PR
- `.github/PULL_REQUEST_TEMPLATE.md`: template obligatoire de description PR
- `.github/CODEOWNERS`: proprietaire/reviewer par defaut

## Lancer localement

Prerequis:
- Node.js 20+

Commandes:

```bash
npm run check
npm run dev
```

Puis ouvrir `http://localhost:5173`.

## Politique Pull Request

Regles appliquees automatiquement sur chaque PR:
- Titre PR au format Conventional Commits (`feat: ...`, `fix: ...`, etc.)
- Sections obligatoires dans la description PR
- Checklist obligatoire cochee
- Reviewer par defaut via `CODEOWNERS`

Regles a activer dans GitHub (`Settings > Branches > Branch protection`):
1. Require a pull request before merging
2. Require approvals (au moins 1)
3. Require status checks to pass (`CI`, `PR Policy`)
4. Require conversation resolution before merging
5. Include administrators

## Activer GitHub Pages

1. Aller dans `Settings > Pages` du repo.
2. S'assurer que la source est `GitHub Actions`.
3. Push sur `main` pour declencher le workflow `Deploy Prototype To GitHub Pages`.

## Prochain jalon

- Ajouter API dediee (auth, biens, dossiers, devis, catalogue)
- Migrer le moteur de chiffrage cote serveur
- Brancher Stripe webhooks et RBAC serveur

## Validation PR - Exemple
- Cette section a ete ajoutee depuis la branche codex/pr-validation-example pour valider le workflow PR.
