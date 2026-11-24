// Modèle du relevé : bâtiment → niveaux → pièces → (murs déduits du contour) + ouvertures.
// Longueurs en millimètres entiers (R28). Objets immuables : chaque fonction renvoie un nouvel objet.
// Le mur i va du sommet i au sommet suivant. Logique pure : aucune dépendance au DOM ni à React.

import { distance, estAutoSecant, longueurMurMm } from "./geometrie.js";
import { formaterLongueurMm } from "./unites.js";

/**
 * @typedef {{x: number, y: number}} Point  // millimètres
 * @typedef {"porte"|"fenetre"} TypeOuverture
 * @typedef {{
 *   id: string, type: TypeOuverture, murIndex: number,
 *   positionMm: number, largeurMm: number, hauteurMm: number, alleMm: number
 * }} Ouverture  // positionMm : du début du mur au bord de l'ouverture ; alleMm : hauteur du bas de l'ouverture
 * @typedef {{id: string, nom: string, hauteurMm: number, sommets: Point[], ouvertures: Ouverture[]}} Piece
 * @typedef {{id: string, nom: string, pieces: Piece[]}} Niveau
 * @typedef {{id: string, nom: string, niveaux: Niveau[]}} Batiment
 * @typedef {{ok: true, piece: Piece} | {ok: false, message: string}} ResultatPiece
 */

export const HAUTEUR_PAR_DEFAUT_MM = 2500;
export const TYPES_OUVERTURE = /** @type {const} */ (["porte", "fenetre"]);

const DIMENSIONS_PAR_DEFAUT = {
  porte: { largeurMm: 900, hauteurMm: 2040, alleMm: 0 },
  fenetre: { largeurMm: 1200, hauteurMm: 1000, alleMm: 900 },
};

let compteur = 0;

