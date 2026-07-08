# AGENTS.md - AVEREO

## Role du depot

Ce depot fait partie de l'architecture hybride AVEREO V1.

## Regles absolues

- Ne jamais commiter de secrets.
- Ne jamais commiter `.env`, `node_modules/` ou `frontend/dist/`.
- Garder la V1 statique.
- Ne pas activer de backend ou de MySQL avant la V2.
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
