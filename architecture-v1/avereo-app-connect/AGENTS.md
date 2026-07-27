# AGENTS.md - AVEREO

## Rôle du dépôt

Ce dépôt contient le frontend historique AVEREO CONNECT et le candidat backend
C7/V2 chargé de déléguer l'identification à Drupal.

## Règles absolues

- Ne jamais commiter de secrets.
- Ne jamais commiter `.env`, `node_modules/` ou `frontend/dist/`.
- Garder le frontend V1 stable tant qu'une modification dédiée ne l'autorise pas.
- Limiter le backend et MySQL au périmètre C7/V2, avec tests et documentation.
- Ne jamais déclencher automatiquement un déploiement backend ou une migration
  hébergée depuis une PR de préparation.
- Préserver le comportement de l'application source.
- Documenter tout écart dans `docs/source-audit.md`.

## Workflow Codex

Avant modification :

1. inspecter le dépôt ;
2. lire `README.md` ;
3. lire les documents dans `docs/` ;
4. proposer un plan ;
5. modifier les fichiers ;
6. exécuter les validations possibles ;
7. résumer les changements.

## Documentation longue

Les détails d'architecture, de déploiement et de CI/CD sont dans `docs/`.
