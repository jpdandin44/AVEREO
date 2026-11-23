---
project: avereo-app-saisie-unique
document_type: roadmap
title: Suivi de Saisie unique
status: active
version: git
created: 2026-11-06
updated: 2026-11-23
owner: jpdandin
tags: [avereo, saisie-unique, documentation]
---

# Suivi de Saisie unique

Le développement local de la PR #113 est présent. Les statuts et événements humains restent dans [le suivi existant](docs/suivi-chantier.json) ; leur décalage avec le versement du code est documenté dans [le livrable local](docs/01-developpement-local.md).

Le lot transversal du 6 novembre ajoute Mon espace, sans modifier ces événements ni engager un backend. [Fiche canonique du seul lot de menu](../avereo-platform/data/suivi-fonctions-communes.json).

## État au 23 novembre 2026

- La PR #179 (pilotage des dossiers, formulaires de démonstration, entrée CONNECT et candidat PHP protégé) est fusionnée depuis le 22 novembre. Le candidat reste local : [candidat de démonstration](docs/demo-2026-11-23.md).
- La préproduction n'est ni installée ni recettée. Le [plan d'installation](docs/plan-installation-preproduction.md) est un brouillon : sous-domaine, secret UNI, accès à la cible et accord d'installation restent à fournir par le responsable.
- Le suivi `docs/suivi-chantier.json` n'a pas changé depuis le 6 novembre (phase 0 en cours, aucun événement de revue, questions Q01 à Q33 ouvertes). Seul le responsable l'actualise, par AVEREO Projet.
- Ouvert : test de téléchargement puis réimport en local, rendu des Word, test Edge, absence de `package-lock.json`, persistance serveur non intégrée.
