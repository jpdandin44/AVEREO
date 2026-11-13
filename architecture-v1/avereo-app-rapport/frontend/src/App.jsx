import { useAppPreferences } from '../../../avereo-platform/shared/use-app-preferences.js';
import { protocolOptions, escapeHtml } from './reportHtml.js';
import { buildReportHtml, optionsWithCurrent } from './reportDelivery.js';
import ReportDeliveryOptions from './ReportDeliveryOptions.jsx';
import DecisionSupportPanel from './DecisionSupportPanel.jsx';
import { observationAdviceLabel } from './reportProfiles.js';
import { textLinks } from './textLinks.js';
import { orderedObservations, observationPhase, moveObservation } from './observationOrder.js';
import ObservationPlans from './ObservationPlans.jsx';
import { PhotoOriginalControls } from './PhotoOriginals.jsx';
import { attachOriginal, photoOriginalCapabilities } from './photoOriginals.js';
import { observationPlanNames, planPayloadError } from './observationPlans.js';
import VoiceField, { MicButton } from './VoiceField.jsx';
import { appendDictation } from './dictationText.js';
import { saveAs } from './saveAs.js';
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
  HABITOLOGIE_DEFAULT_HOUSING_TYPE,
  HABITOLOGIE_CATEGORY,
  REPORT_CATEGORIES,
  getReportSubcategories,
  getSelectableReportCategories,
  defaultReportTitle,
  isHabitologieReport,
  nextReportTitle,
  normalizeReportClassification,
  recommendedProtocols,
} from './reportClassification.js';
import { buildGeorisquesReportUrl } from './georisquesReport.js';
import {
  fetchGeorisquesRiskPayload,
  previousRisksAtPoint,
  emptyGeorisquesRiskSummary,
  normalizeGeorisquesRiskSummary,
  riskStatusTone,
  safeGeorisquesReportUrl,
  isRgaRisk,
  rgaRisk,
} from './georisquesRiskSummary.js';
import OnlineReports from './OnlineReports.jsx';
import ReportImport from './ReportImport.jsx';
import { requireReportContent } from './reportFiles.js';
import { createTestReportCopy, observationGravities } from './testReportCopy.js';
import RgaMap from './RgaMap.jsx';
import { readRgaTransfer, RGA_TRANSFER_KEY } from './rgaContext.js';
import { latestDraft } from './draftRecovery.js';
import {
  HABITOLOGIE_PROTOCOL_STAGES,
  LISTENING_TOPICS,
  createHabitologieProtocolState,
  isHabitologieControlSelected,
  isHabitologieStageEnabled,
  setHabitologieStageEnabled,
  listeningSuggestions,
  findHabitologieControl,
  findHabitologieStage,
  mergeHabitologieProtocolState,
} from './habitologieProtocol.js';
import { LISTENING_SECTIONS, emptyClientListening } from './clientListening.js';
import LocationMap from './LocationMap.jsx';
import BuildingResources from './BuildingResources.jsx';
import { emptyBuildingResources, normalizeBuildingResources } from './buildingResources.js';
import { emptyLocation, locationConfirmed, validLocation } from './locationMap.js';
import { moveVisitPoint } from './visitPoint.js';
import { TerrainPanel, UrbanismPanel } from './SiteInsights.jsx';
import { emptyTerrain, normalizeStoredTerrain } from './terrainContext.js';
import { normalizeStoredUrbanism } from './urbanismContext.js';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  GripVertical,
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


const emptyObservation = () => ({
  id: createId(),
  phase_habitologie: '',
  controle_habitologie: '',
  piece: '',
  surface: '',
  gravite: 'Mineure',
  titre: '',
  observations: '',
  explications: '',
  actions: '',
  photos: [],
});

