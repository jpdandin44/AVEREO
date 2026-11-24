# Brief Codex T-02 — état de précision par mode et banc d'essai d'écart (R29, R30)

Lot : 1 — Branche : vision/lot-1-fondations-plan2d-metres — Rédigé par Claude Code le 24/11/2026

## Contexte
Lis `architecture-v1/avereo-app-vision/AGENTS.md` (règles permanentes, section « Précision »), puis uniquement les fichiers listés ci-dessous.
L'application s'engage sur une tolérance de ±2 cm (20 mm) entre les longueurs calculées et les cotes d'une pièce de référence relevée au mètre laser. Tout mode de capture qui ne peut pas tenir cette tolérance est signalé comme tel. Ce brief demande : (1) l'état de précision affiché pour chaque mode de capture ; (2) un banc d'essai qui compare les longueurs de l'application aux cotes laser. Logique pure en JavaScript (modules ES, types JSDoc), tests avec `node --test`, aucune dépendance.

**Important :** la vraie pièce de référence n'est pas encore fournie. Le fichier `docs/essais/piece-reference.json` que tu crées est un **jeu provisoire** (marqué `"provisoire": true`) : tant qu'il est provisoire, le mode « cotes saisies » reste en « qualification en attente » et ne passe jamais en « tolérance tenue ».

## Ce que tu fais
Crée `frontend/src/domain/precision.js`, `frontend/tests/precision.test.mjs` et `docs/essais/piece-reference.json`.

### API de `precision.js`
```js
export const TOLERANCE_MM = 20;
export const MODES = { COTES_SAISIES: "cotes-saisies", VIDEO: "video", WEBXR: "webxr" };

/** Longueurs « affichées » d'une pièce, pour comparaison avec le laser. */
export function longueursAffichees(piece)
// → [{ nom: "mur 1", valeurMm, origine: "saisie" }, …, { nom: "hauteur", valeurMm: piece.hauteurMm, origine: "saisie" }]
//   + si la pièce a 4 sommets : { nom: "diagonale 1", origine: "calculee" } (sommet 0 → sommet 2) et "diagonale 2" (sommet 1 → sommet 3).
//   Longueur d'un mur : utilise longueurMurMm de ./geometrie.js (le mur i va du sommet i au sommet suivant). Valeurs arrondies au millimètre.

/** Compare des longueurs de l'application à des cotes laser. */
export function comparerAuReleveLaser(longueurs, laserMm, toleranceMm = TOLERANCE_MM)
// longueurs : sortie de longueursAffichees ; laserMm : objet { [nom]: valeurMm }.
// → { conforme: boolean, ecartMaxMm: number, lignes: [{ nom, origine, calculeMm, laserMm, ecartMm, conforme }],
//     sansReference: string[]  /* longueurs sans cote laser */, parOrigine: { saisie: {nb, nbHorsTolerance}, calculee: {nb, nbHorsTolerance} } }
// ecartMm = valeur absolue de (calculeMm − laserMm). Une ligne est conforme si ecartMm <= toleranceMm (20 mm inclus).
// conforme global = aucune ligne hors tolérance ET sansReference vide ET au moins une ligne comparée.

/** État de précision d'un mode de capture, pour l'interface. */
export function etatPrecision(mode, { resultatEssai } = {})
// → { mode, etat: "qualification_en_attente" | "tolerance_tenue" | "non_garantie", icone: "info" | "alerte", titre, libelle }
// - MODES.COTES_SAISIES : "tolerance_tenue" (icone "info") seulement si resultatEssai?.conforme === true ET resultatEssai?.provisoire !== true ; sinon "qualification_en_attente" (icone "alerte").
// - MODES.VIDEO et MODES.WEBXR : toujours "non_garantie" (icone "alerte") : « précision de ±2 cm non garantie ».
// - mode inconnu : lève une Error.
// titre et libelle sont toujours non vides, en français, avec la mention « ±2 cm » (R12 : jamais la couleur seule).

/** Charge une pièce de référence { piece, laserMm, provisoire } et rend le résultat de l'essai. */
export function evaluerPieceReference(reference, toleranceMm = TOLERANCE_MM)
// → { ...comparerAuReleveLaser(longueursAffichees(reference.piece), reference.laserMm, toleranceMm), provisoire: reference.provisoire === true }
```

