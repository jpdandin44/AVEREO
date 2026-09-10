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
- Checklist conforme au modele UTF-8 officiel et obligatoirement cochee par le responsable humain
- Liens temporaires `URL_*` obligatoirement remplaces
- Reviewer par defaut via `CODEOWNERS`

Le modele `.github/PULL_REQUEST_TEMPLATE.md` est la source unique des
libelles. Le meme verificateur est utilise localement et dans GitHub Actions :

```powershell
# Avant publication : les cases peuvent encore etre decochees.
python .github/scripts/check-pr-policy.py --allow-unchecked `
  --title "TYPE(SCOPE): DESCRIPTION" `
  --body-file CHEMIN_DESCRIPTION

# Apres validation humaine : controle strict de la PR reellement enregistree.
python .github/scripts/check-pr-policy.py `
  --pr-number NUMERO `
  --repo PROPRIETAIRE/DEPOT

# Non-regression du verificateur.
python -m unittest discover `
  -s .github/scripts/tests `
  -p "test_check_pr_policy.py"
```

Le mode de prepublication ne coche aucune case. Le controle strict conserve la
validation et l'autorisation de merge sous responsabilite humaine.

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
