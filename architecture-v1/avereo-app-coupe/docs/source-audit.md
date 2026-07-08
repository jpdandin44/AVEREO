# Audit source - Coupe AVEREO Reno Pro

## Source

- Fichier attendu : Coupe_AVEREO_Reno_Pro.txt
- Statut : trouve dans le zip technique fourni

## Integration V1

Le HTML source est place dans frontend/public/legacy-app.html; frontend/src/App.jsx fournit un wrapper React iframe.

## Dependances detectees ou prevues

- Runtime : react, react-dom
- Dev : @vitejs/plugin-react, vite

## APIs navigateur visibles

- FileReader
- Blob
- URL.createObjectURL
- canvas
- window
- document

## Points a verifier manuellement

- Verifier les caracteres accentues si la source historique etait encodee differemment.
- Verifier le rendu responsive apres npm run dev.
- Verifier les exports PDF, imports fichiers et stockages locaux si l'application les utilise.

## Refactorisations reportees

Notes V1.1 : fabric et pdfjs-dist devront etre integres proprement via npm.

## Validation

- npm install : tente, echec car npm n'est pas reconnu comme commande PowerShell.
- npm run build : non executable tant que npm est absent du PATH.
- Correction minimale : installer Node.js 20 LTS ou ajouter Node/npm au PATH, puis relancer cd frontend, npm install, npm run build.
