import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { del as idbDel, get as idbGet, set as idbSet } from 'idb-keyval';
import {
  completeOAuthLogin,
  getAuthConfig,
  getCurrentUser,
  saveOnlineReport,
  startOAuthLogin,
} from './services/reportApi.js';
import {
  DEFAULT_CATEGORY,
  DEFAULT_SUBCATEGORY,
  HABITOLOGIE_ANALYSIS_STAGES,
  HABITOLOGIE_DEFAULT_HOUSING_TYPE,
  REPORT_CATEGORIES,
  getReportSubcategories,
  getSelectableReportCategories,
  isHabitologieReport,
  nextReportTitle,
  normalizeReportClassification,
  recommendedProtocols,
} from './reportClassification.js';
import { buildGeorisquesReportUrl } from './georisquesReport.js';
import {
  buildGeorisquesRiskSummaryUrl,
  emptyGeorisquesRiskSummary,
  normalizeGeorisquesRiskSummary,
  riskStatusTone,
  safeGeorisquesReportUrl,
} from './georisquesRiskSummary.js';
import {
  HABITOLOGIE_PROTOCOL_STAGES,
  LISTENING_TOPICS,
  createHabitologieProtocolState,
  isHabitologieControlSelected,
  listeningSuggestions,
  findHabitologieControl,
  findHabitologieStage,
  mergeHabitologieProtocolState,
} from './habitologieProtocol.js';
import { LISTENING_SECTIONS, emptyClientListening } from './clientListening.js';
import LocationMap from './LocationMap.jsx';
import { emptyLocation, locationConfirmed, validLocation } from './locationMap.js';
import { TerrainPanel, UrbanismPanel } from './SiteInsights.jsx';
import { DIRECTIONS, emptyTerrain, normalizeStoredTerrain } from './terrainContext.js';
import { safeDocumentUrl, normalizeStoredUrbanism, URBAN_LAYERS } from './urbanismContext.js';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardList,
  CloudSun,
  Download,
  Eye,
  FileJson,
  FileText,
  Home,
  Loader2,
  MapPin,
  Mic,
  PenLine,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

const DRAFT_KEY = 'avereo-rapport-draft-v2';
const LEGACY_DRAFT_KEY = 'draftReport';
const ONLINE_SYNC_ENABLED = import.meta.env.VITE_ENABLE_ONLINE_SYNC === 'true';

const piecesOptions = [
  'Salon',
  'Cuisine',
  'Chambre',
  'Salle de bain',
  'WC',
  'Bureau',
  'Garage',
  'Combles',
  'Facade',
  'Toiture',
  'Exterieur',
  'Autre',
];

const surfacesOptions = [
  'Murs',
  'Sols',
  'Plafond',
  'Menuiseries',
  'Toiture',
  'Facade',
  'Structure',
  'Equipement',
  'Autre',
];

const gravities = ['Mineure', 'Moyenne', 'Severe', 'Critique'];

const protocolOptions = [
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

const emptyObservation = () => ({
  id: createId(),
  phase_habitologie: '',
  controle_habitologie: '',
  piece: '',
  surface: '',
  gravite: 'Mineure',
  titre: '',
  observations: '',
  actions: '',
  photos: [],
});

const initialReport = normalizeReportClassification({
  categorie: DEFAULT_CATEGORY,
  sous_categorie: DEFAULT_SUBCATEGORY,
  titre: "Rapport d'expertise technique",
  reference_dossier: '',
  proprietaire: '',
  email: '',
  adresse_logement: '',
  date_visite: new Date().toISOString().slice(0, 10),
  intervenant: '',
  environnement: 'Interieur',
  meteo: {
    ciel: '',
    temperatureC: '',
    humiditePct: '',
    pluie: '',
    vent: '',
  },
  cadastre: {
    section: '',
    numero: '',
    contenance: '',
    commune: '',
    nom_commune: '',
    lon: '',
    lat: '',
  },
  urbanisme: {
    zone: '',
    description: '',
    pdfUrl: '',
  },
  risques: emptyGeorisquesRiskSummary(),
  localisation: emptyLocation(),
  terrain: emptyTerrain(),
  ecoute: emptyClientListening(),
  protocoles: {
    standard: true,
    fissures: false,
    humidite: false,
    toiture: false,
    reception: false,
  },
  habitologie_protocoles: createHabitologieProtocolState(),
  observations: [emptyObservation()],
  analyse_expert: '',
  recommandations: '',
  reserves: '',
  nom_signataire: '',
  signature: '',
  updatedAt: '',
});

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function deepMergeReport(base, incoming) {
  const classifiedIncoming = normalizeReportClassification(incoming);
  const merged = {
    ...base,
    ...classifiedIncoming,
    meteo: { ...base.meteo, ...(classifiedIncoming.meteo || {}) },
    cadastre: { ...base.cadastre, ...(classifiedIncoming.cadastre || {}) },
    urbanisme: { ...base.urbanisme, ...(classifiedIncoming.urbanisme || {}) },
    risques: { ...base.risques, ...(classifiedIncoming.risques || {}) },
    localisation: { ...base.localisation, ...(classifiedIncoming.localisation || {}) },
    terrain: { ...base.terrain, ...(classifiedIncoming.terrain || {}) },
    ecoute: { ...base.ecoute, ...(classifiedIncoming.ecoute || {}) },
    habitologie_protocoles: mergeHabitologieProtocolState(classifiedIncoming.habitologie_protocoles),
    protocoles: {
      ...base.protocoles,
      ...(classifiedIncoming.protocoles || {}),
      standard:
        classifiedIncoming.protocoles?.standard
        ?? classifiedIncoming.protocoles?.is_standard
        ?? base.protocoles.standard,
      fissures:
        classifiedIncoming.protocoles?.fissures
        ?? classifiedIncoming.protocoles?.is_fissures_n1
        ?? base.protocoles.fissures,
      humidite:
        classifiedIncoming.protocoles?.humidite
        ?? classifiedIncoming.protocoles?.is_humidite_infiltration
        ?? base.protocoles.humidite,
    },
  };

  const observations = Array.isArray(classifiedIncoming.observations)
    ? classifiedIncoming.observations
    : base.observations;
  merged.observations = observations.length > 0 ? observations.map(normalizeObservation) : [emptyObservation()];
  merged.terrain = normalizeStoredTerrain(merged.terrain, merged.cadastre.lon, merged.cadastre.lat);
  merged.urbanisme.context = normalizeStoredUrbanism(merged.urbanisme.context, merged.cadastre.lon, merged.cadastre.lat);
  return normalizeReportClassification(merged);
}

function normalizeStoredDraft(incoming) {
  return deepMergeReport(initialReport, incoming);
}

function createNewReport() {
  return normalizeReportClassification({ ...initialReport, observations: [emptyObservation()] });
}

function normalizeObservation(obs) {
  return {
    ...emptyObservation(),
    ...obs,
    id: obs?.id || createId(),
    titre: obs?.titre || '',
    photos: Array.isArray(obs?.photos) ? obs.photos : [],
  };
}

async function saveDraft(report) {
  const payload = { ...report, updatedAt: new Date().toISOString() };
  try {
    await withTimeout(idbSet(DRAFT_KEY, payload), 800);
    await withTimeout(idbSet(LEGACY_DRAFT_KEY, payload), 800);
  } catch {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    localStorage.setItem(LEGACY_DRAFT_KEY, JSON.stringify(payload));
  }
  return payload;
}

async function loadDraft() {
  const localDraft = localStorage.getItem(DRAFT_KEY) || localStorage.getItem(LEGACY_DRAFT_KEY);
  if (localDraft) return normalizeStoredDraft(JSON.parse(localDraft));

  try {
    const draft = (await withTimeout(idbGet(DRAFT_KEY), 800)) || (await withTimeout(idbGet(LEGACY_DRAFT_KEY), 800));
    if (draft) return normalizeStoredDraft(draft);
  } catch {
    return null;
  }
  return null;
}

async function removeDraft() {
  try {
    await withTimeout(idbDel(DRAFT_KEY), 800);
    await withTimeout(idbDel(LEGACY_DRAFT_KEY), 800);
  } catch {
    // localStorage cleanup runs below even when IndexedDB is unavailable.
  }
  localStorage.removeItem(DRAFT_KEY);
  localStorage.removeItem(LEGACY_DRAFT_KEY);
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error('storage timeout')), timeoutMs);
    }),
  ]);
}

function saveAs(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[char];
  });
}

function textToHtml(value = '') {
  const safe = escapeHtml(value.trim());
  return safe ? safe.replace(/\n/g, '<br />') : '<span class="muted">Non renseigne.</span>';
}

