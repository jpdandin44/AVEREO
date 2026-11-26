import { useEffect, useRef, useState } from "react";
import { ajouterPhotoNiveau, placementPhoto, preparerPhoto } from "./logique.js";

export function usePhotos({ moteur, projetId, niveau, piece, validerNiveau }) {
  const [images, setImages] = useState({}), [medias, setMedias] = useState([]);
  const [erreur, setErreur] = useState(null), [occupe, setOccupe] = useState(false);
  const supprimees = useRef(new Set());
  useEffect(() => {
    let actif = true, lecture = false, relire = false;
    const urls = new Map();
    async function actualiser() {
      if (lecture) { relire = true; return; }
      lecture = true;
      try {
        do {
          relire = false;
          const liste = await moteur.listerMedias(projetId);
          if (!actif) return;
          setMedias(liste);
          const resultat = {};
          for (const photo of niveau.photos ?? []) {
            const media = liste.find(m => m.id === photo.id);
            if (media?.supprimer) supprimees.current.add(photo.id);
            if (supprimees.current.has(photo.id)) { resultat[photo.id] = { message: "Photo supprimée" }; continue; }
            try {
              if (!urls.has(photo.id)) {
                const blob = media?.blob ?? await moteur.telechargerMedia(projetId, photo.id);
                if (!actif) return;
                urls.set(photo.id, URL.createObjectURL(blob));
              }
              resultat[photo.id] = { url: urls.get(photo.id) };
            } catch (e) {
              resultat[photo.id] = { message: e.statut === 404 ? "Photo supprimée" : "Photo indisponible : vérifiez le réseau puis réessayez." };
            }
          }
          if (actif) setImages(resultat);
        } while (relire && actif);
      } catch { if (actif) setErreur("Lecture du stockage des photos impossible."); }
      finally { lecture = false; }
    }
    actualiser();
    const desabonner = moteur.abonner(e => { if (e.projetId === projetId || !e.projetId) actualiser(); });
    return () => { actif = false; desabonner(); for (const url of urls.values()) URL.revokeObjectURL(url); };
  }, [moteur, projetId, niveau.photos]);

  async function ajouter(fichier) {
    if (!fichier || occupe) return;
    setOccupe(true); setErreur(null);
    try {
      const photo = await preparerPhoto(moteur, projetId, fichier, placementPhoto(niveau, piece?.id));
      // Le niveau ciblé reste celui de la capture même si la sélection a changé pendant la compression.
      validerNiveau(n => ajouterPhotoNiveau(n, photo), niveau.id);
    } catch (e) { setErreur(`Photo non ajoutée : compression ou stockage impossible. ${e.message}`); }
    finally { setOccupe(false); }
  }
  return { images, medias, ajouter, erreur, occupe, noterSuppression: id => supprimees.current.add(id) };
}
