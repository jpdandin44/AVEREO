// Géométrie plane en millimètres (plan cartésien, pas de coordonnées géographiques).
// Logique pure : aucune dépendance au DOM ni à React.

/** @typedef {{x: number, y: number}} Point */

/** @param {Point} a @param {Point} b @returns {number} */
export function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Aire signée par la formule de Gauss (positive si les sommets tournent dans le sens trigonométrique).
 * @param {Point[]} sommets
 * @returns {number} en mm²
 */
export function aireSigneeMm2(sommets) {
  let somme = 0;
  for (let i = 0; i < sommets.length; i += 1) {
    const a = sommets[i];
    const b = sommets[(i + 1) % sommets.length];
    somme += a.x * b.y - b.x * a.y;
  }
  return somme / 2;
}

/** @param {Point[]} sommets @returns {number} en mm² */
export function aireMm2(sommets) {
  return Math.abs(aireSigneeMm2(sommets));
}

/** @param {Point[]} sommets @returns {number} en mm */
export function perimetreMm(sommets) {
  let total = 0;
  for (let i = 0; i < sommets.length; i += 1) {
    total += distance(sommets[i], sommets[(i + 1) % sommets.length]);
  }
  return total;
}

/**
 * Longueur du mur i : du sommet i au sommet suivant.
 * @param {Point[]} sommets
 * @param {number} i
 * @returns {number} en mm
 */
export function longueurMurMm(sommets, i) {
  return distance(sommets[i], sommets[(i + 1) % sommets.length]);
}

function orientation(a, b, c) {
  const v = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  if (v > 0) return 1;
  if (v < 0) return -1;
  return 0;
}

function dansBoite(a, b, c) {
  return (
    Math.min(a.x, b.x) <= c.x &&
    c.x <= Math.max(a.x, b.x) &&
    Math.min(a.y, b.y) <= c.y &&
    c.y <= Math.max(a.y, b.y)
  );
}

/**
 * Deux segments [a,b] et [c,d] se touchent-ils (croisement, contact ou recouvrement) ?
 * @param {Point} a @param {Point} b @param {Point} c @param {Point} d
 */
export function segmentsSeTouchent(a, b, c, d) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && dansBoite(a, b, c)) return true;
  if (o2 === 0 && dansBoite(a, b, d)) return true;
  if (o3 === 0 && dansBoite(c, d, a)) return true;
  if (o4 === 0 && dansBoite(c, d, b)) return true;
  return false;
}

/**
 * Le contour se recoupe-t-il lui-même ? Seuls les murs non adjacents sont comparés
 * (deux murs adjacents partagent un sommet par construction).
 * @param {Point[]} sommets
 * @returns {boolean}
 */
export function estAutoSecant(sommets) {
  const n = sommets.length;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const adjacents = j === i + 1 || (i === 0 && j === n - 1);
      if (adjacents) continue;
      if (segmentsSeTouchent(sommets[i], sommets[(i + 1) % n], sommets[j], sommets[(j + 1) % n])) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Projection d'un point sur le segment [a,b].
 * @param {Point} p @param {Point} a @param {Point} b
 * @returns {{point: Point, t: number, distance: number}} t dans [0, 1] le long du segment
 */
export function projeterSurSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const longueurCarree = dx * dx + dy * dy;
  const brut = longueurCarree === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / longueurCarree;
  const t = Math.min(1, Math.max(0, brut));
  const point = { x: a.x + t * dx, y: a.y + t * dy };
  return { point, t, distance: distance(p, point) };
}
