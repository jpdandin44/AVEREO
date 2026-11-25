# Brief Codex T-07 — icônes provisoires de l'application installable (R09, décision D12)

Lot : 2C — Branche : vision/lot-2c-pwa — Rédigé par Claude Code le 25/11/2026

## Contexte
Lis `architecture-v1/avereo-app-vision/AGENTS.md` (charte, logo), puis uniquement les fichiers listés ci-dessous.
L'application devient installable (PWA). Il faut des icônes carrées ; la charte interdit de redessiner le logo ou d'en extraire le symbole, et aucun fichier carré n'est fourni. Décision du responsable (D12) : **icône provisoire** = aplat bleu nuit `#002B45` et lettre « V » **géométrique** blanche `#FFFFFF` (deux traits épais formant un V, tracés comme polygones, **pas une police, pas le logo**), signalée « À VÉRIFIER : fichier logo carré ». Elle sera remplacée par un vrai fichier plus tard.

## Ce que tu fais
### `frontend/scripts/icones-provisoires.mjs` (ES module, Node seul, **aucune dépendance** : `node:zlib`, `node:fs`, `node:path`, `node:url`)
Fonctions exportées :
```js
/** Image RGBA (Uint8Array, largeur × hauteur × 4) : fond #002B45 opaque, V blanc anticrénelé (suréchantillonnage 4 × 4).
 *  `zoneUtile` : fraction du côté dans laquelle le V est inscrit, centré (0,6 pour une icône normale, 0,5 pour l'icône « maskable »). */
export function dessinerIcone(taille, { zoneUtile = 0.6 } = {})
/** Encode une image RGBA 8 bits en PNG (signature, IHDR, un IDAT zlib, IEND, CRC32 calculé à la main ; filtre 0 par ligne). */
export function encoderPng(largeur, hauteur, rgba)
/** Liste des icônes à produire : [{fichier, taille, zoneUtile}] */
export const ICONES = [
  { fichier: "icone-192.png", taille: 192, zoneUtile: 0.6 },
  { fichier: "icone-512.png", taille: 512, zoneUtile: 0.6 },
  { fichier: "icone-maskable-512.png", taille: 512, zoneUtile: 0.5 },
  { fichier: "apple-touch-icon-180.png", taille: 180, zoneUtile: 0.6 },
];
```
- Géométrie du V (dans un carré unité centré, puis mis à l'échelle de `zoneUtile × taille`) : deux bandes de largeur 0,22 (en unités de la zone) partant des coins supérieurs gauche et droit de la zone et se rejoignant en bas au centre ; un point est blanc s'il est dans l'une des deux bandes et à l'intérieur de la zone. Le résultat doit être **symétrique** gauche/droite et **déterministe** (mêmes octets à chaque exécution).
- Exécuté directement (`node scripts/icones-provisoires.mjs`), le script écrit les quatre PNG dans `frontend/public/icons/` (dossier créé si besoin) et affiche leurs noms et tailles.
- Exécute-le une fois pour produire les quatre fichiers (ils seront commités).

### Tests `frontend/tests/icones.test.mjs` (`node:test`, `node:assert/strict`, comme les autres tests)
Écris un petit décodeur de test (lecture des blocs, `inflateSync` de l'IDAT, filtre 0) pour vérifier :
- signature PNG, `IHDR` (largeur, hauteur, profondeur 8, type couleur 6) et CRC de chaque bloc ;
- pixel du coin = `#002B45` opaque ; pixel du bas du V (centre horizontal, à `0,5 + zoneUtile/2 - 0,05` de la hauteur) = blanc ; centre exact de l'icône = fond (le creux du V) ;
- symétrie gauche/droite de chaque ligne ;
- icône « maskable » : aucun pixel non-fond hors du cercle centré de rayon 40 % du côté (zone sûre) ;
- déterminisme : deux appels donnent les mêmes octets ; **les quatre fichiers de `public/icons/` sont identiques** à ce que produit le script (sinon le test dit de relancer le script).

## Périmètre
- Fichiers à créer : `frontend/scripts/icones-provisoires.mjs`, `frontend/tests/icones.test.mjs`, `frontend/public/icons/{icone-192,icone-512,icone-maskable-512,apple-touch-icon-180}.png`.
- Fichiers à lire : `AGENTS.md`, `frontend/tests/charte.test.mjs` (aucun code couleur hors de `src/styles/tokens.css` **dans `src/`** : ton script est hors de `src/`, c'est permis), `frontend/package.json`.
- Tu ne touches à aucun autre fichier (ni `vite.config.js`, ni `src/`, ni `package.json`, ni `docs/`), et jamais à `data/suivi-vision.json` ni à `docs/plan-lots.md`. Aucune dépendance.

## Terminé quand
- `npm test` dans `frontend/` passe en entier ; les quatre PNG existent et correspondent au script ; tu as relu ton diff.

## Ce que tu rends
- Fichiers créés ; commandes lancées et résultats ; « À VÉRIFIER » éventuels.
Tu ne commites pas, tu ne pousses pas, tu ne merges pas : Claude Code vérifie puis commite.
