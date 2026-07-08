import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Camera, Mic, Upload, FileText, Trash2, ArrowLeft, ArrowRight, CheckCircle, Eye, X, Home, PlusCircle, Edit, Map } from 'lucide-react';

// --- Helpers : Remplacement natif de 'file-saver' pour éviter les dépendances externes ---
const saveAs = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
};

// NOTE: La bibliothèque 'idb-keyval' est une dépendance externe pour l'IndexedDB.
// Assurez-vous que 'idb-keyval' est chargé via une balise <script> dans votre fichier HTML en production.
// Ex: <script src="https://unpkg.com/idb-keyval@6/dist/iife/index.js"></script>

// --- Helpers : Stockage Robuste (IndexedDB avec fallback sur localStorage) ---
const getIDB = () => window.idbKeyval;

const saveDraft = (data) => {
    const idb = getIDB();
    if (idb?.set) {
        return idb.set('draftReport', data);
    }
    return Promise.resolve(localStorage.setItem('draftReport', JSON.stringify(data)));
};

const loadDraft = async () => {
    const idb = getIDB();
    if (idb?.get) {
        const draft = await idb.get('draftReport');
        return draft;
    }
    return Promise.resolve(JSON.parse(localStorage.getItem('draftReport') || 'null'));
};

const removeDraft = () => {
    const idb = getIDB();
    if (idb?.del) {
        return idb.del('draftReport');
    }
    return Promise.resolve(localStorage.removeItem('draftReport'));
};


// --- Helpers : Permissions Média ---
const requestPermissions = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        // Arrête les pistes pour libérer la caméra/micro immédiatement
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (err) {
        console.error("Permission refusée pour la caméra/micro:", err);
        return false;
    }
};

// --- Helpers : Reconnaissance Vocale (Speech-to-Text) ---
const useSpeechRecognition = (lang = 'fr-FR', onFinalText) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

    useEffect(() => {
        if (!isSupported) return;

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = lang;
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript && onFinalText) {
                onFinalText(finalTranscript + ' ');
            }
        };

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => console.error("Erreur de reconnaissance vocale:", event.error);

        recognitionRef.current = recognition;

        return () => {
            recognitionRef.current?.stop();
        };
    }, [lang, isSupported, onFinalText]);

    const toggleListening = useCallback(() => {
        if (!isSupported) return;
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    }, [isListening, isSupported]);

    return { isSupported, isListening, toggleListening };
};

