# AGENTS.md - AVEREO

## Role du depot

Ce dossier porte le socle partage du monorepo AVEREO.

## Regles absolues

- Ne jamais commiter de secrets.
- Ne jamais commiter `.env`, `node_modules/` ou `frontend/dist/`.
- Garder les composants partages generiques et sans code metier applicatif.
- Ne jamais demarrer ou arreter une application depuis un composant partage.
- Le gateway HTTP local ne fournit que le routage; chaque application declare et teste son fichier dans `infra/local-gateway/routes/`.
- Preserver le comportement de l'application source.
- Documenter tout ecart dans `docs/source-audit.md`.

## Workflow Codex

Avant modification :
1. Inspecter le depot.
2. Lire `README.md`.
3. Lire les documents dans `docs/`.
4. Proposer un plan.
5. Modifier les fichiers.
6. Executer les validations possibles.
7. Resumer les changements.

## Documentation longue

Les details d'architecture, de deploiement et de CI/CD sont dans `docs/`.
