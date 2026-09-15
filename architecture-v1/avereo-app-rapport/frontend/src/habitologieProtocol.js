export const HABITOLOGIE_PROTOCOL_STAGES = Object.freeze([
  {
    key: 'eau',
    label: 'Eau',
    summary: "Rechercher les apports d'eau, les infiltrations et les désordres liés à l'humidité.",
    controls: Object.freeze([
      { key: 'infiltrations', label: "Infiltrations et traces d'eau" },
      { key: 'apports_evacuations', label: "Apports, usages et évacuations d'eau" },
      { key: 'toiture_eaux_pluviales', label: 'Toiture et gestion des eaux pluviales' },
      { key: 'humidite', label: 'Humidité, condensation et moisissures' },
    ]),
  },
  {
    key: 'air',
    label: 'Air',
    summary: "Vérifier le renouvellement d'air, le fonctionnement et la qualité de l'installation.",
    controls: Object.freeze([
      { key: 'presence_ventilation', label: "Présence d'une VMC ou d'un autre système de ventilation" },
      { key: 'fonctionnement_ventilation', label: 'Type et fonctionnement de la ventilation' },
      { key: 'installation_entretien', label: "Qualité de l'installation et état d'entretien" },
      { key: 'circulation_air', label: "Entrées, transferts et sorties d'air" },
    ]),
  },
  {
    key: 'terre',
    label: 'Terre',
    summary: "Examiner les interfaces de l'enveloppe et les transferts d'air et de vapeur d'eau.",
    controls: Object.freeze([
      { key: 'interfaces', label: 'Interfaces entre sols, murs, toiture et menuiseries' },
      { key: 'etancheite_air', label: "Continuité de l'étanchéité à l'air" },
      { key: 'vapeur_eau', label: "Gestion de la vapeur d'eau dans les parois" },
      { key: 'isolation_ponts', label: "Continuité de l'isolation et ponts thermiques visibles" },
    ]),
  },
  {
    key: 'feu',
    label: 'Feu',
    summary: 'Étudier la production, la diffusion et la régulation de la chaleur ainsi que le confort ressenti.',
    controls: Object.freeze([
      { key: 'systeme_chauffage', label: 'Système de production de chauffage' },
      { key: 'emetteurs', label: 'Radiateurs et autres émetteurs' },
      { key: 'regulation', label: 'Régulation, programmation et commandes' },
      { key: 'etat_entretien', label: 'État apparent et entretien du système' },
      { key: 'ressenti', label: 'Ressenti des occupants et confort thermique' },
    ]),
  },
]);

export function createHabitologieProtocolState() {
  return Object.fromEntries(
    HABITOLOGIE_PROTOCOL_STAGES.map((stage) => [
      stage.key,
      {
        enabled: true,
        // An absent choice follows the listening suggestions; an explicit boolean wins.
        controls: {},
      },
    ]),
  );
}

export function mergeHabitologieProtocolState(value = {}) {
  const defaults = createHabitologieProtocolState();
  return Object.fromEntries(
    HABITOLOGIE_PROTOCOL_STAGES.map((stage) => [
      stage.key,
      {
        ...defaults[stage.key],
        ...(value?.[stage.key] || {}),
        enabled: value?.[stage.key]?.enabled !== false,
        controls: {
          ...defaults[stage.key].controls,
          ...(value?.[stage.key]?.controls || {}),
        },
      },
    ]),
  );
}

export function findHabitologieStage(stageKey) {
  return HABITOLOGIE_PROTOCOL_STAGES.find((stage) => stage.key === stageKey) || null;
}

export function findHabitologieControl(stageKey, controlKey) {
  return findHabitologieStage(stageKey)?.controls.find((control) => control.key === controlKey) || null;
}

export const LISTENING_TOPICS = Object.freeze([
  { key: 'infiltrations', label: "Entrées d'eau, fuite ou toiture", controls: ['eau.infiltrations', 'eau.apports_evacuations', 'eau.toiture_eaux_pluviales'] },
  { key: 'humidite', label: 'Humidité, condensation ou moisissures', controls: ['eau.humidite', 'air.presence_ventilation', 'terre.vapeur_eau'] },
  { key: 'air', label: "Air intérieur, odeurs ou ventilation", controls: ['air.presence_ventilation', 'air.fonctionnement_ventilation', 'air.installation_entretien', 'air.circulation_air'] },
  { key: 'enveloppe', label: "Courants d'air, parois froides ou isolation", controls: ['terre.interfaces', 'terre.etancheite_air', 'terre.isolation_ponts'] },
  { key: 'chauffage', label: 'Chauffage, radiateurs ou réglages', controls: ['feu.systeme_chauffage', 'feu.emetteurs', 'feu.regulation', 'feu.etat_entretien', 'feu.ressenti'] },
  { key: 'confort', label: 'Confort thermique ou consommations', controls: ['feu.ressenti', 'feu.regulation', 'terre.isolation_ponts'] },
]);

export function listeningSuggestions(ecoute, stageKey, controlKey) {
  const topics = Array.isArray(ecoute?.sujets_identifies) ? ecoute.sujets_identifies : [];
  return LISTENING_TOPICS.filter((topic) => topics.includes(topic.key) && topic.controls.includes(`${stageKey}.${controlKey}`));
}

export function isHabitologieControlSelected(report, stageKey, controlKey) {
  if (!isHabitologieStageEnabled(report, stageKey)) return false;
  const choice = report.habitologie_protocoles?.[stageKey]?.controls?.[controlKey];
  return typeof choice === 'boolean' ? choice : listeningSuggestions(report.ecoute, stageKey, controlKey).length > 0;
}

export function isHabitologieStageEnabled(report, stageKey) {
  return Boolean(findHabitologieStage(stageKey)) && report.habitologie_protocoles?.[stageKey]?.enabled !== false;
}

export function setHabitologieStageEnabled(report, stageKey, enabled) {
  const stage = findHabitologieStage(stageKey);
  if (!stage || typeof enabled !== 'boolean' || isHabitologieStageEnabled(report, stageKey) === enabled) return report;
  const previous = report.habitologie_protocoles?.[stageKey] || {};
  // Freeze the effective choices before suspending them, including listening suggestions.
  // Later listening changes must not silently change the restored visit scope.
  const controls = enabled ? previous.controls : {
    ...previous.controls,
    ...Object.fromEntries(stage.controls.map((control) => [
      control.key, isHabitologieControlSelected(report, stageKey, control.key),
    ])),
  };
  return {
    ...report,
    habitologie_protocoles: {
      ...report.habitologie_protocoles,
      [stageKey]: { ...previous, enabled, controls: controls || {} },
    },
  };
}
