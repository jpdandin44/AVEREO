import { isHabitologieReport } from './reportClassification.js';
import { HABITOLOGIE_PROTOCOL_STAGES, LISTENING_TOPICS, isHabitologieControlSelected, isHabitologieStageEnabled, findHabitologieControl, findHabitologieStage } from './habitologieProtocol.js';
import { LISTENING_SECTIONS } from './clientListening.js';
import { rgaRisk, isRgaRisk } from './georisquesRiskSummary.js';
import { buildingResourcesHtml } from './buildingResources.js';
import { locationConfirmed, validLocation } from './locationMap.js';
import { safeDocumentUrl, URBAN_LAYERS } from './urbanismContext.js';
import { DIRECTIONS } from './terrainContext.js';

export const protocolOptions = [
  {
    key: 'standard',
    label: 'Releve visuel et photographique',
    detail: 'Inspection non destructive des zones accessibles, avec photos horodatees.',
  },
  {
    key: 'fissures',
    label: 'Analyse fissures niveau 1',
    detail: 'Caracterisation visuelle des fissures, orientation, ouverture apparente et contexte.',
  },
  {
    key: 'humidite',
    label: 'Recherche humidite / infiltrations',
    detail: 'Reperage des traces, aureoles, moisissures, decollements et zones sensibles.',
  },
  {
    key: 'toiture',
    label: 'Controle toiture et exterieurs',
    detail: 'Observation des couvertures, evacuations, points singuliers et raccords visibles.',
  },
  {
    key: 'reception',
    label: 'Reception et reserves',
    detail: 'Liste structuree des reserves, localisation et niveau de priorite.',
  },
];

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[char];
  });
}

export function textToHtml(value = '') {
  const safe = escapeHtml(value.trim());
  return safe ? safe.replace(/\n/g, '<br />') : '<span class="muted">Non renseigne.</span>';
}

// Legacy imported expert notes contain pipe-separated tables and uppercase subheadings.
// Render their existing words as structured content, without interpreting their meaning.
export function narrativeHtml(value = '') {
  const lines = String(value).split('\n');
  const parts = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.includes(' | ')) {
      const rows = [];
      while(i < lines.length && lines[i].includes(' | ')) {
        rows.push(`<tr>${lines[i].split(' | ').map(cell => `<td>${escapeHtml(cell.trim())}</td>`).join('')}</tr>`); i++;
      }
      i--; parts.push(`<table><thead>${rows.shift()}</thead><tbody>${rows.join('')}</tbody></table>`);
    } else if (line.length < 100 && line === line.toLocaleUpperCase('fr-FR') && /[A-ZÀ-Ü]/.test(line)) {
      parts.push(`<h4>${escapeHtml(line)}</h4>`);
    } else { parts.push(`<p>${escapeHtml(line)}</p>`); }
  }
  return parts.join('') || '<p>Non renseigné.</p>';
}

