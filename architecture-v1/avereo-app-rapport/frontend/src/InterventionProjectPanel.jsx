import React from 'react';
import ScreenDisclosure from './ScreenDisclosure.jsx';
import { normalizeDecision } from './decisionSupport.js';
import { buildInterventionProject, interventionPlanningError, projectSettings, projectSelection } from './interventionProject.js';
import './interventionProject.css';

const dateLabel = date => new Intl.DateTimeFormat('fr-FR').format(date);

export default function InterventionProjectPanel({ report, setReport }) {
  const d = normalizeDecision(report.decision), settings = projectSettings(report), selected = projectSelection(report);
  const malformed = interventionPlanningError(report, true);
  let result, issue;
  try { result = buildInterventionProject(report); } catch (error) { issue = error.message; }
  const updateSettings = (key, value) => setReport(previous => ({ ...previous, decision: { ...previous.decision,
    planning_projet: { ...projectSettings(previous), [key]: value } } }));
  const updateAction = (index, key, value) => setReport(previous => ({ ...previous, decision: { ...previous.decision,
    actions: previous.decision.actions.map((action, i) => i === index ? { ...action, planning_projet: { ...action.planning_projet, [key]: value } } : action) } }));
  const download = () => {
    const current = buildInterventionProject(report);
    const url = URL.createObjectURL(new Blob([current.json], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'avereo-projet-interventions.json';
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <ScreenDisclosure name="interventions-project" title="Planning informatif et Projet"
    summary={`${selected.length} intervention(s) sélectionnée(s) pour Projet · ${result ? 'Aperçu disponible' : 'Estimations à compléter'}`}>
    <p>Préparez une copie des interventions pour votre espace Projet. Les estimations suivent la sauvegarde du dossier Rapport ; elles n’autorisent pas les travaux.</p>
    {malformed ? <p role="alert" className="issue-list danger">{malformed} Conservez le JSON complet avant toute correction.</p> : <>
      <div className="form-grid two">
        <label className="field">Titre du projet<input maxLength={200} value={settings.titre} onChange={e => updateSettings('titre', e.target.value)} /></label>
        <label className="field">Date de départ<input type="date" value={settings.date_debut} onChange={e => updateSettings('date_debut', e.target.value)} /></label>
        <label className="field">Capacité par semaine (jours-personne)<input type="text" inputMode="decimal" maxLength={20} placeholder="À estimer" value={settings.capacite_semaine} onChange={e => updateSettings('capacite_semaine', e.target.value)} /></label>
        <label className="field">Date cible facultative<input type="date" value={settings.date_cible} onChange={e => updateSettings('date_cible', e.target.value)} /></label>
      </div>
      <p className="muted">Une charge de 2 jours-personne représente deux journées de travail pour une personne. La capacité hebdomadaire sert au calcul ; les interventions se suivent, sans travail simultané supposé. Calendrier du lundi au vendredi, jours fériés non déduits. La date cible ne raccourcit pas les charges.</p>
      <div className="project-estimates">{d.actions.map((action, index) => <fieldset key={`${action.id}-${index}`}>
        <legend>Intervention {index + 1} · {action.intitule || 'Intitulé à préciser'}</legend>
        <label className="decision-check"><input type="checkbox" checked={action.planning_projet?.inclure === true} onChange={e => updateAction(index, 'inclure', e.target.checked)} />Inclure dans le fichier Projet</label>
        {action.planning_projet?.inclure === true && <div className="form-grid two">
          <label className="field">Charge estimée (jours-personne)<input type="text" inputMode="decimal" maxLength={20} value={action.planning_projet.charge || ''} placeholder="À estimer" onChange={e => updateAction(index, 'charge', e.target.value)} /></label>
          <label className="field">Ne pas commencer avant (facultatif)<input type="date" value={action.planning_projet.debut_minimal || ''} onChange={e => updateAction(index, 'debut_minimal', e.target.value)} /></label>
          <label className="field">Intervenant pressenti (facultatif)<input maxLength={200} value={action.planning_projet.responsable || ''} onChange={e => updateAction(index, 'responsable', e.target.value)} /></label>
        </div>}
      </fieldset>)}</div>
      {issue && <p role="status" className="issue-list warning">{issue}</p>}
      {result && <div className="intervention-gantt" aria-label="Aperçu du planning informatif">
        <p><strong>Estimation : {dateLabel(result.schedule.projectStart)} au {dateLabel(result.schedule.projectEnd)}</strong> · {result.schedule.totalDuration} jour(s)-personne au total.</p>
        {result.project.targetDate && result.schedule.projectEnd.getFullYear() + '-' + String(result.schedule.projectEnd.getMonth() + 1).padStart(2, '0') + '-' + String(result.schedule.projectEnd.getDate()).padStart(2, '0') > result.project.targetDate && <p className="issue-list warning">L’estimation dépasse la date cible ; les charges ne sont pas compressées.</p>}
        {result.schedule.tasks.map(task => <div className="intervention-gantt-row" key={task.id}>
          <span><strong>{task.name}</strong><small>{dateLabel(task.calcStart)} → {dateLabel(task.calcEnd)} · {task.duration} j-personne</small></span>
          <div className="intervention-gantt-track"><span style={{ marginLeft: `${task.startOffset / result.schedule.totalWorkDays * 100}%`, width: `${(task.endOffset - task.startOffset) / result.schedule.totalWorkDays * 100}%` }} /></div>
        </div>)}
        <p className="muted">Barres en jours ouvrés. Dates calculées sous ces hypothèses, à discuter ; aucun engagement ni avancement n’est déduit.</p>
      </div>}
      <p>Le fichier contient les interventions cochées, leurs modalités et préalables, les références des constats/attentes et les estimations affichées. Il est destiné à votre espace professionnel ; la sélection client du rapport reste indépendante. Photos, plans, signature, coordonnées des habitants et notes d’écoute restent dans Rapport.</p>
      <button type="button" className="button secondary" disabled={!result} onClick={download}>Télécharger pour Projet</button>
      <p>Dans Projet : <strong>Mes projets → Importer un projet</strong>, puis choisissez ce fichier pour créer un projet indépendant. Cette opération ne remplace pas votre projet existant. Les modifications ultérieures dans Projet et Rapport restent indépendantes.</p>
    </>}
  </ScreenDisclosure>;
}
