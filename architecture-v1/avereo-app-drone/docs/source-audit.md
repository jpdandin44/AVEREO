---
project: avereo-app-drone
document_type: reference
title: source-audit
status: active
version: git
created: 2026-11-06
updated: 2026-11-08
owner: jpdandin
tags: [avereo, interface, fonctions-communes]
---

# Audit source - Drone AVEREO Pro

## Source

- Fichier attendu : Missions_AVEREO_Pro.txt
- Statut : trouve dans le zip technique fourni

## Integration V1

La syntaxe TypeScript est conservee dans frontend/src/App.tsx; Vite React TypeScript utilise frontend/src/main.tsx.
Les classes utilitaires presentes dans la source sont compilees localement avec
Tailwind CSS et PostCSS. Le build reste autonome et ne charge aucune feuille de
styles depuis un CDN.

## Dependances detectees ou prevues

- Runtime : lucide-react, react, react-dom
- Dev : @types/react, @types/react-dom, @vitejs/plugin-react, autoprefixer,
  postcss, tailwindcss, typescript, vite

## APIs navigateur visibles

- localStorage
- window
- document

## Points a verifier manuellement

- Verifier les caracteres accentues si la source historique etait encodee differemment.
- Verifier le rendu responsive apres npm run dev.
- Verifier les exports PDF, imports fichiers et stockages locaux si l'application les utilise.

## Refactorisations reportees

Notes V1.1 : auditer les types metier et extraire les composants si la surface fonctionnelle evolue.

## Validation

- npm install : tente, echec car npm n'est pas reconnu comme commande PowerShell.
- npm run build : non executable tant que npm est absent du PATH.
- Correction minimale : installer Node.js 20 LTS ou ajouter Node/npm au PATH, puis relancer cd frontend, npm install, npm run build.

## 6 novembre 2026 — Menu de compte commun

Le menu est dans l’accueil des missions et au pied de la barre latérale de l’éditeur, avec un mode compact lorsque celle-ci est repliée. Les missions restent dans le stockage navigateur existant.

Le périmètre transverse est demandé explicitement par le responsable. [Contrat commun](../../avereo-platform/docs/fonctionnalites-communes.md) et [preuve du lot](../../avereo-platform/docs/qualification-mon-espace.md). Aucune migration, modification de secret ou de droit ; tests sur données fictives.

## 6 novembre 2026 — Extension de PR #121

Mes projets revient aux missions locales et enregistre la mission en cours avant navigation. Les préférences règlent le tri et la visibilité des archives. Le stockage `avereo_missions` conserve son format ; aucune synchronisation en ligne n’est ajoutée.

Les contrôles actualisés sont dans la [qualification transversale](../../avereo-platform/docs/qualification-mon-espace.md). Les preuves précédentes restent attachées à leur candidat.

La lecture ne réécrit pas la liste initiale. Une liste illisible ou un quota dépassé maintient l’éditeur ouvert, sans faux succès. Trois tests fictifs couvrent ces protections.

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

Une mission enregistrée est accessible depuis la liste et possède une action Ordre de mission. Les cinq types ont produit une page PDF chacun sur fixture. Les coordonnées supplémentaires sont facultatives dans les anciennes missions. [Recette commune](../../avereo-platform/docs/preparation-missions.md).

## 2026-11-08 — Modèle commun

Le bandeau réutilise la sauvegarde locale de la mission en cours. [Modèle partagé](../../avereo-platform/docs/modele-affichage.md).