export function safeEmbeddedImageSource(value = '') {
  const source = String(value).trim();
  return /^data:image\/(?:png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(source) ? source : '';
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('fr-FR');
}

function buildProtocolHtml(report) {
  if (isHabitologieReport(report)) {
    return HABITOLOGIE_PROTOCOL_STAGES.map((stage, index) => {
      const selectedControls = stage.controls.filter(
        (control) => isHabitologieControlSelected(report, stage.key, control.key),
      );
      return `
        <section class="protocol-phase-export">
          <h3>Phase ${index + 1} - ${escapeHtml(stage.label)}</h3>
          <p>${escapeHtml(stage.summary)}</p>
          ${
            !isHabitologieStageEnabled(report, stage.key)
              ? '<p><strong>Non retenue pour cette visite.</strong> Les éventuelles observations antérieures sont conservées ci-dessous.</p>'
              : selectedControls.length > 0
              ? `<ul>${selectedControls.map((control) => `<li>${escapeHtml(control.label)}</li>`).join('')}</ul>`
              : '<p><span class="muted">Aucun point retenu pour cette phase.</span></p>'
          }
        </section>
      `;
    }).join('');
  }

  const selected = protocolOptions.filter((protocol) => report.protocoles?.[protocol.key]);
  if (selected.length === 0) {
    return '<p>Aucun protocole specifique n a ete selectionne.</p>';
  }
  return selected
    .map(
      (protocol) => `
        <h3>${escapeHtml(protocol.label)}</h3>
        <p>${escapeHtml(protocol.detail)}</p>
      `,
    )
    .join('');
}

function buildRiskSummaryHtml(summary) {
  if (!summary?.fetchedAt) return '';
  const rga = rgaRisk(summary);
  const groups = [
    ['Autres risques naturels identifies', (summary.naturels || []).filter((risk) => !isRgaRisk(risk))],
    ['Risques technologiques identifies', summary.technologiques || []],
  ];
  return `
    <h3>Synthese Georisques</h3>
    <p>${escapeHtml(summary.addressLabel || summary.communeLabel || '')}</p>
    <h4>Retrait-gonflement des argiles (RGA)</h4>
    <p>À l’adresse : ${escapeHtml(rga?.addressStatus || 'Information non disponible')}.
    Sur la commune : ${escapeHtml(rga?.communeStatus || 'Information non disponible')}.</p>
    <p class="muted">Une information manquante ne signifie pas absence de risque. La carte territoriale AVEREO RGA 2026 est consultable depuis Rapport avec un compte autorisé ; elle ne constitue pas un diagnostic de la parcelle.</p>
    ${groups
      .map(
        ([label, risks]) => `
          <h4>${risks.length} ${escapeHtml(label)}</h4>
          ${
            risks.length > 0
              ? `<table>
                  <tr><td>Risque</td><td>A l'adresse</td><td>Sur la commune</td></tr>
                  ${risks
                    .map(
                      (risk) => `<tr>
                        <td>${escapeHtml(risk.label)}</td>
                        <td>${escapeHtml(risk.addressStatus)}</td>
                        <td>${escapeHtml(risk.communeStatus)}</td>
                      </tr>`,
                    )
                    .join('')}
                </table>`
              : '<p><span class="muted">Aucun risque present dans cette categorie selon la reponse recue.</span></p>'
          }
        `,
      )
      .join('')}
    <p class="muted">Source : ${escapeHtml(summary.source)} - consultation du ${escapeHtml(
      formatDateTime(summary.fetchedAt),
    )}. Synthese informative ; consulter le rapport officiel pour le detail.</p>
  `;
}

export function buildExpertDocumentHtml(report, beforeSignatureHtml = '') {
  const habitologie = isHabitologieReport(report);
  const sectionNumbers = habitologie
    ? { ecoute: 2, protocoles: 3, observations: 4, analyse: 5, signature: 6 }
    : { protocoles: 2, observations: 3, analyse: 4, signature: 5 };
  const meteoLine = [
    report.meteo?.ciel && `Ciel : ${report.meteo.ciel}`,
    report.meteo?.temperatureC && `Temperature : ${report.meteo.temperatureC} C`,
    report.meteo?.humiditePct && `Humidite : ${report.meteo.humiditePct} %`,
    report.meteo?.pluie && `Pluie : ${report.meteo.pluie}`,
    report.meteo?.vent && `Vent : ${report.meteo.vent}`,
  ]
    .filter(Boolean)
    .join(' - ');

  const cadastreLine = report.cadastre?.section
    ? `Commune ${report.cadastre.nom_commune || report.cadastre.commune || ''} - Section ${
        report.cadastre.section
      } - Numero ${report.cadastre.numero || ''}${
        report.cadastre.contenance ? ` - ${report.cadastre.contenance} m2` : ''
      }`
    : '';

  const observationsHtml = report.observations
    .map((obs, index) => {
      const photos = obs.photos
        .map((photo) => {
          const source = safeEmbeddedImageSource(photo.src);
          if (!source) return '';
          return `
          <div class="photo-block">
            <img src="${source}" alt="${escapeHtml(photo.name || `Photo ${index + 1}`)}" />
            <p>${escapeHtml(photo.name || 'Photo')} - ${formatDateTime(photo.horodatageISO)}</p>
          </div>
        `;
        })
        .join('');

      return `
        <section class="observation">
          <h3>${index + 1}. ${escapeHtml(obs.titre || `${obs.piece || 'Zone'} - ${obs.surface || 'Surface'}`)}</h3>
          <table>
            ${
              habitologie
                ? `<tr><td>Phase d'analyse</td><td>${escapeHtml(
                    findHabitologieStage(obs.phase_habitologie)?.label || 'A classer',
                  )}${findHabitologieStage(obs.phase_habitologie) && !isHabitologieStageEnabled(report, obs.phase_habitologie) ? ' — phase non retenue, observation conservée' : ''}</td></tr>
                   <tr><td>Point du protocole</td><td>${escapeHtml(
                     findHabitologieControl(obs.phase_habitologie, obs.controle_habitologie)?.label ||
                       'Constat transversal ou non classe',
                   )}</td></tr>`
                : ''
            }
            <tr><td>Piece / zone</td><td>${escapeHtml(obs.piece)}</td></tr>
            <tr><td>Element observe</td><td>${escapeHtml(obs.surface)}</td></tr>
            <tr><td>Gravite</td><td>${escapeHtml(obs.gravite)}</td></tr>
          </table>
          <h4>Constat</h4>
          <p>${textToHtml(obs.observations)}</p>
          <h4>Suites proposees</h4>
          <p>${textToHtml(obs.actions)}</p>
          ${photos}
        </section>
      `;
    })
    .join('');

  const mapLink =
    report.cadastre?.lon && report.cadastre?.lat
      ? `https://www.geoportail-urbanisme.gouv.fr/map/#tile=1&lon=${report.cadastre.lon}&lat=${report.cadastre.lat}&zoom=19`
      : '';

  const signatureSource = safeEmbeddedImageSource(report.signature);
  const signatureHtml = signatureSource
    ? `<img class="signature" src="${signatureSource}" alt="Signature" />`
    : `<p>${escapeHtml(report.signature)}</p>`;

  const ecouteHtml = habitologie
    ? `
  <h2>${sectionNumbers.ecoute}. Ecoute client</h2>
  <table>
    ${LISTENING_SECTIONS.flatMap((section) => section.fields).map((field) => `<tr><td>${escapeHtml(field.label)}</td><td>${textToHtml(report.ecoute?.[field.key] || 'Non renseigné')}</td></tr>`).join('')}
    <tr><td>Reformulation confirmée avec le client</td><td>${report.ecoute?.besoin_confirme ? 'Oui' : 'À confirmer'}</td></tr>
    <tr><td>Sujets identifiés à l'écoute</td><td>${escapeHtml(LISTENING_TOPICS.filter((topic) => report.ecoute?.sujets_identifies?.includes(topic.key)).map((topic) => topic.label).join(', ') || 'Aucun sujet coché')}</td></tr>
    <tr><td>Consentement photos</td><td>${report.ecoute?.consentement_photos ? 'Accorde' : 'Non accorde'}</td></tr>
    <tr><td>Consentement dictee vocale</td><td>${report.ecoute?.consentement_dictee ? 'Accorde' : 'Non accorde'}</td></tr>
  </table>
  `
    : '';

  return `<!doctype html>
<html lang="fr" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.titre)}</title>
  <style>
    @page WordSection1 { size: A4; margin: 2.4cm 2cm; }
    body { font-family: Calibri, Arial, sans-serif; color: #1f2937; font-size: 11pt; line-height: 1.45; }
    h1 { font-size: 22pt; color: #111827; margin: 0 0 8pt; }
    h2 { font-size: 16pt; color: #1d4ed8; border-bottom: 1pt solid #d1d5db; padding-bottom: 5pt; margin-top: 24pt; }
    h3 { font-size: 13pt; color: #111827; margin-bottom: 5pt; }
    h4 { font-size: 11pt; margin-bottom: 3pt; }
    table { border-collapse: collapse; width: 100%; margin: 8pt 0 12pt; }
    td { border: 1pt solid #d1d5db; padding: 6pt; vertical-align: top; }
    td:first-child { width: 30%; font-weight: 700; background: #f3f4f6; }
    .cover { margin-top: 90pt; }
    .muted { color: #6b7280; }
    .observation { page-break-inside: avoid; margin-bottom: 18pt; }
    .photo-block { page-break-inside: avoid; margin: 10pt 0; }
    .photo-block img { max-width: 520pt; width: 100%; border: 1pt solid #d1d5db; }
    .photo-block p { color: #6b7280; font-size: 9pt; margin-top: 3pt; }
    .signature { width: 170pt; border-bottom: 1pt solid #9ca3af; padding-bottom: 6pt; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${escapeHtml(report.titre || "Rapport d'expertise")}</h1>
    <p><strong>Reference dossier :</strong> ${escapeHtml(report.reference_dossier || 'Non renseignee')}</p>
    <p><strong>Type de dossier :</strong> ${escapeHtml(report.categorie)}</p>
    <p><strong>${habitologie ? "Type d'habitation" : 'Sous-categorie'} :</strong> ${escapeHtml(report.sous_categorie)}</p>
    <p><strong>Date de visite :</strong> ${formatDate(report.date_visite)}</p>
    <p><strong>Intervenant :</strong> ${escapeHtml(report.intervenant)}</p>
  </div>

  <br style="page-break-before: always;" />
  <h2>1. Informations generales</h2>
  <table>
    <tr><td>Proprietaire</td><td>${escapeHtml(report.proprietaire)}</td></tr>
    <tr><td>Email</td><td>${escapeHtml(report.email)}</td></tr>
    <tr><td>Adresse</td><td>${escapeHtml(report.adresse_logement)}</td></tr>
    <tr><td>Environnement analyse</td><td>${escapeHtml(report.environnement)}</td></tr>
    <tr><td>Conditions meteo</td><td>${escapeHtml(meteoLine)}</td></tr>
    <tr><td>References cadastrales</td><td>${escapeHtml(cadastreLine)}</td></tr>
    <tr><td>Lieu confirmé avec le client</td><td>${locationConfirmed(report) ? `Oui — ${escapeHtml(formatDate(report.localisation.confirmation.date))}` : 'À confirmer'}</td></tr>
    ${validLocation(report.cadastre.lon, report.cadastre.lat) ? `<tr><td>Point de visite (latitude, longitude)</td><td>${Number(report.cadastre.lat).toFixed(7)}, ${Number(report.cadastre.lon).toFixed(7)}${report.localisation?.point_manuel ? ' — Ajuste manuellement ; notes du contexte et ressources a reverifier.' : ''}</td></tr>` : ''}
    <tr><td>Zonage urbanisme</td><td>${escapeHtml(report.urbanisme?.zone || '')} ${escapeHtml(
      report.urbanisme?.description || '',
    )}${mapLink ? `<br /><a href="${mapLink}">Voir la parcelle</a>` : ''}${
      safeDocumentUrl(report.urbanisme?.pdfUrl) ? `<br /><a href="${escapeHtml(safeDocumentUrl(report.urbanisme.pdfUrl))}">Document PLU</a>` : ''
    }</td></tr>
  </table>

  ${buildRiskSummaryHtml(report.risques)}

  ${report.urbanisme.context ? `
    <h3>Urbanisme : elements retournes au point d'adresse</h3>
    <p>Source : ${escapeHtml(report.urbanisme.context.source)} — ${escapeHtml(formatDateTime(report.urbanisme.context.fetchedAt))}.</p>
    ${report.urbanisme.context.results.map((group) => `
      <h4>${escapeHtml(URBAN_LAYERS.find(([key]) => key === group.layer)?.[1] || group.layer)}</h4>
      ${group.error ? '<p>Source indisponible, aucune conclusion possible.</p>' : group.items.length ? `
        <ul>${group.items.map((item) => `<li><strong>${escapeHtml(item.title)}</strong> ${escapeHtml(item.detail)}
          — ${escapeHtml(item.document)} ${escapeHtml(item.sourceDate)}
          ${safeDocumentUrl(item.url) ? `<a href="${escapeHtml(safeDocumentUrl(item.url))}">Texte source</a>` : ''}</li>`).join('')}</ul>`
        : '<p>Aucun element retourne au point interroge ; cela ne prouve pas l absence de contrainte.</p>'}
      ${group.partial ? '<p>Resultat partiel : consulter le GPU.</p>' : ''}`).join('')}
    <p>Reperage non exhaustif au point d'adresse, pas sur toute la parcelle. Les libelles ne remplacent pas la lecture du reglement ni la confirmation par le service urbanisme. Les servitudes lineaires et ponctuelles ne sont pas couvertes.</p>` : ''}
  ${report.urbanisme.notes ? `<h4>Regles / interdictions : notes de verification du professionnel</h4><p>${textToHtml(report.urbanisme.notes)}</p>` : ''}
  ${report.terrain?.orientation || report.terrain?.facade ? `<h3>Orientation renseignee par le professionnel</h3><p>Facade : ${escapeHtml(report.terrain.facade || 'Non precisee')} — direction : ${escapeHtml(DIRECTIONS.find(([key]) => key === report.terrain.orientation)?.[1] || 'A relever')}. Ni orientation mesuree automatiquement, ni direction du vent.</p>` : ''}
  ${report.terrain?.analysis ? `<h3>Reperage altimetrique indicatif</h3>
    <p>${escapeHtml(report.terrain.analysis.source)} — ${escapeHtml(formatDateTime(report.terrain.analysis.fetchedAt))} — emprise : ${report.terrain.analysis.width} m x ${report.terrain.analysis.width} m.</p>
    <p>Minimum ${report.terrain.analysis.min.toFixed(2)} m ; maximum ${report.terrain.analysis.max.toFixed(2)} m ; ecart ${report.terrain.analysis.range.toFixed(2)} m.</p>
    <table><tr><th>Point</th><th>Altitude (m)</th></tr>${report.terrain.analysis.samples.map((p) => `<tr><td>${escapeHtml(p.label)}</td><td>${p.z.toFixed(2)}</td></tr>`).join('')}</table>
    <p>Neuf points autour de l'adresse, pouvant depasser la propriete. Precision variable. Ce n'est ni une etude hydrologique ni un releve de geometre ; aucun ecoulement reel ou absence de risque n'en est deduit.</p>` : ''}
  ${report.terrain?.notes ? `<h4>Verifications terrain / eaux pluviales</h4><p>${textToHtml(report.terrain.notes)}</p>` : ''}

  ${buildingResourcesHtml(report, escapeHtml)}

  ${ecouteHtml}

  <h2>${sectionNumbers.protocoles}. Protocole de recherche</h2>
  ${buildProtocolHtml(report)}

  <h2>${sectionNumbers.observations}. Observations</h2>
  ${observationsHtml || '<p>Aucune observation n a ete enregistree.</p>'}

  <h2>${sectionNumbers.analyse}. Analyse et recommandations</h2>
  <h3>Analyse de l expert</h3>
  ${narrativeHtml(report.analyse_expert)}
  <h3>Recommandations</h3>
  ${narrativeHtml(report.recommandations)}
  <h3>Reserves</h3>
  ${narrativeHtml(report.reserves)}

  ${beforeSignatureHtml}
  <h2>${sectionNumbers.signature}. Signature</h2>
  <p>Fait le ${formatDate(new Date().toISOString())}</p>
  <p><strong>Signataire :</strong> ${escapeHtml(report.nom_signataire)}</p>
  ${signatureHtml}
</body>
</html>`;
}
