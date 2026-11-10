import { normalizeReportClassification } from './reportClassification.js';
import { findHabitologieStage, findHabitologieControl, HABITOLOGIE_PROTOCOL_STAGES, LISTENING_TOPICS } from './habitologieProtocol.js';
import { protocolOptions } from './reportHtml.js';

export const observationGravities = ['Mineure', 'Moyenne', 'Severe', 'Critique'];

// Construct a new document from catalogue values only. Unknown and future fields stay private.
export function createTestReportCopy(report) {
  const classification = normalizeReportClassification({
    categorie: typeof report.categorie === 'string' ? report.categorie : '',
    sous_categorie: typeof report.sous_categorie === 'string' ? report.sous_categorie : '',
    report_type: report.report_type === 'habitologie' ? 'habitologie' : '',
  });
  const topics = report.ecoute?.sujets_identifies;
  const stages = HABITOLOGIE_PROTOCOL_STAGES.map(({key, controls}) => {
    const source = report.habitologie_protocoles?.[key];
    return [key, {
      enabled: source?.enabled !== false,
      controls: Object.fromEntries(controls
        .filter(control => typeof source?.controls?.[control.key] === 'boolean')
        .map(control => [control.key, source.controls[control.key]])),
    }];
  });
  return {
    categorie: classification.categorie,
    sous_categorie: classification.sous_categorie,
    titre: 'Copie pour les tests',
    reference_dossier: 'TEST-' + crypto.randomUUID(),
    proprietaire: 'Client fictif',
    adresse_logement: 'Adresse fictive',
    intervenant: 'Intervenant fictif',
    ecoute: { sujets_identifies: LISTENING_TOPICS.filter(topic => Array.isArray(topics) && topics.includes(topic.key)).map(topic => topic.key) },
    protocoles: Object.fromEntries(protocolOptions.map(({key}) => [key, report.protocoles?.[key] === true])),
    habitologie_protocoles: Object.fromEntries(stages),
    observations: (Array.isArray(report.observations) ? report.observations : []).map((obs, index) => ({
      id: 'test-' + (index + 1),
      titre: 'Observation fictive ' + (index + 1),
      observations: 'Constat de test',
      phase_habitologie: findHabitologieStage(obs?.phase_habitologie)?.key || '',
      controle_habitologie: findHabitologieControl(obs?.phase_habitologie, obs?.controle_habitologie)?.key || '',
      gravite: observationGravities.includes(obs?.gravite) ? obs.gravite : 'Mineure',
      photos: [],
    })),
  };
}
