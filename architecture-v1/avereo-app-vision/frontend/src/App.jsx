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
  // Projets dont le relevé a été ouvert pendant cette session de la page, et projet affiché.
  // Les relevés restent montés (masqués) quand on revient à la liste : tant que le contenu n'est pas enregistré
  // sur le serveur (Lot 2B), naviguer entre les projets ne doit jamais effacer un relevé en cours.
  const [ouverts, setOuverts] = useState([]);
  const [projetOuvert, setProjetOuvert] = useState(null);
  const { session } = projets;
  const deconnexionPossible = session.etat === "ok" && session.modeAuth === "connect";

  function ouvrir(projet) {
    setOuverts((liste) => (liste.some((p) => p.id === projet.id) ? liste : [...liste, projet]));
    setProjetOuvert(projet);
  }

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
        {deconnexionPossible ? (
          <button
            type="button"
            className="bouton bouton--secondaire"
            onClick={() => {
              setProjetOuvert(null);
              setOuverts([]);
              projets.deconnecter();
            }}
          >
            Se déconnecter
          </button>
        ) : null}
        <span className="entete__type">
          {session.etat === "ok"
            ? `Connecté (${session.identite.provider} ${session.identite.id}) — ${NOMS_ROLE[session.role] ?? session.role}`
            : "AVEREO Vision — plan 2D et métrés"}
        </span>
      </header>
      {projetOuvert ? null : <EcranProjets projets={projets} onOuvrir={ouvrir} />}
      {ouverts.map((projet) => (
        <div key={projet.id} hidden={projetOuvert?.id !== projet.id} style={{ display: projetOuvert?.id === projet.id ? "contents" : "none" }}>
          <EcranReleve projet={projet} />
        </div>
      ))}
    </div>
  );
}
