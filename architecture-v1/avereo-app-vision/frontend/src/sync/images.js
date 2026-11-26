// Les décisions de compression sont pures ; aucun média n'est transmis à un tiers.
export function dimensionsImage(largeur, hauteur, maxCote = 2560) {
  if (!(largeur > 0 && hauteur > 0 && maxCote >= 1)) throw new Error("Dimensions invalides.");
  const ratio = Math.min(1, maxCote / Math.max(largeur, hauteur));
  return { largeur: Math.max(1, Math.round(largeur * ratio)), hauteur: Math.max(1, Math.round(hauteur * ratio)) };
}
export const QUALITES_JPEG = Object.freeze([0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3]);
export async function empreinteSha256(blob) {
  const buffer = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return [...new Uint8Array(buffer)].map(n => n.toString(16).padStart(2, "0")).join("");
}
/** Renvoie {blob, largeurPx, hauteurPx}. Refuse explicitement si le plafond reste impossible. */
export async function compresserImage(fichier, { maxOctets = 2_000_000, maxCote = 2560 } = {}) {
  const url = URL.createObjectURL(fichier);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const { largeur, hauteur } = dimensionsImage(img.naturalWidth, img.naturalHeight, maxCote);
    const canvas = document.createElement("canvas");
    canvas.width = largeur; canvas.height = hauteur;
    const contexte = canvas.getContext("2d");
    contexte.fillStyle = "white"; contexte.fillRect(0, 0, largeur, hauteur);
    contexte.drawImage(img, 0, 0, largeur, hauteur);
    for (const qualite of QUALITES_JPEG) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", qualite));
      if (blob && blob.size <= maxOctets) return { blob, largeurPx: largeur, hauteurPx: hauteur };
    }
    throw new Error("Photo trop volumineuse après compression.");
  } finally { URL.revokeObjectURL(url); }
}