function safeEmbeddedImageSource(value = '') {
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

function toFileName(value) {
  return String(value || 'rapport-avereo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
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
            selectedControls.length > 0
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
  const groups = [
    ['Risques naturels identifies', summary.naturels || []],
    ['Risques technologiques identifies', summary.technologiques || []],
  ];
  return `
    <h3>Synthese Georisques</h3>
    <p>${escapeHtml(summary.addressLabel || summary.communeLabel || '')}</p>
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

function buildWordDocumentHtml(report) {
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
                  )}</td></tr>
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

  ${ecouteHtml}

  <h2>${sectionNumbers.protocoles}. Protocole de recherche</h2>
  ${buildProtocolHtml(report)}

  <h2>${sectionNumbers.observations}. Observations</h2>
  ${observationsHtml || '<p>Aucune observation n a ete enregistree.</p>'}

  <h2>${sectionNumbers.analyse}. Analyse et recommandations</h2>
  <h3>Analyse de l expert</h3>
  <p>${textToHtml(report.analyse_expert)}</p>
  <h3>Recommandations</h3>
  <p>${textToHtml(report.recommandations)}</p>
  <h3>Reserves</h3>
  <p>${textToHtml(report.reserves)}</p>

  <h2>${sectionNumbers.signature}. Signature</h2>
  <p>Fait le ${formatDate(new Date().toISOString())}</p>
  <p><strong>Signataire :</strong> ${escapeHtml(report.nom_signataire)}</p>
  ${signatureHtml}
</body>
</html>`;
}

function useSpeechRecognition(lang = 'fr-FR', onFinalText) {
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef(null);
  const onFinalTextRef = useRef(onFinalText);
  const isSupported =
    typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    onFinalTextRef.current = onFinalText;
  }, [onFinalText]);

  useEffect(() => {
    if (!isSupported) return undefined;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onstart = () => {
      setSpeechError('');
      setIsListening(true);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      setIsListening(false);
      const messages = {
        'audio-capture': "Aucun microphone utilisable n'a ete detecte.",
        network: 'Le service de dictee est indisponible dans ce navigateur. Essayez Chrome, Edge ou Windows + H.',
        'no-speech': "Aucune parole n'a ete detectee. Rapprochez-vous du microphone et recommencez.",
        'not-allowed': "Autorisez l'acces au microphone dans les reglages du navigateur, puis rechargez la page.",
        'service-not-allowed': 'La dictee vocale est bloquee par ce navigateur. Essayez Chrome, Edge ou Windows + H.',
      };
      if (event.error !== 'aborted') {
        setSpeechError(messages[event.error] || `Dictee interrompue (${event.error || 'erreur inconnue'}).`);
      }
    };
    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) transcript += event.results[index][0].transcript;
      }
      if (transcript) onFinalTextRef.current(`${transcript} `);
    };
    recognitionRef.current = recognition;
    return () => {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [isSupported, lang]);

  const toggle = useCallback(async () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    setSpeechError('');
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
        setSpeechError(
          denied
            ? "Autorisez l'acces au microphone dans les reglages du navigateur, puis rechargez la page."
            : "Le microphone n'est pas disponible sur cet appareil.",
        );
        return;
      }
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      if (error?.name !== 'InvalidStateError') {
        setSpeechError('Impossible de demarrer la dictee vocale. Essayez Chrome, Edge ou Windows + H.');
      }
    }
  }, [isListening]);

  return { isListening, isSupported, speechError, toggle };
}

function MicButton({ disabled = false, disabledReason = '', onFinalText, title = 'Dicter' }) {
  const { isListening, isSupported, speechError, toggle } = useSpeechRecognition('fr-FR', onFinalText);
  const unavailableMessage = 'Dictee non disponible dans ce navigateur. Utilisez Chrome, Edge ou Windows + H.';
  const buttonTitle = disabled ? disabledReason : isSupported ? title : unavailableMessage;
  return (
    <>
      <button
        className={`icon-button ${isListening ? 'danger active' : ''}`}
        type="button"
        title={buttonTitle}
        aria-label={isListening ? 'Arreter la dictee' : title}
        aria-pressed={isListening}
        onClick={toggle}
        disabled={disabled || !isSupported}
      >
        <Mic size={18} />
      </button>
      {(speechError || !isSupported || isListening) && (
        <span className={`mic-status ${speechError || !isSupported ? 'error' : 'listening'}`} role="status">
          {speechError || (!isSupported ? unavailableMessage : 'Ecoute en cours...')}
        </span>
      )}
    </>
  );
}

function Modal({ title, children, onClose, actions }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" type="button" aria-label="Fermer" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-content">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

function CameraModal({ open, onClose, onShot }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('Chargement de la camera...');

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("La camera n'est pas disponible sur ce navigateur.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStatus('');
        }
      } catch {
        setStatus("Autorisation camera refusee ou camera indisponible.");
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [open]);

  const takeShot = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    onShot({
      id: createId(),
      name: `capture-${Date.now()}.png`,
      src: canvas.toDataURL('image/png'),
      horodatageISO: new Date().toISOString(),
    });
    onClose();
  }, [onClose, onShot]);

  if (!open) return null;

  return (
    <Modal
      title="Prendre une photo"
      onClose={onClose}
      actions={
        <>
          <button className="button ghost" type="button" onClick={onClose}>
            Annuler
          </button>
          <button className="button primary" type="button" onClick={takeShot} disabled={Boolean(status)}>
            <Camera size={18} />
            Capturer
          </button>
        </>
      }
    >
      <div className="camera-frame">
        <video ref={videoRef} playsInline muted />
        {status && <p>{status}</p>}
      </div>
    </Modal>
  );
}

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#111827';

    if (value?.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = value;
    }
  }, [value]);

  const point = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  };

  const start = (event) => {
    event.preventDefault();
    drawingRef.current = true;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(...point(event));
  };

  const move = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(...point(event));
    ctx.stroke();
  };

  const stop = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="signature-pad">
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerLeave={stop}
      />
      <button className="text-button" type="button" onClick={clear}>
        Effacer la signature
      </button>
    </div>
  );
}

function Header({ onHome }) {
  return (
    <header className="app-header">
      <div className="brand-block">
        <span className="brand-mark">A</span>
        <div>
          <h1>AVEREO Rapport</h1>
          <p>Production de rapports terrain</p>
        </div>
      </div>
      {onHome && (
        <button className="button ghost" type="button" onClick={onHome}>
          <Home size={18} />
          Accueil
        </button>
      )}
    </header>
  );
}

