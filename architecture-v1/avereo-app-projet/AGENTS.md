---
project: avereo-app-projet
document_type: agent-instructions
title: Instructions de développement de Projet
status: active
version: git
created: 2026-09-15
updated: 2026-09-24
owner: jpdandin
tags: [projet, instructions, developpement]
---

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

## Revue locale autorisée le 24 septembre 2026

La demande utilisateur d'intégrer revue et approbation dans Projet autorise
l'outil décrit dans `workflows/revue-developpement.md` : écran React et
middleware Vite local écrivant dans le suivi JSON du chantier choisi.
La V1 hébergée reste statique ; aucun backend hébergé ni MySQL n'est activé.
Tester les décisions sur les fixtures ou le mode `--demo`, jamais en approuvant
le chantier réel à la place du responsable. Un accord de phase ne vaut ni
accord de publication ni exécution automatique d'un agent.