const initialReport = normalizeReportClassification({
  profil_metier: '',
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
  rga_cartographie: null,
  localisation: emptyLocation(),
  ressources_batiment: emptyBuildingResources(),
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
  const planError = planPayloadError(incoming || {});
  if (planError) throw new Error(planError);
  const classifiedIncoming = normalizeReportClassification(incoming);
  const merged = {
    ...base,
    ...classifiedIncoming,
    profil_metier: typeof classifiedIncoming.profil_metier === 'string' ? classifiedIncoming.profil_metier : '',
    meteo: { ...base.meteo, ...(classifiedIncoming.meteo || {}) },
    cadastre: { ...base.cadastre, ...(classifiedIncoming.cadastre || {}) },
    urbanisme: { ...base.urbanisme, ...(classifiedIncoming.urbanisme || {}) },
    risques: { ...base.risques, ...(classifiedIncoming.risques || {}) },
    localisation: { ...base.localisation, ...(classifiedIncoming.localisation || {}) },
    ressources_batiment: normalizeBuildingResources(classifiedIncoming.ressources_batiment),
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
  return normalizeReportClassification({ ...initialReport, categorie: HABITOLOGIE_CATEGORY,
    sous_categorie: HABITOLOGIE_DEFAULT_HOUSING_TYPE, titre: defaultReportTitle(HABITOLOGIE_CATEGORY), observations: [emptyObservation()] });
}

function normalizeObservation(obs) {
  return {
    ...emptyObservation(),
    ...obs,
    id: obs?.id || createId(),
    titre: obs?.titre || '',
    explications: typeof obs?.explications === 'string' ? obs.explications : '',
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
  const candidates = [];
  for (const key of [DRAFT_KEY, LEGACY_DRAFT_KEY]) {
    try { candidates.push(JSON.parse(localStorage.getItem(key))); }
    catch { /* A malformed or blocked fallback must not hide the IndexedDB copy. */ }
  }
  try {
    candidates.push(await withTimeout(idbGet(DRAFT_KEY), 800));
    candidates.push(await withTimeout(idbGet(LEGACY_DRAFT_KEY), 800));
  } catch {
    // The fallback remains usable if IndexedDB is unavailable.
  }
  const draft = latestDraft(candidates);
  return draft ? normalizeStoredDraft(draft) : null;
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

const rapportPreferences = [{"key": "audience", "label": "Format proposé pour un nouveau rapport", "type": "select", "default": "expert", "options": [{"value": "expert", "label": "Rapport expert"}, {"value": "client", "label": "Synthèse client"}]}];

function ReportAccountMenu({ onHome, onLogout, onLocalCopy }) {
  return (
    <avereo-account-menu preferences-app="rapport" preferences-label="Rapport" preferences-fields={JSON.stringify(rapportPreferences)}>
      <button slot="items" type="button" onClick={onHome || (() => document.querySelector('main')?.scrollIntoView())}>Mes projets</button>
      {onLocalCopy && <button slot="local-copy" data-avereo-save="local" data-avereo-proxy="" onClick={onLocalCopy}>Exporter le rapport JSON</button>}
      {ONLINE_SYNC_ENABLED ? <a slot="logout" href="/connect/logout.php" onClick={onLogout}>Se déconnecter</a> : <span slot="logout" hidden></span>}
    </avereo-account-menu>
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

function StepNav({ steps, currentStep, setStep, onHome }) {
  return (
    <nav className="step-nav" aria-label="Navigation du rapport">
      <button type="button" onClick={onHome}><Home size={18} aria-hidden="true" /> Accueil</button>
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
        <span className="eyebrow">Complétude de saisie</span>
        <strong>{score} %</strong>
        <div className="progress">
          <span style={{ width: `${score}%` }} />
        </div>
        <p className="muted">Repère de remplissage des champs essentiels. Les informations inconnues et les confirmations restent à examiner.</p>
      </div>
      <div className="notice" role="status">
        <span><b>Revue métier à effectuer.</b> Le pourcentage ne vaut ni validation du dossier ni accord des habitants. Relisez le contenu avant remise.</span>
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

function HomePage({ draft, onNew, onResume, onlineSyncEnabled, accessToken, onOpenOnline, onLoadFile, onBackup }) {
  const hasDraft = Boolean(draft);
  return (
    <div className="screen">
      <ReportAccountMenu />
      <main className="home-grid">
        <section className="panel home-panel">
          <span className="eyebrow">Rapport AVEREO Pro</span>
          <h1>Créer ou reprendre un rapport</h1>
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
            <ReportImport draft={draft} onLoad={onLoadFile} onBackup={onBackup} />
          </div>
          {hasDraft && (
            <p className="draft-line">
              Dernier brouillon{isHabitologieReport(draft) ? " d'habitologie" : ''} :{' '}
              {draft.reference_dossier || draft.titre} - {formatDateTime(draft.updatedAt)}
            </p>
          )}
        </section>

        {onlineSyncEnabled && <OnlineReports token={accessToken} draft={draft} onOpen={onOpenOnline} onBackup={onBackup} />}
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
        rga_cartographie: null,
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
          <h1>Dossier</h1>
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

      {!habitologie && REPORT_CATEGORIES[report.categorie]?.selectable === false && <p className="muted">Type du dossier conservé : {report.categorie}.</p>}
      <div className="choice-grid">
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
        <Field label="Profil de la mission" hint="Le profil adapte les conseils et les étapes de l’export pour ce dossier.">
          <select value={report.profil_metier || ''} onChange={(event) => updateField('profil_metier', event.target.value)}>
            <option value="">Parcours actuel</option>
            <option value="habitologue">Habitologue</option>
            {report.profil_metier && report.profil_metier !== 'habitologue' && <option value={report.profil_metier}>{report.profil_metier} (parcours actuel)</option>}
          </select>
        </Field>
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
  useEffect(() => { setStatus(''); }, [summary?.fetchedAt]);
  useEffect(() => {
    if (!hasCoordinates || busy || (summary?.fetchedAt && refresh === 0)) return;
    let active = true;
    const controller = new AbortController();
    setStatus('loading');
    fetchGeorisquesRiskPayload(lon, lat, { signal: controller.signal })
      .then(({ payload, fetchedAt }) => {
        const risques = normalizeGeorisquesRiskSummary(payload, fetchedAt);
        if (!active) return;
        setReport((prev) => Number(prev.cadastre.lon) === Number(lon) && Number(prev.cadastre.lat) === Number(lat)
          ? { ...prev, risques } : prev);
        setStatus('');
      }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; controller.abort(); };
  }, [lon, lat, hasCoordinates, busy, refresh, setReport]);
  const groups = [
    { key: 'naturels', label: 'Autres risques naturels identifies', items: (summary.naturels || []).filter((risk) => !isRgaRisk(risk)) },
    { key: 'technologiques', label: 'Risques technologiques identifies', items: summary.technologiques || [] },
  ];
  const reportUrl = safeGeorisquesReportUrl(summary.reportUrl) || fallbackReportUrl;
  const rga = rgaRisk(summary);

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
      {(busy || status === 'loading') && <p role="status">Récupération de la synthèse des risques… En cas de coupure, de nouvelles tentatives sont effectuées automatiquement (environ 30 secondes maximum).</p>}
      {status === 'error' && <p className="status-line warning" role="alert">La connexion à Géorisques n’a pas fourni de synthèse exploitable. Réessayez plus tard ou consultez le rapport officiel.
        {summary?.fetchedAt && ' La dernière consultation est conservée ci-dessous.'}</p>}
      {!summary?.fetchedAt && status !== 'loading' && !busy && <p>Aucune synthèse disponible dans ce dossier. Cela ne signifie pas absence de risque.</p>}

      <div className="risk-group">
        <h4>Retrait-gonflement des argiles (RGA)</h4>
        <p>À l’adresse : <strong>{rga?.addressStatus || 'Information non disponible'}</strong></p>
        <p>Sur la commune : {rga?.communeStatus || 'Information non disponible'}</p>
        <p>Une information manquante ne signifie pas absence de risque. Les statuts ci-dessus proviennent de la synthèse Géorisques, à la date de consultation indiquée.</p>
        <RgaMap report={report} setReport={setReport} />
        <p className="muted">Carte territoriale de préqualification, distincte du statut à l’adresse. Elle ne remplace ni l’étude de sol ni un diagnostic de la parcelle.</p>
      </div>

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
  const lookupAbort = useRef(null);
  useEffect(() => () => { lookupSequence.current += 1; lookupAbort.current?.abort(); }, [report.adresse_logement]);

  const updateNested = (group, field, value) => {
    setReport((prev) => ({ ...prev, [group]: { ...prev[group], [field]: value } }));
  };

  const lookupCadastre = async (point = null) => {
    const manual = point && validLocation(point.lon, point.lat);
    if (!manual && !report.adresse_logement.trim()) {
      setLookupStatus({ state: 'error', message: 'Renseigner une adresse avant la recherche.' });
      return;
    }

    const sequence = ++lookupSequence.current;
    lookupAbort.current?.abort();
    const controller = new AbortController();
    lookupAbort.current = controller;
    const isCurrent = () => lookupSequence.current === sequence;
    setView('cadastre');
    setReport((prev) => ({ ...prev, localisation: { ...prev.localisation, confirmation: null } }));
    setLookupStatus({ state: 'loading', message: manual ? 'Actualisation au point de visite...' : "Recherche de l'adresse..." });
    try {
      let feature;
      if (manual) {
        feature = { geometry: { coordinates: [Number(point.lon), Number(point.lat)] }, properties: {} };
      } else {
        const banUrl = `https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(report.adresse_logement)}&limit=1`;
        const banResponse = await fetch(banUrl, { signal: AbortSignal.timeout(15000) });
        if (!banResponse.ok) throw new Error('Recherche indisponible');
        const banData = await banResponse.json();
        feature = banData.features?.[0];
        if (!feature) throw new Error('Adresse introuvable');
      }

      const [lon, lat] = feature.geometry.coordinates;
      if (!validLocation(lon, lat)) throw new Error('Coordonnees invalides');
      if (!isCurrent()) return;
      // Display the location immediately: cadastral enrichment must not block client review.
      setReport((prev) => manual ? moveVisitPoint(prev, lon, lat, new Date().toISOString()) : ({ ...prev,
        cadastre: { ...initialReport.cadastre, lon, lat },
        urbanisme: { ...initialReport.urbanisme },
        risques: previousRisksAtPoint(prev, lon, lat),
        rga_cartographie: null,
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

      let risques = previousRisksAtPoint(report, lon, lat);
      let risquesDisponibles = false;
      if (!isCurrent()) return;
      try {
        setLookupStatus({ state: 'loading', message: 'Recuperation de la synthese des risques...' });
        const { payload, fetchedAt } = await fetchGeorisquesRiskPayload(lon, lat, { signal: controller.signal });
        risques = normalizeGeorisquesRiskSummary(payload, fetchedAt);
        risquesDisponibles = true;
      } catch {
        // Keep the dated consultation only when it belongs to this exact point.
      }

      if (!isCurrent()) return;
      setReport((prev) => ({
        ...prev,
        cadastre: {
          section: parcelle?.section || '',
          numero: parcelle?.numero || '',
          contenance: parcelle?.contenance || '',
          commune: parcelle?.code_insee || feature.properties.citycode || '',
          nom_commune: parcelle?.nom_com || feature.properties.city || '',
          lon,
          lat,
        },
        urbanisme: manual ? { ...prev.urbanisme, ...urbanisme } : urbanisme,
        risques: risquesDisponibles ? risques : previousRisksAtPoint(prev, lon, lat),
      }));
      setLookupStatus({
        state: risquesDisponibles && parcelle ? 'success' : 'warning',
        message:
          risquesDisponibles && parcelle
            ? 'Parcelle, contexte et synthese des risques recuperes.'
            : risquesDisponibles
              ? "Adresse et synthese des risques recuperees. La parcelle cadastrale n'a pas ete identifiee automatiquement."
              : parcelle
                ? `Parcelle et contexte récupérés. Connexion à Géorisques indisponible.${risques.fetchedAt ? ' La dernière synthèse datée pour ce point est conservée.' : ' Aucune synthèse disponible ; cela ne signifie pas absence de risque.'}`
                : `Point localisé. La parcelle et la synthèse Géorisques n’ont pas pu être actualisées.${risques.fetchedAt ? ' La dernière synthèse datée pour ce point est conservée.' : ''}`,
      });
    } catch {
      if (isCurrent()) setLookupStatus({ state: 'error', message: manual ? 'Actualisation indisponible. Le point corrigé reste conservé.' : 'Recherche indisponible ou adresse non trouvee.' });
    }
  };

  const georisquesReportUrl = buildGeorisquesReportUrl(report.cadastre.lon, report.cadastre.lat);
  const hasCoordinates = georisquesReportUrl !== null;

  return (
    <section className="panel">
      <div className="section-title">
        <CloudSun size={22} />
        <div>
          <h1>Site et contexte</h1>
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
          <p>{report.localisation?.point_manuel ? 'Recherche au point ajusté. Une recherche d’adresse remplace ce point.' : "Recherche automatique depuis l'adresse du dossier."}</p>
        </div>
        <div className="toolbar">
          <button className="button secondary" type="button" onClick={() => lookupCadastre(report.localisation?.point_manuel ? { lon: report.cadastre.lon, lat: report.cadastre.lat } : null)} disabled={lookupStatus.state === 'loading'}>
            {lookupStatus.state === 'loading' ? <Loader2 className="spin" size={18} /> : <MapPin size={18} />}
            {report.localisation?.point_manuel ? 'Actualiser ce point' : 'Rechercher'}
          </button>
          {report.localisation?.point_manuel && <button className="button ghost" type="button" onClick={() => lookupCadastre()} disabled={lookupStatus.state === 'loading'}>Rechercher l’adresse à nouveau</button>}
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
        {view === 'cadastre' && <LocationMap report={report} setReport={setReport} onCorrectAddress={onCorrectAddress}
          onMovePoint={(lon, lat) => lookupCadastre({ lon, lat })} />}
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
      <BuildingResources report={report} setReport={setReport} />
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
          <h1>Protocoles</h1>
          <p>
            {habitologie
              ? "Retenir les phases utiles à la visite, puis les suivre dans l'ordre Eau, Air, Terre, Feu."
              : 'Selectionner les controles qui seront repris dans le rapport.'}
          </p>
        </div>
      </div>
      {habitologie ? (
        <div className="habitologie-protocol" aria-label="Protocole de visite globale">
          <div className="analysis-sequence" aria-label="Ordre de l'analyse globale">
            <div>
              <strong>Fil conducteur de l'analyse</strong>
              <small>Cliquer sur le numéro ou le nom pour activer ou désactiver une phase avec le client.</small>
            </div>
            <ol>
              {HABITOLOGIE_PROTOCOL_STAGES.map((stage, index) => (
                <li key={stage.key}>
                  <button type="button" className="phase-toggle"
                    aria-label={`Phase ${index + 1} ${stage.label}`}
                    aria-pressed={isHabitologieStageEnabled(report, stage.key)}
                    onClick={() => setReport((prev) => setHabitologieStageEnabled(prev, stage.key, !isHabitologieStageEnabled(prev, stage.key)))}>
                    <span aria-hidden="true">{index + 1}</span>
                    <strong>{stage.label}<small>{isHabitologieStageEnabled(report, stage.key) ? 'Retenue' : 'Non retenue'}</small></strong>
                  </button>
                  {index < HABITOLOGIE_PROTOCOL_STAGES.length - 1 && <ArrowRight size={16} aria-hidden="true" />}
                </li>
              ))}
            </ol>
          </div>
          <div className="listening-review">
            <strong>Besoin reformulé : {report.ecoute.besoin_reformule || 'À préciser avec le client'}</strong>
            <p>{report.ecoute.besoin_confirme ? 'Reformulation confirmée avec le client.' : 'Reformulation à confirmer avec le client.'}</p>
            <p>Les nouveaux dossiers commencent sans contrôle coché. Seuls les sujets identifiés à l'écoute proposent une sélection, ajustable ici. Vos choix précédents sont conservés.</p>
            <p>Désactiver une phase suspend ses contrôles sans effacer les observations. La réactiver restaure les choix présents au moment de sa désactivation.</p>
            <small>Un point non retenu n'est ni vérifié ni déclaré sans risque. Complétez le périmètre selon votre expertise et les conditions de visite.</small>
          </div>
          {HABITOLOGIE_PROTOCOL_STAGES.map((stage, index) => (
            <article className={`protocol-phase phase-${stage.key}${isHabitologieStageEnabled(report, stage.key) ? '' : ' is-inactive'}`} key={stage.key}>
              <div className="protocol-phase-heading">
                <span>Phase {index + 1}</span>
                <div>
                  <h3>{stage.label}</h3>
                  <p>{stage.summary}</p>
                </div>
              </div>
              {!isHabitologieStageEnabled(report, stage.key) && <p className="phase-status" role="status"><strong>Non retenue pour cette visite.</strong> Choix et observations conservés. Réactivez cette phase dans le fil conducteur pour modifier les contrôles.</p>}
              <div className="protocol-list compact">
                {stage.controls.map((control) => {
                  const selected = isHabitologieControlSelected(report, stage.key, control.key);
                  const suggestions = listeningSuggestions(report.ecoute, stage.key, control.key);
                  return (
                    <label key={control.key} className={selected ? 'selected' : ''}>
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!isHabitologieStageEnabled(report, stage.key)}
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

function ObservationStep({ report, setReport, onlineSyncEnabled, authenticated, onlineSaving, onPhotoTransfer }) {
  const [cameraFor, setCameraFor] = useState(null);
  const [planObservationId, setPlanObservationId] = useState('');
  const [compact, setCompact] = useState(false);
  const [draggedId, setDraggedId] = useState('');
  const [dropId, setDropId] = useState('');
  const [orderMessage, setOrderMessage] = useState('');
  const [photoCapabilities, setPhotoCapabilities] = useState(null);
  const canUseOnlinePhotos = Boolean(onlineSyncEnabled && authenticated);
  useEffect(() => {
    setPhotoCapabilities(null);
    if (!canUseOnlinePhotos || !/^[a-f0-9]{32}$/.test(report.onlineReportId || '')) return undefined;
    const controller = new AbortController();
    photoOriginalCapabilities({ signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setPhotoCapabilities(value); })
      .catch(() => { if (!controller.signal.aborted) setPhotoCapabilities({ enabled: false }); });
    return () => controller.abort();
  }, [canUseOnlinePhotos, report.onlineReportId]);
  const dragSource = useRef(null);
  const observationsInOrder = orderedObservations(report);
  const observationNumbers = new Map(observationsInOrder.map((observation, index) => [observation, index + 1]));
  const phaseObservations = new Map();
  for (const observation of observationsInOrder) {
    const phase = observationPhase(report, observation);
    if (!phaseObservations.has(phase)) phaseObservations.set(phase, []);
    phaseObservations.get(phase).push(observation);
  }
  const clearDrag = () => { dragSource.current = null; setDraggedId(''); setDropId(''); };
  const pointerTarget = event => {
    const card = document.elementFromPoint(event.clientX, event.clientY)?.closest('.observation-card');
    return card ? report.observations.find(observation => card.id === `observation-${observation.id}`) : null;
  };
  const reorder = (sourceId, targetId) => {
    setReport(previous => moveObservation(previous, sourceId, targetId));
    setOrderMessage('Ordre mis à jour. Les numéros du rapport et des repères sont recalculés.');
  };
  const localize = id => {
    setPlanObservationId(id);
    document.getElementById('observation-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('observation-plans')?.focus({ preventScroll: true });
  };
  const habitologie = isHabitologieReport(report);
  const photoAllowed = !habitologie || Boolean(report.ecoute?.consentement_photos);
  const dictationAllowed = !habitologie || Boolean(report.ecoute?.consentement_dictee);
  const consentReason = "Enregistrer d'abord l'accord du client dans l'etape Dossier.";

  const addObservation = (phaseKey = '') => {
    setReport((prev) => isHabitologieReport(prev) && phaseKey && !isHabitologieStageEnabled(prev, phaseKey) ? prev : ({
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
    const number = observationNumbers.get(obs);
    const phase = observationPhase(report, obs);
    const siblings = phaseObservations.get(phase);
    const position = siblings.indexOf(obs);
    const selectedStage = findHabitologieStage(obs.phase_habitologie);
    const controls = selectedStage?.controls || [];

    return (
      <article className={`observation-card${draggedId === obs.id ? ' is-dragged' : ''}${dropId === obs.id ? ' is-drop-target' : ''}`} key={obs.id} id={`observation-${obs.id}`}>
        <div className="observation-header">
          <span className="observation-drag-handle" draggable={false} data-can-drag={siblings.length > 1} aria-hidden="true" title="Glisser pour déplacer dans cette phase"
            onPointerDown={event => {
              if (event.button !== 0 || siblings.length < 2) return;
              event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
              dragSource.current = { id: obs.id, x: event.clientX, y: event.clientY, moved: false };
            }}
            onPointerMove={event => {
              const drag = dragSource.current;
              if (!drag) return;
              if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 5) drag.moved = true;
              if (!drag.moved) return;
              event.preventDefault(); setDraggedId(drag.id);
              const target = pointerTarget(event);
              setDropId(target && target.id !== drag.id && observationPhase(report, target) === phase ? target.id : '');
            }}
            onPointerUp={event => {
              const drag = dragSource.current;
              if (drag?.moved) {
                const target = pointerTarget(event);
                if (target && target.id !== drag.id && observationPhase(report, target) === phase) reorder(drag.id, target.id);
                else if (target && observationPhase(report, target) !== phase) setOrderMessage('Le déplacement reste limité à la même phase.');
              }
              clearDrag();
            }} onPointerCancel={clearDrag}><GripVertical size={20} /></span>
          <h3>Observation {number}{compact && obs.titre ? ` · ${obs.titre}` : ''}</h3>
          <button
            className="icon-button danger"
            type="button"
            aria-label="Supprimer cette observation"
            onClick={() => removeObservation(obs.id)}
          >
            <Trash2 size={17} />
          </button>
        </div>

        <div className="observation-order-controls">
          <Field label="Numéro dans le rapport">
            <select aria-label={`Numéro de l’observation ${number}`} value={obs.id} disabled={siblings.length < 2} onChange={event => reorder(obs.id, event.target.value)}>
              {siblings.map(item => <option key={item.id} value={item.id}>{observationNumbers.get(item)}</option>)}
            </select>
          </Field>
          <button type="button" className="button secondary" aria-label={`Monter l’observation ${number}`} disabled={position === 0} onClick={() => reorder(obs.id, siblings[position - 1].id)}><ArrowUp size={16} />Monter</button>
          <button type="button" className="button secondary" aria-label={`Descendre l’observation ${number}`} disabled={position === siblings.length - 1} onClick={() => reorder(obs.id, siblings[position + 1].id)}><ArrowDown size={16} />Descendre</button>
        </div>
        <div className="observation-body" hidden={compact}>

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
                  <option key={stage.key} value={stage.key} disabled={!isHabitologieStageEnabled(report, stage.key) && stage.key !== obs.phase_habitologie}>
                    Phase {index + 1} · {stage.label}{!isHabitologieStageEnabled(report, stage.key) ? ' — non retenue' : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Point du protocole">
              <select
                value={obs.controle_habitologie}
                disabled={!selectedStage || !isHabitologieStageEnabled(report, selectedStage.key)}
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
              {optionsWithCurrent(piecesOptions, obs.piece).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>
          <Field label="Element">
            <select value={obs.surface} onChange={(event) => updateObservation(obs.id, { surface: event.target.value })}>
              <option value="">Selectionner</option>
              {optionsWithCurrent(surfacesOptions, obs.surface).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>
          <Field label="Gravite">
            <select value={obs.gravite} onChange={(event) => updateObservation(obs.id, { gravite: event.target.value })}>
              {optionsWithCurrent(observationGravities, obs.gravite).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="observation-location">
          <button type="button" className="button secondary" onClick={() => localize(obs.id)}><MapPin size={18} />Localiser sur un plan</button>
          <span>{observationPlanNames(report, obs).join(' · ') || 'Aucun repère placé'}</span>
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
          label="Explications"
          value={obs.explications || ''}
          onChange={(value) => updateObservation(obs.id, { explications: value })}
          onAppend={(text) => updateObservation(obs.id, { explications: `${obs.explications || ''}${text}` })}
          placeholder="Expliquer le constat et ajouter, si utile, des liens http:// ou https://..."
          rows={3}
          micDisabled={!dictationAllowed}
          micDisabledReason={consentReason}
        />
        {textLinks(obs.explications || '').some(part => part.href) && <p className="explanation-preview" aria-label="Aperçu des explications">
          {textLinks(obs.explications || '').map((part, index) => part.href
            ? <a key={index} href={part.href} target="_blank" rel="noopener noreferrer">{part.text}</a>
            : <React.Fragment key={index}>{part.text}</React.Fragment>)}
        </p>}
        <TextAreaWithMic
          label={observationAdviceLabel(report)}
          value={obs.actions}
          onChange={(value) => updateObservation(obs.id, { actions: value })}
          onAppend={(text) => updateObservation(obs.id, { actions: `${obs.actions || ''}${text}` })}
          placeholder="Conseils, mesures conservatoires, vérifications complémentaires..."
          rows={3}
          micDisabled={!dictationAllowed}
          micDisabledReason={consentReason}
        />

        <div className="photo-grid">
          {obs.photos.map((photo) => (
            <figure className="photo-with-original" key={photo.id}>
              <div className="photo-thumb">
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
              </div>
              <PhotoOriginalControls photo={photo} reportId={report.onlineReportId}
                canUseOnline={canUseOnlinePhotos} capabilities={photoCapabilities}
                disabled={onlineSaving} onTransfer={onPhotoTransfer}
                onPreserved={original => setReport(current => attachOriginal(current, {
                  reportId: report.onlineReportId, observationId: obs.id, photoId: photo.id, src: photo.src,
                }, original))} />
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
        {obs.photos.length > 0 && <p className="muted photo-original-notice">
          {!canUseOnlinePhotos
            ? 'Vos photos restent dans le brouillon. La conservation privée des originaux nécessite une connexion CONNECT.'
            : !report.onlineReportId
              ? 'Sauvez d’abord le dossier en ligne pour conserver ses originaux dans son espace privé.'
              : photoCapabilities && !photoCapabilities.enabled
                ? 'La conservation privée des originaux est indisponible pour le moment. Les photos du dossier restent utilisables.'
                : 'La conservation d’un original est volontaire. La photo du rapport reste inchangée.'}
        </p>}
        </div>
      </article>
    );
  };

  return (
    <section className="panel">
      <div className="section-title">
        <Camera size={22} />
        <div>
          <h1>Observations</h1>
          <p>Constats localisés, explications, photos et {observationAdviceLabel(report).toLocaleLowerCase('fr-FR')}.</p>
        </div>
      </div>

      <ObservationPlans report={report} setReport={setReport} selectedId={planObservationId} onSelect={setPlanObservationId} />

      <div className="observation-order-toolbar">
        <p>{habitologie ? 'Les numéros suivent Eau, Air, Terre, Feu, puis les constats à classer. ' : ''}Changez le numéro ou glissez une fiche pour choisir sa place{habitologie ? ' dans sa phase' : ''}.</p>
        <button type="button" className="button secondary" aria-pressed={compact} onClick={() => setCompact(value => !value)}>{compact ? 'Afficher les fiches complètes' : 'Vue compacte pour réorganiser'}</button>
      </div>
      {orderMessage && <p role="status" className="observation-order-status">{orderMessage}</p>}

      {habitologie && (!photoAllowed || !dictationAllowed) && (
        <div className="notice warning consent-warning" role="status">
          <AlertTriangle size={18} />
          {!photoAllowed && !dictationAllowed
            ? "L’import de photos, la caméra et la dictée sont désactivés. Enregistrez chaque accord dans l’étape Dossier pour activer la fonction correspondante."
            : !photoAllowed
              ? "L’import de photos et la caméra sont désactivés : l’accord photo reste à recueillir dans l’étape Dossier. L’accord pour la dictée est enregistré."
              : "La dictée est désactivée : son accord reste à recueillir dans l’étape Dossier. L’accord pour les photos est enregistré."}
        </div>
      )}

      {habitologie ? (
        <div className="observation-phases">
          {HABITOLOGIE_PROTOCOL_STAGES.map((stage, index) => {
            const stageObservations = observationsInOrder.filter((obs) => obs.phase_habitologie === stage.key);
            return (
              <section className={`observation-phase phase-${stage.key}${isHabitologieStageEnabled(report, stage.key) ? '' : ' is-inactive'}`} key={stage.key}>
                <div className="observation-phase-heading">
                  <div>
                    <span>Phase {index + 1}</span>
                    <h3>{stage.label}</h3>
                    <p>{stage.summary}</p>
                  </div>
                  <button className="button secondary" type="button" disabled={!isHabitologieStageEnabled(report, stage.key)} onClick={() => addObservation(stage.key)}>
                    <Plus size={18} />
                    Ajouter
                  </button>
                </div>
                {!isHabitologieStageEnabled(report, stage.key) && <p className="phase-status"><strong>Non retenue pour cette visite.</strong> Les observations et photos existantes restent conservées et exportées. Réactivez la phase dans Protocoles pour ajouter un constat.</p>}
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
                {observationsInOrder.filter((obs) => !findHabitologieStage(obs.phase_habitologie)).map(renderObservationCard)}
              </div>
            </section>
          )}
        </div>
      ) : (
        <>
          <div className="observation-list">{observationsInOrder.map(renderObservationCard)}</div>
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

function ShareTestCopy({ report }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [sharing, setSharing] = useState(false);
  async function share(downloadOnly) {
    setStatus('');
    setSharing(true);
    try {
      const copy = createTestReportCopy(report);
      const file = new File([JSON.stringify(copy, null, 2)], 'rapport-structure-test-sans-contenu.json', {type: 'application/json'});
      if (!downloadOnly && navigator.share && navigator.canShare?.({files: [file]})) {
        await navigator.share({files: [file]});
        setStatus('Copie remise au service de partage choisi.');
      } else {
        saveAs(file, file.name);
        setStatus('Téléchargement lancé. Cette structure contient des constats fictifs, sans les textes et photos du dossier.');
      }
    } catch (error) {
      setStatus(error.name === 'AbortError' ? 'Partage annulé.' : 'Partage indisponible. Vous pouvez télécharger la copie.');
    } finally {
      setSharing(false);
    }
  }
  return <section aria-label="Copie pour les tests">
    <button className="button secondary" type="button" aria-expanded={open} onClick={() => {setOpen(!open); setStatus('');}}>
      Créer une structure de test sans textes ni photos
    </button>
    {open && <div>
      <p>Cette structure ne contient pas le dossier complet : les textes sont remplacés par des constats fictifs ; coordonnées, photos, plans et signature sont retirés. Pour transmettre le contenu du dossier, utilisez « Télécharger le dossier complet (JSON) » au-dessus.</p>
      <div className="export-actions">
        {typeof navigator.share === 'function' && <button className="button secondary" disabled={sharing} type="button" onClick={() => share(false)}>Choisir un destinataire</button>}
        <button className="button secondary" disabled={sharing} type="button" onClick={() => share(true)}>Télécharger la structure seule</button>
      </div>
      <p role="status">{status}</p>
    </div>}
  </section>;
}

function ValidationStep({ report, setReport, validation, onPreview, onExport, onExportJson, onLoadFile, onlineSaving, onSaveDraft }) {
  const dictationAllowed = !isHabitologieReport(report) || Boolean(report.ecoute?.consentement_dictee);
  return (
    <section className="panel">
      <div className="section-title">
        <FileText size={22} />
        <div>
          <h1>Validation et export</h1>
          <p>Verifier les points bloquants, signer et generer le document Word.</p>
        </div>
      </div>

      {isHabitologieReport(report) && <DecisionSupportPanel report={report} setReport={setReport} dictationAllowed={dictationAllowed} onSaveDraft={onSaveDraft} />}

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
          <VoiceField label="Nom du signataire" multiline={false} micDisabled={!dictationAllowed}
            value={report.nom_signataire}
            onChange={value => setReport(prev => ({ ...prev, nom_signataire: value }))}
            onAppend={text => setReport(prev => ({ ...prev, nom_signataire: appendDictation(prev.nom_signataire, text) }))} />
          <SignaturePad value={report.signature} onChange={(signature) => setReport((prev) => ({ ...prev, signature }))} />
        </div>
      </div>

      <TextAreaWithMic
        label="Analyse de l'expert"
        micDisabled={!dictationAllowed}
        micDisabledReason="Enregistrer d'abord l'accord du client dans l'etape Dossier."
        value={report.analyse_expert}
        onChange={(value) => setReport((prev) => ({ ...prev, analyse_expert: value }))}
        onAppend={(text) => setReport((prev) => ({ ...prev, analyse_expert: appendDictation(prev.analyse_expert, text) }))}
        placeholder="Synthese technique, causalites probables, limites..."
      />
      <TextAreaWithMic
        label="Recommandations"
        micDisabled={!dictationAllowed}
        micDisabledReason="Enregistrer d'abord l'accord du client dans l'etape Dossier."
        value={report.recommandations}
        onChange={(value) => setReport((prev) => ({ ...prev, recommandations: value }))}
        onAppend={(text) => setReport((prev) => ({ ...prev, recommandations: appendDictation(prev.recommandations, text) }))}
        placeholder="Actions recommandees, priorites, controles complementaires..."
      />

      <ReportDeliveryOptions report={report} setReport={setReport} dictationAllowed={dictationAllowed} />

      <div className="export-actions">
        <ReportImport draft={report} onBackup={onExportJson} onLoad={onLoadFile} disabled={onlineSaving} />
        <button className="button ghost" type="button" onClick={onExportJson}>
          <FileJson size={18} />
          Télécharger le dossier complet (JSON)
        </button>
        <button className="button secondary" type="button" onClick={onPreview}>
          <Eye size={18} />
          Apercu
        </button>
        <button className="button primary" type="button" onClick={onExport} disabled={validation.errors.length > 0}>
          <Download size={18} />
          Générer Word (.docx)
        </button>
      </div>
      <p>Le JSON complet contient les textes, explications, conseils, photos, plans et la signature présents dans ce dossier. Transmettez-le uniquement aux personnes autorisées.</p>
      <ShareTestCopy report={report} />
    </section>
  );
}

function validateReport(report) {
  const errors = [];
  const warnings = [];
  const planError = planPayloadError(report);
  if (planError) errors.push(planError);

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
  const html = useMemo(() => {
    try { return buildReportHtml(report); }
    catch (error) { return `<!doctype html><html lang="fr"><body><h1>Aperçu indisponible</h1><p>${escapeHtml(error.message)}</p><p>Fermez l’aperçu et corrigez les informations de la vue.</p></body></html>`; }
  }, [report]);
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
  photoTransfers,
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
          <button className="button primary" data-avereo-save="online" type="button" onClick={onSave} disabled={saving || photoTransfers > 0}>
            <Save size={18} />
            {photoTransfers > 0 ? 'Envoi photo en cours…' : saving ? 'Sauvegarde...' : 'Sauver en ligne'}
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
  useMissionDossier(useEffect, reportMissionDossier(report, setReport, true));
  const [toast, setToast] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [onlineSaving, setOnlineSaving] = useState(false);
  const [photoTransfers, setPhotoTransfers] = useState(0);
  const onPhotoTransfer = useCallback(delta => setPhotoTransfers(count => Math.max(0, count + delta)), []);
  const [onlineStatus, setOnlineStatus] = useState('');
  const onlineRequest = useRef(null);
  const reportGeneration = useRef(0);
  const currentReport = useRef(report);
  currentReport.current = report;
  useEffect(() => () => { reportGeneration.current += 1; onlineRequest.current?.abort(); }, []);
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
    // Do not replace input entered while storage was completing.
    setReport(current => current === report ? saved : current);
    notify('Brouillon enregistre.');
    return saved;
  };

  const handleOnlineSave = async () => {
    if (onlineSaving) return;
    if (photoTransfers > 0) {
      setOnlineStatus('Attendez la fin de l’envoi des originaux avant de sauvegarder le dossier en ligne.');
      return;
    }
    if (!authenticated) {
      setOnlineStatus('Connexion requise pour la sauvegarde en ligne.');
      return;
    }
    const generation = reportGeneration.current;
    const snapshot = report;
    const controller = new AbortController();
    onlineRequest.current = controller;
    setOnlineSaving(true);
    setOnlineStatus('');
    try {
      const saved = await saveOnlineReport(snapshot, accessToken, snapshot.onlineReportId || '', { signal: controller.signal });
      if (controller.signal.aborted || reportGeneration.current !== generation) return;
      const edited = currentReport.current !== snapshot;
      const updated = { ...currentReport.current, onlineReportId: saved.id };
      currentReport.current = updated;
      setReport(updated);
      await saveDraft(updated);
      const content = saved.content;
      setOnlineStatus(content
        ? `${content.observations} observation(s), ${content.photos} photo(s), ${content.plans} plan(s) sauvegardés en ligne et relus sur le serveur.${edited ? ' Des modifications plus récentes restent dans le brouillon : sauvez de nouveau pour les envoyer.' : ''}`
        : 'Dossier envoyé en ligne. Rouvrez la copie serveur pour vérifier son contenu.');
    } catch (error) {
      if (error.name !== 'AbortError' && reportGeneration.current === generation) {
        if (error.reportId) setReport(current => ({ ...current, onlineReportId: error.reportId }));
        setOnlineStatus(error.message || 'Sauvegarde en ligne impossible. Le brouillon est conservé.');
      }
    } finally {
      if (reportGeneration.current === generation) setOnlineSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const { createWordBlob } = await import('./reportDocx.js');
      const blob = await createWordBlob(buildReportHtml(report), report);
      saveAs(blob, `${toFileName(report.reference_dossier || report.titre)}-${report.livrable?.audience === 'client' ? 'client' : 'expert'}.docx`);
      notify('Document Word généré.');
    } catch (error) {
      notify(`Export Word impossible : ${error.message}`);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
    saveAs(blob, `${toFileName(report.reference_dossier || report.titre)}.json`);
  };

  const loadFile = async loaded => {
    const normalized = deepMergeReport(initialReport, loaded);
    await saveDraft(normalized);
    reportGeneration.current += 1;
    onlineRequest.current?.abort();
    setOnlineSaving(false);
    setOnlineStatus('Copie locale chargée. Une sauvegarde en ligne créera un nouveau dossier sous votre compte.');
    currentReport.current = normalized;
    setReport(normalized);
    notify('Dossier chargé avec son contenu.');
  };

  const returnToHome = async () => {
    try { await saveDraft(report); await onHome(); }
    catch { notify('Brouillon non enregistré. Exportez une copie JSON avant de quitter.'); }
  };

  const goNext = () => setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  const goPrev = () => setCurrentStep((step) => Math.max(step - 1, 0));

  return (
    <div className="screen">
      <main className="wizard-layout">
        <StepNav steps={steps} currentStep={currentStep} setStep={setCurrentStep} onHome={returnToHome} />
        <div className="wizard-grid">
          <div className="wizard-main">
            {currentStep === 0 && <DossierStep report={report} setReport={setReport} />}
            {currentStep === 1 && <SiteStep report={report} setReport={setReport} onCorrectAddress={() => {
              setCurrentStep(0);
              requestAnimationFrame(() => document.getElementById('adresse-logement')?.focus());
            }} />}
            {currentStep === 2 && <ProtocolStep report={report} setReport={setReport} />}
            {currentStep === 3 && <ObservationStep report={report} setReport={setReport} onlineSyncEnabled={onlineSyncEnabled} authenticated={authenticated} onlineSaving={onlineSaving} onPhotoTransfer={onPhotoTransfer} />}
            {currentStep === 4 && (
              <ValidationStep
                report={report}
                setReport={setReport}
                validation={validation}
                onPreview={() => setPreviewOpen(true)}
                onExport={handleExport}
                onExportJson={handleExportJson}
                onLoadFile={loadFile}
                onlineSaving={onlineSaving}
                onSaveDraft={handleSave}
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
          photoTransfers={photoTransfers}
          status={onlineStatus}
        />
      </main>

      <footer className="action-bar">
        <ReportAccountMenu onLocalCopy={handleExportJson} onHome={returnToHome} onLogout={async (event) => {
          event.preventDefault();
          try { await saveDraft(report); window.location.assign('/connect/logout.php'); }
          catch { notify('Brouillon non enregistré. Exportez une copie JSON avant de vous déconnecter.'); }
        }} />
        <nav aria-label="Navigation entre les étapes">
          <button className="button ghost" type="button" onClick={goPrev} disabled={currentStep === 0}>
            <ArrowLeft size={18} aria-hidden="true" /> Précédent
          </button>
          <button className="button primary" type="button" onClick={goNext} disabled={currentStep === steps.length - 1}>
            Suivant <ArrowRight size={18} aria-hidden="true" />
          </button>
        </nav>
      </footer>

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
      <ReportAccountMenu />
      <main className="auth-gate">
        <section className="panel auth-panel">
          <span className="eyebrow">Acces securise</span>
          <h1>Connexion à AVEREO Rapport</h1>
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
  const applicationPreferences = useAppPreferences('rapport', rapportPreferences, { useState, useEffect });
  const newReport = () => { const report = createNewReport(); return { ...report, livrable: { ...report.livrable, audience: applicationPreferences.audience } }; };
  const [rgaImport, setRgaImport] = useState(() => {
    try { return window.location.hash === '#rga-import' ? readRgaTransfer(sessionStorage.getItem(RGA_TRANSFER_KEY)) : null; }
    catch { return null; }
  });
  const [newContext, setNewContext] = useState(null);
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

  const startNew = async (context = null) => {
    setNewContext(context);
    if (draft) {
      setConfirmReset(true);
      return;
    }
    const fresh = newReport();
    setInitialWizardData(deepMergeReport(fresh, { ...fresh, ...(context || {}) }));
    setAppState('wizard');
  };

  const confirmNew = async () => {
    await removeDraft();
    const initial = newReport();
    const fresh = deepMergeReport(initial, { ...initial, ...(newContext || {}) });
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
      {appState === 'home' && rgaImport && <section className="risk-summary" style={{ maxWidth: '960px', margin: '24px auto' }}>
        <h2>Recherche RGA prête à reprendre</h2>
        <p>{rgaImport.adresse_logement}</p>
        <p>Créer un nouveau dossier avec cette adresse et les risques consultés. Le point du bien restera à confirmer dans Site.</p>
        <button className="button primary" type="button" onClick={() => {
          startNew(rgaImport); setRgaImport(null);
          sessionStorage.removeItem(RGA_TRANSFER_KEY);
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }}>Créer le rapport pour ce bien</button>{' '}
        <button className="button ghost" type="button" onClick={() => {
          setRgaImport(null); sessionStorage.removeItem(RGA_TRANSFER_KEY);
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }}>Ignorer cette recherche</button>
      </section>}
      {appState === 'home' && (
        <HomePage
          draft={draft}
          onNew={() => startNew()}
          onResume={resume}
          onlineSyncEnabled={ONLINE_SYNC_ENABLED}
          accessToken={accessToken}
          onLoadFile={async loaded => {
            const normalized = deepMergeReport(initialReport, loaded);
            await saveDraft(normalized);
            setDraft(normalized);
            setInitialWizardData(normalized);
            setAppState('wizard');
          }}
          onOpenOnline={async (loaded) => {
            requireReportContent(loaded);
            const normalized = deepMergeReport(initialReport, loaded);
            await saveDraft(normalized);
            setDraft(normalized);
            setInitialWizardData(normalized);
            setAppState('wizard');
          }}
          onBackup={() => draft && saveAs(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json;charset=utf-8' }),
            `${toFileName(draft.reference_dossier || draft.titre)}-brouillon.json`)}
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
          {draft && <button className="button secondary" type="button" onClick={() => saveAs(
            new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json;charset=utf-8' }),
            `${toFileName(draft.reference_dossier || draft.titre)}-brouillon.json`)}>Exporter le brouillon avant de continuer</button>}
        </Modal>
      )}
    </>
  );
}
import { useMissionDossier, reportMissionDossier } from '../../../avereo-platform/shared/mission-dossier.js';
