// Aimantation du plan (R32) : grille de 10 mm et alignement sur les sommets existants
// (donc angles droits entre murs voisins). Logique pure, testée.

export const PAS_GRILLE_MM = 10;

/**
 * @param {{x: number, y: number}} point en mm
 * @param {{sommets?: {x: number, y: number}[], ignorerIndex?: number, toleranceMm?: number, pasMm?: number}} [options]
 * @returns {{x: number, y: number, alignX: boolean, alignY: boolean}}
 *   alignX / alignY : le point a été aligné sur un sommet existant (x ou y identique)
 */
export function aimanter(point, { sommets = [], ignorerIndex = -1, toleranceMm = 100, pasMm = PAS_GRILLE_MM } = {}) {
  let x = Math.round(point.x / pasMm) * pasMm;
  let y = Math.round(point.y / pasMm) * pasMm;
  let alignX = false;
  let alignY = false;
  let meilleurEcartX = toleranceMm;
  let meilleurEcartY = toleranceMm;
  sommets.forEach((s, index) => {
    if (index === ignorerIndex) return;
    const ecartX = Math.abs(point.x - s.x);
    if (ecartX <= meilleurEcartX) {
      meilleurEcartX = ecartX;
      x = s.x;
      alignX = true;
    }
    const ecartY = Math.abs(point.y - s.y);
    if (ecartY <= meilleurEcartY) {
      meilleurEcartY = ecartY;
      y = s.y;
      alignY = true;
    }
  });
  return { x, y, alignX, alignY };
}
