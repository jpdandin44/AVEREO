const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const measure = value => typeof value === 'string' || typeof value === 'number' ? value : '';
const empty = () => ({ temperatureC: '', humiditePct: '' });

// Old weather measurements described the selected environment. Freeze that
// attribution before switching environments; mixed historic values stay unlocated.
export function siteConditions(report) {
  const stored = object(report?.conditions_site);
  if (report?.conditions_site != null) return {
    ...stored,
    interieur: { ...empty(), co2Ppm: '', ...object(stored.interieur) },
    exterieur: { ...empty(), ...object(stored.exterieur) },
  };
  const legacy = { temperatureC: measure(report?.meteo?.temperatureC), humiditePct: measure(report?.meteo?.humiditePct) };
  return {
    interieur: { ...empty(), co2Ppm: '', ...(report?.environnement === 'Interieur' ? legacy : {}) },
    exterieur: { ...empty(), ...(report?.environnement === 'Exterieur' ? legacy : {}) },
    ...(!['Interieur', 'Exterieur'].includes(report?.environnement) && Object.values(legacy).some(value => value !== '')
      ? { historique: legacy } : {}),
  };
}

export function withSiteConditions(report) {
  return { ...report, conditions_site: siteConditions(report) };
}

export function updateSiteCondition(report, context, key, value) {
  if (!['interieur', 'exterieur'].includes(context) || !['temperatureC', 'humiditePct', 'co2Ppm'].includes(key)) return report;
  const conditions = siteConditions(report);
  return { ...report, conditions_site: { ...conditions, [context]: { ...conditions[context], [key]: value } } };
}

function numeric(value, humidity = false) {
  if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') return null;
  const number = Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(number) && (!humidity || number >= 0 && number <= 100) ? number : null;
}

export function siteConditionDifferences(report) {
  const conditions = siteConditions(report);
  const difference = (key, humidity) => {
    const inside = numeric(conditions.interieur[key], humidity), outside = numeric(conditions.exterieur[key], humidity);
    return inside === null || outside === null ? null : Math.round((inside - outside) * 100) / 100;
  };
  return { temperatureC: difference('temperatureC', false), humiditePoints: difference('humiditePct', true) };
}

export function conditionMeasurements(value, includeCo2 = false) {
  const item = object(value);
  return [['temperatureC', 'Température', '°C'], ['humiditePct', 'Humidité relative', '%'],
    ...(includeCo2 ? [['co2Ppm', 'CO₂', 'ppm']] : [])]
    .filter(([key]) => ['string', 'number'].includes(typeof item[key]) && String(item[key]).trim() !== '')
    .map(([key, label, unit]) => `${label} : ${item[key]} ${unit}`).join(' · ');
}

export function siteConditionRows(report) {
  const conditions = siteConditions(report), rows = [];
  const inside = conditionMeasurements(conditions.interieur, true);
  const outside = [conditionMeasurements(conditions.exterieur),
    ...[['ciel', 'Ciel'], ['pluie', 'Pluie'], ['vent', 'Vent']].map(([key, label]) => report?.meteo?.[key] ? `${label} : ${report.meteo[key]}` : '')].filter(Boolean).join(' · ');
  if (inside) rows.push(['Conditions intérieures', inside]);
  if (outside) rows.push(['Conditions extérieures', outside]);
  if (report?.environnement === 'Mixte') {
    const delta = siteConditionDifferences(report);
    const values = [delta.temperatureC !== null ? `Température : ${delta.temperatureC} °C` : '',
      delta.humiditePoints !== null ? `Humidité relative : ${delta.humiditePoints} point(s)` : ''].filter(Boolean);
    if (values.length) rows.push(['Écarts intérieur − extérieur', values.join(' · ')]);
  }
  const historic = conditionMeasurements(conditions.historique);
  if (historic) rows.push(['Mesures historiques non localisées', historic]);
  return rows;
}
