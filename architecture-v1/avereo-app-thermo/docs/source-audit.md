---
project: avereo-app-thermo
document_type: reference
title: source-audit
status: active
version: git
created: 2026-11-06
updated: 2026-11-08
owner: jpdandin
tags: [avereo, interface, fonctions-communes]
---

# Audit source - Thermo AVEREO Pro

## Source

- Fichier attendu : Thermo_AVEREO_Pro.txt
- Statut : trouve dans le zip technique fourni

## Integration V1

Le contenu source est copie dans frontend/src/App.jsx pour conserver le comportement au plus proche.
Les classes utilitaires presentes dans la source sont compilees localement avec
Tailwind CSS et PostCSS. Le build reste autonome et ne charge aucune feuille de
styles depuis un CDN.

## Dependances detectees ou prevues

- Runtime : chart.js, file-saver, idb-keyval, lucide-react, react, react-dom
- Dev : @vitejs/plugin-react, autoprefixer, postcss, tailwindcss, vite

## APIs navigateur visibles

- localStorage
- idb
- FileReader
- Blob
- canvas
- navigator
- window
- document
- crypto

## Points a verifier manuellement

- Verifier les caracteres accentues si la source historique etait encodee differemment.
- Verifier le rendu responsive apres npm run dev.
- Verifier les exports PDF, imports fichiers et stockages locaux si l'application les utilise.

## Refactorisations reportees

Notes V1.1 : consolider les exports fichiers, graphiques et stockage local autour de dependances npm versionnees.

## Validation

- npm install : tente, echec car npm n'est pas reconnu comme commande PowerShell.
- npm run build : non executable tant que npm est absent du PATH.
- Correction minimale : installer Node.js 20 LTS ou ajouter Node/npm au PATH, puis relancer cd frontend, npm install, npm run build.

## 6 novembre 2026 — Menu de compte commun

Le menu est dans l’en-tête du parcours de rapport et au pied de la barre latérale du référentiel. Le bouton de déconnexion flottant est retiré ; le brouillon conserve son stockage existant.

Le périmètre transverse est demandé explicitement par le responsable. [Contrat commun](../../avereo-platform/docs/fonctionnalites-communes.md) et [preuve du lot](../../avereo-platform/docs/qualification-mon-espace.md). Aucune migration, modification de secret ou de droit ; tests sur données fictives.

## 6 novembre 2026 — Extension de PR #121

Mes projets conserve plusieurs rapports dans IndexedDB, en plus du brouillon historique. La sauvegarde et le retour à la liste préservent les données complètes ; un échec garde le rapport ouvert. Les préférences règlent le tri et le nom des étapes. Ces données sont locales au navigateur, sans synchronisation en ligne.

Les contrôles actualisés sont dans la [qualification transversale](../../avereo-platform/docs/qualification-mon-espace.md). Les preuves précédentes restent attachées à leur candidat.

## 2026-11-06 — Identité du livrable

Raccordement au nom et au logo officiels partagés, demandé transversalement par le
responsable. Les contenus, protocoles, calculs, dossiers et accès restent inchangés.
[Contrat et preuves locales](../../avereo-platform/docs/identite-livrables.md).

## 2026-11-07 — Bloc d’entreprise provisoire

Le responsable fournit les informations de société en formation. L’export ajoute
les lignes non vides du profil commun sous le logo ; données métier et stockage
inchangés. Les champs futurs sont préparés sans formulaire d’administration.
[Preuves actuelles et réserves](../../avereo-platform/docs/identite-livrables.md).

## 7 novembre 2026 — Module Missions en recette locale

Le rapport reprend les coordonnées du dossier en couverture. Le sommaire est lisible dès l’ouverture dans Word et la signature texte est échappée. Les signatures graphiques prises en charge restent des images. [Recette commune](../../avereo-platform/docs/preparation-missions.md).

## 2026-11-08 — Modèle commun

Le rapport ouvert garde sa sauvegarde dans ce navigateur. [Modèle partagé](../../avereo-platform/docs/modele-affichage.md).
