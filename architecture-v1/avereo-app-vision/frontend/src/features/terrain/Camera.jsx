// Prise de vue intégrée (PC et tablettes Windows) : caméra du navigateur, une image capturée en JPEG.
// L'image capturée suit ensuite le même chemin qu'un fichier choisi (compression, stockage local, envoi).
import { useEffect, useRef, useState } from "react";
import Encadre from "../../components/Encadre.jsx";
import Dialogue from "./Dialogue.jsx";
import { messageErreurCamera } from "./appareil.js";

/** @param {{onPhoto: (fichier: File) => void, onFermer: () => void}} props */
export default function Camera({ onPhoto, onFermer }) {
  const video = useRef(null);
  const flux = useRef(null);
  const [pret, setPret] = useState(false);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    let annule = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 2560 }, height: { ideal: 1920 } }, audio: false })
      .then((s) => {
        if (annule) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        flux.current = s;
        if (video.current) {
          video.current.srcObject = s;
          video.current.play().catch(() => {});
        }
      })
      .catch((e) => !annule && setErreur(messageErreurCamera(e?.name)));
    return () => {
      annule = true;
      flux.current?.getTracks().forEach((t) => t.stop());
      flux.current = null;
    };
  }, []);

  function capturer() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const toile = document.createElement("canvas");
    toile.width = v.videoWidth;
    toile.height = v.videoHeight;
    toile.getContext("2d").drawImage(v, 0, 0);
    toile.toBlob(
      (blob) => {
        if (!blob) {
          setErreur("La photo n'a pas pu être capturée. Réessayez ou utilisez « Choisir une photo ».");
          return;
        }
        const horodatage = new Date().toISOString().replace(/[:.]/g, "-");
        onPhoto(new File([blob], `photo-${horodatage}.jpg`, { type: "image/jpeg" }));
        onFermer();
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <Dialogue titre="Prendre une photo" sansFermer onFermer={onFermer}>
      {erreur ? (
        <Encadre type="alerte" titre="Caméra indisponible">{erreur}</Encadre>
      ) : (
        <video
          ref={video}
          className="terrain-camera"
          playsInline
          muted
          onLoadedMetadata={() => setPret(true)}
          aria-label="Aperçu de la caméra"
        />
      )}
      {!erreur ? (
        <button type="button" className="bouton" disabled={!pret} onClick={capturer}>
          {pret ? "Prendre la photo" : "Démarrage de la caméra…"}
        </button>
      ) : null}
      <button type="button" className="bouton bouton--secondaire" onClick={onFermer}>
        {erreur ? "Fermer" : "Annuler"}
      </button>
    </Dialogue>
  );
}
