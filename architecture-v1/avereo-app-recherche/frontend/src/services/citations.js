// Formats de citation. Règle (note 04, § 6) : la référence est toujours citable ;
// le contenu n'entre dans un livrable client que s'il est APPROVED_FOR_CLIENT_USE.
import { AUTHORITY_EXPLANATION } from '../config/referentiels.js';
import { fmtDate } from '../utils/text.js';
import { provenanceChain, isApproved } from './resource.js';

const loc = r => (r.src.loc ? `, ${r.src.loc}` : '');
const urlPart = r => (r.src.url ? ` ${r.src.url}` : '');
const orgOf = r => r.src.org || 'Source non renseignée';
// « AQC (exemple fictif) » → « AQC » dans le corps du texte ; la mention reste dans les références
const shortOrg = r => orgOf(r).replace(/\s*\(exemple[^)]*\)\s*$/i, '');
const chain = r => provenanceChain(r).join(' › ');
const withChain = r => (chain(r) ? ` — ${chain(r)}` : '');

export function citeShort(r) {
  return `${r.title}${withChain(r)}${loc(r)}. ${orgOf(r)}. Consulté le ${fmtDate(r.date)}.${urlPart(r)}`;
}

export function citeMarkdown(r) {
  const source = r.src.url ? `([source](${r.src.url}))` : '';
  const quote = r.text ? `> ${r.text.replace(/\n+/g, '\n> ')}\n\n` : '';
  return `${quote}— *${r.title}*, ${orgOf(r)}${chain(r) ? `, ${chain(r)}` : ''}${loc(r)} ${source}, consulté le ${fmtDate(r.date)}.`.replace(/ ,/g, ',');
}

export function citeInternal(r) {
  const lines = [
    `[${r.id}] ${r.title}`,
    r.text,
    `Source : ${orgOf(r)}${withChain(r)}${loc(r)}${r.src.url ? ` — ${r.src.url}` : ''}`,
    `Droits : ${r.rights} · Usage client : ${r.client} · Fiabilité : ${r.conf}`,
  ];
  if (r.validation) lines.push(`Validation : ${r.validation.decision} par ${r.validation.by} le ${fmtDate(r.validation.at)}${r.validation.note ? ` (${r.validation.note})` : ''}`);
  if (r.conflict) lines.push(`⚠ ${r.conflict}`);
  return lines.filter(Boolean).join('\n');
}

export const fullReference = r => `${r.title}, ${orgOf(r)}${loc(r)}.${urlPart(r)} Consulté le ${fmtDate(r.date)}.`;

const PLACEHOLDER = r => `[À reformuler avec vos mots — contenu non validé pour usage client : « ${r.title} »]`;
const bodyFor = r => (isApproved(r) && r.text ? r.text.replace(/[.\s]+$/, '') : PLACEHOLDER(r));
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => String(n).split('').map(c => SUP[Number(c)]).join('');

export function clientExport(items, style) {
  if (!items.length) return '';
  if (style === 'simple') {
    return items.map(r => `${bodyFor(r)} (${shortOrg(r)}).`).join('\n\n')
      + '\n\nSources\n' + items.map(r => `- ${fullReference(r)}`).join('\n');
  }
  if (style === 'classe') {
    return items.map((r, i) => `${bodyFor(r)}${sup(i + 1)}.`).join('\n\n')
      + '\n\nNotes et références\n' + items.map((r, i) => `${sup(i + 1)} ${fullReference(r)}`).join('\n');
  }
  // pédagogique
  return items.map(r => [
    `${bodyFor(r)}.`,
    '',
    "D'où vient cette information ?",
    `${shortOrg(r)} — ${AUTHORITY_EXPLANATION[r.authority] || 'source documentaire'}.`,
    `Document : ${r.title}${loc(r)}.`,
    r.src.url ? `Pour aller plus loin : ${r.src.url}` : '',
  ].filter((l, i) => l !== '' || i === 1).join('\n')).join('\n\n———\n\n');
}

export function exportBasket(items, formatId) {
  if (formatId.startsWith('client-')) return clientExport(items, formatId.slice('client-'.length));
  const fn = { short: citeShort, md: citeMarkdown, internal: citeInternal }[formatId] || citeShort;
  return items.map(fn).join('\n\n');
}

export const referenceOnlyItems = (items, formatId) => (formatId.startsWith('client-') ? items.filter(r => !isApproved(r)) : []);
