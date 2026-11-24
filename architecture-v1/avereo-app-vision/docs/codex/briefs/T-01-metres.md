# Brief Codex T-01 — logique pure des métrés

Lot : 1 — Branche : vision/lot-1-fondations-plan2d-metres — Rédigé par Claude Code le 24/11/2026

## Contexte
Lis `architecture-v1/avereo-app-vision/AGENTS.md` (règles permanentes), puis uniquement les fichiers listés ci-dessous.
Les métrés (surfaces, murs, volume, ouvertures) sont le cœur de l'application : ce sont de la **logique pure**, séparée de l'interface, testée sur des valeurs de référence chiffrées. Tout le code est en JavaScript (modules ES) avec types JSDoc, tests avec le lanceur natif `node --test` (aucune dépendance de test).

## Ce que tu fais
Crée `frontend/src/domain/metres.js` et `frontend/tests/metres.test.mjs`.

Modèle d'entrée (déjà écrit, à ne pas modifier) : voir `frontend/src/domain/modele.js` et `frontend/src/domain/geometrie.js`. Une pièce a `hauteurMm`, `sommets` (contour en millimètres) et `ouvertures`. Le mur `i` va du sommet `i` au sommet suivant. Une ouverture a `murIndex`, `positionMm` (du début du mur au bord de l'ouverture), `largeurMm`, `hauteurMm`, `alleMm` (hauteur du bas de l'ouverture), `type` (`"porte"` ou `"fenetre"`).

### API à exporter de `metres.js`
```js
/** @returns {Metres} */
export function calculerMetres(piece)
/** Somme des pièces d'un niveau (valeurs numériques additionnées, erreurs concaténées). */
export function calculerMetresNiveau(niveau)
```
`Metres` :
```js
{
  valide: boolean,            // false si le contour est dégénéré ou auto-sécant : alors toutes les valeurs numériques sont null
  solM2, perimetreM, hauteurM, plafondM2, mursBrutsM2, volumeM3,   // m, m², m³ (nombres flottants, PAS arrondis)
  ouverturesM2, mursNetsM2, plinthesM,
  murs: [{ index, longueurM, brutM2, ouverturesM2, netM2 }],
  erreurs: [{ code, message, murIndex?, ouvertureId? }]
}
```
Définitions :
- sol = aire du contour (`aireMm2`) ; plafond = sol ; périmètre = somme des murs ; murs bruts = périmètre × hauteur ; volume = sol × hauteur (volume intérieur de la pièce, pas la matière des murs).
- ouvertures = somme de `largeurMm × hauteurMm` ; murs nets = murs bruts − ouvertures ; par mur : brut = longueur × hauteur.
- plinthes = périmètre − somme des largeurs des **portes** (les fenêtres ne comptent pas).
- Convertis les mm en m (÷ 1000) et les mm² en m² (÷ 1 000 000) ; mm³ en m³ si besoin. **N'arrondis jamais** dans `calculerMetres` : l'arrondi d'affichage est ailleurs (`unites.js`, déjà écrit).

Erreurs (codes exacts, ceux de `frontend/src/domain/alertes.js`) :
- `POLYGONE_DEGENERE` : moins de 3 sommets ou aire nulle → `valide: false`, valeurs numériques `null`.
- `POLYGONE_AUTO_SECANT` (via `estAutoSecant`) → `valide: false`, valeurs `null`.
- `OUVERTURE_HORS_MUR` : `positionMm < 0` ou `positionMm + largeurMm > longueur du mur` ou `murIndex` inexistant (avec `murIndex` et `ouvertureId`).
- `OUVERTURE_TROP_HAUTE` : `alleMm + hauteurMm > hauteurMm de la pièce`.
- `OUVERTURE_CHEVAUCHEMENT` : deux ouvertures du même mur dont les intervalles `[position, position + largeur]` se recouvrent strictement (se toucher bord à bord n'est pas un chevauchement).
- `OUVERTURES_SUPERIEURES_MUR` : pour un mur, surface des ouvertures > surface brute du mur.
Pour les erreurs d'ouverture, `valide` reste `true` et les valeurs sont calculées telles quelles (l'interface affiche l'alerte) ; seule une ouverture dont `murIndex` n'existe pas est ignorée du calcul par mur mais comptée dans le total.

### Valeurs de référence chiffrées (tests obligatoires, tolérance 1e-9 sur les flottants)
- **REF-1** : rectangle 4,00 × 3,00 m (sommets (0;0), (4000;0), (4000;3000), (0;3000)), hauteur 2,50 m → sol 12,00 m² ; périmètre 14,00 m ; murs bruts 35,00 m² ; plafond 12,00 m² ; volume 30,00 m³ ; ouvertures 0 ; murs nets 35,00 m² ; plinthes 14,00 m ; murs de longueurs 4, 3, 4, 3 m.
- **REF-2** : REF-1 + porte (mur 0, position 500, largeur 900, hauteur 2040, allège 0) + fenêtre (mur 1, position 900, largeur 1200, hauteur 1000, allège 900) → ouvertures 1,836 + 1,20 = 3,036 m² ; murs nets 31,964 m² ; plinthes 13,10 m ; aucune erreur.
- **REF-3** : pièce en L, sommets (0;0), (5000;0), (5000;2000), (3000;2000), (3000;4000), (0;4000), hauteur 2,50 m → sol 16,00 m² ; périmètre 18,00 m ; murs bruts 45,00 m² ; volume 40,00 m³.
- Contour dans le sens horaire (sommets inversés) : mêmes résultats que REF-3.
- Cas limites : pièce sans ouverture (REF-1) ; ouverture plus grande que le mur (`OUVERTURE_HORS_MUR` et `OUVERTURES_SUPERIEURES_MUR`) ; fenêtre dépassant le plafond (`OUVERTURE_TROP_HAUTE`) ; deux portes qui se chevauchent ; deux portes bord à bord (pas d'erreur) ; polygone auto-sécant « en papillon » (0;0), (4000;3000), (4000;0), (0;3000) → `valide: false` ; moins de 3 sommets ; aire nulle (trois sommets alignés).
- Niveau : deux pièces REF-1 et REF-3 → sol 28,00 m², volume 70,00 m³, murs bruts 80,00 m² ; un niveau vide → valeurs à 0 et `valide: true`.

## Périmètre
- Fichiers à créer : `architecture-v1/avereo-app-vision/frontend/src/domain/metres.js`, `architecture-v1/avereo-app-vision/frontend/tests/metres.test.mjs`.
- Fichiers à lire : `frontend/src/domain/modele.js`, `frontend/src/domain/geometrie.js`, `frontend/src/domain/alertes.js`, `frontend/src/domain/unites.js`, `frontend/package.json`.
- Tu ne touches à aucun autre fichier, et jamais à `data/suivi-vision.json` ni à `docs/plan-lots.md`.
- Aucune nouvelle dépendance. Si une dépendance te semble indispensable, arrête-toi et explique pourquoi.
- Importe `aireMm2`, `perimetreMm`, `longueurMurMm`, `estAutoSecant` depuis `./geometrie.js` ; n'en redéfinis pas.

## Terminé quand
- `npm test` dans `architecture-v1/avereo-app-vision/frontend` passe (tous les fichiers de test, pas seulement le tien) ; les cas REF-1, REF-2, REF-3 et les cas limites ci-dessus sont couverts par des tests nommés.
- Aucun arrondi dans `calculerMetres` (un test le prouve, par exemple une aire 11,995 m² reste 11,995).
- Tu as relu ton diff.

## Ce que tu rends
- Liste des fichiers créés ou modifiés.
- Commandes lancées et leur résultat.
- « À VÉRIFIER » éventuels et questions.
Tu ne commites pas, tu ne pousses pas, tu ne merges pas : Claude Code vérifie puis commite.