/** Identifiant unique (UUID quand le navigateur le permet). @param {string} [prefixe] @returns {string} */
export function creerId(prefixe = "id") {
  compteur += 1;
  const alea =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefixe}-${alea}-${compteur}`;
}

/**
 * @param {{id?: string, nom?: string, hauteurMm?: number, sommets: Point[], ouvertures?: Ouverture[]}} donnees
 * @returns {Piece}
 */
export function creerPiece({ id = creerId("piece"), nom = "Pièce", hauteurMm = HAUTEUR_PAR_DEFAUT_MM, sommets, ouvertures = [] }) {
  return { id, nom, hauteurMm, sommets: sommets.map(({ x, y }) => ({ x, y })), ouvertures: ouvertures.map((o) => ({ ...o })) };
}

/**
 * Pièce rectangulaire : mur 0 = longueur (au sud), mur 1 = largeur (à l'est), mur 2 = longueur, mur 3 = largeur.
 * @param {{id?: string, nom?: string, longueurMm: number, largeurMm: number, hauteurMm?: number}} donnees
 * @returns {Piece}
 */
export function creerPieceRectangulaire({ id, nom, longueurMm, largeurMm, hauteurMm }) {
  return creerPiece({
    id,
    nom,
    hauteurMm,
    sommets: [
      { x: 0, y: 0 },
      { x: longueurMm, y: 0 },
      { x: longueurMm, y: largeurMm },
      { x: 0, y: largeurMm },
    ],
  });
}

/**
 * @param {{id?: string, type: TypeOuverture, murIndex: number, positionMm: number,
 *   largeurMm?: number, hauteurMm?: number, alleMm?: number}} donnees
 * @returns {Ouverture}
 */
export function creerOuverture({ id = creerId("ouv"), type, murIndex, positionMm, ...dimensions }) {
  const defauts = DIMENSIONS_PAR_DEFAUT[type];
  return {
    id,
    type,
    murIndex,
    positionMm,
    largeurMm: dimensions.largeurMm ?? defauts.largeurMm,
    hauteurMm: dimensions.hauteurMm ?? defauts.hauteurMm,
    alleMm: dimensions.alleMm ?? defauts.alleMm,
  };
}

/** @param {{id?: string, nom?: string, pieces?: Piece[]}} [donnees] @returns {Niveau} */
export function creerNiveau({ id = creerId("niveau"), nom = "Niveau", pieces = [] } = {}) {
  return { id, nom, pieces };
}

/** @param {{id?: string, nom?: string, niveaux?: Niveau[]}} [donnees] @returns {Batiment} */
export function creerBatiment({ id = creerId("bat"), nom = "Bâtiment", niveaux = [] } = {}) {
  return { id, nom, niveaux };
}

/** @param {Piece} piece @returns {number} */
export function nombreMurs(piece) {
  return piece.sommets.length;
}

/** @param {Piece} piece @param {number} i @returns {number} en mm */
export function longueurMur(piece, i) {
  return longueurMurMm(piece.sommets, i);
}

/** @param {Piece} piece @param {string} nom @returns {Piece} */
export function renommerPiece(piece, nom) {
  return { ...piece, nom };
}

/** @param {Piece} piece @param {number} hauteurMm @returns {Piece} */
export function definirHauteur(piece, hauteurMm) {
  return { ...piece, hauteurMm };
}

/**
 * Rectangle : change la longueur et la largeur en gardant l'angle du sommet 0.
 * @param {Piece} piece @param {number} longueurMm @param {number} largeurMm @returns {Piece}
 */
export function redimensionnerRectangle(piece, longueurMm, largeurMm) {
  if (piece.sommets.length !== 4) return piece;
  const [s0] = piece.sommets;
  return {
    ...piece,
    sommets: [
      s0,
      { x: s0.x + longueurMm, y: s0.y },
      { x: s0.x + longueurMm, y: s0.y + largeurMm },
      { x: s0.x, y: s0.y + largeurMm },
    ],
  };
}

/** @param {Piece} piece @returns {boolean} contour rectangulaire aligné sur les axes */
export function estRectangleAxes(piece) {
  if (piece.sommets.length !== 4) return false;
  const [a, b, c, d] = piece.sommets;
  return a.y === b.y && b.x === c.x && c.y === d.y && d.x === a.x && a.x !== b.x && a.y !== d.y;
}

/**
 * Déplace toute la pièce sans la déformer (les ouvertures suivent leurs murs).
 * @param {Piece} piece @param {number} dx @param {number} dy en mm @returns {Piece}
 */
export function translaterPiece(piece, dx, dy) {
  return { ...piece, sommets: piece.sommets.map((s) => ({ x: s.x + Math.round(dx), y: s.y + Math.round(dy) })) };
}

/**
 * Déplace un sommet. Les ouvertures restent attachées à leur mur ; si le mur raccourcit,
 * le calcul des métrés signale l'ouverture qui ne tient plus.
 * @param {Piece} piece @param {number} i @param {Point} point @returns {Piece}
 */
export function deplacerSommet(piece, i, point) {
  const sommets = piece.sommets.map((s, index) => (index === i ? { x: Math.round(point.x), y: Math.round(point.y) } : s));
  return { ...piece, sommets };
}

/**
 * Fixe la longueur du mur i en déplaçant son extrémité (sommet suivant) le long du mur.
 * Les coordonnées sont arrondies au millimètre : sur un mur biais, la longueur obtenue peut s'écarter
 * de la longueur demandée de moins d'un millimètre (largement dans la tolérance de ±2 cm).
 * @param {Piece} piece @param {number} i @param {number} longueurMm @returns {ResultatPiece}
 */
export function definirLongueurMur(piece, i, longueurMm) {
  if (!Number.isFinite(longueurMm) || longueurMm <= 0) return { ok: false, message: "La longueur doit être supérieure à zéro." };
  const n = piece.sommets.length;
  const debut = piece.sommets[i];
  const fin = piece.sommets[(i + 1) % n];
  const actuelle = distance(debut, fin);
  if (actuelle === 0) return { ok: false, message: "Ce mur a une longueur nulle : déplacez d'abord un sommet." };
  const facteur = longueurMm / actuelle;
  const nouvelleFin = {
    x: Math.round(debut.x + (fin.x - debut.x) * facteur),
    y: Math.round(debut.y + (fin.y - debut.y) * facteur),
  };
  const sommets = piece.sommets.map((s, index) => (index === (i + 1) % n ? nouvelleFin : s));
  if (estAutoSecant(sommets)) return { ok: false, message: "Cette longueur ferait se croiser les murs." };
  return { ok: true, piece: { ...piece, sommets } };
}

/**
 * Ajoute un sommet sur le mur i (à la fraction t, au milieu par défaut). Le mur est coupé en deux ;
 * une ouverture à cheval sur le point de coupure fait refuser l'opération.
 * @param {Piece} piece @param {number} i @param {number} [t] @returns {ResultatPiece}
 */
export function insererSommet(piece, i, t = 0.5) {
  const n = piece.sommets.length;
  const a = piece.sommets[i];
  const b = piece.sommets[(i + 1) % n];
  const nouveau = { x: Math.round(a.x + (b.x - a.x) * t), y: Math.round(a.y + (b.y - a.y) * t) };
  const longueurPremierePartie = distance(a, nouveau);
  const ouvertures = [];
  for (const o of piece.ouvertures) {
    if (o.murIndex < i) {
      ouvertures.push(o);
    } else if (o.murIndex > i) {
      ouvertures.push({ ...o, murIndex: o.murIndex + 1 });
    } else if (o.positionMm + o.largeurMm <= longueurPremierePartie) {
      ouvertures.push(o);
    } else if (o.positionMm >= longueurPremierePartie) {
      ouvertures.push({ ...o, murIndex: i + 1, positionMm: Math.round(o.positionMm - longueurPremierePartie) });
    } else {
      return { ok: false, message: "Une ouverture se trouve à cheval sur ce point : déplacez-la avant d'ajouter un sommet." };
    }
  }
  const sommets = [...piece.sommets.slice(0, i + 1), nouveau, ...piece.sommets.slice(i + 1)];
  return { ok: true, piece: { ...piece, sommets, ouvertures } };
}

/**
 * Retire le sommet i : les deux murs voisins n'en forment plus qu'un. Refusé s'il reste moins
 * de 3 sommets, si un des deux murs porte une ouverture, ou si le contour se croiserait.
 * @param {Piece} piece @param {number} i @returns {ResultatPiece}
 */
export function supprimerSommet(piece, i) {
  const n = piece.sommets.length;
  if (n <= 3) return { ok: false, message: "Une pièce garde au moins trois murs." };
  const murAvant = (i - 1 + n) % n;
  if (piece.ouvertures.some((o) => o.murIndex === murAvant || o.murIndex === i)) {
    return { ok: false, message: "Un des deux murs concernés porte une ouverture : supprimez-la ou déplacez-la d'abord." };
  }
  const sommets = piece.sommets.filter((_, index) => index !== i);
  if (estAutoSecant(sommets)) return { ok: false, message: "Retirer ce sommet ferait se croiser les murs." };
  const ouvertures = piece.ouvertures.map((o) => (o.murIndex > i ? { ...o, murIndex: o.murIndex - 1 } : o));
  return { ok: true, piece: { ...piece, sommets, ouvertures } };
}

/**
 * Contrôle d'une ouverture avant de l'enregistrer (R33) : elle doit rester dans son mur, sous le plafond
 * et ne pas chevaucher une autre ouverture. Renvoie le message d'erreur, ou null si tout va bien.
 * @param {Piece} piece @param {Ouverture} ouverture @returns {string | null}
 */
export function validerOuverture(piece, ouverture) {
  if (!Number.isInteger(ouverture.murIndex) || ouverture.murIndex < 0 || ouverture.murIndex >= piece.sommets.length) {
    return "Ce mur n'existe pas.";
  }
  const longueur = Math.round(longueurMur(piece, ouverture.murIndex));
  if (ouverture.positionMm < 0 || ouverture.positionMm + ouverture.largeurMm > longueur) {
    return `L'ouverture dépasserait du mur (longueur ${formaterLongueurMm(longueur)}).`;
  }
  if (ouverture.alleMm + ouverture.hauteurMm > piece.hauteurMm) {
    return `L'ouverture dépasserait le plafond (hauteur ${formaterLongueurMm(piece.hauteurMm)}).`;
  }
  const chevauche = piece.ouvertures.some(
    (autre) =>
      autre.id !== ouverture.id &&
      autre.murIndex === ouverture.murIndex &&
      Math.max(ouverture.positionMm, autre.positionMm) < Math.min(ouverture.positionMm + ouverture.largeurMm, autre.positionMm + autre.largeurMm),
  );
  return chevauche ? "L'ouverture chevaucherait une autre ouverture de ce mur." : null;
}

