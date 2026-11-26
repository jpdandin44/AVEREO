import { compresserImage, empreinteSha256 } from "./images.js";
import { supprimerCible } from "../domain/terrain.js";

/** Service sans écran, lié à un projet ET à un niveau explicite. fermer() libère ses URL blob. */
export function creerMedias(moteur, projetId, niveauId, { compresser = compresserImage, empreinte = empreinteSha256, uuid = () => crypto.randomUUID() } = {}) {
  const urls = new Map();
  return {
    async ajouterPhoto(fichier, { xMm, yMm, pieceId }) {
      if (!Number.isInteger(xMm) || !Number.isInteger(yMm)) throw new Error("Coordonnées entières attendues.");
      const { blob, largeurPx, hauteurPx } = await compresser(fichier);
      const id = uuid(), sha256 = await empreinte(blob), prisLe = new Date().toISOString();
      const photo = { id, xMm, yMm, ...(pieceId ? { pieceId } : {}), prisLe, largeurPx, hauteurPx, tailleOctets: blob.size, sha256, mime: blob.type };
      // Blob d'abord : si l'écriture de l'objet échoue, aucune référence à un fichier perdu n'est créée.
      await moteur.sauverMedia({ id, projectId: projetId, etat: "a-envoyer", blob, mime: blob.type, sha256, taille: blob.size, creeLe: prisLe });
      await moteur.modifierBatiment(projetId, batiment => {
        if (!batiment.niveaux.some(n => n.id === niveauId)) throw new Error("Niveau introuvable.");
        return { ...batiment, niveaux: batiment.niveaux.map(n => n.id === niveauId ? { ...n, photos: [...(n.photos ?? []), photo] } : n) };
      });
      return photo;
    },
    async urlPhoto(id) {
      const media = await moteur.lireMedia(projetId, id);
      if (media?.blob) {
        if (!urls.has(id)) urls.set(id, URL.createObjectURL(media.blob));
        return urls.get(id);
      }
      // Lecture authentifiée par le client lié à l'identité (y compris en mode local).
      if (!urls.has(id)) urls.set(id, URL.createObjectURL(await moteur.telechargerMedia(projetId, id)));
      return urls.get(id);
    },
    async supprimerPhoto(id, choix = "detacher") {
      await moteur.modifierBatiment(projetId, batiment => ({ ...batiment, niveaux: batiment.niveaux.map(n => n.id === niveauId ? supprimerCible(n, { type: "photo", photoId: id }, choix).niveau : n) }));
      const media = await moteur.lireMedia(projetId, id);
      // Conserver une intention de suppression même après une réponse PUT perdue.
      await moteur.sauverMedia({ ...media, id, projectId: projetId, etat: "a-envoyer", supprimer: true, erreur: null });
      if (urls.has(id)) URL.revokeObjectURL(urls.get(id));
      urls.delete(id);
    },
    fermer() { for (const url of urls.values()) URL.revokeObjectURL(url); urls.clear(); },
  };
}
