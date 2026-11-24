// Application AVEREO Vision : en-tête commun, session, écran Projets puis écran du relevé.
import { useMemo, useState } from "react";
import Icone from "./components/Icone.jsx";
import EcranProjets from "./features/projets/EcranProjets.jsx";
import { useProjets } from "./features/projets/useProjets.js";
import EcranReleve from "./features/releve/EcranReleve.jsx";
import { creerClientApplication } from "./services/api.js";

const NOMS_ROLE = { fondateur: "fondateur", conseiller: "conseiller" };

export default function App() {
  const client = useMemo(() => creerClientApplication(), []);
  const projets = useProjets(client);
  const [projetOuvert, setProjetOuvert] = useState(null);
  const { session } = projets;

  return (
    <div className="app">
      <header className="entete">
        <img className="logo" src="./branding/logo-avereo.png" alt="AVEREO" />
        <h1>{projetOuvert ? projetOuvert.name : "Relevé de l'existant"}</h1>
        {projetOuvert ? (
          <button type="button" className="bouton bouton--secondaire" onClick={() => setProjetOuvert(null)}>
            <Icone nom="annuler" /> Tous les projets
          </button>
        ) : null}
        <span className="entete__type">
          {session.etat === "ok"
            ? `Connecté (${session.identite.provider} ${session.identite.id}) — ${NOMS_ROLE[session.role] ?? session.role}`
            : "AVEREO Vision — plan 2D et métrés"}
        </span>
      </header>
      {projetOuvert ? <EcranReleve projet={projetOuvert} /> : <EcranProjets projets={projets} onOuvrir={setProjetOuvert} />}
    </div>
  );
}
