---
project: avereo-app-passeport-immo
document_type: source-audit
title: Audit du lot documentaire
status: active
version: git
created: 2026-10-14
updated: 2026-10-14
owner: jpdandin
tags: [passeport-immo, documents, local]
---

# Audit du lot documentaire

## Écart autorisé e

La demande du 14 octobre 2026 autorise la gestion des documents d’un client liés
à son bien et le cas réel local. Elle complète la reprise du prototype et le
correctif PDF d. L’audit et la matrice initiaux approuvés restent inchangés ;
le présent complément documente l’écart e sans invalider leurs empreintes.

`frontend/src/App.jsx` remplace la carte des pièces jointes par `DocumentsPanel`.
Les calculs et les autres parcours sont conservés. `tests/check-parity.mjs`
inverse a/b/c/d/e puis compare toujours le reste avec le prototype historique.

`document-store.js` conserve clients, associations et métadonnées séparément
des fichiers dans IndexedDB. Le client est obligatoire avant l’import. Les
empreintes SHA-256 dédoublonnent le contenu par bien. Les écritures du lot sont
atomiques et les erreurs de quota restent visibles. Consultation et modification
exigent un identifiant de document appartenant au bien. Ce contrôle local ne
constitue pas une authentification ou des droits serveur.

Les originaux client, copies de fichiers, reçus de rotation, aperçus et captures
restent hors Git. Les fichiers clients ne sont ni inclus dans le build ni envoyés à un
service externe. PDF.js est chargé à l’ouverture du lecteur ; son worker est
servi depuis les assets de l’application. Le rendu n’exécute pas les scripts PDF
et n’utilise pas le plugin PDF natif du navigateur. Deux PDF ont été tournés à 180°, sans modifier leurs flux de
contenu ; le diagnostic est ordonné selon sa pagination imprimée. Les 33 pages
ont été inspectées visuellement. Aucun champ de signature électronique rempli
n’était présent dans les PDF corrigés ; les images de signatures sont conservées.

## Sources ExamIn

Le corpus initial comporte 44 fichiers hors ZIP, dont les devis documentaires,
stratégies, bilans et tableurs de recette. SRC-38 fournit 14 fonctionnalités pour
la matrice actuelle. SRC-40 et SRC-43 donnent le contexte des use cases. Les
statuts de 2025 restent historiques : ils ne sont pas repris comme validations
du nouveau prototype. Le JSON de progression et sa projection Markdown sont
contrôlés ensemble. Les scans non textuels ne sont pas automatiquement OCRisés.

## Vérifications

26 tests frontend réussis, dont 10 tests de stockage documentaire et 2 parcours
d’interface ; build Vite réussi. La parité a/b/c/d/e est vérifiée. L’avertissement
de taille du bundle préexistait au lot. La recette réelle confirme six documents actifs, des copies précédentes archivées,
la conservation après rechargement, le classement, l’import et la consultation
des scans. Les références du bien ont été corrigées après lecture en grand format
et confirmation du responsable ; il n’y avait pas de divergence d’adresse établie.
Aucune approbation de phase n’est créée par cette recette.

Onze tests Python vérifient préparation, protection des vues approuvées et ordre
du packaging. Une première comparaison CI/local a montré les mêmes sept assets
mais un ordre différent des deux noms d’assets index, lié au tri des chemins sur
Windows et Linux. Le tri par nom relatif corrige cet écart ; archive et manifeste
sont ensuite identiques aux fichiers construits par la CI du candidat.

Deux projets de coupe locaux sont chargés et sauvegardés dans Coupe. Les SVG
exportés constituent la source du PDF comparatif de deux pages ajouté au bien.
Les deux pages sont inspectées et consultées dans Passeport Immo ; la copie
téléchargée est identique au PDF source. Les dimensions manquantes et la hauteur
après travaux hypothétique sont explicites dans les dessins et dans le
[guide des coupes](coupes-bien.md). Le code de Coupe reste inchangé.

Le complément thermique renseigne les zones et interfaces des éléments natifs,
utilise les commandes de couleurs chauffé/non chauffé, puis réexporte les SVG.
Les renseignements du responsable complètent la source historique du DPE ; les
incertitudes et les arrondis du tableau de repérage restent explicites.
Les deux pages du PDF enrichi sont inspectées et consultées ; les versions
antérieures restent archivées. Les fichiers de ce cas et les captures sont privés.
