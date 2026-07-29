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

- `npm ci` et `npm run build` sont reproductibles avec Node.js 20.19 ou plus.
- Le lot du 29 juillet 2026 ajoute un sas serveur CONNECT devant `index.html` et
  `legacy-app.html`.
- Un ticket HMAC court, lié à Coupe et à usage unique, établit un cookie
  `Secure`, `HttpOnly` et `SameSite=Lax`.
- Les accès directs sont redirigés vers CONNECT ; les endpoints OAuth et métier
  refusent aussi les requêtes sans cookie de sas. Seul le healthcheck reste
  public.
- L'API Coupe conserve ensuite son client OAuth Drupal confidentiel, son secret
  distinct et ses contrôles de rôles.
- Le sas reste à qualifier intégralement en préproduction avant tout
  déclenchement manuel du workflow de production.
