import Icone from "./Icone.jsx";

/**
 * Encadré d'information (bleu clair) ou d'alerte (orange pâle). R12 : l'état n'est jamais porté par la couleur
 * seule : une icône ET un titre en toutes lettres sont toujours présents.
 * @param {{type?: "info"|"alerte", titre: string, children?: import("react").ReactNode}} props
 */
export default function Encadre({ type = "info", titre, children }) {
  return (
    <div className={type === "alerte" ? "encadre encadre--alerte" : "encadre"} role={type === "alerte" ? "alert" : "note"}>
      <Icone nom={type === "alerte" ? "alerte" : "info"} />
      <div>
        <div className="encadre__titre">{titre}</div>
        {children ? <div>{children}</div> : null}
      </div>
    </div>
  );
}
