import { useEffect, useId, useRef } from "react";

/** @param {{titre: string, onFermer: () => void, children: any, sansFermer?: boolean}} props  sansFermer : la boîte a déjà son propre bouton « Annuler ». */
export default function Dialogue({ titre, onFermer, children, sansFermer = false }) {
  const ref = useRef(null), id = useId();
  useEffect(() => {
    const precedent = document.activeElement;
    ref.current.showModal();
    return () => { precedent?.focus(); };
  }, []);
  return <dialog ref={ref} className="terrain-dialogue" aria-labelledby={id} onCancel={e => { e.preventDefault(); onFermer(); }}>
    <h2 id={id}>{titre}</h2>
    {children}
    {sansFermer ? null : <button className="bouton bouton--secondaire" type="button" onClick={onFermer}>Fermer</button>}
  </dialog>;
}