/**
 * Première position libre (par pas de 100 mm, en partant de 500 mm) pour une nouvelle ouverture sur un mur,
 * ou null s'il n'y a pas de place.
 * @param {Piece} piece @param {Ouverture} ouverture @returns {number | null}
 */
export function trouverPositionLibre(piece, ouverture) {
  const longueur = Math.round(longueurMur(piece, ouverture.murIndex));
  // Candidats : 500 mm, tous les 100 mm, et les bornes des ouvertures du mur (un intervalle libre peut commencer
  // juste après une ouverture, ou finir juste avant, à une position qui n'est pas un multiple de 100 mm).
  const bornes = piece.ouvertures
    .filter((autre) => autre.murIndex === ouverture.murIndex && Number.isFinite(autre.positionMm) && Number.isFinite(autre.largeurMm))
    .flatMap((autre) => [autre.positionMm + autre.largeurMm, autre.positionMm - ouverture.largeurMm]);
  const candidats = [
    500,
    ...Array.from({ length: Math.floor(longueur / 100) + 1 }, (_, k) => k * 100),
    ...bornes,
    longueur - ouverture.largeurMm,
  ];
  for (const positionMm of candidats) {
    if (validerOuverture(piece, { ...ouverture, positionMm }) === null) return positionMm;
  }
  return null;
}

