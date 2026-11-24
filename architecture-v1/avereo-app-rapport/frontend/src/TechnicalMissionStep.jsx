import React, { useState } from 'react';
import VoiceField from './VoiceField.jsx';
import { technicalMission, technicalReportTypes } from './technicalReport.js';
import { appendDictation } from './dictationText.js';

export default function TechnicalMissionStep({ report, setReport, site, protocols }) {
  const [showSite, setShowSite] = useState(false);
  const [showProtocols, setShowProtocols] = useState(false);
  const mission = technicalMission(report);
  const field = (key, label, type = 'text') => <label className="field"><span>{label}</span>
    <input id={key === 'adresse_logement' ? 'adresse-logement' : undefined} type={type} value={report[key] || ''}
      onChange={event => setReport(current => ({ ...current, [key]: event.target.value }))} /></label>;
  const update = (key, value) => setReport(current => ({ ...current,
    mission_technique: { ...current.mission_technique, [key]: value } }));
  return <section className="panel technical-mission">
    <div className="section-title"><div><h1>Mission</h1><p>Le client, le bien et le périmètre de la visite technique.</p></div></div>
    <div className="form-grid two">
      <label className="field"><span>Type de rapport technique</span>
        <select value={report.sous_categorie || ''} onChange={event => setReport(current => ({ ...current, sous_categorie: event.target.value }))}>
          {technicalReportTypes(report.sous_categorie).map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
      </label>
      {field('titre', 'Titre du rapport')}
      {field('reference_dossier', 'Référence du dossier')}{field('date_visite', 'Date de visite', 'date')}
      {field('proprietaire', 'Nom du propriétaire')}{field('email', 'Email', 'email')}
      {field('adresse_logement', 'Adresse du logement')}{field('intervenant', 'Intervenant')}
    </div>
    {Object.entries({ objet: 'Objet de la mission', perimetre: 'Périmètre de la visite', limites: 'Limites et parties non accessibles' }).map(([key, label]) =>
      <VoiceField key={key} label={label} value={mission[key]}
        onChange={value => update(key, value)} onAppend={text => update(key, appendDictation(mission[key], text))} />)}
    <details onToggle={event => setShowSite(event.currentTarget.open)}>
      <summary>Compléments sur le bien, cadastre et risques</summary>{showSite && site}
    </details>
    <details onToggle={event => setShowProtocols(event.currentTarget.open)}>
      <summary>Préparation et protocole de visite</summary>{showProtocols && protocols}
    </details>
  </section>;
}
