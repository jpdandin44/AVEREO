import { useId } from "react";
import BoutonDictee from "../../components/BoutonDictee.jsx";

/**
 * Champ de saisie avec libellé, aide et message d'erreur (R12 : l'erreur a un texte, pas seulement une couleur).
 * @param {{libelle: string, valeur: string, onChange: (v: string) => void, aide?: string, erreur?: string,
 *   onBlur?: () => void, onKeyDown?: (e: import("react").KeyboardEvent) => void, inputMode?: string,
 *   dictee?: boolean}} props dictee : bouton « Dicter » (dictée du système de l'appareil) pour les champs libres
 */
export default function Champ({ libelle, valeur, onChange, aide, erreur, onBlur, onKeyDown, inputMode = "decimal", dictee = false }) {
  const id = useId();
  return (
    <div className="champ">
      <label className="champ__libelle" htmlFor={id}>
        {libelle}
      </label>
      <input
        id={id}
        className="champ__saisie"
        type="text"
        inputMode={inputMode}
        value={valeur}
        aria-invalid={erreur ? "true" : "false"}
        aria-describedby={erreur || aide ? `${id}-aide` : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      {dictee ? <BoutonDictee cibleId={id} /> : null}
      {erreur ? (
        <span id={`${id}-aide`} className="champ__aide" role="alert">
          Erreur : {erreur}
        </span>
      ) : aide ? (
        <span id={`${id}-aide`} className="champ__aide">
          {aide}
        </span>
      ) : null}
    </div>
  );
}
