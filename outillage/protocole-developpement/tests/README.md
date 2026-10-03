---
project: protocole-developpement
document_type: test-index
title: Contrôles du protocole
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [developpement, github, cockpit]
---

# Contrôles

`python -m unittest discover -s tests` vérifie les refus de passage, la version des preuves, la séparation des environnements, l'autorisation exacte, les sauvegardes et les suites d'itération sur des fixtures.

Le validateur Codex vérifie séparément la structure du skill. La compatibilité avec le cockpit est contrôlée par lecture du suivi via le moteur existant et une décision fictive en dossier temporaire ; aucune approbation réelle n'est créée.
