---
project: avereo-app-passeport-immo
document_type: workflow
title: Génération du plan CIL
status: active
version: git
created: 2026-10-16
updated: 2026-10-16
owner: jpdandin
tags: [cil, documents, word, generation]
---

# Génération du plan CIL

## Source et sortie

Le [plan Markdown](../docs/plan-action-cil.md) est la source documentaire.
[generer-plan-cil.py](generer-plan-cil.py) produit le
[Word de restitution](../docs/livrables/plan-action-cil.docx), sans seconde rédaction.
Le comparatif institutionnel reste référencé dans le plan ; les documents client
et secrets ne sont pas des entrées de cette génération.

## Dépendances et exécution

Python avec `python-docx` est nécessaire pour générer le Word. Ces dépendances
documentaires sont distinctes du runtime applicatif. Aucun secret n’est requis.
Depuis la racine de l’application :

```text
python workflows/generer-plan-cil.py
```

Les options `--source` et `--output` permettent des emplacements explicites.
Le script reprend paragraphes, titres, tableaux, liens et sauts de page. Il
contrôle la présence du texte source dans le document et consigne son SHA-256
dans les propriétés du Word. Les dates correspondent au plan du 16 octobre 2026.

## Vérification avant diffusion

Après toute modification, régénérer puis rendre le Word en pages et examiner
chaque page : tableaux, retours à la ligne, titres, pagination et liens.
Un contrôle de contenu ne remplace pas cette vérification visuelle. Contrôler
également les titres et en-têtes de tableau pour l’accessibilité.

Le 16 octobre, le rendu documentaire habituel était indisponible faute de
LibreOffice. L’export PDF par Microsoft Word installé sur ce PC, puis le rendu
des pages par Poppler, ont permis de contrôler les dix pages. Le PDF et les PNG
restent des intermédiaires privés sous `.local/plan-cil/`. L’audit d’accessibilité
ne signale aucun problème dans le périmètre contrôlé. Le livrable demandé est le
Word ; ni le PDF de contrôle ni les images ne constituent une seconde référence.

Une correction durable se fait d’abord dans le Markdown ou le générateur,
puis nécessite une nouvelle génération et une nouvelle inspection des pages.
