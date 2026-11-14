import React, { useEffect, useRef, useState } from 'react';
import VoiceField from './VoiceField.jsx';
import { appendDictation } from './dictationText.js';
import { isHabitologueProfile } from './reportProfiles.js';
import { readPlanFile } from './observationPlans.js';
import { safeEmbeddedImageSource } from './reportHtml.js';
import { environmentContext, contextText, newEnvironmentContext, changeEnvironmentContext, removeEnvironmentContext } from './environmentContext.js';

export default function EnvironmentContext({ report, setReport, onPhotoTransfer }) {
  const value = environmentContext(report), readGeneration = useRef(0);
  const [message, setMessage] = useState(''), [reading, setReading] = useState(false);
  const id = value?.id;
  useEffect(() => { setReading(false); return () => { readGeneration.current++; }; }, [id, report.reference_dossier, report.onlineReportId]);
  if (!isHabitologueProfile(report)) return null;
  const update = patch => setReport(previous => changeEnvironmentContext(previous, id, patch));
  const photoAllowed = report.ecoute?.consentement_photos === true;
  const dictationAllowed = report.ecoute?.consentement_dictee === true;
  const plan = (report.plans || []).find(item => item.id === value?.planId);
  const photoSource = safeEmbeddedImageSource(value?.photo?.src);
  const voice = (field, label) => <VoiceField key={field} label={label} value={contextText(value, field)} rows={3}
    micDisabled={!dictationAllowed} onChange={text => update({ [field]: text })}
    onAppend={text => update(current => ({ [field]: appendDictation(contextText(current, field), text) }))} />;
  async function addPhoto(file) {
    if (!file || !photoAllowed) return;
    const generation = ++readGeneration.current;
    onPhotoTransfer(1);
    setReading(true); setMessage('');
    try {
      const image = await readPlanFile(file);
      if (generation !== readGeneration.current) return;
      setReport(previous => previous.ecoute?.consentement_photos === true
        ? changeEnvironmentContext(previous, id, { photo: { id: image.id, name: file.name.slice(0, 200), src: image.src,
          width: image.width, height: image.height, source: '', caption: '', horodatageISO: new Date().toISOString() } }) : previous);
    } catch (error) { if (generation === readGeneration.current) setMessage(error.message); }
    finally { onPhotoTransfer(-1); if (generation === readGeneration.current) setReading(false); }
  }
  return <section className="site-insight environment-context" aria-label="Contexte Environnement / Terrain">
    <h2>Contexte Environnement / Terrain</h2>
    <p>Décrivez les abords du bien. Ce contexte est séparé des observations Eau, Air, Terre et Feu ; leurs numéros restent inchangés.</p>
    {!value ? <button type="button" className="button secondary" onClick={() => setReport(previous => environmentContext(previous) ? previous
      : { ...previous, contexte_exterieur: newEnvironmentContext(crypto.randomUUID()) })}>Renseigner le contexte extérieur</button> : <>
      <div className="form-grid two">
        <label>Titre du contexte<input value={contextText(value, 'titre')} maxLength={200} onChange={event => update({ titre: event.target.value })} /></label>
        <label>Zone extérieure<input value={contextText(value, 'zone')} maxLength={200} placeholder="Ex. abords, jardin, accès" onChange={event => update({ zone: event.target.value })} /></label>
      </div>
      {voice('constat', 'Constat du contexte extérieur')}
      {voice('explications', 'Explications du contexte extérieur (liens et URL possibles)')}
      {voice('conseils', 'Conseils habitologue pour le contexte extérieur')}
      <label>Vue associée au contexte (facultative)<select value={contextText(value, 'planId')} onChange={event => update({ planId: event.target.value })}>
        <option value="">Aucune vue associée</option>
        {value.planId && !plan && <option value={value.planId}>Vue indisponible — référence conservée</option>}
        {(report.plans || []).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select></label>
      <p>Les vues se chargent dans Observations → Repérage sur les plans. Ce lien n’ajoute aucun repère numéroté.</p>
      <label>Photo du contexte (PNG ou JPEG, 4 Mio maximum)<input type="file" accept="image/png,image/jpeg" disabled={!photoAllowed || reading}
        onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; addPhoto(file); }} /></label>
      {!photoAllowed && <p>Enregistrez l’accord photo dans Dossier pour ajouter une photo.</p>}
      {reading && <p role="status">Lecture de la photo du contexte…</p>}
      {message && <p role="alert">{message}</p>}
      {photoSource && <>
        <details><summary>Voir la photo du contexte</summary><img src={photoSource} alt={value.photo.name || 'Photo du contexte extérieur'} style={{ maxWidth: '100%', maxHeight: 600, objectFit: 'contain' }} /></details>
        <div className="form-grid two">
          <label>Légende de la photo<input value={contextText(value.photo, 'caption')} onChange={event => update(current => ({ photo: { ...current.photo, caption: event.target.value } }))} /></label>
          <label>Source de la photo<input value={contextText(value.photo, 'source')} maxLength={1000} onChange={event => update(current => ({ photo: { ...current.photo, source: event.target.value } }))} /></label>
        </div>
        <button type="button" className="button ghost" onClick={() => { readGeneration.current++; setReading(false); update({ photo: null }); }}>Retirer la photo du contexte</button>
      </>}
      <label className="context-client-choice"><input type="checkbox" checked={value.includeInClient === true} onChange={event => update({ includeInClient: event.target.checked })} /> Inclure ce contexte dans la synthèse client</label>
      <p>Le contexte renseigné figure dans le rapport expert. Son ajout à la synthèse client est indépendant des trois observations sélectionnées.</p>
      <button type="button" className="button ghost" onClick={() => { readGeneration.current++; setReading(false); setReport(previous => removeEnvironmentContext(previous, id)); }}>Supprimer le contexte extérieur</button>
    </>}
  </section>;
}
