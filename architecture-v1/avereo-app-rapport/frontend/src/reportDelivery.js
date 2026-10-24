import { buildExpertDocumentHtml, escapeHtml, textToHtml, safeEmbeddedImageSource } from './reportHtml.js';
import { REPORT_VISUALS, AVEREO_LOGO } from './reportVisuals.js';

export function deliveryOptions(report) {
  const value = report.livrable || {};
  return {
    audience: value.audience === 'client' ? 'client' : 'expert',
    synthese: String(value.synthese || ''),
    priorites: String(value.priorites || ''),
    suite: String(value.suite || ''),
    limites_client: String(value.limites_client || ''),
    observations: Array.isArray(value.observations) ? value.observations.slice(0, 3) : [],
    visuels: Array.isArray(value.visuels) ? value.visuels.filter(id => REPORT_VISUALS.some(v => v.id === id)) : [],
    annexes: Array.isArray(value.annexes) ? value.annexes.filter(a => a && safeEmbeddedImageSource(a.src)).map(a => ({...a, title:String(a.title || ''), caption:String(a.caption || ''), source:String(a.source || '')})) : [],
  };
}

export function optionsWithCurrent(options, current) {
  return current && !options.includes(current) ? [current, ...options] : options;
}

function illustration(image, client = false) {
  return `<section class="illustration${client ? ' client-illustration' : ''}">
    <h2>${escapeHtml(image.title)}</h2>
    <img src="${safeEmbeddedImageSource(image.src)}" alt="${escapeHtml(image.title)}" />
    <p class="caption">${textToHtml(image.caption)}</p>
    <p class="source">Source : ${escapeHtml(image.source || 'À renseigner')}.</p>
  </section>`;
}

function cover(report, client) {
  return `<section class="cover">
    <img class="brand-logo" src="${AVEREO_LOGO}" alt="AVEREO" />
    <p class="eyebrow">HABITAT · COMPRENDRE · DÉCIDER</p>
    <h1>${client ? 'Votre habitat, l’essentiel' : 'Rapport expert détaillé'}</h1>
    <h2>${escapeHtml(report.titre)}</h2>
    <p class="address">${escapeHtml(report.adresse_logement)}</p>
    <table><tr><td>Dossier</td><td>${escapeHtml(report.reference_dossier)}</td></tr>
      <tr><td>Destinataire</td><td>${escapeHtml(report.proprietaire)}</td></tr>
      <tr><td>Intervenant</td><td>${escapeHtml(report.intervenant)}</td></tr>
      <tr><td>Visite</td><td>${escapeHtml(report.date_visite || 'Date non renseignée')}</td></tr></table>
    <p class="status">Document de travail · ${client ? 'Restitution à relire avant remise au client' : 'Soumis à validation professionnelle'}</p>
    <p class="muted">Les illustrations pédagogiques expliquent des mécanismes. Elles ne constituent pas des mesures du bâtiment.</p>
  </section>`;
}

const style = `
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; }
  body { max-width: 800px; margin: auto; padding: 32px; font-family: Calibri,Arial,sans-serif; color: #002B45; font-size: 11pt; line-height: 1.45; }
  h1 { color: #002B45; font-size: 32pt; line-height: 1.15; }
  h2 { color: #002B45; border-bottom: 2px solid #FF6600; padding-bottom: 8px; font-size: 19pt; page-break-after: avoid; }
  h3,h4 { color: #002B45; page-break-after: avoid; }
  p { margin: 8px 0 12px; } table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 10pt; }
  td,th { padding: 10px; border: 1px solid #d6e2e8; text-align: left; vertical-align: top; }
  td:first-child, th { background: #eef4f6; font-weight: bold; width: 30%; }
  tr { page-break-inside: avoid; } img { max-width: 100%; height: auto; }
  .cover { padding: 30px 0 50px; margin: 0; page-break-after: always; }
  .brand-logo { width: 220px; max-height: 110px; object-fit: contain; }
  .eyebrow { color: #FF6600; font-size: 10pt; letter-spacing: 2px; margin-top: 50px; }
  .address { font-size: 18pt; } .status { background: #fff1e7; border-left: 4px solid #FF6600; padding: 14px; }
  .muted,.source,.caption { color: #506573; } .source { font-size: 9pt; }
  .observation { margin: 26px 0; page-break-before: always; page-break-inside: auto; }
  .photo-block { page-break-inside: avoid; margin: 20px 0; }
  .photo-block img { max-height: 350px; width: auto; max-width: 100%; }
  .photo-block p { font-size: 9pt; }
  .illustration { page-break-before: always; } .illustration img { display: block; margin: 20px auto; max-height: 610px; }
  .client-page { page-break-before: always; } .client-illustration { page-break-before: auto; }
  .client-illustration img { max-height: 370px; } .signature { width: 170px; }
  .report-footer { margin-top: 30px; border-top: 1px solid #d6e2e8; padding-top: 12px; font-size: 9pt; }
  @media(max-width:600px) { body { padding: 18px; } h1 { font-size: 26pt; } td { padding: 6px; } }
`;

export function buildReportHtml(report) {
  const options = deliveryOptions(report);
  const client = options.audience === 'client';
  const visuals = REPORT_VISUALS.filter(v => options.visuels.includes(v.id) && (!client || v.client));
  let content;
  if (!client) {
    // Keep every existing expert field, observation, photo and contextual source.
    const original = buildExpertDocumentHtml(report);
    content = original.split('<body>')[1].split('</body>')[0];
    content = content.replace(/<div class="cover">[\s\S]*?<\/div>\s*<br style="page-break-before: always;" \/>/, cover(report, false));
    content += visuals.map(v => illustration(v)).join('');
    content += options.annexes.map(a => illustration(a)).join('');
  } else {
    const selected = (report.observations || []).filter(o => options.observations.includes(o.id));
    content = cover(report, true) + `<section class="client-page"><h2>01 · Ce qu’il faut retenir</h2>
      <p>${textToHtml(options.synthese || 'Synthèse client à rédiger par le professionnel.')}</p>
      ${selected.map(o => `<h3>${escapeHtml(o.titre || o.piece)}</h3><p>${textToHtml(o.observations)}</p>
        ${(o.photos || []).slice(0, 1).map(p => safeEmbeddedImageSource(p.src) ? `<div class="photo-block"><img src="${safeEmbeddedImageSource(p.src)}" alt="${escapeHtml(p.name)}" /><p>${escapeHtml(p.name)}</p></div>` : '').join('')}`).join('')}
      <p class="muted">Le rapport expert conserve l’ensemble des constats et des sources.</p></section>`;
    content += visuals.map(v => `<section class="client-page">${illustration(v, true)}</section>`).join('');
    content += `<section class="client-page"><h2>02 · Les priorités</h2><p>${textToHtml(options.priorites || 'Priorités à préciser avec le professionnel.')}</p>
      <h2>03 · La prochaine étape</h2><p>${textToHtml(options.suite || 'Prochaine étape à convenir.')}</p>
      <h3>Limites et points à confirmer</h3><p>${textToHtml(options.limites_client || report.reserves)}</p>
      <p class="status">Cette synthèse accompagne le rapport expert. Elle ne remplace pas les vérifications techniques nécessaires.</p></section>`;
  }
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8" /><title>${escapeHtml(report.titre)} — ${client ? 'Synthèse client' : 'Rapport expert'}</title><style>${style}</style></head><body>${content}<p class="report-footer">AVEREO · ${escapeHtml(report.reference_dossier)} · Document de travail</p></body></html>`;
}
