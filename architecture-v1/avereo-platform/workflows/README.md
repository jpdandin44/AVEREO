---
project: avereo-platform
document_type: directory-index
title: workflows
status: active
version: git
created: 2026-11-04
updated: 2026-11-07
owner: jpdandin
tags: [avereo, acces, documentation]
---

# workflows

Répertoire documentaire réservé. Aucun contenu workflows supplémentaire n’est introduit par le lot des accès temporaires. Les sources existantes sont décrites dans le [README](../README.md).

## Préparer les quatre modèles privés

Avec Node 22 et Python 3.12.14 utilisant zlib 1.3.2, exécuter `python preparer-lettres-mission.py --sources DOSSIER_DES_ORIGINAUX --sortie NOUVEAU_DOSSIER`. Le catalogue vérifie les originaux puis les copies préparées. Ce couple Python/zlib reproduit les empreintes du pack. Une autre compression peut produire un Word lisible avec une empreinte différente. Le pack qualifié présente les quatre modèles et son manifeste. [Parcours de génération](../docs/protocole-missions.md).
