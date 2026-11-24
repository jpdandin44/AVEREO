// Déplacement d'une ouverture le long de son mur, avec les mêmes contrôles que la saisie au clavier (R33) :
// une position qui sortirait du mur ou chevaucherait une autre ouverture est refusée, l'ouverture garde sa dernière
// position valide. Logique pure, testée.
import { projeterSurSegment } from "../../domain/geometrie.js";
import { modifierOuverture, validerOuverture } from "../../domain/modele.js";

/**
 * @param {import("../../domain/modele.js").Piece} piece
 * @param {import("../../domain/modele.js").Ouverture} ouverture
 * @param {{x: number, y: number}} pointeurMm position du pointeur dans le plan, en mm
 * @returns {{piece: import("../../domain/modele.js").Piece | null, positionMm: number, message: string | null}}
 *   piece : la pièce mise à jour, ou null si la position est refusée (message donne la raison)
 */
export function deplacerOuverture(piece, ouverture, pointeurMm) {
  const n = piece.sommets.length;
  const a = piece.sommets[ouverture.murIndex];
  const b = piece.sommets[(ouverture.murIndex + 1) % n];
  const longueur = Math.hypot(b.x - a.x, b.y - a.y);
  const { t } = projeterSurSegment(pointeurMm, a, b);
  const souhaitee = Math.round((t * longueur - ouverture.largeurMm / 2) / 10) * 10;
  // L'ouverture reste d'abord dans son mur, puis on contrôle les chevauchements.
  const positionMm = Math.min(Math.max(0, souhaitee), Math.max(0, Math.floor(longueur - ouverture.largeurMm)));
  const candidate = { ...ouverture, positionMm };
  const message = validerOuverture(piece, candidate);
  if (message) return { piece: null, positionMm: ouverture.positionMm, message };
  return { piece: modifierOuverture(piece, ouverture.id, { positionMm }), positionMm, message: null };
}

/**
 * Centre de l'ouverture sur son mur, en mm, pour placer la poignée.
 * @param {import("../../domain/modele.js").Piece} piece
 * @param {import("../../domain/modele.js").Ouverture} ouverture
 * @returns {{x: number, y: number}}
 */
export function centreOuverture(piece, ouverture) {
  const n = piece.sommets.length;
  const a = piece.sommets[ouverture.murIndex];
  const b = piece.sommets[(ouverture.murIndex + 1) % n];
  const longueur = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const milieu = ouverture.positionMm + ouverture.largeurMm / 2;
  return { x: a.x + ((b.x - a.x) / longueur) * milieu, y: a.y + ((b.y - a.y) / longueur) * milieu };
}
