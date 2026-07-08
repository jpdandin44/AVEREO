# Audit source - AVEREO CONNECT

## Source

- Fichier attendu : AVEREO CONNECT.txt
- Statut : trouve dans le zip technique fourni

## Integration V1

Le contenu source est copie dans frontend/src/App.jsx pour conserver le comportement au plus proche.

## Dependances detectees ou prevues

- Runtime : react, react-dom, zustand
- Dev : @vitejs/plugin-react, vite

## APIs navigateur visibles

- localStorage
- FileReader
- canvas
- navigator
- window
- document

## Points a verifier manuellement

- Verifier les caracteres accentues si la source historique etait encodee differemment.
- Verifier le rendu responsive apres npm run dev.
- Verifier les exports PDF, imports fichiers et stockages locaux si l'application les utilise.

## Refactorisations reportees

Notes V1.1 : jspdf, html2canvas et papaparse devront etre remplaces par des imports npm si actuellement charges dynamiquement.

## Validation

- npm install : tente, echec car npm n'est pas reconnu comme commande PowerShell.
- npm run build : non executable tant que npm est absent du PATH.
- Correction minimale : installer Node.js 20 LTS ou ajouter Node/npm au PATH, puis relancer cd frontend, npm install, npm run build.
