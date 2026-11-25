// État de synchronisation d'un relevé : projet archivé, modifications refusées, journal des modifications écrasées (R06).
import { useEffect, useState } from "react";
import Encadre from "../../components/Encadre.jsx";
import { libelleEcrasement } from "../../sync/journal.js";

const formaterDate = (iso) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

/**
 * @param {{projetId: string, moteur: ReturnType<import("../../sync/moteur.js").creerMoteur>}} props
 */
export default function StatutSynchro({ projetId, moteur }) {
  const [etat, setEtat] = useState({ enAttente: 0, refusees: [], archive: false, introuvable: false });
  const [journal, setJournal] = useState([]);

  useEffect(() => {
    let vivant = true;
    const lire = async () => {
      const [e, j] = await Promise.all([moteur.etatProjet(projetId), moteur.lireJournal(projetId)]);
      if (vivant) {
        setEtat(e);
        setJournal(j);
      }
    };
    lire();
    const desabonner = moteur.abonner(lire);
    return () => {
      vivant = false;
      desabonner();
    };
  }, [moteur, projetId]);

  return (
    <>
      {etat.archive ? (
        <Encadre type="alerte" titre="Projet archivé : modifications non envoyées">
          Ce projet est archivé sur le serveur. Vos modifications restent enregistrées sur cet appareil ; restaurez le projet depuis la liste pour les envoyer.
        </Encadre>
      ) : null}
      {etat.refusees.length > 0 ? (
        <Encadre type="alerte" titre={`${etat.refusees.length} modification${etat.refusees.length > 1 ? "s" : ""} refusée${etat.refusees.length > 1 ? "s" : ""} par le serveur`}>
          Elles restent affichées sur cet appareil mais ne sont pas synchronisées : {etat.refusees[0].message}
        </Encadre>
      ) : null}
      {journal.length > 0 ? (
        <section className="carte" aria-labelledby="titre-journal">
          <h2 id="titre-journal">Journal des modifications remplacées ({journal.length})</h2>
          <p className="champ__aide">Quand deux appareils modifient le même élément, la modification la plus récente est conservée ; l'autre est listée ici.</p>
          <ul className="liste">
            {journal.map((entree) => (
              <li key={entree.id}>
                {entree.lost.device_id === moteur.deviceId
                  ? libelleEcrasement(entree, formaterDate)
                  : `Une modification faite sur un autre appareil a été remplacée par la vôtre le ${formaterDate(entree.created_at)}.`}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
