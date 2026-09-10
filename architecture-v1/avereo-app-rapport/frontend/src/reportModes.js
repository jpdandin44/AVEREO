export const REPORT_TYPES = Object.freeze({
  TECHNICAL: 'technical',
  HABITOLOGIE: 'habitologie',
});

export const REPORT_SCHEMA_VERSION = 1;

export const HABITOLOGIE_STEPS = Object.freeze([
  'Client',
  'Bien immobilier',
  'Risques',
  'Analyse',
  'Aides',
  'Synthese',
]);

const emptyHabitologieSections = () => ({
  client: {},
  bien: {},
  risques: {},
  analyse: {},
  aides: {},
  synthese: {},
});

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function resolveReportType(report) {
  return report?.report_type === REPORT_TYPES.HABITOLOGIE
    ? REPORT_TYPES.HABITOLOGIE
    : REPORT_TYPES.TECHNICAL;
}

export function applyReportMetadata(report, reportType = REPORT_TYPES.TECHNICAL) {
  const normalizedType = reportType === REPORT_TYPES.HABITOLOGIE
    ? REPORT_TYPES.HABITOLOGIE
    : REPORT_TYPES.TECHNICAL;

  return {
    ...report,
    report_type: normalizedType,
    schema_version: REPORT_SCHEMA_VERSION,
  };
}

export function createHabitologieReport(dateVisite = new Date().toISOString().slice(0, 10)) {
  return applyReportMetadata(
    {
      titre: "Rapport d'habitologie",
      reference_dossier: '',
      date_visite: dateVisite,
      updatedAt: '',
      habitologie: emptyHabitologieSections(),
    },
    REPORT_TYPES.HABITOLOGIE,
  );
}

export function normalizeHabitologieReport(incoming = {}) {
  const sections = emptyHabitologieSections();
  const incomingSections = isRecord(incoming?.habitologie) ? incoming.habitologie : {};

  for (const section of Object.keys(sections)) {
    const incomingSection = isRecord(incomingSections[section]) ? incomingSections[section] : {};
    sections[section] = {
      ...sections[section],
      ...incomingSection,
    };
  }

  return applyReportMetadata(
    {
      ...createHabitologieReport(),
      ...incoming,
      habitologie: sections,
    },
    REPORT_TYPES.HABITOLOGIE,
  );
}
