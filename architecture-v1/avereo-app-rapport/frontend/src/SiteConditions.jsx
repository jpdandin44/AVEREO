import React from 'react';
import { siteConditions, siteConditionDifferences, conditionMeasurements, updateSiteCondition, withSiteConditions } from './siteConditions.js';
import './siteConditions.css';

function Measurement({ label, unit, value, onChange, min, max, step = 'any' }) {
  return <label className="field">{label} ({unit})<input type="number" step={step} min={min} max={max} value={value} onChange={e => onChange(e.target.value)} /></label>;
}

export default function SiteConditions({ report, setReport }) {
  const conditions = siteConditions(report), delta = siteConditionDifferences(report);
  const update = (context, key, value) => setReport(previous => updateSiteCondition(previous, context, key, value));
  const weather = (key, value) => setReport(previous => ({ ...previous, meteo: { ...previous.meteo, [key]: value } }));
  return <div className="site-conditions">
    <div className="segmented" aria-label="Environnement analysé">
      {[['Interieur', 'Intérieur'], ['Exterieur', 'Extérieur'], ['Mixte', 'Mixte']].map(([key, label]) =>
        <button key={key} type="button" className={report.environnement === key ? 'selected' : ''} aria-pressed={report.environnement === key}
          onClick={() => setReport(previous => ({ ...withSiteConditions(previous), environnement: key }))}>{label}</button>)}
    </div>
    {report.environnement !== 'Exterieur' && <fieldset><legend>Conditions intérieures</legend><div className="form-grid three">
      <Measurement label="Température intérieure" unit="°C" value={conditions.interieur.temperatureC} onChange={v => update('interieur', 'temperatureC', v)} />
      <Measurement label="Humidité relative intérieure" unit="%" min="0" max="100" value={conditions.interieur.humiditePct} onChange={v => update('interieur', 'humiditePct', v)} />
      <Measurement label="CO₂ intérieur" unit="ppm" min="0" step="1" value={conditions.interieur.co2Ppm} onChange={v => update('interieur', 'co2Ppm', v)} />
    </div></fieldset>}
    {report.environnement !== 'Interieur' && <fieldset><legend>Conditions extérieures</legend><div className="form-grid five">
      <label className="field">Ciel<select value={report.meteo.ciel} onChange={e => weather('ciel', e.target.value)}>
        <option value="">Non renseigné</option>{['Clair','Nuageux','Pluvieux','Orageux'].map(value => <option key={value}>{value}</option>)}</select></label>
      <Measurement label="Température extérieure" unit="°C" value={conditions.exterieur.temperatureC} onChange={v => update('exterieur', 'temperatureC', v)} />
      <Measurement label="Humidité relative extérieure" unit="%" min="0" max="100" value={conditions.exterieur.humiditePct} onChange={v => update('exterieur', 'humiditePct', v)} />
      <label className="field">Pluie<select value={report.meteo.pluie} onChange={e => weather('pluie', e.target.value)}>
        <option value="">Non renseignée</option>{['Aucune','Fine','Moderee','Forte'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="field">Vent<input value={report.meteo.vent} onChange={e => weather('vent', e.target.value)} /></label>
    </div></fieldset>}
    {report.environnement === 'Mixte' && <div className="site-differences" role="status" aria-label="Écarts intérieur extérieur">
      <strong>Écarts intérieur − extérieur</strong>
      <p>Température : {delta.temperatureC === null ? 'renseigner les deux températures' : `${delta.temperatureC} °C`}.</p>
      <p>Humidité relative : {delta.humiditePoints === null ? 'renseigner les deux humidités' : `${delta.humiditePoints} point(s)`}.</p>
    </div>}
    {conditionMeasurements(conditions.historique) && <p className="notice">Mesures historiques non localisées : {conditionMeasurements(conditions.historique)}. Elles sont conservées ; précisez les valeurs intérieures et extérieures pour calculer un écart.</p>}
  </div>;
}
