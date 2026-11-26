// Contrat terrain du lot 3A. Logique pure, coordonnées en millimètres.
import { distance, longueurMurMm } from "./geometrie.js";
import { TOLERANCE_MM } from "./precision.js";
import { decrireCoteLaser } from "./alertes.js";
import { supprimerSommet, insererSommet } from "./modele.js";

export function evaluerCotesLaser(piece) {
  return Object.entries(piece.cotesLaser ?? {}).map(([nom, cote]) => {
    if (!Number.isInteger(cote.valeurMm) || cote.valeurMm < 1 || cote.valeurMm > 100000)
      throw new Error("Cote laser invalide.");
    const indices = nom !== "controle" ? [cote.murIndex] : cote.type === "diagonale" ? [cote.deSommet, cote.aSommet] : [];
    if (indices.some(i => !Number.isInteger(i) || i < 0 || i >= piece.sommets.length)) throw new Error("Repère laser introuvable.");
    const modeleMm = Math.round(nom !== "controle" ? longueurMurMm(piece.sommets, cote.murIndex)
      : cote.type === "hauteur" ? piece.hauteurMm : distance(piece.sommets[cote.deSommet], piece.sommets[cote.aSommet]));
    const ecartMm = Math.abs(modeleMm - cote.valeurMm);
    const etat = ecartMm > TOLERANCE_MM ? "hors-tolerance" : "ok";
    return { nom, modeleMm, valeurMm: cote.valeurMm, ecartMm, etat, ...decrireCoteLaser(etat) };
  });
}

export function validerCommentaire(commentaire) {
  return typeof commentaire.texte === "string" && commentaire.texte.trim().length > 0
    && [...commentaire.texte].length <= 500;
}

/** null si la cible est absente : ne jamais déplacer silencieusement une annotation orpheline. */
export function positionCommentaire(niveau, commentaire) {
  const c = commentaire.cible;
  if (c.type === "point") return { xMm: c.xMm, yMm: c.yMm };
  if (c.type === "photo") {
    const p = (niveau.photos ?? []).find((p) => p.id === c.photoId);
    return p ? { xMm: p.xMm, yMm: p.yMm } : null;
  }
  const p = niveau.pieces.find((p) => p.id === c.pieceId);
  if (!p) return null;
  if (c.type === "piece") return {
    xMm: Math.round(p.sommets.reduce((s, v) => s + v.x, 0) / p.sommets.length),
    yMm: Math.round(p.sommets.reduce((s, v) => s + v.y, 0) / p.sommets.length),
  };
  const a = p.sommets[c.murIndex], b = p.sommets[(c.murIndex + 1) % p.sommets.length];
  if (!a || !b || distance(a, b) === 0) return null;
  const t = c.positionMm / distance(a, b);
  return { xMm: Math.round(a.x + (b.x - a.x) * t), yMm: Math.round(a.y + (b.y - a.y) * t) };
}

/** cible : {type:'piece',pieceId} | {type:'photo',photoId} | {type:'sommet',pieceId,sommetIndex}. */
export function commentairesConcernes(niveau, cible) {
  const p = niveau.pieces.find((p) => p.id === cible.pieceId);
  return (niveau.commentaires ?? []).filter(({ cible: c }) => {
    if (cible.type === "photo") return c.type === "photo" && c.photoId === cible.photoId;
    if (c.pieceId !== cible.pieceId) return false;
    if (cible.type === "piece") return c.type === "piece" || c.type === "mur";
    return c.type === "mur" && [cible.sommetIndex, (cible.sommetIndex - 1 + p.sommets.length) % p.sommets.length].includes(c.murIndex);
  });
}

/** Applique aussi la suppression de la cible ; retourne un résultat sans muter le niveau. */
export function supprimerCible(niveau, cible, choix) {
  if (!["supprimer", "detacher"].includes(choix)) throw new Error("Choix attendu : supprimer ou detacher.");
  const concernes = commentairesConcernes(niveau, cible);
  const ids = new Set(concernes.map((c) => c.id));
  let pieces = niveau.pieces;
  if (cible.type === "sommet") {
    const p = pieces.find((p) => p.id === cible.pieceId);
    const resultat = supprimerSommet(p, cible.sommetIndex);
    if (!resultat.ok) return resultat;
    pieces = pieces.map((p) => p.id === cible.pieceId ? resultat.piece : p);
  } else if (cible.type === "piece") pieces = pieces.filter((p) => p.id !== cible.pieceId);
  const commentaires = (niveau.commentaires ?? []).flatMap((c) => {
    if (ids.has(c.id)) {
      if (choix === "supprimer") return [];
      const position = positionCommentaire(niveau, c);
      if (!position) throw new Error("Position de détachement introuvable.");
      return [{ ...c, cible: { type: "point", ...position } }];
    }
    if (cible.type === "sommet" && c.cible.type === "mur" && c.cible.pieceId === cible.pieceId && c.cible.murIndex > cible.sommetIndex)
      return [{ ...c, cible: { ...c.cible, murIndex: c.cible.murIndex - 1 } }];
    return [c];
  });
  return { ok: true, niveau: { ...niveau, pieces, commentaires,
    ...(cible.type === "photo" ? { photos: (niveau.photos ?? []).filter((p) => p.id !== cible.photoId) } : {}) }, concernes };
}

/** Même règle que les ouvertures : décaler le mur et retrancher la première partie. */
export function insererSommetTerrain(niveau, pieceId, murIndex, t = 0.5) {
  const piece = niveau.pieces.find(p => p.id === pieceId);
  if (!piece || !Number.isInteger(murIndex) || murIndex < 0 || murIndex >= piece.sommets.length || !(t > 0 && t < 1))
    return { ok: false, message: "Insertion invalide." };
  const resultat = insererSommet(piece, murIndex, t);
  if (!resultat.ok) return resultat;
  const coupure = distance(piece.sommets[murIndex], resultat.piece.sommets[murIndex + 1]);
  return { ok: true, niveau: { ...niveau, pieces: niveau.pieces.map(p => p.id === pieceId ? resultat.piece : p),
    commentaires: (niveau.commentaires ?? []).map(c => {
      const cible = c.cible;
      if (cible.type !== "mur" || cible.pieceId !== pieceId) return c;
      if (cible.murIndex > murIndex) return { ...c, cible: { ...cible, murIndex: cible.murIndex + 1 } };
      if (cible.murIndex === murIndex && cible.positionMm >= coupure)
        return { ...c, cible: { ...cible, murIndex: murIndex + 1, positionMm: Math.round(cible.positionMm - coupure) } };
      return c;
    }) } };
}
