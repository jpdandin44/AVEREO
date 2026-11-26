// Application AVEREO Vision : en-tête commun, session, écran Projets puis écran du relevé.
import { useMemo, useState } from "react";
import Encadre from "./components/Encadre.jsx";
import Reconnexion from "./components/Reconnexion.jsx";
import BandeauApplication from "./components/BandeauApplication.jsx";
import Icone from "./components/Icone.jsx";
import IndicateurEnregistrement from "./components/IndicateurEnregistrement.jsx";
import EcranProjets from "./features/projets/EcranProjets.jsx";
import { useProjets } from "./features/projets/useProjets.js";
import EcranReleve from "./features/releve/EcranReleve.jsx";
import { creerClientApplication } from "./services/api.js";
import { useSynchro } from "./sync/useSynchro.js";

const NOMS_ROLE = { fondateur: "fondateur", conseiller: "conseiller" };

export default function App() {
  const client = useMemo(() => creerClientApplication(), []);
  const projets = useProjets(client);
  const synchro = useSynchro(projets.moteur);
  // Projets dont le relevé a été ouvert pendant cette session de la page, et projet affiché.
  // Les relevés restent montés (masqués) quand on revient à la liste : l'état d'un relevé en cours (sélection, historique
  // annuler/rétablir) n'est pas enregistré, naviguer entre les projets ne doit donc jamais le perdre.
  const [ouverts, setOuverts] = useState([]);
  const [projetOuvert, setProjetOuvert] = useState(null);
  const { session } = projets;

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
        {session.connectPortal ? (
          // Pas de prop « portal » (propriété en lecture seule du composant) : l'adresse est dans <meta name="avereo-connect-portal">.
          <avereo-account-menu no-missions="" logout-path="/connect/logout.php">
            <button slot="items" type="button" onClick={() => setProjetOuvert(null)}>Mes projets</button>
            <a slot="logout" href="/connect/logout.php" onClick={(event) => {
              if ((synchro.enAttente > 0 || !projets.stockageDurable) && !window.confirm(
                projets.stockageDurable
                  ? `${synchro.enAttente} modification(s) restent sur cet appareil et partiront après reconnexion avec ce compte. Se déconnecter ?`
                  : "Le stockage durable est indisponible. Quitter cette page risque de perdre les modifications. Se déconnecter ?"
              )) event.preventDefault();
            }}>Se déconnecter</a>
          </avereo-account-menu>
        ) : null}
        {projets.moteur ? <IndicateurEnregistrement synchro={synchro} durable={projets.stockageDurable} /> : null}
        <span className="entete__type">
          {session.etat === "ok"
            ? `Connecté (${session.identite.provider} ${session.identite.id}) — ${NOMS_ROLE[session.role] ?? session.role}`
            : "AVEREO Vision — plan 2D et métrés"}
        </span>
      </header>
      {synchro.reseau === "reconnexion" ? (
        <div role="status"><Encadre type="alerte" titre="Connexion requise">
          <Reconnexion portal={session.connectPortal} durable={projets.stockageDurable} />
        </Encadre></div>
      ) : null}
      <BandeauApplication enAttente={synchro.enAttente} durable={projets.stockageDurable} />
      {projetOuvert ? null : <EcranProjets projets={projets} onOuvrir={ouvrir} />}
      {ouverts.map((projet) => (
        <div key={projet.id} hidden={projetOuvert?.id !== projet.id} style={{ display: projetOuvert?.id === projet.id ? "contents" : "none" }}>
          {projets.moteur ? <EcranReleve projet={projet} moteur={projets.moteur} /> : null}
        </div>
      ))}
    </div>
  );
}
