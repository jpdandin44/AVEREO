import { compresserImage, empreinteSha256 } from "../../sync/images.js";
import { longueurMurMm } from "../../domain/geometrie.js";
import { validerCommentaire } from "../../domain/terrain.js";

export function placementPhoto(niveau, pieceId) {
  const piece = niveau.pieces.find(p => p.id === pieceId);
  const points = (piece ? [piece] : niveau.pieces).flatMap(p => p.sommets);
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  return { xMm: points.length ? Math.round((Math.min(...xs) + Math.max(...xs)) / 2) : 0,
    yMm: points.length ? Math.round((Math.min(...ys) + Math.max(...ys)) / 2) : 0,
    ...(piece ? { pieceId: piece.id } : {}) };
}

// Le fichier est durable AVANT que l'objet rejoigne l'historique de useReleve.
export async function preparerPhoto(moteur, projetId, fichier, position,
  { compresser = compresserImage, empreinte = empreinteSha256, uuid = () => crypto.randomUUID() } = {}) {
  const { blob, largeurPx, hauteurPx } = await compresser(fichier);
  const id = uuid(), sha256 = await empreinte(blob), prisLe = new Date().toISOString();
  await moteur.sauverMedia({ id, projectId: projetId, etat: "a-envoyer", blob, mime: blob.type, sha256, taille: blob.size, creeLe: prisLe });
  return { id, ...position, prisLe, largeurPx, hauteurPx, tailleOctets: blob.size, sha256, mime: blob.type };
}

export function ajouterPhotoNiveau(niveau, photo) {
  return { ...niveau, photos: [...(niveau.photos ?? []), photo] };
}

export async function marquerPhotoSupprimee(moteur, projetId, id) {
  const media = await moteur.lireMedia(projetId, id);
  await moteur.sauverMedia({ ...media, id, projectId: projetId, etat: "a-envoyer", supprimer: true, erreur: null });
}

export function cibleCommentaire(niveau, piece, photo, choix) {
  if (choix === "piece" && piece) return { type: "piece", pieceId: piece.id };
  if (choix === "photo" && photo) return { type: "photo", photoId: photo.id };
  if (choix.startsWith("mur:") && piece) {
    const murIndex = Number(choix.split(":")[1]);
    return { type: "mur", pieceId: piece.id, murIndex, positionMm: Math.round(longueurMurMm(piece.sommets, murIndex) / 2) };
  }
  if (choix !== "point") throw new Error("Choisissez une cible encore présente sur le niveau.");
  const { xMm, yMm } = placementPhoto(niveau);
  return { type: "point", xMm, yMm };
}

export function commentaireHorsMur(niveau, commentaire) {
  const c = commentaire.cible;
  const p = niveau.pieces.find(p => p.id === c.pieceId);
  return c.type === "mur" && p && c.murIndex < p.sommets.length
    && c.positionMm > longueurMurMm(p.sommets, c.murIndex);
}

export function enregistrerCommentaire(niveau, commentaire) {
  if (!validerCommentaire(commentaire)) throw new Error("Saisissez entre 1 et 500 caractères.");
  const existe = (niveau.commentaires ?? []).some(c => c.id === commentaire.id);
  return { ...niveau, commentaires: existe ? niveau.commentaires.map(c => c.id === commentaire.id ? commentaire : c)
    : [...(niveau.commentaires ?? []), commentaire] };
}

export function deplacerRepere(niveau, type, id, position) {
  const point = { xMm: Math.round(position.xMm), yMm: Math.round(position.yMm) };
  if (type === "photo") return { ...niveau, photos: niveau.photos.map(p => p.id === id ? { ...p, ...point } : p) };
  return { ...niveau, commentaires: niveau.commentaires.map(c => c.id === id && c.cible.type === "point" ? { ...c, cible: { type: "point", ...point } } : c) };
}