/** @param {Piece} piece @param {Ouverture} ouverture @returns {Piece} */
export function ajouterOuverture(piece, ouverture) {
  return { ...piece, ouvertures: [...piece.ouvertures, ouverture] };
}

/** @param {Piece} piece @param {string} id @param {Partial<Ouverture>} changements @returns {Piece} */
export function modifierOuverture(piece, id, changements) {
  return { ...piece, ouvertures: piece.ouvertures.map((o) => (o.id === id ? { ...o, ...changements, id: o.id } : o)) };
}

/** @param {Piece} piece @param {string} id @returns {Piece} */
export function supprimerOuverture(piece, id) {
  return { ...piece, ouvertures: piece.ouvertures.filter((o) => o.id !== id) };
}

/** @param {Niveau} niveau @param {Piece} piece @returns {Niveau} */
export function ajouterPiece(niveau, piece) {
  return { ...niveau, pieces: [...niveau.pieces, piece] };
}

/** @param {Niveau} niveau @param {Piece} piece @returns {Niveau} remplace la pièce de même id */
export function remplacerPiece(niveau, piece) {
  return { ...niveau, pieces: niveau.pieces.map((p) => (p.id === piece.id ? piece : p)) };
}

/** @param {Niveau} niveau @param {string} id @returns {Niveau} */
export function supprimerPiece(niveau, id) {
  return { ...niveau, pieces: niveau.pieces.filter((p) => p.id !== id) };
}

/** @param {Batiment} batiment @param {Niveau} niveau @returns {Batiment} */
export function ajouterNiveau(batiment, niveau) {
  return { ...batiment, niveaux: [...batiment.niveaux, niveau] };
}

/** @param {Batiment} batiment @param {Niveau} niveau @returns {Batiment} remplace le niveau de même id */
export function remplacerNiveau(batiment, niveau) {
  return { ...batiment, niveaux: batiment.niveaux.map((n) => (n.id === niveau.id ? niveau : n)) };
}