const MicButton = React.memo(({ onFinalText, title = 'Dictée vocale' }) => {
    const { isSupported, isListening, toggleListening } = useSpeechRecognition('fr-FR', onFinalText);

    if (!isSupported) {
        return null; // Ne rien afficher si ce n'est pas supporté
    }

    return (
        <button
            type="button"
            onClick={toggleListening}
            title={title}
            aria-label={title}
            className={`absolute top-2 right-2 p-2 rounded-full transition-colors duration-200 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
            <Mic size={20} />
        </button>
    );
});


// --- Caméra : Capture Photo ---
const CameraCaptureModal = ({ open, onClose, onShot }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const startCamera = async () => {
            if (!open) return;
            if (!navigator.mediaDevices?.getUserMedia) {
                console.error("Caméra non supportée.");
                onClose?.();
                return;
            }
            setIsLoading(true);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' } }
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
            } catch (error) {
                console.error("Erreur d'accès à la caméra:", error);
                onClose?.();
            } finally {
                setIsLoading(false);
            }
        };

        startCamera();

        return () => {
            streamRef.current?.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        };
    }, [open, onClose]);

    const handleTakeShot = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/png');
        onShot?.({
            id: crypto.randomUUID(),
            name: `capture_${Date.now()}.png`,
            src: dataUrl,
            horodatageISO: new Date().toISOString()
        });
        onClose?.();
    }, [onShot, onClose]);
    
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if(open) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);


    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-4 w-full max-w-lg shadow-xl">
                <div className="aspect-video bg-black rounded overflow-hidden relative flex items-center justify-center">
                    <video ref={videoRef} playsInline muted className={`w-full h-full object-contain transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`} />
                    {isLoading && <div className="absolute text-white">Chargement de la caméra...</div>}
                </div>
                <div className="flex justify-between mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
                    <button onClick={handleTakeShot} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400">
                        <Camera size={18} /> Prendre la photo
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Génération de document .DOC (format HTML compatible Word) ---
const buildWordDocumentHtml = (report) => {
    const escapeHtml = (s = '') => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
    const formatDateTime = (iso) => iso ? new Date(iso).toLocaleString('fr-FR') : '';

    const p = report.protocoles || {};
    let protocoleHtml = `<p>Ce protocole de recherche repose sur l'analyse de l'ensemble des murs du logement à l'aide d'un relevé photographique. Chaque photo est analysée à la recherche de signes visuels pertinents.</p>`;
    if (p.is_humidite_infiltration) {
        protocoleHtml += `<p>Une attention particulière a été portée aux signes d'humidité : taches sombres, auréoles, moisissures, décolorations, décollement d'enduits.</p>`;
    }
    if (p.is_fissures_n1) {
        protocoleHtml += `<p>Un relevé des fissures a été effectué, avec photos et mesures si nécessaire.</p>`;
    }

    const obsHtml = report.observations.map(o => {
        const observationPhotosHtml = o.photos.map(photo => `
            <div style="page-break-inside:avoid; margin:10pt 0;">
                <img src="${photo.src}" alt="${escapeHtml(photo.name)}" width="500" style="max-width:100%; border:1pt solid #ccc;" />
                <p style="font-size:9pt; color:#555; margin-top:4pt;">${escapeHtml(o.piece)}/${escapeHtml(o.surface)} — ${formatDateTime(photo.horodatageISO)}</p>
            </div>
        `).join('');

        return `
        <div style="margin:20pt 0; page-break-inside:avoid;">
            <h3 style="font-size:12pt;margin:0 0 4pt 0; mso-outline-level: 2;">Pièce : ${escapeHtml(o.piece)} / ${escapeHtml(o.surface)} — Gravité : ${escapeHtml(o.gravite)}</h3>
            <div style="font-size:10.5pt;white-space:pre-wrap;">${escapeHtml(o.observations)}</div>
            ${observationPhotosHtml}
        </div>`;
    }).join('');

    const meteo = report.meteo || {};
    const meteoLine = [
      meteo.ciel && `Ciel : ${meteo.ciel}`,
      (meteo.temperatureC !== '' && meteo.temperatureC !== undefined) && `Température : ${meteo.temperatureC}°C`,
      (meteo.humiditePct !== '' && meteo.humiditePct !== undefined) && `Humidité : ${meteo.humiditePct}%`,
      meteo.pluie && `Pluie : ${meteo.pluie}`
    ].filter(Boolean).join(' · ');

    const mapLink = report.cadastre?.lon ? `https://www.geoportail-urbanisme.gouv.fr/map/#tile=1&lon=${report.cadastre.lon}&lat=${report.cadastre.lat}&zoom=19` : '';

    return `
    <!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="fr">
    <head><meta charset="utf-8">
    <title>${escapeHtml(report.titre)}</title>
    <style>
        @page WordSection1 {
            size: A4;
            margin: 2.5cm 2cm 2.5cm 2cm;
            mso-header-margin: 1.25cm;
            mso-footer-margin: 1.25cm;
            mso-header: h1;
            mso-footer: f1;
        }
        div.WordSection1 {
            page: WordSection1;
        }
        body { font-family: Calibri, sans-serif; font-size: 11pt; color: #333; }
        h1, h2, h3 { color: #222; }
        h1 { font-size: 20pt; }
        h2 { font-size: 16pt; margin: 24pt 0 12pt 0; border-bottom: 1px solid #ccc; padding-bottom: 4pt; page-break-after: avoid; mso-outline-level: 1; }
        h3 { font-size: 12pt; margin: 12pt 0 6pt 0; page-break-after: avoid; mso-outline-level: 2; }
        table { border-collapse: collapse; width: 100%; font-size: 10.5pt; margin-bottom: 12pt; }
        td { border: 1pt solid #e5e7eb; padding: 6pt; vertical-align: top; }
        td:first-child { font-weight: bold; width: 30%; background-color: #f9fafb; }
        p { margin: 0 0 10pt 0; line-height: 1.4; }
        p.MsoHeader, p.MsoFooter { margin: 0; padding: 0; border: none; }
        p.MsoToc1, li.MsoToc1, div.MsoToc1 { margin-bottom: 5pt; }
    </style></head>
    <body>
        <div class="WordSection1">
            <h1>${escapeHtml(report.titre || "Rapport d'expertise")}</h1>
            <p><b>Référence dossier :</b> ${escapeHtml(report.reference_dossier)}</p>
            
            <br style="page-break-before:always;"/>

            <h2>Sommaire</h2>
            <p class="MsoToc1">
                <span style="mso-element:field-begin"></span>
                <span style="mso-spacerun:yes"> </span>
                TOC \\o "1-3" \\h \\z \\u
                <span style="mso-element:field-separator"></span>
            </p>
            <p class="MsoToc1"><span style="mso-element:field-end"></span></p>

            <br style="page-break-before:always;"/>

            <h2>1. Informations générales</h2>
            <table>
                <tr><td>Titre</td><td>${escapeHtml(report.titre)}</td></tr>
                <tr><td>Type de rapport</td><td>${escapeHtml(report.categorie)} - ${escapeHtml(report.sous_categorie)}</td></tr>
                <tr><td>Propriétaire</td><td>${escapeHtml(report.proprietaire)}</td></tr>
                <tr><td>Adresse</td><td>${escapeHtml(report.adresse_logement)}</td></tr>
                <tr><td>Date de visite</td><td>${formatDate(report.date_visite)}</td></tr>
                <tr><td>Intervenant</td><td>${escapeHtml(report.intervenant)}</td></tr>
                <tr><td>Environnement analysé</td><td>${escapeHtml(report.environnement)}</td></tr>
                <tr><td>Conditions météo</td><td>${escapeHtml(meteoLine)}</td></tr>
                ${report.cadastre && report.cadastre.section ? `<tr><td>Réf. Cadastrales</td><td>${report.cadastre.nom_commune ? `Commune de ${escapeHtml(report.cadastre.nom_commune)} (${escapeHtml(report.cadastre.commune)})` : 'Références'} - Section ${escapeHtml(report.cadastre.section)} N°${escapeHtml(report.cadastre.numero)}${report.cadastre.contenance ? ` (${report.cadastre.contenance} m²)` : ''}</td></tr>` : ''}
                ${report.urbanisme && report.urbanisme.zone ? `<tr><td>Zonage Urbanisme (PLU)</td><td>Zone ${escapeHtml(report.urbanisme.zone)}${report.urbanisme.description ? ` - ${escapeHtml(report.urbanisme.description)}` : ''} 
                ${mapLink ? `<br><br><a href="${mapLink}" style="color:blue; text-decoration:underline;">📍 Voir la parcelle sur le Géoportail</a>` : ''}
                ${report.urbanisme.pdfUrl ? `<br><a href="${escapeHtml(report.urbanisme.pdfUrl)}" style="color:blue; text-decoration:underline;">📄 Télécharger le règlement complet (PDF)</a>` : ''}
                </td></tr>` : ''}
            </table>
            <br style="page-break-before:always;"/>
            <h2>2. Protocole de recherche</h2>
            ${protocoleHtml}
            <br style="page-break-before:always;"/>
            <h2>3. Observations générales et conclusion</h2>
            ${obsHtml || "<p>Aucune observation n'a été enregistrée.</p>"}
            <h3>Analyse de l’expert</h3>
            <p>${escapeHtml(report.analyse_expert) || "Aucune analyse fournie."}</p>
            <h3>Recommandations</h3>
            <p>${escapeHtml(report.recommandations) || "Aucune recommandation fournie."}</p>
            <br style="page-break-before:always;"/>
            <h2>4. Signatures</h2>
            <p>Fait à ${escapeHtml((report.adresse_logement.split(',').pop() || 'N/A').trim())}, le ${formatDate(new Date().toISOString())}</p>
            <p><b>Signataire (Expert) :</b> ${escapeHtml(report.nom_signataire || '')}</p>
            ${report.signature ? `<img src="${report.signature}" alt="Signature" style="width: 200px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">` : ""}
        </div>

        <div style='mso-element:header' id='h1'>
            <p class='MsoHeader'>
                <table style='width:100%; border:none; border-collapse:collapse;'>
                    <tr>
                        <td style='border:none; font-size:12pt; font-weight:bold; color:#333;'>AVEREO</td>
                        <td style='border:none; text-align:right; font-size:9pt; color:#555;'>Rapport d'expertise</td>
                    </tr>
                </table>
                <hr style='height:1px; color:#ccc; background-color:#ccc; border:none;'/>
            </p>
        </div>

        <div style='mso-element:footer' id='f1'>
            <p class='MsoFooter'>
                 <hr style='height:1px; color:#ccc; background-color:#ccc; border:none;'/>
                <table style='width:100%; font-size:8pt; color:#6b7280; border:none; border-collapse:collapse;'>
                    <tr>
                        <td style='border:none;'>AVEREO - 34 chemin vieux de Berat, 31410 Longages</td>
                        <td style='border:none; text-align:right;'>
                            Page <span style='mso-field-code:"PAGE"'></span> sur <span style='mso-field-code:"NUMPAGES"'></span>
                        </td>
                    </tr>
                </table>
            </p>
        </div>
    </body></html>`;
};

// --- CONSTANTES ---
const PIECES_OPTIONS = ["Salon", "Cuisine", "Chambre", "Salle de bain", "WC", "Bureau", "Garage", "Extérieur", "Autre"];
const SURFACES_OPTIONS = ["Murs", "Sols", "Plafond", "Toiture", "Façade", "Autre"];
const SUB_CATEGORIES = {
    "Expertise & Visite Technique": ["Constat général", "Fissures", "Humidité", "Toiture"],
    "Assistance & Gestion avant-projet": ["Avant-projet", "Consultation d'entreprise"],
    "Réception de travaux": ["Réception de travaux"],
    "Expertise Diagnostique Spécifique": ["Diagnostic Fissures", "Diagnostic Humidité"],
};

// --- COMPOSANTS UI ---

const Toast = ({ message }) => (
    <div className="fixed bottom-24 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-out">
        {message}
    </div>
);

const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl animate-scale-in">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600 mt-2 mb-6">{message}</p>
            <div className="flex justify-end gap-3">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annuler</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Confirmer</button>
            </div>
        </div>
    </div>
);

const Stepper = ({ currentStep }) => {
    const steps = ["Type", "Catégorie", "Client", "Protocoles", "Analyses", "Export"];
    return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-0 mb-8">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <React.Fragment key={index}>
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors ${index + 1 <= currentStep ? 'bg-blue-600' : 'bg-gray-400'}`}>
                                {index + 1 < currentStep ? <CheckCircle size={16} /> : index + 1}
                            </div>
                            <p className={`mt-2 text-xs text-center ${index + 1 <= currentStep ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>{step}</p>
                        </div>
                        {index < steps.length - 1 && <div className={`flex-1 h-1 mx-2 transition-colors ${index + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-300'}`}></div>}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const Header = ({ onGoHome }) => {
    const [isConfirming, setIsConfirming] = useState(false);
    return (
        <>
            <header className="bg-white shadow-sm w-full p-4 mb-6">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">AVEREO 2.0</h1>
                        <p className="text-sm text-gray-500">Générateur de Rapports</p>
                    </div>
                    {onGoHome && (
                        <button onClick={() => setIsConfirming(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" title="Retourner à l'accueil">
                            <Home size={16} /> Accueil
                        </button>
                    )}
                </div>
            </header>
            {isConfirming && (
                <ConfirmationModal
                    title="Retourner à l'accueil ?"
                    message="Le brouillon actuel sera conservé, mais toute progression non enregistrée pourrait être perdue."
                    onConfirm={onGoHome}
                    onCancel={() => setIsConfirming(false)}
                />
            )}
        </>
    );
};

const Footer = ({ onPrev, onNext, currentStep, isNextDisabled, onSaveDraft }) => (
    <footer className="fixed bottom-0 left-0 w-full bg-white border-t p-4 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button onClick={onSaveDraft} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Enregistrer Brouillon</button>
            <div className="flex gap-4">
                {currentStep > 1 && (
                    <button onClick={onPrev} className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        <ArrowLeft size={16} /> Précédent
                    </button>
                )}
                {currentStep < 6 && (
                    <button onClick={onNext} disabled={isNextDisabled} className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed">
                        Suivant <ArrowRight size={16} />
                    </button>
                )}
            </div>
        </div>
    </footer>
);

const Card = ({ children, title }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 w-full animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">{title}</h2>
        {children}
    </div>
);

const InputField = React.memo(({ label, name, ...props }) => (
    <div className="mb-4">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            id={name}
            name={name}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            {...props}
        />
    </div>
));

const SelectField = React.memo(({ label, name, options, ...props }) => (
     <div className="mb-4">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
            id={name}
            name={name}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            {...props}
        >
            <option value="" disabled>Sélectionner...</option>
            {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
    </div>
));


// --- ÉCRANS DU PARCOURS ---

const Step1_ReportType = ({ data, setData }) => (
    <Card title="Étape 1 : Type de rapport">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(SUB_CATEGORIES).map(type => (
                <button
                    key={type}
                    onClick={() => setData({ ...data, categorie: type, sous_categorie: '' })}
                    className={`p-4 h-full rounded-lg text-center font-semibold transition-all duration-200 border-2 flex items-center justify-center ${data.categorie === type ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 hover:border-blue-400'}`}
                >
                    {type}
                </button>
            ))}
        </div>
    </Card>
);

const Step2_SubCategory = ({ data, setData }) => {
    const options = SUB_CATEGORIES[data.categorie] || [];

    useEffect(() => {
        // Pré-sélectionne les protocoles en fonction de la sous-catégorie
        const sc = (data.sous_categorie || '').toLowerCase();
        const p = { ...data.protocoles, is_standard: true, is_fissures_n1: false, is_humidite_infiltration: false };
        if (sc.includes('fissure')) p.is_fissures_n1 = true;
        if (sc.includes('humidité')) p.is_humidite_infiltration = true;
        setData(prev => ({ ...prev, protocoles: p }));
    }, [data.sous_categorie, setData]);

    return (
        <Card title="Étape 2 : Sous-catégorie">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {options.map(sub => (
                    <button
                        key={sub}
                        onClick={() => setData({ ...data, sous_categorie: sub })}
                        className={`p-4 rounded-lg text-center font-semibold transition-all duration-200 border-2 ${data.sous_categorie === sub ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 hover:border-blue-400'}`}
                    >
                        {sub}
                    </button>
                ))}
            </div>
        </Card>
    );
};

const Step3_ClientInfo = ({ data, setData }) => {
    const [cadastreStatus, setCadastreStatus] = useState('');

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    }, [setData]);

    const handleMeteoChange = useCallback((e) => {
        const { name, value } = e.target;
        const field = name.split('.')[1];
        setData(prev => ({...prev, meteo: {...prev.meteo, [field]: value}}));
    }, [setData]);

    const handleFetchCadastre = async () => {
        if (!data.adresse_logement) {
            setCadastreStatus("❌ Veuillez d'abord saisir une adresse de logement.");
            return;
        }

        setCadastreStatus('Recherche des coordonnées de l\'adresse...');
        try {
            // 1. Géocodage de l'adresse (Base Adresse Nationale)
            const banUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(data.adresse_logement)}&limit=1`;
            const banRes = await fetch(banUrl);
            const banData = await banRes.json();

            if (!banData.features || banData.features.length === 0) {
                setCadastreStatus("❌ Adresse introuvable.");
                return;
            }

            const [lon, lat] = banData.features[0].geometry.coordinates;
            const citycode = banData.features[0].properties.citycode;
            const city = banData.features[0].properties.city;

            setCadastreStatus("Recherche de la parcelle cadastrale (IGN)...");

            // 2. Récupération de la parcelle via l'API IGN (APICarto)
            const pointGeom = JSON.stringify({ type: "Point", coordinates: [lon, lat] });
            const ignUrl = `https://apicarto.ign.fr/api/cadastre/parcelle?geom=${pointGeom}`;
            const ignRes = await fetch(ignUrl);
            
            if (!ignRes.ok) throw new Error("Parcelle non trouvée");
            const ignData = await ignRes.json();

            if (!ignData.features || ignData.features.length === 0) {
                setCadastreStatus("❌ Parcelle introuvable à cette adresse.");
                return;
            }

            const parcel = ignData.features[0].properties;

            // 3. Récupération des infos PLU/Urbanisme via l'API IGN (APICarto GPU)
            let urbanismeInfo = { zone: '', description: '', pdfUrl: '' };
            try {
                // Essai 1 : Endpoint zone-urba pour avoir la zone
                const gpuUrl = `https://apicarto.ign.fr/api/gpu/zone-urba?geom=${pointGeom}`;
                const gpuRes = await fetch(gpuUrl);
                if (gpuRes.ok) {
                    const gpuData = await gpuRes.json();
                    if (gpuData.features && gpuData.features.length > 0) {
                        const props = gpuData.features[0].properties;
                        urbanismeInfo.zone = props.libelle;
                        urbanismeInfo.description = props.libelong;
                        
                        // Si l'urlfic est bien un lien internet on le prend
                        if (props.urlfic && props.urlfic.startsWith('http')) {
                            urbanismeInfo.pdfUrl = props.urlfic;
                        }
                    }
                }
                
                // Essai 2 : Si pas de PDF trouvé dans la zone, on interroge le document global
                if (!urbanismeInfo.pdfUrl) {
                    const docUrl = `https://apicarto.ign.fr/api/gpu/document?geom=${pointGeom}`;
                    const docRes = await fetch(docUrl);
                    if (docRes.ok) {
                        const docData = await docRes.json();
                        if (docData.features && docData.features.length > 0) {
                            urbanismeInfo.pdfUrl = docData.features[0].properties.urldoc || '';
                        }
                    }
                }

            } catch(e) {
                console.warn("Info PLU non disponible", e);
            }

            setData(prev => ({
                ...prev,
                cadastre: { 
                    section: parcel.section, 
                    numero: parcel.numero, 
                    contenance: parcel.contenance,
                    commune: citycode,
                    nom_commune: city,
                    lon: lon,
                    lat: lat
                },
                urbanisme: urbanismeInfo
            }));
            setCadastreStatus(`✅ Parcelle trouvée !`);
        } catch (err) {
            console.error(err);
            setCadastreStatus("❌ Erreur de réseau ou service indisponible.");
        }
    };

    return (
        <Card title="Étape 3 : Informations client & dossier">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <InputField label="Nom du propriétaire" name="proprietaire" value={data.proprietaire} onChange={handleChange} placeholder="Jean Dupont" />
                <InputField label="Email" name="email" value={data.email} onChange={handleChange} placeholder="jean.dupont@email.com" type="email" />
                <InputField label="Adresse du logement" name="adresse_logement" value={data.adresse_logement} onChange={handleChange} placeholder="123 Rue de la République, 75001 Paris" />
                <InputField label="Référence dossier" name="reference_dossier" value={data.reference_dossier} onChange={handleChange} placeholder="DOS-2025-001" />
                <InputField label="Date de la visite" name="date_visite" value={data.date_visite} onChange={handleChange} type="date" />
                <InputField label="Intervenant" name="intervenant" value={data.intervenant} onChange={handleChange} placeholder="Michel Martin" />
                
                <div className="md:col-span-2 mt-2 p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
                        <p className="text-sm font-medium text-blue-900">Recherche Cadastrale & Géorisques</p>
                        <div className="flex flex-wrap gap-2">
                            <button 
                                onClick={handleFetchCadastre} 
                                disabled={!data.adresse_logement || cadastreStatus.includes('Recherche')}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium shadow-sm"
                            >
                                Rechercher via l'adresse
                            </button>
                            {data.cadastre?.lon && data.cadastre?.lat && (
                                <>
                                    <button 
                                        onClick={() => window.open(`https://georisques.gouv.fr/api/v1/rapport_pdf?latlon=${data.cadastre.lon},${data.cadastre.lat}`, '_blank')}
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium shadow-sm flex items-center gap-2"
                                        title="Télécharger le rapport Géorisques officiel au format PDF"
                                    >
                                        <FileText size={16} /> Rapport des risques
                                    </button>
                                    <button 
                                        onClick={() => window.open(`https://www.geoportail-urbanisme.gouv.fr/map/#tile=1&lon=${data.cadastre.lon}&lat=${data.cadastre.lat}&zoom=19`, '_blank')}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm font-medium shadow-sm flex items-center gap-2"
                                        title="Voir la parcelle sur le Géoportail de l'Urbanisme"
                                    >
                                        <Map size={16} /> Carte PLU
                                    </button>
                                </>
                            )}
                            {data.urbanisme?.pdfUrl && (
                                <button 
                                    onClick={() => window.open(data.urbanisme.pdfUrl, '_blank')}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm font-medium shadow-sm flex items-center gap-2"
                                    title="Télécharger le document d'urbanisme complet"
                                >
                                    <FileText size={16} /> Règlement PLU
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {data.cadastre?.section ? (
                        <div className="flex flex-col gap-3 bg-white p-3 rounded border border-blue-100 shadow-sm">
                            <div className="grid grid-cols-3 gap-4">
                                <div><span className="text-xs text-gray-500 block uppercase tracking-wide">Section</span><span className="font-semibold text-gray-800">{data.cadastre.section}</span></div>
                                <div><span className="text-xs text-gray-500 block uppercase tracking-wide">Numéro</span><span className="font-semibold text-gray-800">{data.cadastre.numero}</span></div>
                                <div><span className="text-xs text-gray-500 block uppercase tracking-wide">Surface</span><span className="font-semibold text-gray-800">{data.cadastre.contenance} m²</span></div>
                            </div>
                            {data.urbanisme?.zone && (
                                <div className="border-t border-gray-100 pt-2 mt-1">
                                    <span className="text-xs text-gray-500 block uppercase tracking-wide">Zonage Urbanisme (PLU)</span>
                                    <span className="font-semibold text-gray-800">Zone {data.urbanisme.zone}</span>
                                    {data.urbanisme.description && <span className="text-sm text-gray-600 ml-2">- {data.urbanisme.description}</span>}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-blue-800/70 italic bg-white/50 p-2 rounded">Saisissez l'adresse de logement complète puis cliquez sur "Rechercher via l'adresse".</p>
                    )}
                    {cadastreStatus && <p className={`text-sm mt-3 font-medium ${cadastreStatus.includes('❌') ? 'text-red-600' : 'text-blue-800'}`}>{cadastreStatus}</p>}
                </div>

                <div className="md:col-span-2 mt-2 p-4 border rounded-lg bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-3">Conditions météo</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <SelectField label="Ciel" name="meteo.ciel" value={data.meteo?.ciel || ''} onChange={handleMeteoChange} options={["Clair","Nuageux","Pluvieux","Orageux"]}/>
                        <InputField label="Temp. (°C)" name="meteo.temperatureC" type="number" value={data.meteo?.temperatureC || ''} onChange={handleMeteoChange} placeholder="18"/>
                        <InputField label="Humidité (%)" name="meteo.humiditePct" type="number" value={data.meteo?.humiditePct || ''} onChange={handleMeteoChange} placeholder="55"/>
                        <SelectField label="Pluie" name="meteo.pluie" value={data.meteo?.pluie || ''} onChange={handleMeteoChange} options={["Aucune","Fine","Modérée","Forte"]}/>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const ProtocolCheckbox = React.memo(({ label, name, checked, onChange }) => (
    <label className={`flex items-center p-3 rounded-md border transition-colors cursor-pointer ${checked ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'}`}>
        <input type="checkbox" name={name} checked={checked} onChange={onChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <span className="ml-3 text-sm text-gray-800">{label}</span>
    </label>
));

const Step4_Protocols = ({ data, setData }) => {
    const handleProtocolChange = useCallback((e) => {
        const { name, checked } = e.target;
        setData(prev => ({ ...prev, protocoles: { ...prev.protocoles, [name]: checked } }));
    }, [setData]);

    const handleEnvironnementChange = (value) => {
        setData(prev => ({ ...prev, environnement: value }));
    };

    return (
        <Card title="Étape 4 : Environnement & Protocoles">
             <div className="mb-6">
                <label className="block text-md font-semibold text-gray-800 mb-3">Environnement analysé</label>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleEnvironnementChange('Intérieur')}
                        className={`flex-1 p-3 rounded-lg text-center font-semibold transition-all duration-200 border-2 ${data.environnement === 'Intérieur' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 hover:border-blue-400'}`}
                    >
                        Intérieur
                    </button>
                    <button
                        onClick={() => handleEnvironnementChange('Extérieur')}
                        className={`flex-1 p-3 rounded-lg text-center font-semibold transition-all duration-200 border-2 ${data.environnement === 'Extérieur' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 hover:border-blue-400'}`}
                    >
                        Extérieur
                    </button>
                </div>
             </div>

             <h3 className="text-md font-semibold text-gray-800 mb-3 pt-4 border-t">Protocoles de recherche</h3>
             <p className="text-sm text-gray-600 mb-4">Un protocole est recommandé selon la sous-catégorie. Vous pouvez en sélectionner d'autres.</p>
             <div className="space-y-3">
                <ProtocolCheckbox label="Standard – Visite sur site et relevé photographique" name="is_standard" checked={data.protocoles.is_standard} onChange={handleProtocolChange} />
                <h4 className="font-semibold pt-3 text-gray-600">Fissures</h4>
                <ProtocolCheckbox label="Niveau 1 - Relevé visuel et identification" name="is_fissures_n1" checked={data.protocoles.is_fissures_n1} onChange={handleProtocolChange} />
                <h4 className="font-semibold pt-3 text-gray-600">Humidité</h4>
                <ProtocolCheckbox label="Infiltration - Recherche visuelle (taches, moisissures)" name="is_humidite_infiltration" checked={data.protocoles.is_humidite_infiltration} onChange={handleProtocolChange} />
            </div>
        </Card>
    );
};

const Step5_Analysis = ({ data, setData }) => {
    const [cameraForObsId, setCameraForObsId] = useState(null);

    const handleAddObservation = useCallback(() => {
        setData(prev => ({
            ...prev,
            observations: [...prev.observations, { id: crypto.randomUUID(), piece: '', surface: '', gravite: 'Mineure', observations: '', photos: [] }]
        }));
    }, [setData]);

    const handleRemoveObservation = useCallback((id) => {
        setData(prev => ({ ...prev, observations: prev.observations.filter(obs => obs.id !== id) }));
    }, [setData]);

    const handleObsFieldChange = useCallback((obsId, field, value) => {
        setData(prev => ({
            ...prev,
            observations: prev.observations.map(o => o.id === obsId ? { ...o, [field]: value } : o)
        }));
    }, [setData]);
    
    const handleAppendToObsField = useCallback((obsId, field, text) => {
        setData(prev => ({
            ...prev,
            observations: prev.observations.map(o => o.id === obsId ? { ...o, [field]: (o[field] || '') + text } : o)
        }));
    }, [setData]);

    const handleMainFieldChange = useCallback((e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    }, [setData]);

    const handleAppendToMainField = useCallback((name, text) => {
        setData(prev => ({ ...prev, [name]: (prev[name] || '') + text }));
    }, [setData]);
    
    const handlePhotoUpload = useCallback((e, obsId) => {
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newPhoto = {
                    id: crypto.randomUUID(), name: file.name, src: event.target.result,
                    horodatageISO: new Date().toISOString()
                };
                setData(prev => ({ ...prev, observations: prev.observations.map(obs => 
                    obs.id === obsId ? { ...obs, photos: [...obs.photos, newPhoto] } : obs
                )}));
            };
            reader.readAsDataURL(file);
        });
    }, [setData]);
    
     const handlePhotoShot = useCallback((photo) => {
        if (!cameraForObsId) return;
        setData(prev => ({
            ...prev,
            observations: prev.observations.map(o =>
                o.id === cameraForObsId ? { ...o, photos: [...o.photos, photo] } : o
            )
        }));
        setCameraForObsId(null);
    }, [cameraForObsId, setData]);

    const handleRemovePhoto = useCallback((obsId, photoId) => {
        setData(prev => ({ ...prev, observations: prev.observations.map(obs => 
            obs.id === obsId ? { ...obs, photos: obs.photos.filter(p => p.id !== photoId) } : obs
        )}));
    }, [setData]);

    // Ajouter une observation vide si la liste est vide au montage
    useEffect(() => {
        if (data.observations.length === 0) {
            handleAddObservation();
        }
    }, [data.observations.length, handleAddObservation]);

    return (
        <Card title="Étape 5 : Saisie des analyses">
            {data.observations.map((obs, index) => (
                <ObservationForm
                    key={obs.id}
                    obs={obs}
                    index={index}
                    onFieldChange={handleObsFieldChange}
                    onAppendToField={handleAppendToObsField}
                    onPhotoUpload={handlePhotoUpload}
                    onRemovePhoto={handleRemovePhoto}
                    onRemoveObservation={handleRemoveObservation}
                    onOpenCamera={() => setCameraForObsId(obs.id)}
                    isOnlyObservation={data.observations.length === 1}
                />
            ))}
            <button onClick={handleAddObservation} className="mt-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm font-semibold">
                Ajouter une observation
            </button>

            <TextAreaWithMic label="Analyse de l'expert" name="analyse_expert" value={data.analyse_expert} onChange={handleMainFieldChange} onAppend={handleAppendToMainField} />
            <TextAreaWithMic label="Recommandations" name="recommandations" value={data.recommandations} onChange={handleMainFieldChange} onAppend={handleAppendToMainField} />
            
            <CameraCaptureModal
                open={!!cameraForObsId}
                onClose={() => setCameraForObsId(null)}
                onShot={handlePhotoShot}
            />
        </Card>
    );
};

const ObservationForm = React.memo(({ obs, index, onFieldChange, onAppendToField, onPhotoUpload, onRemovePhoto, onRemoveObservation, onOpenCamera, isOnlyObservation }) => (
    <div className="p-4 border rounded-md bg-gray-50 space-y-4 mb-4 relative">
        <div className="flex justify-between items-center">
            <h3 className="text-md font-semibold text-gray-800">Observation #{index + 1}</h3>
            {!isOnlyObservation && (
                <button onClick={() => onRemoveObservation(obs.id)} aria-label="Supprimer cette observation" className="text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField label="Pièce" name="piece" value={obs.piece} onChange={e => onFieldChange(obs.id, 'piece', e.target.value)} options={PIECES_OPTIONS} />
            <SelectField label="Surface" name="surface" value={obs.surface} onChange={e => onFieldChange(obs.id, 'surface', e.target.value)} options={SURFACES_OPTIONS} />
            <SelectField label="Gravité" name="gravite" value={obs.gravite} onChange={e => onFieldChange(obs.id, 'gravite', e.target.value)} options={['Mineure', 'Moyenne', 'Sévère']} />
        </div>

        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Détails</label>
            <textarea
                value={obs.observations}
                onChange={e => onFieldChange(obs.id, 'observations', e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-12"
                placeholder="Décrire les désordres..."
            />
            <MicButton onFinalText={(txt) => onAppendToField(obs.id, 'observations', txt)} title="Dicter les observations" />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {obs.photos.map(photo => (
                    <div key={photo.id} className="relative group aspect-square">
                        <img loading="lazy" src={photo.src} alt={photo.name} className="w-full h-full object-cover rounded-md border" />
                        <button onClick={() => onRemovePhoto(obs.id, photo.id)} aria-label="Supprimer la photo" className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
                <label className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-100 text-gray-500">
                    <Upload size={24} />
                    <span className="text-xs mt-1">Importer</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => onPhotoUpload(e, obs.id)} />
                </label>
                <button type="button" onClick={onOpenCamera} className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-md hover:bg-gray-100 text-gray-500" title="Prendre une photo">
                    <Camera size={24} />
                    <span className="text-xs mt-1">Prendre</span>
                </button>
            </div>
        </div>
    </div>
));

const TextAreaWithMic = React.memo(({ label, name, value, onChange, onAppend }) => (
    <div className="mt-6">
        <label className="block text-lg font-medium text-gray-800 mb-2">{label}</label>
        <div className="relative">
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                rows="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-12"
            />
            <MicButton onFinalText={(txt) => onAppend(name, txt)} title={`Dicter dans "${label}"`} />
        </div>
    </div>
));

const SignatureCanvas = ({ onSave }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const getCoords = (e) => {
        const event = e.touches ? e.touches[0] : e;
        const rect = canvasRef.current.getBoundingClientRect();
        return [event.clientX - rect.left, event.clientY - rect.top];
    };
    
    const startDrawing = (e) => {
        e.preventDefault();
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(...getCoords(e));
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(...getCoords(e));
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        const ctx = canvasRef.current.getContext('2d');
        ctx.closePath();
        setIsDrawing(false);
        onSave(canvasRef.current.toDataURL('image/png'));
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onSave('');
    };
    
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        ctx.scale(ratio, ratio);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
    }, []);

    return (
        <div>
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="border border-gray-400 rounded-md w-full h-48 touch-none bg-white"
            />
            <button type="button" onClick={clearCanvas} className="mt-2 text-sm text-blue-600 hover:underline">Effacer</button>
        </div>
    );
};


const Step6_SignatureExport = ({ data, setData, onGenerateDocx, onPreview, onEditReport, onNewReport }) => {
    const [editStep, setEditStep] = useState(3);
    const isExportDisabled = !data.nom_signataire || !data.signature;
    return (
        <Card title="Étape 6 : Signature & Export">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Signature du rapport</h3>
                    <InputField label="Nom du signataire" name="nom_signataire" value={data.nom_signataire} onChange={e => setData(prev => ({ ...prev, nom_signataire: e.target.value }))} />
                    <SignatureCanvas onSave={sig => setData(prev => ({...prev, signature: sig}))} />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Actions</h3>
                    <div className="space-y-3">
                        <button onClick={onPreview} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition">
                            <Eye size={20} /> Visualiser le rapport
                        </button>
                        <button onClick={onGenerateDocx} disabled={isExportDisabled} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition disabled:bg-gray-400">
                            <FileText size={20} /> Générer le .DOC
                        </button>
                        {isExportDisabled && <p className="text-xs text-center text-gray-500">La signature et le nom sont requis pour l'export.</p>}
                    </div>

                    <div className="mt-6 pt-6 border-t">
                        <div className="mb-3 p-3 border rounded-md bg-gray-50">
                            <label className="text-sm text-gray-600">Modifier le rapport</label>
                            <div className="flex gap-2 mt-2">
                                <select value={editStep} onChange={(e) => setEditStep(Number(e.target.value))} className="flex-grow px-2 py-2 border rounded bg-white text-sm">
                                    <option value={3}>Infos client</option>
                                    <option value={4}>Protocoles</option>
                                    <option value={5}>Analyses</option>
                                </select>
                                <button onClick={() => onEditReport?.(editStep)} className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm">Aller</button>
                            </div>
                        </div>
                        <button onClick={onNewReport} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition">
                            Nouveau rapport
                        </button>
                    </div>
                </div>
            </div>
        </Card>
    );
};


const HtmlReportPreview = ({ data }) => {
    const reportHtml = useMemo(() => buildWordDocumentHtml(data), [data]);
    return (
        <div className="bg-white p-8 rounded-lg max-w-4xl mx-auto my-8 shadow-lg">
             {/* Utiliser un iframe pour isoler les styles du document de ceux de l'application */}
            <iframe
                srcDoc={reportHtml}
                title="Aperçu du rapport"
                className="w-full h-[80vh] border rounded"
            />
        </div>
    );
};

// --- LOGIQUE PRINCIPALE DE L'APPLICATION ---

const initialReport = {
    categorie: '', sous_categorie: '', titre: "Rapport d'expertise",
    proprietaire: '', email: '', adresse_logement: '', reference_dossier: '',
    date_visite: new Date().toISOString().split('T')[0], intervenant: '',
    meteo: { ciel: '', temperatureC: '', humiditePct: '', pluie: '' },
    cadastre: { section: '', numero: '', contenance: '', commune: '', nom_commune: '' },
    urbanisme: { zone: '', description: '', pdfUrl: '' },
    environnement: 'Intérieur', // Default to 'Intérieur'
    protocoles: { is_standard: true, is_fissures_n1: false, is_humidite_infiltration: false },
    observations: [],
    analyse_expert: '', recommandations: '', nom_signataire: '', signature: ''
};

const ReportWizard = ({ initialData, onGoHome }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [reportData, setReportData] = useState(initialData);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => saveDraft(reportData), 1000);
        return () => clearTimeout(handler);
    }, [reportData]);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const isNextDisabled = useMemo(() => {
        switch (currentStep) {
            case 1: return !reportData.categorie;
            case 2: return !reportData.sous_categorie;
            case 3: return !reportData.proprietaire || !reportData.adresse_logement || !reportData.reference_dossier;
            default: return false;
        }
    }, [reportData, currentStep]);

    const handleGenerateDocx = useCallback(() => {
        const html = buildWordDocumentHtml(reportData);
        const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
        const fileName = `Rapport_${reportData.reference_dossier || 'sans-ref'}.doc`;
        saveAs(blob, fileName);
    }, [reportData]);

    return (
        <div className="bg-gray-50 min-h-screen font-sans pb-28">
            <Header onGoHome={onGoHome} />
            <main className="max-w-4xl mx-auto p-4">
                <Stepper currentStep={currentStep} />
                <div className="mt-8">
                    {currentStep === 1 && <Step1_ReportType data={reportData} setData={setReportData} />}
                    {currentStep === 2 && <Step2_SubCategory data={reportData} setData={setReportData} />}
                    {currentStep === 3 && <Step3_ClientInfo data={reportData} setData={setReportData} />}
                    {currentStep === 4 && <Step4_Protocols data={reportData} setData={setReportData} />}
                    {currentStep === 5 && <Step5_Analysis data={reportData} setData={setReportData} />}
                    {currentStep === 6 && <Step6_SignatureExport data={reportData} setData={setReportData} onGenerateDocx={handleGenerateDocx} onPreview={() => setIsPreviewVisible(true)} onEditReport={setCurrentStep} onNewReport={onGoHome} />}
                </div>
            </main>
            <Footer
                currentStep={currentStep}
                onPrev={() => setCurrentStep(s => s - 1)}
                onNext={() => setCurrentStep(s => s + 1)}
                isNextDisabled={isNextDisabled}
                onSaveDraft={() => showToast('Brouillon sauvegardé !')}
            />
            {isPreviewVisible && (
                <div className="fixed inset-0 bg-black/70 z-50 p-4 overflow-y-auto flex justify-center items-start" onClick={() => setIsPreviewVisible(false)}>
                    {/* Le conteneur du contenu qui empêche la fermeture au clic */}
                    <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                        <HtmlReportPreview data={reportData} />
                        {/* Bouton de fermeture ajouté */}
                        <button
                            onClick={() => setIsPreviewVisible(false)}
                            aria-label="Fermer la visualisation"
                            className="absolute top-10 right-0 md:right-2 p-2 bg-gray-200 text-gray-900 rounded-full hover:bg-gray-300 shadow-lg"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
            )}
            {toastMessage && <Toast message={toastMessage} />}
        </div>
    );
};

const HomePage = ({ onNewReport, onLoadDraft, draftExists }) => (
    <div className="bg-gray-100 min-h-screen font-sans">
        <Header />
        <main className="max-w-2xl mx-auto p-4 mt-12">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Bienvenue</h2>
                <p className="text-gray-600 mb-8">Commencez par créer un nouveau rapport ou reprenez là où vous vous êtes arrêté.</p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <button onClick={onNewReport} className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition text-lg">
                        <PlusCircle size={22} /> Nouveau rapport
                    </button>
                    <button onClick={onLoadDraft} disabled={!draftExists} className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 text-gray-800 rounded-md font-semibold hover:bg-gray-50 transition text-lg disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                        <Edit size={22} /> Reprendre le brouillon
                    </button>
                </div>
                {!draftExists && <p className="text-xs text-gray-500 mt-4">Aucun brouillon n'a été trouvé.</p>}
            </div>
        </main>
    </div>
);

export default function App() {
    const [appState, setAppState] = useState('loading'); // loading, home, wizard
    const [initialWizardData, setInitialWizardData] = useState(initialReport);
    const [draftExists, setDraftExists] = useState(false);
    const [isConfirmingNew, setIsConfirmingNew] = useState(false);

    useEffect(() => {
        const checkDraft = async () => {
            const draft = await loadDraft();
            setDraftExists(!!(draft && draft.categorie));
            setAppState('home');
        };
        checkDraft();
    }, []);

    const handleStartNewReport = async () => {
        const hasPermission = await requestPermissions();
        if(!hasPermission) {
            // Optionnel: afficher une modale pour informer l'utilisateur sur les permissions
            console.warn("Permissions non accordées. Certaines fonctionnalités seront désactivées.");
        }

        if (draftExists) {
            setIsConfirmingNew(true);
        } else {
            setInitialWizardData(initialReport);
            setAppState('wizard');
        }
    };
    
    const confirmAndStartNew = async () => {
        await removeDraft();
        setDraftExists(false);
        setInitialWizardData(initialReport);
        setAppState('wizard');
        setIsConfirmingNew(false);
    };

    const handleLoadDraft = async () => {
        const draft = await loadDraft();
        if (draft) {
            setInitialWizardData(draft);
            setAppState('wizard');
        }
    };

    const handleGoHome = () => {
       setAppState('loading'); // Forcer la re-vérification du brouillon
       setTimeout(() => {
            const checkDraft = async () => {
                const draft = await loadDraft();
                setDraftExists(!!(draft && draft.categorie));
                setAppState('home');
            };
            checkDraft();
       }, 100);
    };

    if (appState === 'loading') {
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Chargement...</p></div>;
    }

    if (appState === 'home') {
        return (
            <>
                <HomePage onNewReport={handleStartNewReport} onLoadDraft={handleLoadDraft} draftExists={draftExists} />
                {isConfirmingNew && (
                    <ConfirmationModal
                        title="Écraser le brouillon ?"
                        message="Un brouillon existe déjà. Voulez-vous le supprimer et créer un nouveau rapport ?"
                        onConfirm={confirmAndStartNew}
                        onCancel={() => setIsConfirmingNew(false)}
                    />
                )}
            </>
        );
    }

    return <ReportWizard initialData={initialWizardData} onGoHome={handleGoHome} />;
}
