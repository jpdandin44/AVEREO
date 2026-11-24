import React, { useEffect, useRef } from 'react';
import { DEFAULT_CATEGORY, HABITOLOGIE_CATEGORY } from './reportClassification.js';

export default function ReportTypeChooser({ canChooseTechnical, onChoose, onClose }) {
  const dialog = useRef(null), close = useRef(null);
  useEffect(() => {
    const previous = document.activeElement, element = dialog.current;
    element.showModal(); close.current?.focus();
    return () => { element.close(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="report-type-dialog" aria-labelledby="report-type-title"
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="modal-header"><h2 id="report-type-title">Choisir le type de rapport</h2>
      <button ref={close} className="button secondary" type="button" onClick={onClose}>Annuler</button></div>
    <p>Ce choix concerne le nouveau dossier. Votre brouillon reste conservé tant que vous n’avez pas confirmé sa création.</p>
    <div className="choice-grid">
      <button className="choice-card" type="button" onClick={() => onChoose(HABITOLOGIE_CATEGORY)}>
        <strong>Analyse globale</strong><span>Parcours complet : écoute client, Terrain, Eau, Air, Terre, Feu, attentes et interventions.</span>
      </button>
      <button className="choice-card" type="button" disabled={!canChooseTechnical} onClick={() => onChoose(DEFAULT_CATEGORY)}>
        <strong>Rapport Technique</strong><span>Parcours expert en trois étapes : Mission, Constats, Rapport. Choix de la spécialité dans Mission.</span>
      </button>
    </div>
    {!canChooseTechnical && <p role="status">Rapport Technique nécessite une habilitation de ce compte CONNECT. Le profil professionnel ne suffit pas.</p>}
  </dialog>;
}
