// Unités, saisie et affichage (R28). Logique pure : aucune dépendance au DOM ni à React.
// Stockage interne en millimètres entiers ; affichage des surfaces et volumes à 2 décimales,
// des longueurs au centimètre ; les calculs internes gardent la pleine précision.

export const MM_PAR_M = 1000;
export const LONGUEUR_MAX_MM = 100 * MM_PAR_M; // 100 m : au-delà, on suppose une erreur de saisie

/**
 * Arrondi « commercial » (moitié vers l'extérieur), insensible aux erreurs de virgule flottante :
 * 11,995 → 12,00 (alors que Math.round(11,995 × 100) donnerait 1199).
 * @param {number} valeur
 * @param {number} [decimales]
 * @returns {number}
 */
export function arrondir(valeur, decimales = 2) {
  const facteur = 10 ** decimales;
  const signe = valeur < 0 ? -1 : 1;
  const mis_a_l_echelle = Number((Math.abs(valeur) * facteur).toPrecision(15));
  return (signe * Math.round(mis_a_l_echelle)) / facteur;
}

/**
 * Nombre à la française : virgule décimale, nombre fixe de décimales.
 * @param {number} valeur
 * @param {number} [decimales]
 * @returns {string}
 */
export function formaterNombre(valeur, decimales = 2) {
  const texte = arrondir(valeur, decimales).toFixed(decimales);
  return texte.replace(".", ",");
}

/** @param {number} m2 @returns {string} */
export function formaterSurface(m2) {
  return `${formaterNombre(m2)} m²`;
}

/** @param {number} m3 @returns {string} */
export function formaterVolume(m3) {
  return `${formaterNombre(m3)} m³`;
}

/** Longueur en mètres, affichée au centimètre. @param {number} metres @returns {string} */
export function formaterLongueur(metres) {
  return `${formaterNombre(metres)} m`;
}

/** @param {number} mm @returns {string} */
export function formaterLongueurMm(mm) {
  return formaterLongueur(mm / MM_PAR_M);
}

/** @param {number} mm @returns {number} */
export function metresDepuisMm(mm) {
  return mm / MM_PAR_M;
}

const FACTEUR_MM = { mm: 1, cm: 10, m: MM_PAR_M };

/**
 * Lit une longueur saisie ("4,00", "4.00", " 400 ") dans l'unité choisie et la convertit en millimètres entiers.
 * @param {string} texte
 * @param {"mm"|"cm"|"m"} [unite]
 * @param {{autoriserZero?: boolean}} [options] zéro accepté pour une position ou une allège
 * @returns {{ok: true, mm: number} | {ok: false, message: string}}
 */
export function analyserLongueur(texte, unite = "m", { autoriserZero = false } = {}) {
  const nettoye = String(texte ?? "").trim().replace(/\s+/g, "").replace(",", ".");
  if (nettoye === "") {
    return { ok: false, message: "Saisissez une longueur." };
  }
  if (!/^\d+(\.\d+)?$/.test(nettoye)) {
    return { ok: false, message: "Longueur non valide : utilisez des chiffres, par exemple 4,00." };
  }
  const mm = Math.round(Number(nettoye) * FACTEUR_MM[unite]);
  if (mm === 0 && !autoriserZero) {
    return { ok: false, message: "La longueur doit être supérieure à zéro." };
  }
  if (mm > LONGUEUR_MAX_MM) {
    return { ok: false, message: "Longueur trop grande : vérifiez l'unité (maximum 100 m)." };
  }
  return { ok: true, mm };
}

/** Texte de saisie d'une longueur en millimètres, dans l'unité choisie. @param {number} mm @param {"mm"|"cm"|"m"} [unite] */
export function texteDepuisMm(mm, unite = "m") {
  const valeur = mm / FACTEUR_MM[unite];
  return unite === "mm" ? String(Math.round(valeur)) : formaterNombre(valeur, unite === "m" ? 2 : 1);
}
