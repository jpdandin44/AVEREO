# Audit source - Drone AVEREO Pro

## Source

- Fichier attendu : Missions_AVEREO_Pro.txt
- Statut : trouve dans le zip technique fourni

## Integration V1

La syntaxe TypeScript est conservee dans frontend/src/App.tsx; Vite React TypeScript utilise frontend/src/main.tsx.

## Dependances detectees ou prevues

- Runtime : lucide-react, react, react-dom
- Dev : @types/react, @types/react-dom, @vitejs/plugin-react, typescript, vite

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
