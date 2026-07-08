# Audit source - Thermo AVEREO Pro

## Source

- Fichier attendu : Thermo_AVEREO_Pro.txt
- Statut : trouve dans le zip technique fourni

## Integration V1

Le contenu source est copie dans frontend/src/App.jsx pour conserver le comportement au plus proche.

## Dependances detectees ou prevues

- Runtime : chart.js, file-saver, idb-keyval, lucide-react, react, react-dom
- Dev : @vitejs/plugin-react, vite

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
