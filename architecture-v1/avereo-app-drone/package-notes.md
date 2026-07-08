# Notes packages - Drone AVEREO Pro

## Dependances runtime prevues

lucide-react, react, react-dom

## Dependances dev prevues

@types/react, @types/react-dom, @vitejs/plugin-react, typescript, vite

## Dependances reportees

Notes V1.1 : auditer les types metier et extraire les composants si la surface fonctionnelle evolue.

## CDN temporaires V1

Les CDN presents dans le code source sont acceptes temporairement si le comportement source en depend. Ils devront etre remplaces par des imports npm controles en V1.1 quand c'est pertinent.

## Migrations npm V1.1

Les bibliotheques chargees dynamiquement ou par CDN seront auditees, versionnees et integrees via package.json avant durcissement de la V1.1.
