// Création et modification d'un projet : nom (obligatoire), adresse, client (texte libre).
import { useState } from "react";
import Encadre from "../../components/Encadre.jsx";
import Champ from "../saisie-cotes/Champ.jsx";

/**
 * @param {{initial?: {name: string, address: string, client_label: string}, libelleValider: string,
 *   onValider: (donnees: {name: string, address: string, client_label: string}) => Promise<{ok: boolean, erreur?: any}>,
 *   onAnnuler?: () => void}} props
 */
export default function FormulaireProjet({ initial, libelleValider, onValider, onAnnuler }) {
  const [nom, setNom] = useState(initial?.name ?? "");
  const [adresse, setAdresse] = useState(initial?.address ?? "");
  const [client, setClient] = useState(initial?.client_label ?? "");
  const [champs, setChamps] = useState({});
  const [message, setMessage] = useState(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(evenement) {
    evenement.preventDefault();
    if (nom.trim() === "") {
      setChamps({ name: "Le nom du projet est obligatoire." });
      return;
    }
    setEnCours(true);
    const resultat = await onValider({ name: nom, address: adresse, client_label: client });
    setEnCours(false);
    if (resultat.ok) {
      setChamps({});
      setMessage(null);
      if (!initial) {
        setNom("");
        setAdresse("");
        setClient("");
      }
    } else {
      setChamps(resultat.erreur?.champs ?? {});
      setMessage(resultat.erreur?.message ?? "Enregistrement impossible.");
    }
  }

  return (
    <form onSubmit={envoyer} noValidate aria-label={initial ? "Modifier le projet" : "Nouveau projet"}>
      <Champ libelle="Nom du projet" valeur={nom} onChange={setNom} inputMode="text" erreur={champs.name} aide="Par exemple : Maison Dupont" />
      <Champ libelle="Adresse du logement" valeur={adresse} onChange={setAdresse} inputMode="text" erreur={champs.address} aide="Facultatif" />
      <Champ libelle="Client" valeur={client} onChange={setClient} inputMode="text" erreur={champs.client_label} aide="Facultatif, texte libre" />
      {message ? (
        <div style={{ marginBottom: 12 }}>
          <Encadre type="alerte" titre="Enregistrement impossible">
            {message}
          </Encadre>
        </div>
      ) : null}
      <div className="barre-boutons">
        <button type="submit" className="bouton bouton--accent" disabled={enCours}>
          {enCours ? "Enregistrement…" : libelleValider}
        </button>
        {onAnnuler ? (
          <button type="button" className="bouton bouton--secondaire" onClick={onAnnuler}>
            Annuler
          </button>
        ) : null}
      </div>
    </form>
  );
}
