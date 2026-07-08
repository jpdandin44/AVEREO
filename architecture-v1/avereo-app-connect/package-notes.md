# Notes packages - AVEREO CONNECT

## Dependances runtime prevues

react, react-dom, zustand

## Dependances dev prevues

@vitejs/plugin-react, vite

## Dependances reportees

Notes V1.1 : jspdf, html2canvas et papaparse devront etre remplaces par des imports npm si actuellement charges dynamiquement.

## CDN temporaires V1

Les CDN presents dans le code source sont acceptes temporairement si le comportement source en depend. Ils devront etre remplaces par des imports npm controles en V1.1 quand c'est pertinent.

## Migrations npm V1.1

Les bibliotheques chargees dynamiquement ou par CDN seront auditees, versionnees et integrees via package.json avant durcissement de la V1.1.
