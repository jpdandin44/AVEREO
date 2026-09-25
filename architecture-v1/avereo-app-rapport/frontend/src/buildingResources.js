import { locationConfirmed } from './locationMap.js';

export const BUILDING_SOURCES = [
  { key: 'gorenove', name: 'GoRénove', description: 'Données publiées sur le bâtiment et indicateurs simulés : vérifiez leur nature et leur date.', links: [
    ['Rechercher sur GoRénove', 'https://gorenove.fr/'],
  ] },
  { key: 'proreno', name: 'Pro’Réno', description: 'Comprendre une typologie de bâti. Une ressource complémentaire, même si GoRénove fournit des données.', links: [
    ['Typologies de maisons', 'https://www.proreno.fr/documents/arborescence-des-fiches-typologie-de-maisons-individuelles'],
    ['Typologies de collectifs', 'https://www.proreno.fr/documents/arborescence-des-fiches-typologie-de-logements-collectifs'],
  ] },
];

const text = (value, max = 4000) => typeof value === 'string' ? value.slice(0, max) : '';
const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export const emptyBuildingResources = () => Object.fromEntries(BUILDING_SOURCES.map(({ key }) => [key,
  { url: '', consultedOn: '', notes: '', location: null },
]));

// Allow only public resource routes, never credentials, arbitrary hosts or redirects.
export function safeBuildingResourceUrl(source, value) {
  if (typeof value !== 'string' || value.length > 4000 || /[\u0000-\u001f\u007f\\]/.test(value)) return '';
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return '';
    if (source === 'gorenove' && ['gorenove.fr', 'www.gorenove.fr'].includes(url.hostname)
      && url.pathname === '/fiche-batiment' && url.searchParams.getAll('id').length === 1
      && /^[a-zA-Z0-9_-]{1,100}$/.test(url.searchParams.get('id') || '')) {
      return `https://gorenove.fr/fiche-batiment?id=${encodeURIComponent(url.searchParams.get('id'))}&origin=adresse`;
    }
    if (source !== 'proreno') return '';
    if (['proreno.fr', 'www.proreno.fr'].includes(url.hostname)) {
      if (/^\/documents\/[a-zA-Z0-9-]+\/?$/.test(url.pathname)) return `https://www.proreno.fr${url.pathname}`;
      if (url.pathname === '/pdf') return safeBuildingResourceUrl(source, url.searchParams.get('file'));
    }
    if (['media.proreno.fr', 'www.proreno.fr', 'proreno.fr'].includes(url.hostname)
      && /^\/storage\/media\/shares\/pdf\/[a-zA-Z0-9_./-]+\.pdf$/i.test(url.pathname)) {
      return `${url.origin}${url.pathname}`;
    }
  } catch { /* Invalid input stays editable but is never used as a link. */ }
  return '';
}

export function normalizeBuildingResources(value) {
  return Object.fromEntries(BUILDING_SOURCES.map(({ key }) => {
    const item = value?.[key];
    const location = item?.location;
    return [key, {
      url: text(item?.url), consultedOn: validDate(item?.consultedOn) ? item.consultedOn : '',
      notes: text(item?.notes, 8000),
      location: location && typeof location === 'object' ? {
        adresse: text(location.adresse), lon: text(String(location.lon)), lat: text(String(location.lat)), date: text(location.date),
      } : null,
    }];
  }));
}

export function resourceMatchesLocation(report, resource) {
  const current = report.localisation?.confirmation;
  const saved = resource?.location;
  return Boolean(locationConfirmed(report) && validDate(resource?.consultedOn) && saved && saved.adresse === current.adresse
    && Number(saved.lon) === Number(current.lon) && Number(saved.lat) === Number(current.lat)
    && saved.date === current.date);
}

export function confirmBuildingResource(report, key, date) {
  if (!BUILDING_SOURCES.some((source) => source.key === key) || !locationConfirmed(report)) return report;
  const resources = normalizeBuildingResources(report.ressources_batiment);
  const url = safeBuildingResourceUrl(key, resources[key].url);
  if (!url || !validDate(date)) return report;
  return { ...report, ressources_batiment: { ...resources, [key]: {
    ...resources[key], url, consultedOn: date, location: { ...report.localisation.confirmation },
  } } };
}

export function buildingResourcesHtml(report, escapeHtml) {
  const resources = normalizeBuildingResources(report.ressources_batiment);
  const rows = BUILDING_SOURCES.filter(({ key }) => resources[key].url || resources[key].notes).map(({ key, name }) => {
    const item = resources[key];
    const url = safeBuildingResourceUrl(key, item.url);
    const confirmed = url && resourceMatchesLocation(report, item);
    return `<h4>${name} — ${confirmed ? 'Ressource retenue par le professionnel' : 'Rattachement au bien à vérifier'}</h4>
      <p>${key === 'proreno' ? 'Typologie générale, pas un diagnostic de ce logement.' : 'Données externes pouvant inclure des simulations ; pas une vérification sur place.'}</p>
      ${url ? `<p><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></p>` : '<p>Aucun lien de fiche valide retenu.</p>'}
      <p>Date de consultation déclarée : ${escapeHtml(item.consultedOn || 'Non renseignée')}.</p>
      ${item.location ? `<p>Bien lors du rattachement : ${escapeHtml(item.location.adresse)}.</p>` : ''}
      ${item.notes ? `<p>Notes du professionnel :<br />${escapeHtml(item.notes).replace(/\n/g, '<br />')}</p>` : ''}`;
  });
  return rows.length ? `<h3>Informations déjà disponibles — ressources externes</h3>${rows.join('')}` : '';
}