function ButtonCard({ active, title, description, onClick }) {
  return (
    <button className={`choice-card ${active ? 'selected' : ''}`} type="button" onClick={onClick}>
      <strong>{title}</strong>
      <span>{description}</span>
    </button>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function TextAreaWithMic({
  label,
  value,
  onChange,
  onAppend,
  placeholder,
  rows = 5,
  micDisabled = false,
  micDisabledReason = '',
}) {
  return (
    <Field label={label}>
      <div className="input-with-action">
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} />
        <MicButton
          disabled={micDisabled}
          disabledReason={micDisabledReason}
          onFinalText={onAppend}
          title={`Dicter ${label}`}
        />
      </div>
    </Field>
  );
}

function StepNav({ steps, currentStep, setStep }) {
  return (
    <nav className="step-nav" aria-label="Progression du rapport">
      {steps.map((step, index) => (
        <button
          key={step}
          className={index === currentStep ? 'current' : index < currentStep ? 'done' : ''}
          type="button"
          onClick={() => setStep(index)}
        >
          <span>{index < currentStep ? <CheckCircle2 size={16} /> : index + 1}</span>
          {step}
        </button>
      ))}
    </nav>
  );
}

function CompletionPanel({ report, validation }) {
  const photoCount = report.observations.reduce((count, obs) => count + obs.photos.length, 0);
  const required = [
    report.reference_dossier,
    report.proprietaire,
    report.adresse_logement,
    report.intervenant,
    report.observations.some((obs) => obs.observations.trim()),
    report.analyse_expert,
    report.recommandations,
    report.nom_signataire,
    report.signature,
  ];
  if (isHabitologieReport(report)) {
    required.splice(
      4,
      0,
      report.sous_categorie !== HABITOLOGIE_DEFAULT_HOUSING_TYPE,
      report.ecoute?.motif_visite,
      report.ecoute?.attentes_client,
    );
  }
  const score = Math.round((required.filter(Boolean).length / required.length) * 100);

  return (
    <aside className="summary-panel">
      <div>
        <span className="eyebrow">Avancement</span>
        <strong>{score} %</strong>
        <div className="progress">
          <span style={{ width: `${score}%` }} />
        </div>
      </div>
      <dl>
        <div>
          <dt>Dossier</dt>
          <dd>{report.reference_dossier || 'A renseigner'}</dd>
        </div>
        <div>
          <dt>Client</dt>
          <dd>{report.proprietaire || 'A renseigner'}</dd>
        </div>
        <div>
          <dt>Observations</dt>
          <dd>{report.observations.length}</dd>
        </div>
        <div>
          <dt>Photos</dt>
          <dd>{photoCount}</dd>
        </div>
      </dl>
      {validation.errors.length > 0 && (
        <div className="notice danger">
          <AlertTriangle size={18} />
          {validation.errors.length} point(s) bloquant(s)
        </div>
      )}
      {validation.errors.length === 0 && validation.warnings.length > 0 && (
        <div className="notice warning">
          <AlertTriangle size={18} />
          {validation.warnings.length} alerte(s) metier
        </div>
      )}
    </aside>
  );
}

function HomePage({ draft, onNew, onResume, onlineSyncEnabled }) {
  const hasDraft = Boolean(draft);
  return (
    <div className="screen">
      <Header />
      <main className="home-grid">
        <section className="panel home-panel">
          <span className="eyebrow">Rapport AVEREO Pro</span>
          <h2>Creer ou reprendre un rapport</h2>
          <p>
            Un seul parcours conserve les fonctions existantes. Le type de dossier, dont Visite Globale,
            se choisit dans l'etape Dossier et pourra adapter le workflow a la mission.
          </p>
          {!onlineSyncEnabled && (
            <div className="preview-notice" role="status">
              <Save size={18} />
              <span>
                Preversion sans compte : le brouillon reste uniquement dans ce navigateur. Exportez regulierement une
                copie JSON pour pouvoir le restaurer sur un autre appareil.
              </span>
            </div>
          )}
          <div className="home-actions">
            <button className="button primary" type="button" onClick={onNew}>
              <Plus size={18} />
              Nouveau rapport
            </button>
            <button className="button secondary" type="button" onClick={onResume} disabled={!hasDraft}>
              <RotateCcw size={18} />
              Reprendre
            </button>
          </div>
          {hasDraft && (
            <p className="draft-line">
              Dernier brouillon{isHabitologieReport(draft) ? " d'habitologie" : ''} :{' '}
              {draft.reference_dossier || draft.titre} - {formatDateTime(draft.updatedAt)}
            </p>
          )}
        </section>

        <section className="panel checklist-panel">
          <h3>Controle rapide</h3>
          <ul>
            <li>
              <ClipboardList size={18} />
              Donnees client et dossier
            </li>
            <li>
              <MapPin size={18} />
              Bien, cadastre et risques connus
            </li>
            <li>
              <Camera size={18} />
              Observations, photos et mesures
            </li>
            <li>
              <PenLine size={18} />
              Analyse, aides et synthese
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function DossierStep({ report, setReport }) {
  const subcategories = getReportSubcategories(report.categorie, report.sous_categorie);
  const habitologie = isHabitologieReport(report);
  const housingTypeSelected = report.sous_categorie !== HABITOLOGIE_DEFAULT_HOUSING_TYPE;

  const updateField = (field, value) => {
    setReport((prev) => {
      if (field !== 'adresse_logement') return { ...prev, [field]: value };
      return {
        ...prev,
        [field]: value,
        cadastre: { ...initialReport.cadastre },
        urbanisme: { ...initialReport.urbanisme },
        risques: emptyGeorisquesRiskSummary(),
        localisation: emptyLocation(),
        terrain: emptyTerrain(),
      };
    });
  };
  const updateEcoute = (field, value) => {
    setReport((prev) => ({ ...prev, ecoute: {
      ...prev.ecoute,
      [field]: value,
      ...(field === 'besoin_reformule' ? { besoin_confirme: false } : {}),
    } }));
  };
  const appendEcoute = (field, text) => {
    setReport((prev) => ({
      ...prev,
      ecoute: {
        ...prev.ecoute, [field]: `${prev.ecoute?.[field] || ''}${text}`,
        ...(field === 'besoin_reformule' ? { besoin_confirme: false } : {}),
      },
    }));
  };

  const updateClassification = (previous, categorie, sousCategorie) => {
    return {
      ...previous,
      categorie,
      sous_categorie: sousCategorie,
      titre: nextReportTitle(previous.titre, previous.categorie, categorie),
      protocoles: { ...previous.protocoles, ...recommendedProtocols(categorie, sousCategorie) },
    };
  };

  const selectCategory = (categorie) => {
    const sousCategorie = REPORT_CATEGORIES[categorie].subcategories[0];
    setReport((prev) => updateClassification(prev, categorie, sousCategorie));
  };

  const selectSubcategory = (sousCategorie) => {
    setReport((prev) => updateClassification(prev, prev.categorie, sousCategorie));
  };

  return (
    <section className="panel">
      <div className="section-title">
        <ClipboardList size={22} />
        <div>
          <h2>Dossier</h2>
          <p>Informations de base, client et mission.</p>
        </div>
      </div>

      {habitologie && (
        <fieldset className="consent-list consent-first">
          <legend>Accords recueillis</legend>
          <label className={report.ecoute.consentement_photos ? 'selected' : ''}>
            <input type="checkbox" checked={Boolean(report.ecoute.consentement_photos)}
              onChange={(event) => updateEcoute('consentement_photos', event.target.checked)} />
            <span><strong>Photos dans le dossier</strong>
              <small>Le client autorise l'utilisation des photos prises pendant la visite dans ce dossier.</small></span>
          </label>
          <label className={report.ecoute.consentement_dictee ? 'selected' : ''}>
            <input type="checkbox" checked={Boolean(report.ecoute.consentement_dictee)}
              onChange={(event) => updateEcoute('consentement_dictee', event.target.checked)} />
            <span><strong>Dictee vocale pendant la visite</strong>
              <small>Le client accepte la transcription vocale en texte. Aucun fichier audio n'est conserve.</small></span>
          </label>
        </fieldset>
      )}

      <div className="choice-grid two">
        {getSelectableReportCategories().map(([name, item]) => (
          <ButtonCard
            key={name}
            active={report.categorie === name}
            title={item.label || name}
            description={item.description}
            onClick={() => selectCategory(name)}
          />
        ))}
      </div>

      <div className="form-grid two">
        <Field label={habitologie ? "Type d'habitation" : 'Sous-categorie'}>
          <select value={report.sous_categorie} onChange={(event) => selectSubcategory(event.target.value)}>
            {subcategories.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Titre du rapport">
          <input value={report.titre} onChange={(event) => updateField('titre', event.target.value)} />
        </Field>
        <Field label="Reference dossier">
          <input
            value={report.reference_dossier}
            onChange={(event) => updateField('reference_dossier', event.target.value)}
            placeholder="DOS-2026-001"
          />
        </Field>
        <Field label="Date de visite">
          <input type="date" value={report.date_visite} onChange={(event) => updateField('date_visite', event.target.value)} />
        </Field>
        <Field label="Nom du proprietaire">
          <input value={report.proprietaire} onChange={(event) => updateField('proprietaire', event.target.value)} />
        </Field>
        <Field label="Email">
          <input type="email" value={report.email} onChange={(event) => updateField('email', event.target.value)} />
        </Field>
        <Field label="Adresse du logement">
          <input id="adresse-logement" value={report.adresse_logement} onChange={(event) => updateField('adresse_logement', event.target.value)} />
        </Field>
        <Field label="Intervenant AVEREO">
          <input value={report.intervenant} onChange={(event) => updateField('intervenant', event.target.value)} />
        </Field>
      </div>

      {habitologie && (
        <section className="habitologie-block" aria-labelledby="ecoute-title">
          <div className="habitologie-heading">
            <span>VISITE GLOBALE{housingTypeSelected ? ` · ${report.sous_categorie}` : ''}</span>
            <h3 id="ecoute-title">Ecoute client</h3>
            <p>
              Recueillez le besoin, le contexte et les attentes avant de commencer les observations du bien.
            </p>
          </div>

          {LISTENING_SECTIONS.map((section) => (
            <section className="listening-section" key={section.title}>
              <h4>{section.title}</h4>
              <p>{section.help}</p>
              <div className="form-grid two">
                {section.fields.map((field) => (
                  <TextAreaWithMic
                    key={field.key}
                    label={field.label}
                    value={report.ecoute[field.key] || ''}
                    onChange={(value) => updateEcoute(field.key, value)}
                    onAppend={(text) => appendEcoute(field.key, text)}
                    placeholder={field.prompt}
                    rows={3}
                    micDisabled={!report.ecoute.consentement_dictee}
                    micDisabledReason="Enregistrer d'abord l'accord du client pour utiliser la dictee vocale."
                  />
                ))}
              </div>
            </section>
          ))}
          <label className="inline-confirmation">
            <input type="checkbox" checked={Boolean(report.ecoute.besoin_confirme)}
              disabled={!report.ecoute.besoin_reformule?.trim()}
              onChange={(event) => updateEcoute('besoin_confirme', event.target.checked)} />
            J'ai reformulé le besoin et le client confirme que cela correspond à ses attentes.
          </label>
          <fieldset className="listening-topics">
            <legend>Sujets identifiés ensemble pendant l'écoute</legend>
            <p>Cochez uniquement les sujets évoqués. Ils suggèrent des contrôles à discuter à l'étape 3, sans établir de diagnostic. Les notes libres ne cochent rien automatiquement.</p>
            <div className="protocol-list compact">
              {LISTENING_TOPICS.map((topic) => {
                const selected = Array.isArray(report.ecoute.sujets_identifies) && report.ecoute.sujets_identifies.includes(topic.key);
                return (
                  <label key={topic.key} className={selected ? 'selected' : ''}>
                    <input type="checkbox" checked={selected} onChange={(event) => {
                      const topics = Array.isArray(report.ecoute.sujets_identifies) ? report.ecoute.sujets_identifies : [];
                      updateEcoute('sujets_identifies', event.target.checked ? [...topics, topic.key] : topics.filter((key) => key !== topic.key));
                    }} />
                    <span>{topic.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

        </section>
      )}
    </section>
  );
}

function RiskSummary({ summary, fallbackReportUrl, hasCoordinates, report, setReport, busy }) {
  const [refresh, setRefresh] = useState(0);
  const [status, setStatus] = useState('');
  const { lon, lat } = report.cadastre;
  useEffect(() => {
    if (!hasCoordinates || busy || (summary?.fetchedAt && refresh === 0)) return;
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setStatus('loading');
    fetch(buildGeorisquesRiskSummaryUrl(lon, lat), { signal: controller.signal, referrerPolicy: 'no-referrer' })
      .then((response) => { if (!response.ok) throw new Error('Géorisques indisponible'); return response.json(); })
      .then((payload) => {
        const risques = normalizeGeorisquesRiskSummary(payload);
        if (!active) return;
        setReport((prev) => Number(prev.cadastre.lon) === Number(lon) && Number(prev.cadastre.lat) === Number(lat)
          ? { ...prev, risques } : prev);
        setStatus('');
      }).catch(() => { if (active) setStatus('error'); }).finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [lon, lat, hasCoordinates, busy, refresh, setReport]);
  const groups = [
    { key: 'naturels', label: 'Risques naturels identifies', items: summary.naturels || [] },
    { key: 'technologiques', label: 'Risques technologiques identifies', items: summary.technologiques || [] },
  ];
  const reportUrl = safeGeorisquesReportUrl(summary.reportUrl) || fallbackReportUrl;

  return (
    <section className="risk-summary" aria-labelledby="risk-summary-title">
      <div className="risk-summary-header">
        <div>
          <span>SYNTHESE GEORISQUES</span>
          <h3 id="risk-summary-title">Risques connus pour le bien</h3>
          <p>
            Donnees informatives recuperees pour {summary.addressLabel || summary.communeLabel || 'les coordonnees du bien'}.
          </p>
        </div>
        {hasCoordinates && reportUrl && (
          <button className="button ghost" type="button" onClick={() => window.open(reportUrl, '_blank', 'noopener,noreferrer')}>
            <ShieldCheck size={18} />
            Voir le rapport complet
          </button>
        )}
      </div>

      <button className="button secondary" type="button" disabled={busy || status === 'loading'}
        onClick={() => setRefresh((n) => n + 1)}>Actualiser la synthèse</button>
      {(busy || status === 'loading') && <p role="status">Récupération de la synthèse des risques…</p>}
      {status === 'error' && <p className="status-line warning" role="alert">La synthèse n’a pas pu être récupérée. Réessayez ou ouvrez le rapport officiel.
        {summary?.fetchedAt && ' La dernière consultation est conservée ci-dessous.'}</p>}
      {!summary?.fetchedAt && status !== 'loading' && !busy && <p>Aucune synthèse disponible dans ce dossier. Cela ne signifie pas absence de risque.</p>}

      {summary?.fetchedAt && groups.map((group) => (
        <div className="risk-group" key={group.key}>
          <h4>
            {group.items.length} {group.label}
          </h4>
          {group.items.length === 0 ? (
            <p className="muted">Aucun risque present dans cette categorie selon la reponse recue.</p>
          ) : (
            <div className="risk-table" role="table" aria-label={group.label}>
              {group.items.map((risk) => (
                <div className="risk-row" role="row" key={risk.key}>
                  <strong role="cell">{risk.label}</strong>
                  <span role="cell">
                    <small>A l'adresse</small>
                    <em className={`risk-status ${riskStatusTone(risk.addressStatus)}`}>{risk.addressStatus}</em>
                  </span>
                  <span role="cell">
                    <small>Sur la commune</small>
                    <em className={`risk-status ${riskStatusTone(risk.communeStatus)}`}>{risk.communeStatus}</em>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {summary?.fetchedAt && <p className="risk-source">
        Source : {summary.source} · consultation du {formatDateTime(summary.fetchedAt)}. Cette synthese est informative et ne
        remplace pas le rapport officiel.
      </p>}
    </section>
  );
}

function SiteStep({ report, setReport, onCorrectAddress }) {
  const [lookupStatus, setLookupStatus] = useState({ state: 'idle', message: '' });
  const [view, setView] = useState('cadastre');
  const lookupSequence = useRef(0);
  useEffect(() => () => { lookupSequence.current += 1; }, [report.adresse_logement]);

  const updateNested = (group, field, value) => {
    setReport((prev) => ({ ...prev, [group]: { ...prev[group], [field]: value } }));
  };

  const lookupCadastre = async () => {
    if (!report.adresse_logement.trim()) {
      setLookupStatus({ state: 'error', message: 'Renseigner une adresse avant la recherche.' });
      return;
    }

    const sequence = ++lookupSequence.current;
    const isCurrent = () => lookupSequence.current === sequence;
    setView('cadastre');
    setReport((prev) => ({ ...prev, localisation: { ...prev.localisation, confirmation: null } }));
    setLookupStatus({ state: 'loading', message: "Recherche de l'adresse..." });
    try {
      const banUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(report.adresse_logement)}&limit=1`;
      const banResponse = await fetch(banUrl, { signal: AbortSignal.timeout(15000) });
      if (!banResponse.ok) throw new Error('Recherche indisponible');
      const banData = await banResponse.json();
      const feature = banData.features?.[0];
      if (!feature) throw new Error('Adresse introuvable');

      const [lon, lat] = feature.geometry.coordinates;
      if (!validLocation(lon, lat)) throw new Error('Coordonnees invalides');
      if (!isCurrent()) return;
      // Display the location immediately: cadastral enrichment must not block client review.
      setReport((prev) => ({ ...prev,
        cadastre: { ...initialReport.cadastre, lon, lat },
        urbanisme: { ...initialReport.urbanisme },
        risques: emptyGeorisquesRiskSummary(),
        localisation: { adresse_trouvee: feature.properties.label || '', confirmation: null },
        terrain: emptyTerrain(),
      }));
      const pointGeom = encodeURIComponent(JSON.stringify({ type: 'Point', coordinates: [lon, lat] }));
      setLookupStatus({ state: 'loading', message: 'Recherche de la parcelle cadastrale...' });

      let parcelle = null;
      try {
        const cadastreResponse = await fetch(`https://apicarto.ign.fr/api/cadastre/parcelle?geom=${pointGeom}`, { signal: AbortSignal.timeout(12000) });
        if (cadastreResponse.ok) parcelle = (await cadastreResponse.json()).features?.[0]?.properties || null;
      } catch { /* The map and risk lookup remain available without a parcel. */ }
      if (!isCurrent()) return;

      let urbanisme = { zone: '', description: '', pdfUrl: '' };
      try {
        const zoneResponse = await fetch(`https://apicarto.ign.fr/api/gpu/zone-urba?geom=${pointGeom}`, { signal: AbortSignal.timeout(12000) });
        if (zoneResponse.ok) {
          const zoneData = await zoneResponse.json();
          const zone = zoneData.features?.[0]?.properties;
          urbanisme = {
            zone: zone?.libelle || '',
            description: zone?.libelong || '',
            pdfUrl: safeDocumentUrl(zone?.urlfic),
          };
        }
        if (!urbanisme.pdfUrl) {
          const docResponse = await fetch(`https://apicarto.ign.fr/api/gpu/document?geom=${pointGeom}`, { signal: AbortSignal.timeout(12000) });
          if (docResponse.ok) {
            const docData = await docResponse.json();
            urbanisme.pdfUrl = safeDocumentUrl(docData.features?.[0]?.properties?.urldoc);
          }
        }
      } catch {
        urbanisme = { zone: '', description: '', pdfUrl: '' };
      }

      let risques = emptyGeorisquesRiskSummary();
      let risquesDisponibles = false;
      if (!isCurrent()) return;
      try {
        setLookupStatus({ state: 'loading', message: 'Recuperation de la synthese des risques...' });
        const risksUrl = buildGeorisquesRiskSummaryUrl(lon, lat);
        if (!risksUrl) throw new Error('Coordonnees invalides');
        const risksResponse = await fetch(risksUrl, { signal: AbortSignal.timeout(15000) });
        if (!risksResponse.ok) throw new Error(`Georisques ${risksResponse.status}`);
        risques = normalizeGeorisquesRiskSummary(await risksResponse.json());
        risquesDisponibles = true;
      } catch {
        risques = emptyGeorisquesRiskSummary();
      }

      if (!isCurrent()) return;
      setReport((prev) => ({
        ...prev,
        cadastre: {
          section: parcelle?.section || '',
          numero: parcelle?.numero || '',
          contenance: parcelle?.contenance || '',
          commune: feature.properties.citycode || '',
          nom_commune: feature.properties.city || '',
          lon,
          lat,
        },
        urbanisme,
        risques,
      }));
      setLookupStatus({
        state: risquesDisponibles && parcelle ? 'success' : 'warning',
        message:
          risquesDisponibles && parcelle
            ? 'Parcelle, contexte et synthese des risques recuperes.'
            : risquesDisponibles
              ? "Adresse et synthese des risques recuperees. La parcelle cadastrale n'a pas ete identifiee automatiquement."
              : parcelle
                ? 'Parcelle et contexte recuperes. La synthese Georisques est temporairement indisponible.'
                : "Adresse localisee. La parcelle et la synthese Georisques n'ont pas pu etre recuperees.",
      });
    } catch {
      if (isCurrent()) setLookupStatus({ state: 'error', message: 'Recherche indisponible ou adresse non trouvee.' });
    }
  };

  const georisquesReportUrl = buildGeorisquesReportUrl(report.cadastre.lon, report.cadastre.lat);
  const hasCoordinates = georisquesReportUrl !== null;

  return (
    <section className="panel">
      <div className="section-title">
        <CloudSun size={22} />
        <div>
          <h2>Site et contexte</h2>
          <p>Environnement analyse, meteo, cadastre et urbanisme.</p>
        </div>
      </div>

      <div className="segmented" aria-label="Environnement analyse">
        {['Interieur', 'Exterieur', 'Mixte'].map((item) => (
          <button
            key={item}
            type="button"
            className={report.environnement === item ? 'selected' : ''}
            onClick={() => setReport((prev) => ({ ...prev, environnement: item }))}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="form-grid five">
        <Field label="Ciel">
          <select value={report.meteo.ciel} onChange={(event) => updateNested('meteo', 'ciel', event.target.value)}>
            <option value="">Non renseigne</option>
            <option>Clair</option>
            <option>Nuageux</option>
            <option>Pluvieux</option>
            <option>Orageux</option>
          </select>
        </Field>
        <Field label="Temperature">
          <input
            type="number"
            value={report.meteo.temperatureC}
            onChange={(event) => updateNested('meteo', 'temperatureC', event.target.value)}
            placeholder="18"
          />
        </Field>
        <Field label="Humidite">
          <input
            type="number"
            value={report.meteo.humiditePct}
            onChange={(event) => updateNested('meteo', 'humiditePct', event.target.value)}
            placeholder="55"
          />
        </Field>
        <Field label="Pluie">
          <select value={report.meteo.pluie} onChange={(event) => updateNested('meteo', 'pluie', event.target.value)}>
            <option value="">Non renseigne</option>
            <option>Aucune</option>
            <option>Fine</option>
            <option>Moderee</option>
            <option>Forte</option>
          </select>
        </Field>
        <Field label="Vent">
          <input value={report.meteo.vent} onChange={(event) => updateNested('meteo', 'vent', event.target.value)} />
        </Field>
      </div>

      <div className="cadastre-box">
        <div>
          <h3>Cadastre et PLU</h3>
          <p>Recherche automatique depuis l'adresse du dossier.</p>
        </div>
        <div className="toolbar">
          <button className="button secondary" type="button" onClick={lookupCadastre} disabled={lookupStatus.state === 'loading'}>
            {lookupStatus.state === 'loading' ? <Loader2 className="spin" size={18} /> : <MapPin size={18} />}
            Rechercher
          </button>
        </div>
      </div>

      {lookupStatus.message && <p className={`status-line ${lookupStatus.state}`}>{lookupStatus.message}</p>}

      {hasCoordinates && <>
        <nav className="site-views" aria-label="Informations sur le bien">
          {[['cadastre', 'Cadastre / valider le bien'], ['risques', 'Rapport des risques'],
            ['urbanisme', 'Carte PLU / règles'], ['terrain', 'Relief / orientation']].map(([key, label]) =>
            <button type="button" key={key} aria-pressed={view === key} onClick={() => setView(key)}>{label}</button>)}
        </nav>
        {view !== 'cadastre' && <p className="site-location-status">{locationConfirmed(report) ? 'Lieu confirmé avec le client' : 'Lieu à confirmer dans Cadastre'} · {report.localisation.adresse_trouvee || report.adresse_logement}</p>}
        {view === 'cadastre' && <LocationMap report={report} setReport={setReport} onCorrectAddress={onCorrectAddress} />}
        {view === 'risques' && <RiskSummary summary={report.risques} fallbackReportUrl={georisquesReportUrl}
          hasCoordinates={hasCoordinates} report={report} setReport={setReport} busy={lookupStatus.state === 'loading'} />}
        {view === 'urbanisme' && (lookupStatus.state === 'loading' ? <p role="status">Localisation en cours…</p>
          : <UrbanismPanel report={report} setReport={setReport} />)}
        {view === 'terrain' && (lookupStatus.state === 'loading' ? <p role="status">Localisation en cours…</p>
          : <TerrainPanel report={report} setReport={setReport} />)}
      </>}

      {view === 'cadastre' && <div className="form-grid four">
        <Field label="Section">
          <input value={report.cadastre.section} onChange={(event) => updateNested('cadastre', 'section', event.target.value)} />
        </Field>
        <Field label="Numero">
          <input value={report.cadastre.numero} onChange={(event) => updateNested('cadastre', 'numero', event.target.value)} />
        </Field>
        <Field label="Contenance">
          <input
            value={report.cadastre.contenance}
            onChange={(event) => updateNested('cadastre', 'contenance', event.target.value)}
          />
        </Field>
        <Field label="Commune">
          <input
            value={report.cadastre.nom_commune}
            onChange={(event) => updateNested('cadastre', 'nom_commune', event.target.value)}
          />
        </Field>
        <Field label="Zone PLU">
          <input value={report.urbanisme.zone} onChange={(event) => updateNested('urbanisme', 'zone', event.target.value)} />
        </Field>
        <Field label="Description PLU">
          <input
            value={report.urbanisme.description}
            onChange={(event) => updateNested('urbanisme', 'description', event.target.value)}
          />
        </Field>
      </div>}
    </section>
  );
}

function ProtocolStep({ report, setReport }) {
  const habitologie = isHabitologieReport(report);
  const dictationAllowed = !habitologie || Boolean(report.ecoute?.consentement_dictee);
  const updateHabitologieControl = (stageKey, controlKey, checked) => {
    setReport((prev) => ({
      ...prev,
      habitologie_protocoles: {
        ...prev.habitologie_protocoles,
        [stageKey]: {
          ...prev.habitologie_protocoles[stageKey],
          controls: {
            ...prev.habitologie_protocoles[stageKey].controls,
            [controlKey]: checked,
          },
        },
      },
    }));
  };

  return (
    <section className="panel">
      <div className="section-title">
        <ShieldCheck size={22} />
        <div>
          <h2>Protocoles</h2>
          <p>
            {habitologie
              ? "Suivre les quatre phases dans l'ordre et retenir les points a observer."
              : 'Selectionner les controles qui seront repris dans le rapport.'}
          </p>
        </div>
      </div>
      {habitologie ? (
        <div className="habitologie-protocol" aria-label="Protocole de visite globale">
          <div className="analysis-sequence" aria-label="Ordre de l'analyse globale">
            <div>
              <strong>Fil conducteur de l'analyse</strong>
              <small>Faire le point avec le client avant de lancer les observations.</small>
            </div>
            <ol>
              {HABITOLOGIE_ANALYSIS_STAGES.map((stage, index) => (
                <li key={stage}><span>{index + 1}</span><strong>{stage}</strong>
                  {index < HABITOLOGIE_ANALYSIS_STAGES.length - 1 && <ArrowRight size={16} aria-hidden="true" />}
                </li>
              ))}
            </ol>
          </div>
          <div className="listening-review">
            <strong>Besoin reformulé : {report.ecoute.besoin_reformule || 'À préciser avec le client'}</strong>
            <p>{report.ecoute.besoin_confirme ? 'Reformulation confirmée avec le client.' : 'Reformulation à confirmer avec le client.'}</p>
            <p>Les nouveaux dossiers commencent sans contrôle coché. Seuls les sujets identifiés à l'écoute proposent une sélection, ajustable ici. Vos choix précédents sont conservés.</p>
            <small>Un point non retenu n'est ni vérifié ni déclaré sans risque. Complétez le périmètre selon votre expertise et les conditions de visite.</small>
          </div>
          {HABITOLOGIE_PROTOCOL_STAGES.map((stage, index) => (
            <article className={`protocol-phase phase-${stage.key}`} key={stage.key}>
              <div className="protocol-phase-heading">
                <span>Phase {index + 1}</span>
                <div>
                  <h3>{stage.label}</h3>
                  <p>{stage.summary}</p>
                </div>
              </div>
              <div className="protocol-list compact">
                {stage.controls.map((control) => {
                  const selected = isHabitologieControlSelected(report, stage.key, control.key);
                  const suggestions = listeningSuggestions(report.ecoute, stage.key, control.key);
                  return (
                    <label key={control.key} className={selected ? 'selected' : ''}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) => updateHabitologieControl(stage.key, control.key, event.target.checked)}
                      />
                      <span>
                        <strong>{control.label}</strong>
                        {suggestions.length > 0 && <small>Écoute : {suggestions.map((topic) => topic.label).join(' ; ')}</small>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="protocol-list">
          {protocolOptions.map((protocol) => (
            <label key={protocol.key} className={report.protocoles[protocol.key] ? 'selected' : ''}>
              <input
                type="checkbox"
                checked={Boolean(report.protocoles[protocol.key])}
                onChange={(event) =>
                  setReport((prev) => ({
                    ...prev,
                    protocoles: { ...prev.protocoles, [protocol.key]: event.target.checked },
                  }))
                }
              />
              <span>
                <strong>{protocol.label}</strong>
                <small>{protocol.detail}</small>
              </span>
            </label>
          ))}
        </div>
      )}
      <TextAreaWithMic
        label="Reserves de methode"
        value={report.reserves}
        onChange={(value) => setReport((prev) => ({ ...prev, reserves: value }))}
        onAppend={(text) => setReport((prev) => ({ ...prev, reserves: `${prev.reserves || ''}${text}` }))}
        placeholder="Limites d'acces, conditions meteo, zones non inspectees..."
        rows={4}
        micDisabled={!dictationAllowed}
        micDisabledReason="Enregistrer d'abord l'accord du client dans l'etape Dossier."
      />
    </section>
  );
}

function ObservationStep({ report, setReport }) {
  const [cameraFor, setCameraFor] = useState(null);
  const habitologie = isHabitologieReport(report);
  const photoAllowed = !habitologie || Boolean(report.ecoute?.consentement_photos);
  const dictationAllowed = !habitologie || Boolean(report.ecoute?.consentement_dictee);
  const consentReason = "Enregistrer d'abord l'accord du client dans l'etape Dossier.";

  const addObservation = (phaseKey = '') => {
    setReport((prev) => ({
      ...prev,
      observations: [...prev.observations, { ...emptyObservation(), phase_habitologie: phaseKey }],
    }));
  };

  const updateObservation = (id, patch) => {
    setReport((prev) => ({
      ...prev,
      observations: prev.observations.map((obs) => (obs.id === id ? { ...obs, ...patch } : obs)),
    }));
  };

  const removeObservation = (id) => {
    setReport((prev) => {
      const next = prev.observations.filter((obs) => obs.id !== id);
      return { ...prev, observations: next.length > 0 ? next : [emptyObservation()] };
    });
  };

  const addPhotos = (obsId, files) => {
    if (!photoAllowed) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photo = {
          id: createId(),
          name: file.name,
          src: event.target.result,
          horodatageISO: new Date().toISOString(),
        };
        setReport((prev) => ({
          ...prev,
          observations: prev.observations.map((obs) =>
            obs.id === obsId ? { ...obs, photos: [...obs.photos, photo] } : obs,
          ),
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const addCameraPhoto = (photo) => {
    if (!cameraFor || !photoAllowed) return;
    setReport((prev) => ({
      ...prev,
      observations: prev.observations.map((obs) =>
        obs.id === cameraFor ? { ...obs, photos: [...obs.photos, photo] } : obs,
      ),
    }));
    setCameraFor(null);
  };

  const removePhoto = (obsId, photoId) => {
    setReport((prev) => ({
      ...prev,
      observations: prev.observations.map((obs) =>
        obs.id === obsId ? { ...obs, photos: obs.photos.filter((photo) => photo.id !== photoId) } : obs,
      ),
    }));
  };

  const renderObservationCard = (obs) => {
    const observationIndex = report.observations.findIndex((item) => item.id === obs.id);
    const selectedStage = findHabitologieStage(obs.phase_habitologie);
    const controls = selectedStage?.controls || [];

    return (
      <article className="observation-card" key={obs.id}>
        <div className="observation-header">
          <h3>Observation {observationIndex + 1}</h3>
          <button
            className="icon-button danger"
            type="button"
            aria-label="Supprimer cette observation"
            onClick={() => removeObservation(obs.id)}
          >
            <Trash2 size={17} />
          </button>
        </div>

        {habitologie && (
          <div className="form-grid two protocol-link-fields">
            <Field label="Phase d'analyse">
              <select
                value={obs.phase_habitologie}
                onChange={(event) =>
                  updateObservation(obs.id, { phase_habitologie: event.target.value, controle_habitologie: '' })
                }
              >
                <option value="">A classer</option>
                {HABITOLOGIE_PROTOCOL_STAGES.map((stage, index) => (
                  <option key={stage.key} value={stage.key}>
                    Phase {index + 1} · {stage.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Point du protocole">
              <select
                value={obs.controle_habitologie}
                disabled={!selectedStage}
                onChange={(event) => updateObservation(obs.id, { controle_habitologie: event.target.value })}
              >
                <option value="">{selectedStage ? 'Autre point ou constat transversal' : "Choisir d'abord une phase"}</option>
                {controls.map((control) => (
                  <option key={control.key} value={control.key}>
                    {control.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <div className="form-grid four">
          <Field label="Titre">
            <input value={obs.titre} onChange={(event) => updateObservation(obs.id, { titre: event.target.value })} />
          </Field>
          <Field label="Piece / zone">
            <select value={obs.piece} onChange={(event) => updateObservation(obs.id, { piece: event.target.value })}>
              <option value="">Selectionner</option>
              {piecesOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>
          <Field label="Element">
            <select value={obs.surface} onChange={(event) => updateObservation(obs.id, { surface: event.target.value })}>
              <option value="">Selectionner</option>
              {surfacesOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>
          <Field label="Gravite">
            <select value={obs.gravite} onChange={(event) => updateObservation(obs.id, { gravite: event.target.value })}>
              {gravities.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>
        </div>

        <TextAreaWithMic
          label="Constat"
          value={obs.observations}
          onChange={(value) => updateObservation(obs.id, { observations: value })}
          onAppend={(text) => updateObservation(obs.id, { observations: `${obs.observations || ''}${text}` })}
          placeholder="Decrire les desordres observes..."
          micDisabled={!dictationAllowed}
          micDisabledReason={consentReason}
        />
        <TextAreaWithMic
          label="Suites proposees"
          value={obs.actions}
          onChange={(value) => updateObservation(obs.id, { actions: value })}
          onAppend={(text) => updateObservation(obs.id, { actions: `${obs.actions || ''}${text}` })}
          placeholder="Mesures conservatoires, controle complementaire, travaux recommandes..."
          rows={3}
          micDisabled={!dictationAllowed}
          micDisabledReason={consentReason}
        />

        <div className="photo-grid">
          {obs.photos.map((photo) => (
            <figure key={photo.id}>
              <img src={photo.src} alt={photo.name} loading="lazy" />
              <figcaption>{formatDateTime(photo.horodatageISO)}</figcaption>
              <button
                className="icon-button danger"
                type="button"
                aria-label="Supprimer la photo"
                onClick={() => removePhoto(obs.id, photo.id)}
              >
                <Trash2 size={15} />
              </button>
            </figure>
          ))}
          <label className={`photo-action ${photoAllowed ? '' : 'disabled'}`} title={photoAllowed ? 'Importer des photos' : consentReason}>
            <Upload size={22} />
            Importer
            <input
              type="file"
              multiple
              accept="image/*"
              disabled={!photoAllowed}
              onChange={(event) => addPhotos(obs.id, event.target.files)}
            />
          </label>
          <button
            className="photo-action"
            type="button"
            disabled={!photoAllowed}
            title={photoAllowed ? 'Prendre une photo' : consentReason}
            onClick={() => setCameraFor(obs.id)}
          >
            <Camera size={22} />
            Camera
          </button>
        </div>
      </article>
    );
  };

  return (
    <section className="panel">
      <div className="section-title">
        <Camera size={22} />
        <div>
          <h2>Observations</h2>
          <p>Constats localises, niveau de gravite, photos et suites proposees.</p>
        </div>
      </div>

      {habitologie && (!photoAllowed || !dictationAllowed) && (
        <div className="notice warning consent-warning" role="status">
          <AlertTriangle size={18} />
          Les photos et la dictee restent desactivees tant que les accords correspondants ne sont pas enregistres dans
          l'etape Dossier.
        </div>
      )}

      {habitologie ? (
        <div className="observation-phases">
          {HABITOLOGIE_PROTOCOL_STAGES.map((stage, index) => {
            const stageObservations = report.observations.filter((obs) => obs.phase_habitologie === stage.key);
            return (
              <section className={`observation-phase phase-${stage.key}`} key={stage.key}>
                <div className="observation-phase-heading">
                  <div>
                    <span>Phase {index + 1}</span>
                    <h3>{stage.label}</h3>
                    <p>{stage.summary}</p>
                  </div>
                  <button className="button secondary" type="button" onClick={() => addObservation(stage.key)}>
                    <Plus size={18} />
                    Ajouter
                  </button>
                </div>
                {stageObservations.length > 0 ? (
                  <div className="observation-list">{stageObservations.map(renderObservationCard)}</div>
                ) : (
                  <p className="empty-phase">Aucune observation enregistree pour cette phase.</p>
                )}
              </section>
            );
          })}

          {report.observations.some((obs) => !findHabitologieStage(obs.phase_habitologie)) && (
            <section className="observation-phase unassigned">
              <div className="observation-phase-heading">
                <div>
                  <span>A CLASSER</span>
                  <h3>Observations non rattachees</h3>
                  <p>Choisir une phase pour integrer ces constats au fil Eau, Air, Terre ou Feu.</p>
                </div>
              </div>
              <div className="observation-list">
                {report.observations.filter((obs) => !findHabitologieStage(obs.phase_habitologie)).map(renderObservationCard)}
              </div>
            </section>
          )}
        </div>
      ) : (
        <>
          <div className="observation-list">{report.observations.map(renderObservationCard)}</div>
          <button className="button secondary" type="button" onClick={() => addObservation()}>
            <Plus size={18} />
            Ajouter une observation
          </button>
        </>
      )}

      <CameraModal open={Boolean(cameraFor)} onClose={() => setCameraFor(null)} onShot={addCameraPhoto} />
    </section>
  );
}

function ValidationStep({ report, setReport, validation, onPreview, onExport, onExportJson, onImportJson }) {
  const dictationAllowed = !isHabitologieReport(report) || Boolean(report.ecoute?.consentement_dictee);
  return (
    <section className="panel">
      <div className="section-title">
        <FileText size={22} />
        <div>
          <h2>Validation et export</h2>
          <p>Verifier les points bloquants, signer et generer le document Word.</p>
        </div>
      </div>

      <div className="validation-grid">
        <div className="validation-box">
          <h3>Controle avant export</h3>
          {validation.errors.length === 0 && validation.warnings.length === 0 && (
            <p className="success-line">
              <CheckCircle2 size={18} />
              Rapport pret a etre exporte.
            </p>
          )}
          {validation.errors.length > 0 && (
            <div className="issue-list danger">
              <strong>Points bloquants</strong>
              <ul>
                {validation.errors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div className="issue-list warning">
              <strong>Alertes metier</strong>
              <ul>
                {validation.warnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="signature-block">
          <Field label="Nom du signataire">
            <input
              value={report.nom_signataire}
              onChange={(event) => setReport((prev) => ({ ...prev, nom_signataire: event.target.value }))}
            />
          </Field>
          <SignaturePad value={report.signature} onChange={(signature) => setReport((prev) => ({ ...prev, signature }))} />
        </div>
      </div>

      <TextAreaWithMic
        label="Analyse de l'expert"
        micDisabled={!dictationAllowed}
        micDisabledReason="Enregistrer d'abord l'accord du client dans l'etape Dossier."
        value={report.analyse_expert}
        onChange={(value) => setReport((prev) => ({ ...prev, analyse_expert: value }))}
        onAppend={(text) => setReport((prev) => ({ ...prev, analyse_expert: `${prev.analyse_expert || ''}${text}` }))}
        placeholder="Synthese technique, causalites probables, limites..."
      />
      <TextAreaWithMic
        label="Recommandations"
        micDisabled={!dictationAllowed}
        micDisabledReason="Enregistrer d'abord l'accord du client dans l'etape Dossier."
        value={report.recommandations}
        onChange={(value) => setReport((prev) => ({ ...prev, recommandations: value }))}
        onAppend={(text) => setReport((prev) => ({ ...prev, recommandations: `${prev.recommandations || ''}${text}` }))}
        placeholder="Actions recommandees, priorites, controles complementaires..."
      />

      <div className="export-actions">
        <button className="button ghost" type="button" onClick={onImportJson}>
          <FileJson size={18} />
          Import JSON
        </button>
        <button className="button ghost" type="button" onClick={onExportJson}>
          <FileJson size={18} />
          Export JSON
        </button>
        <button className="button secondary" type="button" onClick={onPreview}>
          <Eye size={18} />
          Apercu
        </button>
        <button className="button primary" type="button" onClick={onExport} disabled={validation.errors.length > 0}>
          <Download size={18} />
          Generer Word
        </button>
      </div>
    </section>
  );
}

function validateReport(report) {
  const errors = [];
  const warnings = [];

  if (!report.reference_dossier.trim()) errors.push('Reference dossier requise.');
  if (!report.proprietaire.trim()) errors.push('Nom du proprietaire requis.');
  if (!report.adresse_logement.trim()) errors.push('Adresse du logement requise.');
  if (!report.intervenant.trim()) errors.push('Intervenant requis.');
  if (!report.nom_signataire.trim()) errors.push('Nom du signataire requis.');
  if (!report.signature) errors.push('Signature requise.');

  const filledObservations = report.observations.filter((obs) => obs.observations.trim());
  if (filledObservations.length === 0) errors.push('Au moins une observation doit etre renseignee.');
  if (!report.analyse_expert.trim()) warnings.push("L'analyse de l'expert est vide.");
  if (!report.recommandations.trim()) warnings.push('Les recommandations sont vides.');
  if (isHabitologieReport(report) && !report.ecoute?.motif_visite?.trim()) {
    warnings.push("Le motif de la visite n'est pas encore renseigne dans la phase Ecoute.");
  }
  if (isHabitologieReport(report) && !report.ecoute?.attentes_client?.trim()) {
    warnings.push("Les attentes du client ne sont pas encore renseignees dans la phase Ecoute.");
  }
  if (isHabitologieReport(report) && !report.ecoute?.besoin_confirme) {
    warnings.push('La reformulation du besoin reste à confirmer avec le client.');
  }
  if (isHabitologieReport(report) && report.sous_categorie === HABITOLOGIE_DEFAULT_HOUSING_TYPE) {
    warnings.push("Le type d'habitation reste a preciser dans l'etape Dossier.");
  }
  if (report.observations.some((obs) => ['Severe', 'Critique'].includes(obs.gravite)) && !report.recommandations.trim()) {
    warnings.push('Une observation severe ou critique necessite une recommandation explicite.');
  }

  return { errors, warnings };
}

function ReportPreview({ report, onClose }) {
  const html = useMemo(() => buildWordDocumentHtml(report), [report]);
  return (
    <div className="preview-backdrop">
      <div className="preview-shell">
        <div className="preview-bar">
          <h2>Apercu du rapport</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fermer l'apercu">
            <X size={18} />
          </button>
        </div>
        <iframe title="Apercu du rapport" srcDoc={html} sandbox="" referrerPolicy="no-referrer" />
      </div>
    </div>
  );
}

function OnlineSyncPanel({
  accessToken,
  authenticated,
  authConfig,
  authError,
  authUser,
  onlineSyncEnabled,
  onOAuthLogin,
  onSave,
  onTokenSubmit,
  saving,
  status,
}) {
  const [tokenInput, setTokenInput] = useState('');
  const [tokenPending, setTokenPending] = useState(false);

  if (!onlineSyncEnabled) {
    return (
      <section className="panel online-panel preview-panel">
        <div>
          <span className="eyebrow">Mode preversion</span>
          <h3>Brouillon enregistre sur cet appareil</h3>
          <p>
            La connexion AVEREO et la copie serveur sont temporairement desactivees. Effacer les donnees du navigateur
            supprimera le brouillon local ; conservez une copie avec l'export JSON.
          </p>
        </div>
        <div className="online-status" role="status">
          <span>Aucune donnee n'est envoyee au serveur Rapport.</span>
        </div>
      </section>
    );
  }

  const activateToken = async () => {
    if (!tokenInput.trim()) return;
    setTokenPending(true);
    try {
      await onTokenSubmit(tokenInput.trim());
      setTokenInput('');
    } catch {
      // Le parent expose le message sans conserver le jeton saisi.
    } finally {
      setTokenPending(false);
    }
  };

  return (
    <section className="panel online-panel">
      <div>
        <span className="eyebrow">Sauvegarde AVEREO</span>
        <h3>Copie en ligne privee</h3>
        <p>Le brouillon local reste disponible. La copie serveur est protegee par l'identite et les roles Rapport.</p>
      </div>
      <div className="online-controls">
        {!authConfig && <span className="muted">Verification de l'API...</span>}
        {authConfig?.mode === 'api_token' && !authenticated && (
          <>
            <input
              type="password"
              autoComplete="off"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="Jeton local temporaire"
              aria-label="Jeton API local"
            />
            <button className="button secondary" type="button" onClick={activateToken} disabled={tokenPending}>
              <ShieldCheck size={18} />
              Activer
            </button>
          </>
        )}
        {authConfig?.mode === 'drupal_oauth' && !authenticated && (
          <button
            className="button secondary"
            type="button"
            onClick={onOAuthLogin}
            disabled={!authConfig.configured}
          >
            <ShieldCheck size={18} />
            Connexion AVEREO
          </button>
        )}
        {authenticated && (
          <button className="button primary" type="button" onClick={onSave} disabled={saving}>
            <Save size={18} />
            {saving ? 'Sauvegarde...' : 'Sauver en ligne'}
          </button>
        )}
      </div>
      <div className="online-status" role="status">
        {authUser && <span>Connecte : {authUser.name || authUser.email || authUser.id}</span>}
        {status && <span>{status}</span>}
        {authError && <span className="error-text">{authError}</span>}
        {authConfig?.mode === 'drupal_oauth' && !authConfig.configured && (
          <span className="error-text">OAuth Drupal n'est pas encore configure cote serveur.</span>
        )}
      </div>
    </section>
  );
}

function ReportWizard({
  accessToken,
  authenticated,
  authConfig,
  authError,
  authUser,
  initialData,
  onlineSyncEnabled,
  onHome,
  onOAuthLogin,
  onTokenSubmit,
}) {
  const steps = ['Dossier', 'Site', 'Protocoles', 'Observations', 'Export'];
  const [currentStep, setCurrentStep] = useState(0);
  const [report, setReport] = useState(() => deepMergeReport(initialReport, initialData));
  const [toast, setToast] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [onlineSaving, setOnlineSaving] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState('');
  const fileInputRef = useRef(null);
  const validation = useMemo(() => validateReport(report), [report]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      saveDraft(report).catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [report]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const handleSave = async () => {
    const saved = await saveDraft(report);
    setReport(saved);
    notify('Brouillon enregistre.');
  };

  const handleOnlineSave = async () => {
    if (!authenticated) {
      setOnlineStatus('Connexion requise pour la sauvegarde en ligne.');
      return;
    }

    setOnlineSaving(true);
    setOnlineStatus('');
    try {
      const saved = await saveOnlineReport(report, accessToken, report.onlineReportId || '');
      const updated = { ...report, onlineReportId: saved.id };
      setReport(updated);
      await saveDraft(updated);
      setOnlineStatus('Rapport sauvegarde en ligne.');
    } catch (error) {
      setOnlineStatus(error.message || 'Sauvegarde en ligne impossible.');
    } finally {
      setOnlineSaving(false);
    }
  };

  const handleExport = () => {
    const html = buildWordDocumentHtml(report);
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    saveAs(blob, `${toFileName(report.reference_dossier || report.titre)}.doc`);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
    saveAs(blob, `${toFileName(report.reference_dossier || report.titre)}.json`);
  };

  const handleImportJson = () => fileInputRef.current?.click();

  const onImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      notify('Import JSON refuse : taille maximale 10 Mio.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        setReport(deepMergeReport(initialReport, parsed));
        notify('Brouillon importe.');
      } catch {
        notify('Import JSON impossible.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const goNext = () => setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  const goPrev = () => setCurrentStep((step) => Math.max(step - 1, 0));

  return (
    <div className="screen">
      <Header onHome={onHome} />
      <main className="wizard-layout">
        <StepNav steps={steps} currentStep={currentStep} setStep={setCurrentStep} />
        <div className="wizard-grid">
          <div className="wizard-main">
            {currentStep === 0 && <DossierStep report={report} setReport={setReport} />}
            {currentStep === 1 && <SiteStep report={report} setReport={setReport} onCorrectAddress={() => {
              setCurrentStep(0);
              requestAnimationFrame(() => document.getElementById('adresse-logement')?.focus());
            }} />}
            {currentStep === 2 && <ProtocolStep report={report} setReport={setReport} />}
            {currentStep === 3 && <ObservationStep report={report} setReport={setReport} />}
            {currentStep === 4 && (
              <ValidationStep
                report={report}
                setReport={setReport}
                validation={validation}
                onPreview={() => setPreviewOpen(true)}
                onExport={handleExport}
                onExportJson={handleExportJson}
                onImportJson={handleImportJson}
              />
            )}
          </div>
          <CompletionPanel report={report} validation={validation} />
        </div>
        <OnlineSyncPanel
          accessToken={accessToken}
          authenticated={authenticated}
          authConfig={authConfig}
          authError={authError}
          authUser={authUser}
          onlineSyncEnabled={onlineSyncEnabled}
          onOAuthLogin={onOAuthLogin}
          onSave={handleOnlineSave}
          onTokenSubmit={onTokenSubmit}
          saving={onlineSaving}
          status={onlineStatus}
        />
      </main>

      <footer className="action-bar">
        <button className="button ghost" type="button" onClick={handleSave}>
          <Save size={18} />
          Enregistrer
        </button>
        <div>
          <button className="button ghost" type="button" onClick={goPrev} disabled={currentStep === 0}>
            <ArrowLeft size={18} />
            Precedent
          </button>
          <button className="button primary" type="button" onClick={goNext} disabled={currentStep === steps.length - 1}>
            Suivant
            <ArrowRight size={18} />
          </button>
        </div>
      </footer>

      <input ref={fileInputRef} type="file" accept="application/json" className="visually-hidden" onChange={onImportFile} />
      {previewOpen && <ReportPreview report={report} onClose={() => setPreviewOpen(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function AccessGate({ authConfig, authError, onOAuthLogin }) {
  const issuer = String(authConfig?.issuer || '').replace(/\/$/, '');
  const oauthReady = authConfig?.mode === 'drupal_oauth' && authConfig?.configured;
  const connectMode = authConfig?.mode === 'connect_gateway';

  return (
    <div className="screen">
      <Header />
      <main className="auth-gate">
        <section className="panel auth-panel">
          <span className="eyebrow">Acces securise</span>
          <h2>Connexion a AVEREO Rapport</h2>
          {connectMode ? (
            <p>Votre session applicative doit etre renouvelee depuis AVEREO CONNECT.</p>
          ) : (
            <p>
              Identifiez-vous avec votre compte AVEREO. L'application reste inaccessible tant que Drupal n'a pas
              valide votre identite et votre role Rapport.
            </p>
          )}
          <div className="auth-actions">
            {connectMode ? (
              <a className="button primary" href="/connect/logout.php">
                <ShieldCheck size={18} />
                Revenir a AVEREO CONNECT
              </a>
            ) : (
              <>
                <button className="button primary" type="button" onClick={onOAuthLogin} disabled={!oauthReady}>
                  <ShieldCheck size={18} />
                  Se connecter a AVEREO Rapport
                </button>
                {issuer && (
                  <a className="button ghost" href={`${issuer}/user/register`}>
                    Creer un compte
                  </a>
                )}
              </>
            )}
          </div>
          <div className="auth-status" role="status">
            {!authConfig && !authError && (
              <>
                <Loader2 className="spin" size={18} />
                Verification de la configuration OAuth...
              </>
            )}
            {authConfig && !oauthReady && !connectMode && !authError && (
              <span className="error-text">OAuth Drupal n'est pas encore configure cote serveur.</span>
            )}
            {authError && <span className="error-text">{authError}</span>}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const [appState, setAppState] = useState('loading');
  const [draft, setDraft] = useState(null);
  const [initialWizardData, setInitialWizardData] = useState(initialReport);
  const [confirmReset, setConfirmReset] = useState(false);
  const [authConfig, setAuthConfig] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [authUser, setAuthUser] = useState(null);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    loadDraft()
      .then((loaded) => {
        setDraft(loaded);
        setInitialWizardData(loaded || initialReport);
        setAppState('home');
      })
      .catch(() => setAppState('home'));
  }, []);

  useEffect(() => {
    if (!ONLINE_SYNC_ENABLED) {
      setAuthConfig({ mode: 'preview', configured: false });
      return undefined;
    }

    let active = true;
    const initializeAuth = async () => {
      try {
        const config = await getAuthConfig();
        if (!active) return;
        setAuthConfig(config);

        if (config.mode === 'connect_gateway') {
          const user = await getCurrentUser('');
          if (!active) return;
          setAuthUser(user);
          setAuthError('');
          return;
        }

        const oauthToken = await completeOAuthLogin();
        if (!oauthToken || !active) return;
        const user = await getCurrentUser(oauthToken);
        if (!active) return;
        setAccessToken(oauthToken);
        setAuthUser(user);
        setAuthError('');
      } catch (error) {
        if (active) setAuthError(error.message || "L'API Rapport est indisponible.");
      }
    };
    initializeAuth();
    return () => {
      active = false;
    };
  }, []);

  const activateLocalToken = async (token) => {
    setAuthError('');
    try {
      const user = await getCurrentUser(token);
      setAccessToken(token);
      setAuthUser(user);
    } catch (error) {
      setAccessToken('');
      setAuthUser(null);
      setAuthError(error.message || 'Jeton local invalide.');
      throw error;
    }
  };

  const beginOAuthLogin = async () => {
    setAuthError('');
    try {
      await startOAuthLogin(authConfig);
    } catch (error) {
      setAuthError(error.message || 'Connexion OAuth impossible.');
    }
  };

  const startNew = async () => {
    if (draft) {
      setConfirmReset(true);
      return;
    }
    setInitialWizardData(createNewReport());
    setAppState('wizard');
  };

  const confirmNew = async () => {
    await removeDraft();
    const fresh = createNewReport();
    setDraft(null);
    setInitialWizardData(fresh);
    setConfirmReset(false);
    setAppState('wizard');
  };

  const resume = () => {
    setInitialWizardData(draft || initialReport);
    setAppState('wizard');
  };

  const goHome = async () => {
    const loaded = await loadDraft();
    setDraft(loaded);
    setInitialWizardData(loaded || initialReport);
    setAppState('home');
  };

  if (appState === 'loading') {
    return (
      <div className="loading-screen">
        <Loader2 className="spin" size={28} />
        Chargement...
      </div>
    );
  }

  const authenticated = Boolean(authUser)
    && (authConfig?.mode === 'connect_gateway' || Boolean(accessToken));

  if (ONLINE_SYNC_ENABLED && !authenticated) {
    return <AccessGate authConfig={authConfig} authError={authError} onOAuthLogin={beginOAuthLogin} />;
  }

  return (
    <>
      {appState === 'home' && (
        <HomePage
          draft={draft}
          onNew={startNew}
          onResume={resume}
          onlineSyncEnabled={ONLINE_SYNC_ENABLED}
        />
      )}
      {appState === 'wizard' && (
        <ReportWizard
          accessToken={accessToken}
          authenticated={authenticated}
          authConfig={authConfig}
          authError={authError}
          authUser={authUser}
          initialData={initialWizardData}
          onlineSyncEnabled={ONLINE_SYNC_ENABLED}
          onHome={goHome}
          onOAuthLogin={beginOAuthLogin}
          onTokenSubmit={activateLocalToken}
        />
      )}
      {confirmReset && (
        <Modal
          title="Creer un nouveau rapport ?"
          onClose={() => setConfirmReset(false)}
          actions={
            <>
              <button className="button ghost" type="button" onClick={() => setConfirmReset(false)}>
                Annuler
              </button>
              <button className="button primary" type="button" onClick={confirmNew}>
                Demarrer
              </button>
            </>
          }
        >
          <p>Un brouillon existe deja. Il sera supprime pour demarrer un dossier vierge.</p>
        </Modal>
      )}
    </>
  );
}
