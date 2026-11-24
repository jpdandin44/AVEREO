// Écran « Projets » : liste, recherche, création, modification, archivage, ouverture du relevé (R01).
import { useState } from "react";
import Encadre from "../../components/Encadre.jsx";
import Icone from "../../components/Icone.jsx";
import Champ from "../saisie-cotes/Champ.jsx";
import FormulaireProjet from "./FormulaireProjet.jsx";

function formaterDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function EtatSession({ session, onReessayer }) {
  if (session.etat === "chargement") {
    return <Encadre titre="Connexion en cours">Vérification de votre session…</Encadre>;
  }
  if (session.etat === "non-connecte") {
    return (
      <Encadre type="alerte" titre="Connexion requise">
        {import.meta.env.DEV
          ? "Aucune session valide. En développement : lancez la pile locale (local/vision-local.ps1 up), puis rechargez la page."
          : "Aucune session valide. Ouvrez AVEREO Vision depuis AVEREO CONNECT."}
      </Encadre>
    );
  }
  if (session.etat === "reseau" || session.etat === "erreur") {
    return (
      <Encadre type="alerte" titre={session.etat === "reseau" ? "Serveur injoignable" : "Erreur du serveur"}>
        {session.message}{" "}
        <button type="button" className="bouton bouton--secondaire" onClick={onReessayer}>
          Réessayer
        </button>
      </Encadre>
    );
  }
  return null;
}

/**
 * @param {{projets: ReturnType<import("./useProjets.js").useProjets>, onOuvrir: (projet: any) => void}} props
 */
export default function EcranProjets({ projets, onOuvrir }) {
  const session = projets.session;
  const liste = projets.projets;
  const [edition, setEdition] = useState(null);
  const [recherche, setRecherche] = useState(projets.filtres.q);

  if (session.etat !== "ok") {
    return (
      <main className="contenu" style={{ gridTemplateColumns: "minmax(0, 720px)" }}>
        <div className="colonne">
          <EtatSession session={session} onReessayer={projets.reessayer} />
        </div>
      </main>
    );
  }

  return (
    <main className="contenu" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 380px)" }}>
      <div className="colonne">
        <section className="carte" aria-labelledby="titre-projets">
          <h2 id="titre-projets">Projets</h2>
          <form
            className="grille-champs"
            style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", alignItems: "end" }}
            onSubmit={(e) => {
              e.preventDefault();
              projets.changerFiltres({ q: recherche });
            }}
            role="search"
          >
            <Champ libelle="Rechercher (nom, adresse, client)" valeur={recherche} onChange={setRecherche} inputMode="search" />
            <div className="champ">
              <label className="champ__libelle" htmlFor="filtre-statut">
                Afficher
              </label>
              <select
                id="filtre-statut"
                className="champ__saisie"
                value={projets.filtres.statut}
                onChange={(e) => projets.changerFiltres({ statut: e.target.value })}
              >
                <option value="active">Projets actifs</option>
                <option value="archived">Projets archivés</option>
                <option value="all">Tous les projets</option>
              </select>
            </div>
          </form>

          {projets.erreur && projets.erreur.type !== "non-connecte" ? (
            <Encadre type="alerte" titre="Chargement impossible">
              {projets.erreur.message}{" "}
              <button type="button" className="bouton bouton--secondaire" onClick={projets.recharger}>
                Réessayer
              </button>
            </Encadre>
          ) : null}

          {projets.chargement && liste.length === 0 ? <p className="champ__aide">Chargement…</p> : null}
          {!projets.chargement && liste.length === 0 && !projets.erreur ? (
            <Encadre titre="Aucun projet">
              {projets.filtres.q || projets.filtres.statut !== "active"
                ? "Aucun projet ne correspond à cette recherche."
                : "Créez votre premier projet avec le formulaire « Nouveau projet »."}
            </Encadre>
          ) : null}

          <ul className="liste" aria-label="Liste des projets" style={{ marginTop: 12 }}>
            {liste.map((projet) => (
              <li key={projet.id} className="carte" style={{ boxShadow: "none", border: "1px solid var(--gris-mineral)" }}>
                {edition === projet.id ? (
                  <FormulaireProjet
                    initial={projet}
                    libelleValider="Enregistrer"
                    onValider={async (donnees) => {
                      const resultat = await projets.modifier(projet.id, donnees);
                      if (resultat.ok) setEdition(null);
                      return resultat;
                    }}
                    onAnnuler={() => setEdition(null)}
                  />
                ) : (
                  <>
                    <div className="liste__element" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ fontSize: "1.05rem" }}>{projet.name}</h3>
                        {projet.address ? <div>{projet.address}</div> : null}
                        {projet.client_label ? <div className="champ__aide">Client : {projet.client_label}</div> : null}
                        <div className="champ__aide">Modifié le {formaterDate(projet.updated_at)}</div>
                      </div>
                      <span className="pastille">{projet.status === "archived" ? "Archivé" : "Actif"}</span>
                    </div>
                    <div className="barre-boutons" style={{ marginTop: 12 }}>
                      <button type="button" className="bouton" onClick={() => onOuvrir(projet)}>
                        Ouvrir le relevé
                      </button>
                      <button type="button" className="bouton bouton--secondaire" onClick={() => setEdition(projet.id)}>
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="bouton bouton--secondaire"
                        onClick={() => projets.modifier(projet.id, { status: projet.status === "archived" ? "active" : "archived" })}
                      >
                        <Icone nom={projet.status === "archived" ? "retablir" : "supprimer"} />
                        {projet.status === "archived" ? "Restaurer" : "Archiver"}
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="colonne">
        <section className="carte" aria-labelledby="titre-nouveau-projet">
          <h2 id="titre-nouveau-projet">Nouveau projet</h2>
          <FormulaireProjet libelleValider="Créer le projet" onValider={(donnees) => projets.creer(donnees)} />
        </section>
      </div>
    </main>
  );
}