### Fichier `docs/essais/piece-reference.json` (provisoire)
```json
{
  "provisoire": true,
  "avertissement": "À VÉRIFIER : jeu fictif de démonstration. La vraie pièce de référence et ses cotes au mètre laser restent à fournir par le responsable.",
  "piece": { "id": "reference", "nom": "Pièce de référence (provisoire)", "hauteurMm": 2500,
             "sommets": [{"x":0,"y":0},{"x":4000,"y":0},{"x":4000,"y":3000},{"x":0,"y":3000}], "ouvertures": [] },
  "laserMm": { "mur 1": 4005, "mur 2": 2996, "mur 3": 4002, "mur 4": 3003, "hauteur": 2498, "diagonale 1": 4999, "diagonale 2": 5003 }
}
```
(Les diagonales calculées valent exactement 5000 mm ; tous les écarts du fichier sont ≤ 5 mm.)

### Tests obligatoires (`tests/precision.test.mjs`)
- Cas limites de la tolérance, avec une cote calculée de 4000 mm et un laser à 4000 ± e : écart **19 mm accepté, 20 mm accepté, 21 mm refusé** (conforme false pour la ligne et pour le global).
- `longueursAffichees` d'un rectangle 4000 × 3000 de hauteur 2500 : 4 murs (4000, 3000, 4000, 3000), `hauteur` 2500, `diagonale 1` et `diagonale 2` = 5000 avec origine `"calculee"` ; une pièce à 6 sommets : pas de diagonales.
- Une longueur sans cote laser : `sansReference` la liste et `conforme` est false ; aucune ligne comparée : `conforme` false.
- Le rapport distingue les longueurs saisies des longueurs calculées (`parOrigine`).
- `etatPrecision` : cotes saisies sans essai → `qualification_en_attente` ; avec un essai conforme mais provisoire → `qualification_en_attente` ; avec un essai conforme et non provisoire → `tolerance_tenue` ; avec un essai non conforme → `qualification_en_attente` ; vidéo et WebXR → `non_garantie` ; icône et libellé non vides partout (et jamais une couleur dans le texte) ; mode inconnu → exception.
- Le fichier `docs/essais/piece-reference.json` est lu par le test (chemin relatif depuis `frontend/tests/`, via `node:fs` et `import.meta.url`) : `evaluerPieceReference` le déclare `provisoire: true`, avec `conforme: true` (écarts ≤ 5 mm), et `etatPrecision(MODES.COTES_SAISIES, { resultatEssai })` reste `qualification_en_attente`.

## Périmètre
- Fichiers à créer : `architecture-v1/avereo-app-vision/frontend/src/domain/precision.js`, `architecture-v1/avereo-app-vision/frontend/tests/precision.test.mjs`, `architecture-v1/avereo-app-vision/docs/essais/piece-reference.json`.
- Fichiers à lire : `frontend/src/domain/geometrie.js`, `frontend/src/domain/modele.js`, `frontend/src/domain/alertes.js`, `docs/exigences.md` (R29, R30), `frontend/package.json`.
- Tu ne touches à aucun autre fichier, et jamais à `data/suivi-vision.json` ni à `docs/plan-lots.md`.
- Aucune nouvelle dépendance. Si une dépendance te semble indispensable, arrête-toi et explique pourquoi.

## Terminé quand
- `npm test` dans `architecture-v1/avereo-app-vision/frontend` passe (tous les fichiers de test).
- Les cas 19, 20 et 21 mm sont couverts par des tests nommés ; le jeu provisoire ne qualifie jamais le mode « cotes saisies ».
- Tu as relu ton diff.

## Ce que tu rends
- Liste des fichiers créés ou modifiés.
- Commandes lancées et leur résultat.
- « À VÉRIFIER » éventuels et questions.
Tu ne commites pas, tu ne pousses pas, tu ne merges pas : Claude Code vérifie puis commite.
