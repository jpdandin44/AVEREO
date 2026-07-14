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

const reportTypes = {
  'Expertise & visite technique': {
    description: 'Constat terrain, recherche de pathologies et synthese technique.',
    subcategories: ['Constat general', 'Fissures', 'Humidite', 'Toiture'],
  },
  'Assistance avant-projet': {
    description: 'Aide a la decision, cadrage travaux et consultation.',
    subcategories: ['Avant-projet', "Consultation d'entreprise"],
  },
  'Reception de travaux': {
    description: 'Releve des reserves, conformite apparente et recommandations.',
    subcategories: ['Reception de travaux', 'Levee de reserves'],
  },
  'Diagnostic specifique': {
    description: 'Analyse ciblee sur un desordre ou une zone identifiee.',
    subcategories: ['Diagnostic fissures', 'Diagnostic humidite', 'Diagnostic toiture'],
  },
};

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
  piece: '',
  surface: '',
  gravite: 'Mineure',
  titre: '',
  observations: '',
  actions: '',
  photos: [],
});

const initialReport = {
  categorie: 'Expertise & visite technique',
  sous_categorie: 'Constat general',
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
  protocoles: {
    standard: true,
    fissures: false,
    humidite: false,
    toiture: false,
    reception: false,
  },
  observations: [emptyObservation()],
  analyse_expert: '',
  recommandations: '',
  reserves: '',
  nom_signataire: '',
  signature: '',
  updatedAt: '',
};

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function deepMergeReport(base, incoming) {
  const merged = {
    ...base,
    ...incoming,
    meteo: { ...base.meteo, ...(incoming?.meteo || {}) },
    cadastre: { ...base.cadastre, ...(incoming?.cadastre || {}) },
    urbanisme: { ...base.urbanisme, ...(incoming?.urbanisme || {}) },
    protocoles: {
      ...base.protocoles,
      ...(incoming?.protocoles || {}),
      standard: incoming?.protocoles?.standard ?? incoming?.protocoles?.is_standard ?? base.protocoles.standard,
      fissures: incoming?.protocoles?.fissures ?? incoming?.protocoles?.is_fissures_n1 ?? base.protocoles.fissures,
      humidite:
        incoming?.protocoles?.humidite ?? incoming?.protocoles?.is_humidite_infiltration ?? base.protocoles.humidite,
    },
  };

  const observations = Array.isArray(incoming?.observations) ? incoming.observations : base.observations;
  merged.observations = observations.length > 0 ? observations.map(normalizeObservation) : [emptyObservation()];
  return merged;
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

function recommendedProtocols(subcategory) {
  const label = (subcategory || '').toLowerCase();
  return {
    standard: true,
    fissures: label.includes('fissure'),
    humidite: label.includes('humid'),
    toiture: label.includes('toiture'),
    reception: label.includes('reception') || label.includes('reserve'),
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
  if (localDraft) return deepMergeReport(initialReport, JSON.parse(localDraft));

  try {
    const draft = (await withTimeout(idbGet(DRAFT_KEY), 800)) || (await withTimeout(idbGet(LEGACY_DRAFT_KEY), 800));
    if (draft) return deepMergeReport(initialReport, draft);
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

function buildWordDocumentHtml(report) {
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
    <p><strong>Type :</strong> ${escapeHtml(report.categorie)} - ${escapeHtml(report.sous_categorie)}</p>
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
    <tr><td>Zonage urbanisme</td><td>${escapeHtml(report.urbanisme?.zone || '')} ${escapeHtml(
      report.urbanisme?.description || '',
    )}${mapLink ? `<br /><a href="${mapLink}">Voir la parcelle</a>` : ''}${
      report.urbanisme?.pdfUrl ? `<br /><a href="${escapeHtml(report.urbanisme.pdfUrl)}">Document PLU</a>` : ''
    }</td></tr>
  </table>

  <h2>2. Protocole de recherche</h2>
  ${buildProtocolHtml(report)}

  <h2>3. Observations</h2>
  ${observationsHtml || '<p>Aucune observation n a ete enregistree.</p>'}

  <h2>4. Analyse et recommandations</h2>
  <h3>Analyse de l expert</h3>
  <p>${textToHtml(report.analyse_expert)}</p>
  <h3>Recommandations</h3>
  <p>${textToHtml(report.recommandations)}</p>
  <h3>Reserves</h3>
  <p>${textToHtml(report.reserves)}</p>

  <h2>5. Signature</h2>
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

function MicButton({ onFinalText, title = 'Dicter' }) {
  const { isListening, isSupported, speechError, toggle } = useSpeechRecognition('fr-FR', onFinalText);
  const unavailableMessage = 'Dictee non disponible dans ce navigateur. Utilisez Chrome, Edge ou Windows + H.';
  return (
    <>
      <button
        className={`icon-button ${isListening ? 'danger active' : ''}`}
        type="button"
        title={isSupported ? title : unavailableMessage}
        aria-label={isListening ? 'Arreter la dictee' : title}
        aria-pressed={isListening}
        onClick={toggle}
        disabled={!isSupported}
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

function TextAreaWithMic({ label, value, onChange, onAppend, placeholder, rows = 5 }) {
  return (
    <Field label={label}>
      <div className="input-with-action">
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} />
        <MicButton onFinalText={onAppend} title={`Dicter ${label}`} />
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
          <h2>Generer un rapport d'expertise terrain</h2>
          <p>
            Nouveau dossier, reprise de brouillon, photos, releves, analyse, signature et export Word sont regroupes
            dans le meme parcours.
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
              Dernier brouillon : {draft.reference_dossier || draft.titre} - {formatDateTime(draft.updatedAt)}
            </p>
          )}
        </section>

        <section className="panel checklist-panel">
          <h3>Controle rapide</h3>
          <ul>
            <li>
              <ClipboardList size={18} />
              Donnees dossier et client
            </li>
            <li>
              <MapPin size={18} />
              Cadastre, PLU et contexte de visite
            </li>
            <li>
              <Camera size={18} />
              Observations photo et camera terrain
            </li>
            <li>
              <PenLine size={18} />
              Signature et document Word
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function DossierStep({ report, setReport }) {
  const subcategories = reportTypes[report.categorie]?.subcategories || [];

  const updateField = (field, value) => setReport((prev) => ({ ...prev, [field]: value }));

  const selectCategory = (categorie) => {
    const sousCategorie = reportTypes[categorie].subcategories[0];
    setReport((prev) => ({
      ...prev,
      categorie,
      sous_categorie: sousCategorie,
      protocoles: { ...prev.protocoles, ...recommendedProtocols(sousCategorie) },
    }));
  };

  const selectSubcategory = (sousCategorie) => {
    setReport((prev) => ({
      ...prev,
      sous_categorie: sousCategorie,
      protocoles: { ...prev.protocoles, ...recommendedProtocols(sousCategorie) },
    }));
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

      <div className="choice-grid two">
        {Object.entries(reportTypes).map(([name, item]) => (
          <ButtonCard
            key={name}
            active={report.categorie === name}
            title={name}
            description={item.description}
            onClick={() => selectCategory(name)}
          />
        ))}
      </div>

      <div className="form-grid two">
        <Field label="Sous-categorie">
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
          <input value={report.adresse_logement} onChange={(event) => updateField('adresse_logement', event.target.value)} />
        </Field>
        <Field label="Intervenant AVEREO">
          <input value={report.intervenant} onChange={(event) => updateField('intervenant', event.target.value)} />
        </Field>
      </div>
    </section>
  );
}

function SiteStep({ report, setReport }) {
  const [lookupStatus, setLookupStatus] = useState({ state: 'idle', message: '' });

  const updateNested = (group, field, value) => {
    setReport((prev) => ({ ...prev, [group]: { ...prev[group], [field]: value } }));
  };

  const lookupCadastre = async () => {
    if (!report.adresse_logement.trim()) {
      setLookupStatus({ state: 'error', message: 'Renseigner une adresse avant la recherche.' });
      return;
    }

    setLookupStatus({ state: 'loading', message: "Recherche de l'adresse..." });
    try {
      const banUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(report.adresse_logement)}&limit=1`;
      const banResponse = await fetch(banUrl);
      const banData = await banResponse.json();
      const feature = banData.features?.[0];
      if (!feature) throw new Error('Adresse introuvable');

      const [lon, lat] = feature.geometry.coordinates;
      const pointGeom = JSON.stringify({ type: 'Point', coordinates: [lon, lat] });
      setLookupStatus({ state: 'loading', message: 'Recherche de la parcelle cadastrale...' });

      const cadastreResponse = await fetch(`https://apicarto.ign.fr/api/cadastre/parcelle?geom=${pointGeom}`);
      const cadastreData = await cadastreResponse.json();
      const parcelle = cadastreData.features?.[0]?.properties;
      if (!parcelle) throw new Error('Parcelle introuvable');

      let urbanisme = { zone: '', description: '', pdfUrl: '' };
      try {
        const zoneResponse = await fetch(`https://apicarto.ign.fr/api/gpu/zone-urba?geom=${pointGeom}`);
        if (zoneResponse.ok) {
          const zoneData = await zoneResponse.json();
          const zone = zoneData.features?.[0]?.properties;
          urbanisme = {
            zone: zone?.libelle || '',
            description: zone?.libelong || '',
            pdfUrl: zone?.urlfic?.startsWith('http') ? zone.urlfic : '',
          };
        }
        if (!urbanisme.pdfUrl) {
          const docResponse = await fetch(`https://apicarto.ign.fr/api/gpu/document?geom=${pointGeom}`);
          if (docResponse.ok) {
            const docData = await docResponse.json();
            urbanisme.pdfUrl = docData.features?.[0]?.properties?.urldoc || '';
          }
        }
      } catch {
        urbanisme = { zone: '', description: '', pdfUrl: '' };
      }

      setReport((prev) => ({
        ...prev,
        cadastre: {
          section: parcelle.section || '',
          numero: parcelle.numero || '',
          contenance: parcelle.contenance || '',
          commune: feature.properties.citycode || '',
          nom_commune: feature.properties.city || '',
          lon,
          lat,
        },
        urbanisme,
      }));
      setLookupStatus({ state: 'success', message: 'Parcelle et contexte recuperes.' });
    } catch {
      setLookupStatus({ state: 'error', message: 'Recherche indisponible ou adresse non trouvee.' });
    }
  };

  const hasCoordinates = report.cadastre.lon && report.cadastre.lat;

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
          {hasCoordinates && (
            <button
              className="button ghost"
              type="button"
              onClick={() =>
                window.open(
                  `https://www.geoportail-urbanisme.gouv.fr/map/#tile=1&lon=${report.cadastre.lon}&lat=${report.cadastre.lat}&zoom=19`,
                  '_blank',
                )
              }
            >
              <MapPin size={18} />
              Carte PLU
            </button>
          )}
          {report.urbanisme.pdfUrl && (
            <button className="button ghost" type="button" onClick={() => window.open(report.urbanisme.pdfUrl, '_blank')}>
              <FileText size={18} />
              Reglement
            </button>
          )}
        </div>
      </div>

      {lookupStatus.message && <p className={`status-line ${lookupStatus.state}`}>{lookupStatus.message}</p>}

      <div className="form-grid four">
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
      </div>
    </section>
  );
}

function ProtocolStep({ report, setReport }) {
  return (
    <section className="panel">
      <div className="section-title">
        <ShieldCheck size={22} />
        <div>
          <h2>Protocoles</h2>
          <p>Selectionner les controles qui seront repris dans le rapport.</p>
        </div>
      </div>
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
      <TextAreaWithMic
        label="Reserves de methode"
        value={report.reserves}
        onChange={(value) => setReport((prev) => ({ ...prev, reserves: value }))}
        onAppend={(text) => setReport((prev) => ({ ...prev, reserves: `${prev.reserves || ''}${text}` }))}
        placeholder="Limites d'acces, conditions meteo, zones non inspectees..."
        rows={4}
      />
    </section>
  );
}

function ObservationStep({ report, setReport }) {
  const [cameraFor, setCameraFor] = useState(null);

  const addObservation = () => setReport((prev) => ({ ...prev, observations: [...prev.observations, emptyObservation()] }));

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
    if (!cameraFor) return;
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

  return (
    <section className="panel">
      <div className="section-title">
        <Camera size={22} />
        <div>
          <h2>Observations</h2>
          <p>Constats localises, niveau de gravite, photos et suites proposees.</p>
        </div>
      </div>

      <div className="observation-list">
        {report.observations.map((obs, index) => (
          <article className="observation-card" key={obs.id}>
            <div className="observation-header">
              <h3>Observation {index + 1}</h3>
              <button
                className="icon-button danger"
                type="button"
                aria-label="Supprimer cette observation"
                onClick={() => removeObservation(obs.id)}
              >
                <Trash2 size={17} />
              </button>
            </div>

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
            />
            <TextAreaWithMic
              label="Suites proposees"
              value={obs.actions}
              onChange={(value) => updateObservation(obs.id, { actions: value })}
              onAppend={(text) => updateObservation(obs.id, { actions: `${obs.actions || ''}${text}` })}
              placeholder="Mesures conservatoires, controle complementaire, travaux recommandes..."
              rows={3}
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
              <label className="photo-action">
                <Upload size={22} />
                Importer
                <input type="file" multiple accept="image/*" onChange={(event) => addPhotos(obs.id, event.target.files)} />
              </label>
              <button className="photo-action" type="button" onClick={() => setCameraFor(obs.id)}>
                <Camera size={22} />
                Camera
              </button>
            </div>
          </article>
        ))}
      </div>

      <button className="button secondary" type="button" onClick={addObservation}>
        <Plus size={18} />
        Ajouter une observation
      </button>

      <CameraModal open={Boolean(cameraFor)} onClose={() => setCameraFor(null)} onShot={addCameraPhoto} />
    </section>
  );
}

function ValidationStep({ report, setReport, validation, onPreview, onExport, onExportJson, onImportJson }) {
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
        value={report.analyse_expert}
        onChange={(value) => setReport((prev) => ({ ...prev, analyse_expert: value }))}
        onAppend={(text) => setReport((prev) => ({ ...prev, analyse_expert: `${prev.analyse_expert || ''}${text}` }))}
        placeholder="Synthese technique, causalites probables, limites..."
      />
      <TextAreaWithMic
        label="Recommandations"
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
        {authConfig?.mode === 'api_token' && !accessToken && (
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
        {authConfig?.mode === 'drupal_oauth' && !accessToken && (
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
        {accessToken && (
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
    if (!accessToken) {
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
            {currentStep === 1 && <SiteStep report={report} setReport={setReport} />}
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
    setInitialWizardData({ ...initialReport, observations: [emptyObservation()] });
    setAppState('wizard');
  };

  const confirmNew = async () => {
    await removeDraft();
    const fresh = { ...initialReport, observations: [emptyObservation()] };
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
                Nouveau rapport
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
