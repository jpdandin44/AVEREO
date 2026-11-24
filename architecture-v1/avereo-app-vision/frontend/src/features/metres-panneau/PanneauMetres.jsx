// Panneau des métrés, recalculés à chaque modification (R27) : aucun bouton « Recalculer ».
import Encadre from "../../components/Encadre.jsx";
import { decrireErreur } from "../../domain/alertes.js";
import { formaterLongueur, formaterSurface, formaterVolume } from "../../domain/unites.js";

function Alertes({ erreurs }) {
  if (!erreurs || erreurs.length === 0) return null;
  return (
    <div className="liste-encadres">
      {erreurs.map((erreur, index) => {
        const d = decrireErreur(erreur);
        return (
          <Encadre key={`${d.code}-${index}`} type="alerte" titre={d.titre}>
            {d.libelle}
          </Encadre>
        );
      })}
    </div>
  );
}

function Ligne({ libelle, valeur }) {
  return (
    <tr>
      <td>{libelle}</td>
      <td className="valeur" data-testid={`metre-${libelle}`}>{valeur}</td>
    </tr>
  );
}

/** @param {{nomPiece?: string, metres: any, nomNiveau: string, metresNiveau: any}} props */
export default function PanneauMetres({ nomPiece, metres, nomNiveau, metresNiveau }) {
  return (
    <>
      <section className="carte" aria-labelledby="titre-metres-piece">
        <h2 id="titre-metres-piece">Métrés{nomPiece ? ` — ${nomPiece}` : ""}</h2>
        {!metres ? (
          <Encadre titre="Aucune pièce sélectionnée">Créez une pièce ou choisissez-en une dans la liste.</Encadre>
        ) : (
          <>
            {metres.valide ? (
              <table className="tableau">
                <thead>
                  <tr>
                    <th scope="col">Mesure</th>
                    <th scope="col" style={{ textAlign: "right" }}>Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  <Ligne libelle="Surface au sol" valeur={formaterSurface(metres.solM2)} />
                  <Ligne libelle="Périmètre" valeur={formaterLongueur(metres.perimetreM)} />
                  <Ligne libelle="Hauteur sous plafond" valeur={formaterLongueur(metres.hauteurM)} />
                  <Ligne libelle="Murs bruts" valeur={formaterSurface(metres.mursBrutsM2)} />
                  <Ligne libelle="Ouvertures" valeur={formaterSurface(metres.ouverturesM2)} />
                  <Ligne libelle="Murs nets" valeur={formaterSurface(metres.mursNetsM2)} />
                  <Ligne libelle="Plafond" valeur={formaterSurface(metres.plafondM2)} />
                  <Ligne libelle="Volume" valeur={formaterVolume(metres.volumeM3)} />
                  <Ligne libelle="Plinthes" valeur={formaterLongueur(metres.plinthesM)} />
                </tbody>
              </table>
            ) : null}
            <Alertes erreurs={metres.erreurs} />
          </>
        )}
      </section>

      <section className="carte" aria-labelledby="titre-metres-niveau">
        <h2 id="titre-metres-niveau">Total — {nomNiveau}</h2>
        {metresNiveau && metresNiveau.valide !== false ? (
          <table className="tableau">
            <tbody>
              <Ligne libelle="Surface au sol" valeur={formaterSurface(metresNiveau.solM2 ?? 0)} />
              <Ligne libelle="Murs bruts" valeur={formaterSurface(metresNiveau.mursBrutsM2 ?? 0)} />
              <Ligne libelle="Murs nets" valeur={formaterSurface(metresNiveau.mursNetsM2 ?? 0)} />
              <Ligne libelle="Volume" valeur={formaterVolume(metresNiveau.volumeM3 ?? 0)} />
            </tbody>
          </table>
        ) : (
          <Encadre type="alerte" titre="Total du niveau indisponible">
            Une pièce du niveau a un contour non valide : corrigez-la pour obtenir le total.
          </Encadre>
        )}
      </section>
    </>
  );
}
