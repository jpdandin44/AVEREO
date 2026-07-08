import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { saveAs } from 'file-saver';
import { Camera, Mic, Upload, FileText, Trash2, ArrowLeft, ArrowRight, CheckCircle, Eye, X, Home, PlusCircle, Edit, BookOpen, ChevronLeft, AlertTriangle } from 'lucide-react';

// --- Helpers : Chargement dynamique de script (pour Chart.js) ---
const useScript = (url) => {
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        if (document.querySelector(`script[src="${url}"]`)) {
            setLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => setLoaded(true);
        document.head.appendChild(script);
    }, [url]);
    return loaded;
};

// --- Helpers : Stockage Robuste (IndexedDB avec fallback) ---
const getIDB = () => window.idbKeyval;

const saveDraft = (data) => {
    const idb = getIDB();
    if (idb?.set) return idb.set('draftReport', data);
    return Promise.resolve(localStorage.setItem('draftReport', JSON.stringify(data)));
};

const loadDraft = async () => {
    const idb = getIDB();
    if (idb?.get) return await idb.get('draftReport');
    return Promise.resolve(JSON.parse(localStorage.getItem('draftReport') || 'null'));
};

const removeDraft = () => {
    const idb = getIDB();
    if (idb?.del) return idb.del('draftReport');
    return Promise.resolve(localStorage.removeItem('draftReport'));
};

// --- Helpers : Permissions Média ---
const requestPermissions = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (err) {
        console.error("Permission refusée pour la caméra/micro:", err);
        return false;
    }
};

// --- Helpers : Reconnaissance Vocale ---
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
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
            }
            if (finalTranscript && onFinalText) onFinalText(finalTranscript + ' ');
        };

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => console.error("Erreur de reconnaissance vocale:", event.error);
        recognitionRef.current = recognition;

        return () => recognitionRef.current?.stop();
    }, [lang, isSupported, onFinalText]);

    const toggleListening = useCallback(() => {
        if (!isSupported) return;
        if (isListening) recognitionRef.current?.stop();
        else recognitionRef.current?.start();
    }, [isListening, isSupported]);

    return { isSupported, isListening, toggleListening };
};

const MicButton = React.memo(({ onFinalText, title = 'Dictée vocale' }) => {
    const { isSupported, isListening, toggleListening } = useSpeechRecognition('fr-FR', onFinalText);
    if (!isSupported) return null;

    return (
        <button
            type="button"
            onClick={toggleListening}
            title={title}
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
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
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
        onShot?.({ src: dataUrl, horodatageISO: new Date().toISOString() });
        onClose?.();
    }, [onShot, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-4 w-full max-w-lg shadow-xl">
                <div className="aspect-video bg-black rounded overflow-hidden relative flex items-center justify-center">
                    <video ref={videoRef} playsInline muted className={`w-full h-full object-contain transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`} />
                    {isLoading && <div className="absolute text-white">Chargement...</div>}
                </div>
                <div className="flex justify-between mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Annuler</button>
                    <button onClick={handleTakeShot} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2">
                        <Camera size={18} /> Prendre la photo
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- CONSTANTES ET TEXTES ---
const PIECES_OPTIONS = ["Façade principale", "Façade arrière", "Pignon", "Toiture", "Salon", "Cuisine", "Chambre", "Salle de bain", "WC", "Combles", "Sous-sol", "TGBT", "Local technique", "Autre"];
const SURFACES_OPTIONS = ["Mur extérieur", "Mur intérieur", "Sol", "Plafond", "Menuiserie", "Couverture", "Tableau électrique", "Panneau PV", "Canalisation", "Autre"];

const SUB_CATEGORIES = {
    "Expertise & Visite Technique": ["Constat général", "Fissures", "Humidité", "Toiture", "Analyse thermographique"],
    "Expertise Thermographique": [
        "Bâtiment - Enveloppe (Ponts thermiques & Isolation)",
        "Bâtiment - Infiltrations d'air",
        "Bâtiment - Humidité & Remontées capillaires",
        "Extérieur - Toiture Terrasse",
        "Équipements - Réseaux Thermiques (Chauffage/Plomberie)",
        "Énergie - Photovoltaïque",
        "Équipements - Installations Électriques",
        "Drone - Inspection Bâtiment / Toiture"
    ],
    "Assistance & Gestion avant-projet": ["Avant-projet", "Consultation d'entreprise"],
    "Réception de travaux": ["Réception de travaux"],
};

const PROTOCOL_TEXTS = {
    is_standard: "<p>Ce protocole de recherche repose sur l'analyse visuelle de l'ensemble des éléments accessibles à l'aide d'un relevé photographique. Chaque cliché est analysé à la recherche de signes pertinents.</p>",
    is_thermo_batiment_enveloppe: "<p>L’inspection thermographique de l’enveloppe a été réalisée de manière non destructive. Elle a pour objectif de repérer des singularités thermiques de surface pouvant correspondre à des déperditions, des ponts thermiques, des défauts d'isolation ou des infiltrations d'air parasites. La méthode repose sur l'analyse comparative des gradients de température. Il est rappelé que la caméra thermique ne voit pas au travers des murs. Les variations observées peuvent être influencées par la structure interne des matériaux, leur inertie thermique ou des conditions environnementales spécifiques. Toute anomalie thermique suspectée lors de cette approche préliminaire requiert d'être confirmée par des sondages ou études thermiques approfondies.</p>",
    is_thermo_humidite: "<p>La recherche thermographique appliquée à l'humidité repose sur l'identification de zones de refroidissement induites par l'évaporation de l'eau en surface des matériaux. L'objectif est d'identifier des cheminements préférentiels d'humidité, des infiltrations ou des remontées capillaires. Une zone perçue \"froide\" au thermogramme n'est pas systématiquement synonyme d'infiltration avérée (pont thermique, effet de matière). Les singularités détectées constituent des présomptions qui doivent être vérifiées par des mesures complémentaires d'humidité (humidimètre à pointe, mesure diélectrique).</p>",
    is_thermo_reseaux: "<p>Le contrôle des équipements thermiques a pour but de vérifier l'homogénéité de la diffusion de chaleur (planchers chauffants, radiateurs) ou de rechercher des anomalies de tracé et d'éventuelles fuites. La chaleur se diffusant par conduction à travers les chapes et revêtements, l'image thermique obtenue est une projection floue du réseau réel. La précision de localisation dépend fortement de la profondeur des conduites et de la nature des revêtements. Les constats formulés sur l'emplacement ou l'état de ces canalisations intégrées restent indicatifs et non garantis.</p>",
    is_thermo_photovoltaique: "<p>L'analyse thermographique des installations photovoltaïques est réalisée sous un ensoleillement direct pour solliciter les modules. Le protocole vise à identifier l'échauffement anormal de cellules (hot-spots), de boîtiers de jonction ou de connectiques, pouvant indiquer une résistance anormale, une défaillance de diode ou un encrassement sévère. Les reflets de l'environnement ou du ciel sur la surface vitrée des panneaux constituent une limite technique majeure pouvant générer de fausses anomalies ou masquer des singularités réelles.</p>",
    is_thermo_electrique: "<p>L'inspection thermographique des installations électriques a pour but de localiser des échauffements anormaux liés à des résistances de contact (desserrage), des surcharges ou des déséquilibres de phases. Les mesures sont effectuées sous tension. L'échauffement dépendant directement de la charge (courant) traversant l'équipement au moment de la mesure, une anomalie peut être masquée si l'installation fonctionne à faible régime. Les mesures au travers de capots plastiques ou de vitres de protection sont impossibles (l'infrarouge n'est pas transmissif à travers ces matériaux).</p>",
    is_thermo_drone: "<p>Le relevé thermographique aérien a été réalisé par drone afin d'inspecter des zones inaccessibles ou de grande hauteur (toitures, façades inaccessibles). Les contraintes aérologiques, la distance de vol de sécurité requise et l'angle d'incidence par rapport aux surfaces analysées peuvent impacter la résolution spatiale (IFOV) et la précision des mesures. Les constats identifiés nécessitent, lorsque la sécurité le permet, d'être confirmés par une approche de contact.</p>"
};

// --- DATA DU RÉFÉRENTIEL ---
const THERMO_DATA = {
    categories: [
        { id: "thermo_batiment_enveloppe", label: "Bâtiment - Enveloppe (Ponts thermiques & Isolation)", domain: "Bâtiment", objectif: "Mettre en évidence des variations thermiques de surface pouvant suggérer des déperditions, des ponts thermiques ou des défauts d'isolation.", protocole: "is_thermo_batiment_enveloppe", conditions: ["Écart de température int/ext > 10°C", "Bâtiment chauffé depuis > 24h", "Absence d'ensoleillement direct préalable"], champs: ["temperature_interieure_c", "temperature_exterieure_c", "emissivite", "temperature_reflechie_c"], limites: ["Inertie thermique des murs épais", "Présence de bardages ventilés ou lames d'air"] },
        { id: "thermo_infiltrations_air", label: "Bâtiment - Infiltrations d'air", domain: "Bâtiment", objectif: "Rechercher des singularités thermiques liées à des circulations d'air parasites à travers l'enveloppe.", protocole: "is_thermo_batiment_enveloppe", conditions: ["Différence de pression air int/ext (Blower Door ou vent naturel)", "Écart de T° > 5°C"], champs: ["vent_kmh", "ecart_temperature_c"], limites: ["Difficilement observable en l'absence de différentiel de pression"] },
        { id: "thermo_humidite", label: "Bâtiment - Humidité & Remontées capillaires", domain: "Bâtiment", objectif: "Repérer des zones de refroidissement évaporatif pouvant indiquer une teneur en eau anormale dans les matériaux.", protocole: "is_thermo_humidite", conditions: ["Absence de pluie récente (< 48h)", "Vent faible"], champs: ["humidite_interieure_pct", "pluie_recente"], limites: ["La thermographie seule ne qualifie pas l'humidité (mesure hygrométrique de contact recommandée)"] },
        { id: "thermo_toiture_terrasse", label: "Extérieur - Toiture Terrasse", domain: "Extérieur", objectif: "Identifier, par différence d'inertie thermique, des zones de stagnation d'eau sous le complexe d'étanchéité.", protocole: "is_thermo_humidite", conditions: ["Ensoleillement diurne préalable", "Ciel dégagé la nuit", "Mesure au crépuscule ou début de nuit"], champs: ["ensoleillement_direct", "ciel"], limites: ["Couvertures lestées (gravillons) limitent fortement l'observation"] },
        { id: "thermo_reseaux", label: "Équipements - Réseaux Thermiques", domain: "Équipements", objectif: "Tracer des réseaux encastrés, repérer des fuites possibles ou des zones d'embouage par analyse du gradient de température.", protocole: "is_thermo_reseaux", conditions: ["Installation en fonctionnement (circulation de fluide)"], champs: ["installation_fonctionnement"], limites: ["Profondeur d'enfouissement", "Nature du revêtement (ex: parquet massif sur plancher chauffant)"] },
        { id: "thermo_photovoltaique", label: "Énergie - Photovoltaïque", domain: "Énergie", objectif: "Rechercher des cellules en échauffement (hot-spots), des défauts de connectique ou des modules sous-performants.", protocole: "is_thermo_photovoltaique", conditions: ["Ensoleillement > 600 W/m²", "Installation sous production active"], champs: ["production_photovoltaique", "ensoleillement_direct"], limites: ["Angle de prise de vue générant des reflets (ciel, soleil)"] },
        { id: "thermo_electrique", label: "Équipements - Installations Électriques", domain: "Équipements", objectif: "Localiser des échauffements anormaux liés à des résistances de contact (desserrage), surcharges ou déséquilibres.", protocole: "is_thermo_electrique", conditions: ["Installation sous tension", "Charge électrique > 40% de la nominale si possible"], champs: ["installation_sous_tension", "charge_electrique_connue"], limites: ["Mesures au travers de plastrons ou vitres impossibles (IR non transmissif)"] },
        { id: "thermo_drone_batiment", label: "Drone - Inspection Bâtiment / Toiture", domain: "Drone", objectif: "Réaliser un relevé thermographique aérien sur des zones inaccessibles ou de grande hauteur.", protocole: "is_thermo_drone", conditions: ["Conditions aérologiques compatibles (vent faible, pas de pluie)", "Autorisations de vol validées"], champs: ["autorisation_drone", "vent_kmh"], limites: ["Résolution spatiale (IFOV) limitée par la distance de sécurité en vol"] }
    ],
    conditions: [
        { crit: "Delta T°", dom: "Bâtiment", cond: "Écart Int/Ext > 10°C", rsq: "Masquage total des déperditions et défauts d'isolation.", act: "Alerte forte. Obligation de renseigner une réserve." },
        { crit: "Chauffage", dom: "Bâtiment", cond: "Actif depuis > 24h", rsq: "Équilibre thermique des murs non atteint, fausses anomalies.", act: "Alerte UI." },
        { crit: "Pluie/Humidité", dom: "Bâti / Toit / Drone", cond: "Pas de pluie (< 48h)", rsq: "Refroidissement évaporatif faussant les températures de surface.", act: "Blocage/Alerte rouge (Extérieur)." },
        { crit: "Brouillard", dom: "Extérieur / Drone", cond: "Aucun", rsq: "Atténuation forte du rayonnement Infrarouge.", act: "Alerte forte." },
        { crit: "Vent", dom: "Bâtiment / Drone", cond: "Faible (< 15 km/h)", rsq: "Lessivage thermique des façades.", act: "Avertissement métier." },
        { crit: "Ensoleillement", dom: "Enveloppe Bâti", cond: "Façades à l'ombre", rsq: "Surchauffe solaire masquant les fuites thermiques réelles.", act: "Alerte si case ensoleillement direct cochée." },
        { crit: "Ensoleillement", dom: "Photovoltaïque", cond: "> 600 W/m² (Soleil franc)", rsq: "Cellules défectueuses non échauffées car non sollicitées.", act: "Alerte si nuageux." },
        { crit: "Charge Élec", dom: "Électricité", cond: "> 40% charge nominale", rsq: "Un défaut de serrage ne s'échauffe pas sans passage de courant.", act: "Champ texte Charge requis." },
        { crit: "Réglementaire", dom: "Drone", cond: "Autorisations validées", rsq: "Vol illégal, mise en danger d'autrui.", act: "Case à cocher bloquante." }
    ],
    levels: [
        { niv: "0", class: "bg-white", def: "Aucune anomalie thermique significative observée.", auth: "Thermogramme homogène, cohérent avec la structure attendue.", inter: "Parfaite isolation, Zéro défaut, Conforme" },
        { niv: "1", class: "bg-green-50", def: "Singularité thermique mineure ou explicable.", auth: "Singularité thermique observée. Phénomène probable lié à la conception.", inter: "Petit défaut" },
        { niv: "2", class: "bg-yellow-50", def: "Anomalie thermique suspectée.", auth: "Anomalie thermique suspectée nécessitant une surveillance ou vérification.", inter: "Défaut certain, Fuite avérée" },
        { niv: "3", class: "bg-orange-50", def: "Défaut probable à confirmer.", auth: "Forte probabilité de désordre. Investigations intrusives recommandées.", inter: "Preuve d'infiltration, Malfaçon" },
        { niv: "4", class: "bg-red-50", def: "Anomalie critique (Risque matériel/incendie - Élec/PV).", auth: "Échauffement ponctuel critique. Mise en sécurité ou maintenance rapide requise.", inter: "Risque incendie garanti, Danger de mort" },
        { niv: "X", class: "bg-slate-100", def: "Image non exploitable.", auth: "Image thermique non exploitable en raison de reflets/matériau/météo.", inter: "(Essayer d'interpréter quand même)" }
    ],
    protocols: [
        { id: "is_thermo_batiment_enveloppe", label: "Bâtiment - Enveloppe", text: "L’inspection thermographique de l’enveloppe a été réalisée de manière non destructive. Elle a pour objectif de repérer des singularités thermiques de surface pouvant correspondre à des déperditions, des ponts thermiques, des défauts d'isolation ou des infiltrations d'air parasites. La méthode repose sur l'analyse comparative des gradients de température. Il est rappelé que la caméra thermique ne voit pas au travers des murs. Les variations observées peuvent être influencées par la structure interne des matériaux, leur inertie thermique ou des conditions environnementales spécifiques. Toute anomalie thermique suspectée lors de cette approche préliminaire requiert d'être confirmée par des sondages ou études thermiques approfondies." },
        { id: "is_thermo_humidite", label: "Humidité", text: "La recherche thermographique appliquée à l'humidité repose sur l'identification de zones de refroidissement induites par l'évaporation de l'eau en surface des matériaux. L'objectif est d'identifier des cheminements préférentiels d'humidité, des infiltrations ou des remontées capillaires. Une zone perçue 'froide' au thermogramme n'est pas systématiquement synonyme d'infiltration avérée (pont thermique, effet de matière). Les singularités détectées constituent des présomptions qui doivent être vérifiées par des mesures complémentaires d'humidité (humidimètre à pointe, mesure diélectrique)." },
        { id: "is_thermo_reseaux", label: "Réseaux & Équipements", text: "Le contrôle des équipements thermiques a pour but de vérifier l'homogénéité de la diffusion de chaleur (planchers chauffants, radiateurs) ou de rechercher des anomalies de tracé et d'éventuelles fuites. La chaleur se diffusant par conduction à travers les chapes et revêtements, l'image thermique obtenue est une projection floue du réseau réel. La précision de localisation dépend fortement de la profondeur des conduites et de la nature des revêtements. Les constats formulés sur l'emplacement ou l'état de ces canalisations intégrées restent indicatifs et non garantis." },
        { id: "is_thermo_photovoltaique", label: "Photovoltaïque", text: "L'analyse thermographique des installations photovoltaïques est réalisée sous un ensoleillement direct pour solliciter les modules. Le protocole vise à identifier l'échauffement anormal de cellules (hot-spots), de boîtiers de jonction ou de connectiques, pouvant indiquer une résistance anormale, une défaillance de diode ou un encrassement sévère. Les reflets de l'environnement ou du ciel sur la surface vitrée des panneaux constituent une limite technique majeure pouvant générer de fausses anomalies ou masquer des singularités réelles." },
        { id: "is_thermo_electrique", label: "Électricité", text: "L'inspection thermographique des installations électriques a pour but de localiser des échauffements anormaux liés à des résistances de contact (desserrage), des surcharges ou des déséquilibres de phases. Les mesures sont effectuées sous tension. L'échauffement dépendant directement de la charge (courant) traversant l'équipement au moment de la mesure, une anomalie peut être masquée si l'installation fonctionne à faible régime. Les mesures au travers de capots plastiques ou de vitres de protection sont impossibles (l'infrarouge n'est pas transmissif à travers ces matériaux)." },
        { id: "is_thermo_drone", label: "Inspection par Drone", text: "Le relevé thermographique aérien a été réalisé par drone afin d'inspecter des zones inaccessibles ou de grande hauteur (toitures, façades inaccessibles). Les contraintes aérologiques, la distance de vol de sécurité requise et l'angle d'incidence par rapport aux surfaces analysées peuvent impacter la résolution spatiale (IFOV) et la précision des mesures. Les constats identifiés nécessitent, lorsque la sécurité le permet, d'être confirmés par une approche de contact." }
    ]
};

// --- COMPOSANT RÉFÉRENTIEL THERMOGRAPHIQUE ---
const ThermoReferentiel = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedCatId, setSelectedCatId] = useState(null);
    const [expandedProtocols, setExpandedProtocols] = useState({});
    
    const chartJsLoaded = useScript("https://cdn.jsdelivr.net/npm/chart.js");
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    const toggleProtocol = (i) => setExpandedProtocols(p => ({ ...p, [i]: !p[i] }));

    useEffect(() => {
        if (activeTab === 'overview' && chartJsLoaded && chartRef.current) {
            if (chartInstanceRef.current) chartInstanceRef.current.destroy();
            
            const domains = {};
            THERMO_DATA.categories.forEach(c => {
                domains[c.domain] = (domains[c.domain] || 0) + 1;
            });

            chartInstanceRef.current = new window.Chart(chartRef.current, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(domains),
                    datasets: [{
                        data: Object.values(domains),
                        backgroundColor: ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'],
                        borderWidth: 2,
                        borderColor: '#ffffff',
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', labels: { font: { family: "'Inter', sans-serif" }, color: '#334155', padding: 20 } },
                        tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, titleFont: { size: 14 }, bodyFont: { size: 14 }, callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} sous-catégories` } }
                    },
                    cutout: '65%'
                }
            });
        }
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [activeTab, chartJsLoaded]);

    const activeCategory = THERMO_DATA.categories.find(c => c.id === selectedCatId);

    return (
        <div className="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen flex flex-col md:flex-row relative">
            <style>{`
                .chart-container { position: relative; width: 100%; max-width: 500px; margin-left: auto; margin-right: auto; height: 300px; max-height: 400px; }
                @media (min-width: 768px) { .chart-container { height: 350px; } }
                .fade-in { animation: fadeIn 0.4s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .tab-btn { border-bottom: 2px solid transparent; transition: all 0.2s; }
                .tab-btn.active { border-bottom-color: #ea580c; color: #ea580c; font-weight: 600; }
            `}</style>
            
            {/* Close Button Top Right */}
            {onClose && (
                <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-slate-800 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg">
                    <X size={20} />
                </button>
            )}

            {/* Sidebar Navigation */}
            <aside className="bg-slate-900 text-slate-300 w-full md:w-64 flex-shrink-0 md:min-h-screen flex flex-col shadow-xl z-20 sticky top-0 md:h-screen">
                <div className="p-6 bg-slate-950 flex items-center gap-3">
                    <span className="text-3xl text-orange-500">&#128293;</span>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Thermo<span className="text-orange-500">Doc</span></h1>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Référentiel Métier</p>
                    </div>
                </div>
                
                <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible p-4 gap-2 flex-grow">
                    <button onClick={() => setActiveTab('overview')} className={`tab-btn ${activeTab === 'overview' ? 'active' : ''} flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap md:whitespace-normal`}>
                        <span className="text-lg">&#128200;</span> Vue d'ensemble
                    </button>
                    <button onClick={() => setActiveTab('explorer')} className={`tab-btn ${activeTab === 'explorer' ? 'active' : ''} flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap md:whitespace-normal`}>
                        <span className="text-lg">&#128194;</span> Catégories
                    </button>
                    <button onClick={() => setActiveTab('validation')} className={`tab-btn ${activeTab === 'validation' ? 'active' : ''} flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap md:whitespace-normal`}>
                        <span className="text-lg">&#9888;</span> Règles & Validation
                    </button>
                    <button onClick={() => setActiveTab('templates')} className={`tab-btn ${activeTab === 'templates' ? 'active' : ''} flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap md:whitespace-normal`}>
                        <span className="text-lg">&#128196;</span> Modèles HTML/Textes
                    </button>
                </nav>
                
                <div className="p-6 bg-slate-950/50 mt-auto hidden md:block">
                    <div className="border border-orange-500/30 bg-orange-500/10 p-3 rounded text-xs text-orange-200 leading-tight">
                        <strong className="block mb-1 text-orange-400">Rappel Légal Critique :</strong>
                        DOCUMENT TECHNIQUE NON OPPOSABLE
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full h-full overflow-x-hidden">
                
                {activeTab === 'overview' && (
                    <section className="fade-in block">
                        <div className="mb-8">
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Architecture d'Intégration</h2>
                            <p className="mt-2 text-lg text-slate-600">Cette section illustre l'intégration de la thermographie dans l'application cible. Elle présente la répartition des domaines couverts et le flux de travail en 6 étapes tel que défini dans le rapport source.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Distribution des Sous-catégories</h3>
                                <p className="text-sm text-slate-500 mb-6">Répartition par grand domaine d'application (Bâtiment, Énergie, etc.). Interagissez avec le graphique pour voir les détails.</p>
                                <div className="chart-container">
                                    <canvas ref={chartRef}></canvas>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <span className="text-orange-600">&#9881;</span> Parcours Applicatif (6 Étapes)
                                </h3>
                                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                                    <div className="relative pl-6">
                                        <div className="absolute w-4 h-4 bg-slate-200 rounded-full -left-[9px] top-1 border-2 border-white"></div>
                                        <h4 className="font-bold text-slate-800">1. Type de rapport</h4>
                                        <p className="text-sm text-slate-600">Déclencheur : Maintien ou ajout du type "Expertise Thermographique".</p>
                                    </div>
                                    <div className="relative pl-6">
                                        <div className="absolute w-4 h-4 bg-orange-400 rounded-full -left-[9px] top-1 border-2 border-white"></div>
                                        <h4 className="font-bold text-slate-800">2. Sous-catégorie <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded ml-2">Clé</span></h4>
                                        <p className="text-sm text-slate-600">Injection des sous-catégories (Bâtiment, Drone, PV...). Déclenche l'auto-sélection des protocoles.</p>
                                    </div>
                                    <div className="relative pl-6">
                                        <div className="absolute w-4 h-4 bg-slate-200 rounded-full -left-[9px] top-1 border-2 border-white"></div>
                                        <h4 class="font-bold text-slate-800">3. Conditions de mesure</h4>
                                        <p className="text-sm text-slate-600">Formulaire étendu (Delta T°, vent, matériel, émissivité). Validera ou invalidera l'export.</p>
                                    </div>
                                    <div className="relative pl-6">
                                        <div className="absolute w-4 h-4 bg-slate-200 rounded-full -left-[9px] top-1 border-2 border-white"></div>
                                        <h4 className="font-bold text-slate-800">4. Protocoles thermographiques</h4>
                                        <p className="text-sm text-slate-600">Cases booléennes pré-cochées. Génération dynamique des textes juridiques.</p>
                                    </div>
                                    <div className="relative pl-6">
                                        <div className="absolute w-4 h-4 bg-orange-400 rounded-full -left-[9px] top-1 border-2 border-white"></div>
                                        <h4 className="font-bold text-slate-800">5. Observations & Thermogrammes</h4>
                                        <p className="text-sm text-slate-600">Fiche jumelée (Photo Visible + IR). Saisie du niveau de qualification (0-4) et confiance.</p>
                                    </div>
                                    <div className="relative pl-6">
                                        <div className="absolute w-4 h-4 bg-red-500 rounded-full -left-[9px] top-1 border-2 border-white shadow-[0_0_0_4px_rgba(239,68,68,0.2)]"></div>
                                        <h4 className="font-bold text-slate-800">6. Validation & Export MSO</h4>
                                        <p className="text-sm text-slate-600">Moteur de validation stricte (mots interdits, T°). Injection "NON OPPOSABLE". Export Word.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'explorer' && (
                    <section className="fade-in block">
                        <div className="mb-8">
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Explorateur de Catégories JSON</h2>
                            <p className="mt-2 text-lg text-slate-600">Explorez les configurations JSON spécifiques requises pour chaque type d'expertise thermographique. Cliquez sur une catégorie à gauche pour afficher ses règles métiers et champs d'état associés.</p>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-6 h-[70vh] min-h-[600px]">
                            <div className="w-full lg:w-1/3 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50">
                                    <h3 className="font-bold text-slate-800">Sous-catégories</h3>
                                </div>
                                <div className="overflow-y-auto flex-grow p-2 space-y-1">
                                    {THERMO_DATA.categories.map(cat => (
                                        <button key={cat.id} onClick={() => setSelectedCatId(cat.id)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all focus:outline-none group ${selectedCatId === cat.id ? 'bg-orange-50 border-orange-300 shadow-sm' : 'border-transparent hover:bg-orange-50 hover:border-orange-200'}`}>
                                            <div className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mb-1 group-hover:text-orange-700">{cat.domain}</div>
                                            <div className="font-semibold text-slate-700 text-sm group-hover:text-slate-900">{cat.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="w-full lg:w-2/3 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
                                {!activeCategory ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50 z-10">
                                        <div className="text-center">
                                            <span className="text-4xl block mb-2">&#128072;</span>
                                            <p>Sélectionnez une catégorie pour voir les détails</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="overflow-y-auto p-6 lg:p-8 fade-in" key={activeCategory.id}>
                                        <div className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold mb-4 uppercase tracking-wider font-mono border border-slate-200">{activeCategory.id}</div>
                                        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">{activeCategory.label}</h2>
                                        
                                        <div className="mb-8 bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                                            <h3 className="text-sm font-bold text-blue-900 mb-2 uppercase tracking-wider flex items-center gap-2"><span>&#127919;</span> Objectif métier</h3>
                                            <p className="text-slate-700 leading-relaxed">{activeCategory.objectif}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2 border-b border-red-100 pb-2"><span>&#9888;</span> Conditions Critiques</h3>
                                                <ul className="space-y-2">
                                                    {activeCategory.conditions.map((c, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="text-red-500 mt-0.5">&#10003;</span> <span>{c}</span></li>
                                                    ))}
                                                </ul>
                                                <h3 className="text-sm font-bold text-orange-700 mb-3 mt-8 flex items-center gap-2 border-b border-orange-100 pb-2"><span>&#9881;</span> Limites Spécifiques</h3>
                                                <ul className="space-y-2">
                                                    {activeCategory.limites.map((l, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="text-orange-400 mt-0.5">&#8226;</span> <span>{l}</span></li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Protocole Auto-sélectionné</h3>
                                                <div className="font-mono text-xs bg-slate-900 text-green-400 p-3 rounded-lg mb-8 overflow-x-auto shadow-inner border border-slate-700">
                                                    report.protocoles.<span className="font-bold text-white">{activeCategory.protocole}</span> = true;
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Champs d'état requis (State)</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {activeCategory.champs.map((c, i) => (
                                                        <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-mono border border-slate-200">{c}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'validation' && (
                    <section className="fade-in block">
                        <div className="mb-8">
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Moteur de Validation & Règles</h2>
                            <p className="mt-2 text-lg text-slate-600">Consultez les règles métier strictes assurant la conformité légale et technique des rapports. Ces tableaux guident le développement des alertes UI et du contrôle qualité avant export.</p>
                        </div>
                        <div className="space-y-8">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-800">Conditions minimales de validité (Check Étape 6)</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
                                            <tr><th className="px-6 py-4 font-semibold">Critère</th><th className="px-6 py-4 font-semibold">Domaine</th><th className="px-6 py-4 font-semibold">Condition attendue</th><th className="px-6 py-4 font-semibold">Risque métier</th><th className="px-6 py-4 font-semibold text-right">Action UI Requise</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {THERMO_DATA.conditions.map((c, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-800">{c.crit}</td>
                                                    <td className="px-6 py-4 text-slate-600">{c.dom}</td>
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-800 bg-slate-50 border-r border-l border-white">{c.cond}</td>
                                                    <td className="px-6 py-4 text-slate-600">{c.rsq}</td>
                                                    <td className="px-6 py-4 text-right"><span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold whitespace-nowrap">{c.act}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                                    <h3 className="text-lg font-bold text-slate-800">Niveaux de qualification des anomalies (0 à 4)</h3>
                                    <p className="text-xs text-slate-500 mt-1">À implémenter dans les sélecteurs de la fiche Thermogramme.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
                                            <tr><th className="px-6 py-4 font-semibold w-16">Niv.</th><th className="px-6 py-4 font-semibold">Définition métier</th><th className="px-6 py-4 font-semibold text-green-700">Formulation Autorisée (Safe)</th><th className="px-6 py-4 font-semibold text-red-600">Interdits Absolus</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {THERMO_DATA.levels.map((l, i) => (
                                                <tr key={i} className={`${l.class} transition-colors border-b border-white`}>
                                                    <td className="px-6 py-4 font-black text-slate-800 text-center text-lg">{l.niv}</td>
                                                    <td className="px-6 py-4 font-medium text-slate-800">{l.def}</td>
                                                    <td className="px-6 py-4 text-green-700 italic text-sm">"{l.auth}"</td>
                                                    <td className="px-6 py-4 text-red-600 font-bold text-xs uppercase tracking-wide">{l.inter}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'templates' && (
                    <section className="fade-in block">
                        <div className="mb-8">
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Modèles HTML & Textes de Protocoles</h2>
                            <p className="mt-2 text-lg text-slate-600">Blocs de code et textes professionnels prêts à être intégrés dans les fonctions de génération Word (MSO). Ils intègrent la mention obligatoire de non-opposabilité.</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-800 mb-4">Textes des Protocoles</h3>
                                <div className="space-y-3">
                                    {THERMO_DATA.protocols.map((p, i) => (
                                        <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                            <button onClick={() => toggleProtocol(i)} className="w-full px-5 py-4 text-left font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 flex justify-between items-center transition-colors focus:outline-none">
                                                <span className="flex items-center gap-2"><span className="font-mono text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded border">report.protocoles.{p.id}</span> {p.label}</span>
                                                <span className={`text-slate-400 transition-transform duration-200 ${expandedProtocols[i] ? 'rotate-180' : ''}`}>&#9660;</span>
                                            </button>
                                            {expandedProtocols[i] && (
                                                <div className="px-5 py-4 text-sm text-slate-700 leading-relaxed border-t border-slate-100 bg-white fade-in">
                                                    {p.text}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-800 mb-4">Blocs HTML Compatibles Word/MSO</h3>
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-800 text-slate-200 px-4 py-2 flex justify-between items-center">
                                        <span className="font-mono text-sm font-bold">Mention Légale Obligatoire</span>
                                        <span className="text-xs bg-slate-700 px-2 py-1 rounded text-orange-300">Critique</span>
                                    </div>
                                    <div className="p-4 bg-slate-900 overflow-x-auto text-sm">
                                        <pre><code className="text-slate-300 font-mono">
<span className="text-blue-400">&lt;div</span> <span className="text-green-300">style</span>=<span className="text-yellow-300">"border: 2px solid #ea580c; background-color: #fff7ed; padding: 15pt; page-break-inside: avoid;"</span><span className="text-blue-400">&gt;</span>{'\n'}
    <span className="text-blue-400">&lt;h3</span> <span className="text-green-300">style</span>=<span className="text-yellow-300">"color: #ea580c; font-size: 11pt;"</span><span className="text-blue-400">&gt;</span>Limites de Mission<span className="text-blue-400">&lt;/h3&gt;</span>{'\n'}
    <span className="text-blue-400">&lt;p</span> <span className="text-green-300">style</span>=<span className="text-yellow-300">"font-weight: bold; text-align: center;"</span><span className="text-blue-400">&gt;</span>DOCUMENT TECHNIQUE NON OPPOSABLE<span className="text-blue-400">&lt;/p&gt;</span>{'\n'}
    <span className="text-blue-400">&lt;p&gt;</span>Le présent document constitue un rapport technique d’observation... Il ne constitue ni une expertise judiciaire, ni un diagnostic réglementaire...<span className="text-blue-400">&lt;/p&gt;</span>{'\n'}
<span className="text-blue-400">&lt;/div&gt;</span>
                                        </code></pre>
                                    </div>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-800 text-slate-200 px-4 py-2 flex justify-between items-center">
                                        <span className="font-mono text-sm font-bold">Fiche Thermogramme (Boucle)</span>
                                        <span className="text-xs bg-slate-700 px-2 py-1 rounded">HTML/MSO</span>
                                    </div>
                                    <div className="p-4 bg-slate-900 overflow-x-auto text-sm max-h-[400px]">
                                        <pre><code className="text-slate-300 font-mono">
<span className="text-blue-400">&lt;div</span> <span className="text-green-300">style</span>=<span className="text-yellow-300">"page-break-inside: avoid; border: 1px solid #ccc; padding: 10pt;"</span><span className="text-blue-400">&gt;</span>{'\n'}
    <span className="text-blue-400">&lt;h3&gt;</span>Zone : {'{{piece_zone}}'}<span className="text-blue-400">&lt;/h3&gt;</span>{'\n'}
    <span className="text-blue-400">&lt;table</span> <span className="text-green-300">style</span>=<span className="text-yellow-300">"width: 100%; border: none;"</span><span className="text-blue-400">&gt;</span>{'\n'}
        <span className="text-blue-400">&lt;tr&gt;</span>{'\n'}
            <span className="text-blue-400">&lt;td</span> <span className="text-green-300">style</span>=<span className="text-yellow-300">"width: 50%; text-align: center;"</span><span className="text-blue-400">&gt;</span>{'\n'}
                <span className="text-slate-500">&lt;!-- Photo Visible --&gt;</span>{'\n'}
                <span className="text-blue-400">&lt;img</span> <span className="text-green-300">src</span>=<span className="text-yellow-300">"{'{{photo_visible}}'}"</span> <span className="text-green-300">style</span>=<span className="text-yellow-300">"max-height: 250px;"</span> <span className="text-blue-400">/&gt;</span>{'\n'}
            <span className="text-blue-400">&lt;/td&gt;</span>{'\n'}
            <span className="text-blue-400">&lt;td</span> <span className="text-green-300">style</span>=<span className="text-yellow-300">"width: 50%; text-align: center;"</span><span className="text-blue-400">&gt;</span>{'\n'}
                <span className="text-slate-500">&lt;!-- Thermogramme --&gt;</span>{'\n'}
                <span className="text-blue-400">&lt;img</span> <span className="text-green-300">src</span>=<span className="text-yellow-300">"{'{{photo_ir}}'}"</span> <span className="text-green-300">style</span>=<span className="text-yellow-300">"max-height: 250px;"</span> <span className="text-blue-400">/&gt;</span>{'\n'}
            <span className="text-blue-400">&lt;/td&gt;</span>{'\n'}
        <span className="text-blue-400">&lt;/tr&gt;</span>{'\n'}
    <span className="text-blue-400">&lt;/table&gt;</span>{'\n'}
    {'\n'}
    <span className="text-blue-400">&lt;div</span> <span className="text-green-300">style</span>=<span className="text-yellow-300">"background-color: #fff; padding: 8pt; border: 1px solid #eee;"</span><span className="text-blue-400">&gt;</span>{'\n'}
        <span className="text-blue-400">&lt;p&gt;</span><span className="text-blue-400">&lt;b&gt;</span>Constat visuel :<span className="text-blue-400">&lt;/b&gt;</span> {'{{observations}}'}<span className="text-blue-400">&lt;/p&gt;</span>{'\n'}
    <span className="text-blue-400">&lt;/div&gt;</span>{'\n'}
    <span className="text-slate-500">&lt;!-- Si limites_interpretation --&gt;</span>{'\n'}
    <span className="text-blue-400">&lt;div</span> <span className="text-green-300">style</span>=<span className="text-yellow-300">"color: #c2410c; font-style: italic;"</span><span className="text-blue-400">&gt;</span>{'\n'}
        <span className="text-blue-400">&lt;b&gt;</span>Limites :<span className="text-blue-400">&lt;/b&gt;</span> {'{{limites_interpretation}}'}{'\n'}
    <span className="text-blue-400">&lt;/div&gt;</span>{'\n'}
<span className="text-blue-400">&lt;/div&gt;</span>
                                        </code></pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

// --- GÉNÉRATION DOCX ---
const buildWordDocumentHtml = (report) => {
    const escapeHtml = (s = '') => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

    let protocoleHtml = Object.keys(report.protocoles)
        .filter(key => report.protocoles[key])
        .map(key => PROTOCOL_TEXTS[key] || '')
        .join('\n');

    const thermogrammesHtml = report.thermogrammes.map((t, index) => `
        <div style="margin: 20pt 0; border: 1px solid #d1d5db; padding: 10pt; page-break-inside: avoid; background-color: #f9fafb;">
            <h3 style="margin-top:0; font-size: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 5pt;">Observation #${index + 1} : ${escapeHtml(t.piece)} / ${escapeHtml(t.surface)}</h3>
            <table style="width: 100%; border: none; margin-bottom: 10pt;">
                <tr>
                    <td style="width: 50%; border: none; text-align: center; padding: 5pt;">
                        <p style="font-size: 9pt; color: #555; margin:0 0 5pt 0;">Image Visible</p>
                        ${t.photo_visible ? `<img src="${t.photo_visible.src}" alt="Visible" width="250" style="max-width: 100%; max-height: 250px; border: 1px solid #999;" />` : `<div style="border:1px dashed #ccc; padding:20px; color:#999;">Non fournie</div>`}
                    </td>
                    <td style="width: 50%; border: none; text-align: center; padding: 5pt;">
                        <p style="font-size: 9pt; color: #555; margin:0 0 5pt 0;">Thermogramme Infrarouge</p>
                        ${t.photo_ir ? `<img src="${t.photo_ir.src}" alt="IR" width="250" style="max-width: 100%; max-height: 250px; border: 1px solid #999;" />` : `<div style="border:1px dashed #ccc; padding:20px; color:#999;">Non fourni</div>`}
                    </td>
                </tr>
            </table>
            <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 10pt;">
                <tr>
                    <td style="border: 1px solid #ccc; padding: 4pt; background-color: #eee;"><b>Niveau de qualification :</b> ${escapeHtml(t.niveau_qualification)}</td>
                    <td style="border: 1px solid #ccc; padding: 4pt;"><b>Confiance :</b> ${escapeHtml(t.niveau_confiance)}</td>
                    <td style="border: 1px solid #ccc; padding: 4pt;"><b>Émissivité :</b> ${escapeHtml(t.emissivite_locale)}</td>
                </tr>
            </table>
            <div style="background-color: #fff; padding: 8pt; border: 1px solid #eee;">
                <p style="font-size: 10.5pt; font-weight: bold; margin:0 0 4pt 0;">Constat visuel et analyse :</p>
                <p style="font-size: 10pt; margin: 0; text-align: justify; white-space: pre-wrap;">${escapeHtml(t.observations)}</p>
            </div>
            ${t.limites_interpretation ? `
            <div style="margin-top: 8pt; font-size: 9.5pt; color: #c2410c; font-style: italic;">
                <b>Limites de l'observation :</b> ${escapeHtml(t.limites_interpretation)}
            </div>` : ''}
        </div>
    `).join('');

    const cond = report.conditions_mesure || {};
    const mat = report.materiel_thermique || {};
    
    return `
    <!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="fr">
    <head><meta charset="utf-8">
    <title>${escapeHtml(report.titre)}</title>
    <style>
        @page WordSection1 { size: A4; margin: 2.5cm 2cm 2.5cm 2cm; mso-header-margin: 1.25cm; mso-footer-margin: 1.25cm; mso-header: h1; mso-footer: f1; }
        div.WordSection1 { page: WordSection1; }
        body { font-family: Calibri, sans-serif; font-size: 11pt; color: #333; }
        h1, h2, h3 { color: #222; }
        h1 { font-size: 20pt; }
        h2 { font-size: 16pt; margin: 24pt 0 12pt 0; border-bottom: 1px solid #ccc; padding-bottom: 4pt; page-break-after: avoid; mso-outline-level: 1; }
        h3 { font-size: 12pt; margin: 12pt 0 6pt 0; page-break-after: avoid; mso-outline-level: 2; }
        table { border-collapse: collapse; width: 100%; font-size: 10.5pt; margin-bottom: 12pt; }
        td { border: 1pt solid #e5e7eb; padding: 6pt; vertical-align: top; }
        td:first-child { font-weight: bold; width: 35%; background-color: #f9fafb; }
        p { margin: 0 0 10pt 0; line-height: 1.4; }
        p.MsoHeader, p.MsoFooter { margin: 0; padding: 0; border: none; }
        p.MsoToc1, li.MsoToc1, div.MsoToc1 { margin-bottom: 5pt; }
    </style></head>
    <body>
        <div class="WordSection1">
            <div style="border: 2px solid #ea580c; background-color: #fff7ed; padding: 15pt; margin-bottom: 30pt; page-break-inside: avoid;">
                <h3 style="color: #ea580c; font-size: 11pt; margin-top:0; text-transform: uppercase;">Mention Légale et Limites de Mission</h3>
                <p style="font-weight: bold; font-size: 10.5pt; text-align: center; color: #ea580c;">DOCUMENT TECHNIQUE NON OPPOSABLE</p>
                <p style="font-size: 10pt; text-align: justify; margin-bottom:0; color: #9a3412;">
                    Le présent document constitue un rapport technique d’observation thermographique. Il est établi à partir des conditions de mesure constatées au moment de l’intervention, des informations transmises par le donneur d’ordre et des thermogrammes exploitables. Il ne constitue ni une expertise judiciaire, ni un diagnostic réglementaire, ni une preuve opposable aux tiers. Les constats formulés sont non opposables et doivent, le cas échéant, être confirmés par des investigations complémentaires adaptées.
                </p>
            </div>

            <h1>${escapeHtml(report.titre || "Rapport d'expertise")}</h1>
            <p><b>Référence dossier :</b> ${escapeHtml(report.reference_dossier)}</p>
            
            <br style="page-break-before:always;"/>
            <h2>Sommaire</h2>
            <p class="MsoToc1"><span style="mso-element:field-begin"></span><span style="mso-spacerun:yes"> </span>TOC \\o "1-3" \\h \\z \\u<span style="mso-element:field-separator"></span></p>
            <p class="MsoToc1"><span style="mso-element:field-end"></span></p>

            <br style="page-break-before:always;"/>
            <h2>1. Informations générales</h2>
            <table>
                <tr><td>Type de rapport</td><td>${escapeHtml(report.categorie)} - ${escapeHtml(report.sous_categorie)}</td></tr>
                <tr><td>Propriétaire</td><td>${escapeHtml(report.proprietaire)}</td></tr>
                <tr><td>Adresse du bien</td><td>${escapeHtml(report.adresse_logement)}</td></tr>
                <tr><td>Date de visite</td><td>${formatDate(report.date_visite)}</td></tr>
                <tr><td>Intervenant</td><td>${escapeHtml(report.intervenant)}</td></tr>
            </table>

            <h3>Conditions de mesure et environnement</h3>
            <table>
                <tr><td>Température Int. / Ext.</td><td>${escapeHtml(cond.temperature_interieure_c)}°C / ${escapeHtml(cond.temperature_exterieure_c)}°C (Écart : ${escapeHtml(cond.ecart_temperature_c)}°C)</td></tr>
                <tr><td>Humidité Int. / Ext.</td><td>${escapeHtml(cond.humidite_interieure_pct)}% / ${escapeHtml(cond.humidite_exterieure_pct)}%</td></tr>
                <tr><td>Météo / Ciel</td><td>${escapeHtml(cond.ciel)} (Vent: ${escapeHtml(cond.vent_kmh)} km/h)</td></tr>
                <tr><td>Pluie / Brouillard / Soleil</td><td>Pluie: ${cond.pluie_recente ? 'Oui' : 'Non'} - Brouillard: ${cond.brouillard ? 'Oui' : 'Non'} - Soleil direct: ${cond.ensoleillement_direct ? 'Oui' : 'Non'}</td></tr>
                <tr><td>Bâtiment chauffé > 24h</td><td>${cond.batiment_chauffe_24h ? 'Oui' : 'Non'}</td></tr>
            </table>

            <h3>Matériel Thermographique</h3>
            <table>
                <tr><td>Caméra utilisée</td><td>${escapeHtml(mat.camera_utilisee)} (Résolution: ${escapeHtml(mat.resolution_capteur)}, NETD: ${escapeHtml(mat.netd)})</td></tr>
                <tr><td>Émissivité moyenne réglée</td><td>${escapeHtml(mat.emissivite_moyenne)}</td></tr>
                <tr><td>Température réfléchie</td><td>${escapeHtml(mat.temperature_reflechie_c)}°C</td></tr>
            </table>

            <br style="page-break-before:always;"/>
            <h2>2. Protocoles de recherche et méthodes</h2>
            ${protocoleHtml}

            <br style="page-break-before:always;"/>
            <h2>3. Observations thermographiques</h2>
            ${thermogrammesHtml || "<p>Aucun thermogramme n'a été enregistré.</p>"}

            <br style="page-break-before:always;"/>
            <h2>4. Analyse et recommandations</h2>
            <h3>Analyse globale de l’expert</h3>
            <p style="white-space:pre-wrap;">${escapeHtml(report.analyse_expert) || "Aucune analyse globale fournie."}</p>
            <h3>Recommandations et actions à mener</h3>
            <p style="white-space:pre-wrap;">${escapeHtml(report.recommandations) || "Aucune recommandation formulée."}</p>

            <br style="page-break-before:always;"/>
            <h2>5. Signatures</h2>
            <div style="border: 2px solid #ea580c; background-color: #fff7ed; padding: 10pt; margin-bottom: 20pt; page-break-inside: avoid;">
                <p style="font-weight: bold; font-size: 10pt; text-align: center; color: #ea580c; margin:0;">RAPPEL : DOCUMENT TECHNIQUE NON OPPOSABLE AUX TIERS</p>
            </div>
            <p>Fait à ${escapeHtml((report.adresse_logement.split(',').pop() || 'N/A').trim())}, le ${formatDate(new Date().toISOString())}</p>
            <p><b>Signataire (Expert) :</b> ${escapeHtml(report.nom_signataire || '')}</p>
            ${report.signature ? `<img src="${report.signature}" alt="Signature" style="width: 200px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">` : ""}
        </div>

        <div style='mso-element:header' id='h1'>
            <p class='MsoHeader'>
                <table style='width:100%; border:none; border-collapse:collapse;'>
                    <tr>
                        <td style='border:none; font-size:12pt; font-weight:bold; color:#333;'>AVEREO</td>
                        <td style='border:none; text-align:right; font-size:9pt; color:#555;'>Rapport d'expertise Thermographique</td>
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
                        <td style='border:none; text-align:left; font-weight:bold; color:#ea580c;'>DOC. NON OPPOSABLE</td>
                        <td style='border:none; text-align:center;'>Réf: ${escapeHtml(report.reference_dossier)}</td>
                        <td style='border:none; text-align:right;'>Page <span style='mso-field-code:"PAGE"'></span> sur <span style='mso-field-code:"NUMPAGES"'></span></td>
                    </tr>
                </table>
            </p>
        </div>
    </body></html>`;
};

// --- COMPOSANTS UI WIZARD ---
const Card = ({ children, title }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 w-full mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">{title}</h2>
        {children}
    </div>
);

const InputField = React.memo(({ label, name, ...props }) => (
    <div className="mb-4 w-full">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input id={name} name={name} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" {...props} />
    </div>
));

const SelectField = React.memo(({ label, name, options, ...props }) => (
     <div className="mb-4 w-full">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select id={name} name={name} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white" {...props}>
            <option value="" disabled>Sélectionner...</option>
            {options.map(option => <option key={option.value || option} value={option.value || option}>{option.label || option}</option>)}
        </select>
    </div>
));

const Header = ({ onGoHome, onOpenReferentiel }) => {
    return (
        <header className="bg-white shadow-sm w-full p-4 mb-6 sticky top-0 z-20">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-gray-800">AVEREO</h1>
                    <p className="text-sm text-gray-500 text-orange-600 font-semibold">Expertise Thermographique</p>
                </div>
                <div className="flex items-center gap-3">
                    {onOpenReferentiel && (
                        <button onClick={onOpenReferentiel} className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-md hover:bg-orange-100 transition shadow-sm text-sm font-semibold">
                            <BookOpen size={16}/> <span className="hidden sm:inline">Référentiel</span>
                        </button>
                    )}
                    {onGoHome && (
                        <button onClick={onGoHome} className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200 transition shadow-sm text-sm font-semibold">
                            <Home size={16}/> <span className="hidden sm:inline">Accueil</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

// --- ÉTAPES ---

const Step1_ReportType = ({ data, setData }) => (
    <Card title="Étape 1 : Type de rapport">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(SUB_CATEGORIES).map(type => (
                <button
                    key={type} onClick={() => setData({ ...data, categorie: type, sous_categorie: '' })}
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
        const sc = (data.sous_categorie || '').toLowerCase();
        let p = { is_standard: true, is_thermo_batiment_enveloppe: false, is_thermo_humidite: false, is_thermo_reseaux: false, is_thermo_photovoltaique: false, is_thermo_electrique: false, is_thermo_drone: false };
        
        if (sc.includes('enveloppe') || sc.includes('pont thermique') || sc.includes('air') || sc.includes('isolation') || sc.includes('thermographique')) p.is_thermo_batiment_enveloppe = true;
        if (sc.includes('humidité') || sc.includes('toiture terrasse') || sc.includes('infiltration')) p.is_thermo_humidite = true;
        if (sc.includes('réseau') || sc.includes('chauffage') || sc.includes('plancher')) p.is_thermo_reseaux = true;
        if (sc.includes('photovoltaïque') || sc.includes('solaire')) p.is_thermo_photovoltaique = true;
        if (sc.includes('électrique') || sc.includes('électricité') || sc.includes('tgbt')) p.is_thermo_electrique = true;
        if (sc.includes('drone') || sc.includes('aérien')) p.is_thermo_drone = true;
        
        setData(prev => ({ ...prev, protocoles: p }));
    }, [data.sous_categorie, setData]);

    return (
        <Card title="Étape 2 : Sous-catégorie">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.map(sub => (
                    <button key={sub} onClick={() => setData({ ...data, sous_categorie: sub })} className={`p-4 rounded-lg text-left font-semibold transition-all duration-200 border-2 ${data.sous_categorie === sub ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 hover:border-blue-400'}`}>
                        {sub}
                    </button>
                ))}
            </div>
        </Card>
    );
};

const Step3_ClientInfo = ({ data, setData }) => {
    const updateField = (section, field, value) => {
        setData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    };

    useEffect(() => {
        const tInt = parseFloat(data.conditions_mesure.temperature_interieure_c);
        const tExt = parseFloat(data.conditions_mesure.temperature_exterieure_c);
        if (!isNaN(tInt) && !isNaN(tExt)) {
            updateField('conditions_mesure', 'ecart_temperature_c', Math.abs(tInt - tExt).toFixed(1));
        }
    }, [data.conditions_mesure.temperature_interieure_c, data.conditions_mesure.temperature_exterieure_c]);

    return (
        <>
            <Card title="Informations Client & Dossier">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <InputField label="Nom du propriétaire" value={data.proprietaire} onChange={e => setData({...data, proprietaire: e.target.value})} placeholder="Jean Dupont" />
                    <InputField label="Adresse du logement" value={data.adresse_logement} onChange={e => setData({...data, adresse_logement: e.target.value})} />
                    <InputField label="Référence dossier" value={data.reference_dossier} onChange={e => setData({...data, reference_dossier: e.target.value})} />
                    <InputField label="Date de la visite" type="date" value={data.date_visite} onChange={e => setData({...data, date_visite: e.target.value})} />
                    <InputField label="Intervenant" value={data.intervenant} onChange={e => setData({...data, intervenant: e.target.value})} />
                </div>
            </Card>

            <Card title="Conditions de Mesure Thermographique">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InputField label="Temp. Intérieure (°C)" type="number" value={data.conditions_mesure.temperature_interieure_c} onChange={e => updateField('conditions_mesure', 'temperature_interieure_c', e.target.value)} />
                    <InputField label="Temp. Extérieure (°C)" type="number" value={data.conditions_mesure.temperature_exterieure_c} onChange={e => updateField('conditions_mesure', 'temperature_exterieure_c', e.target.value)} />
                    <InputField label="Écart T° calculé (°C)" type="number" value={data.conditions_mesure.ecart_temperature_c} disabled className="bg-gray-100 font-bold" />
                    <InputField label="Humidité Int. (%)" type="number" value={data.conditions_mesure.humidite_interieure_pct} onChange={e => updateField('conditions_mesure', 'humidite_interieure_pct', e.target.value)} />
                    <InputField label="Humidité Ext. (%)" type="number" value={data.conditions_mesure.humidite_exterieure_pct} onChange={e => updateField('conditions_mesure', 'humidite_exterieure_pct', e.target.value)} />
                    <InputField label="Vent (km/h)" type="number" value={data.conditions_mesure.vent_kmh} onChange={e => updateField('conditions_mesure', 'vent_kmh', e.target.value)} />
                    <SelectField label="Ciel" options={["Dégagé", "Peu nuageux", "Couvert", "Variable"]} value={data.conditions_mesure.ciel} onChange={e => updateField('conditions_mesure', 'ciel', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-gray-50 p-4 rounded-md border">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={data.conditions_mesure.pluie_recente} onChange={e => updateField('conditions_mesure', 'pluie_recente', e.target.checked)} className="rounded" /> Pluie récente (&lt; 48h)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={data.conditions_mesure.brouillard} onChange={e => updateField('conditions_mesure', 'brouillard', e.target.checked)} className="rounded" /> Brouillard
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={data.conditions_mesure.ensoleillement_direct} onChange={e => updateField('conditions_mesure', 'ensoleillement_direct', e.target.checked)} className="rounded" /> Ensoleillement direct
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer font-semibold">
                        <input type="checkbox" checked={data.conditions_mesure.batiment_chauffe_24h} onChange={e => updateField('conditions_mesure', 'batiment_chauffe_24h', e.target.checked)} className="rounded text-blue-600" /> Bâtiment chauffé &gt; 24h
                    </label>
                </div>
            </Card>

            <Card title="Matériel Thermographique">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Caméra utilisée" placeholder="Ex: FLIR E8, DJI Mavic 3T" value={data.materiel_thermique.camera_utilisee} onChange={e => updateField('materiel_thermique', 'camera_utilisee', e.target.value)} />
                    <InputField label="Résolution capteur" placeholder="Ex: 320x240" value={data.materiel_thermique.resolution_capteur} onChange={e => updateField('materiel_thermique', 'resolution_capteur', e.target.value)} />
                    <InputField label="Sensibilité (NETD)" placeholder="Ex: < 40 mK" value={data.materiel_thermique.netd} onChange={e => updateField('materiel_thermique', 'netd', e.target.value)} />
                    <InputField label="Émissivité moyenne" type="number" step="0.01" value={data.materiel_thermique.emissivite_moyenne} onChange={e => updateField('materiel_thermique', 'emissivite_moyenne', e.target.value)} />
                    <InputField label="Température réfléchie (°C)" type="number" value={data.materiel_thermique.temperature_reflechie_c} onChange={e => updateField('materiel_thermique', 'temperature_reflechie_c', e.target.value)} />
                </div>
            </Card>
        </>
    );
};

const ProtocolCheckbox = React.memo(({ label, checked, onChange }) => (
    <label className={`flex items-center p-3 rounded-md border transition-colors cursor-pointer ${checked ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'}`}>
        <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <span className="ml-3 text-sm text-gray-800">{label}</span>
    </label>
));

const Step4_Protocols = ({ data, setData }) => {
    const handleChange = (key) => (e) => setData(prev => ({ ...prev, protocoles: { ...prev.protocoles, [key]: e.target.checked } }));
    return (
        <Card title="Protocoles appliqués">
            <p className="text-sm text-gray-600 mb-4">Ces protocoles généreront les textes méthodologiques et juridiques dans le rapport.</p>
            <div className="space-y-3">
                <ProtocolCheckbox label="Standard – Visite et relevé photographique simple" checked={data.protocoles.is_standard} onChange={handleChange('is_standard')} />
                <ProtocolCheckbox label="Thermographie : Bâtiment - Enveloppe & Isolation" checked={data.protocoles.is_thermo_batiment_enveloppe} onChange={handleChange('is_thermo_batiment_enveloppe')} />
                <ProtocolCheckbox label="Thermographie : Humidité & Infiltrations" checked={data.protocoles.is_thermo_humidite} onChange={handleChange('is_thermo_humidite')} />
                <ProtocolCheckbox label="Thermographie : Réseaux & Planchers chauffants" checked={data.protocoles.is_thermo_reseaux} onChange={handleChange('is_thermo_reseaux')} />
                <ProtocolCheckbox label="Thermographie : Électricité" checked={data.protocoles.is_thermo_electrique} onChange={handleChange('is_thermo_electrique')} />
                <ProtocolCheckbox label="Thermographie : Photovoltaïque" checked={data.protocoles.is_thermo_photovoltaique} onChange={handleChange('is_thermo_photovoltaique')} />
                <ProtocolCheckbox label="Thermographie : Drone Aérien" checked={data.protocoles.is_thermo_drone} onChange={handleChange('is_thermo_drone')} />
            </div>
        </Card>
    );
};

const Step5_Analysis = ({ data, setData }) => {
    const [cameraState, setCameraState] = useState({ open: false, thermoId: null, slotType: null }); 

    const handleAdd = () => {
        setData(prev => ({ ...prev, thermogrammes: [...prev.thermogrammes, { id: crypto.randomUUID(), piece: '', surface: '', photo_visible: null, photo_ir: null, emissivite_locale: prev.materiel_thermique.emissivite_moyenne, observations: '', niveau_qualification: '0', niveau_confiance: 'Élevé', limites_interpretation: '' }] }));
    };

    const handleRemove = (id) => setData(prev => ({ ...prev, thermogrammes: prev.thermogrammes.filter(t => t.id !== id) }));
    
    const handleUpdate = (id, field, value) => setData(prev => ({ ...prev, thermogrammes: prev.thermogrammes.map(t => t.id === id ? { ...t, [field]: value } : t) }));

    const handleAppend = (id, field, text) => setData(prev => ({ ...prev, thermogrammes: prev.thermogrammes.map(t => t.id === id ? { ...t, [field]: (t[field] || '') + text } : t) }));

    const handlePhotoUpload = (e, id, slotType) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => handleUpdate(id, slotType, { src: event.target.result, horodatageISO: new Date().toISOString() });
        reader.readAsDataURL(file);
    };

    const handlePhotoShot = (photoObj) => {
        if (!cameraState.thermoId) return;
        handleUpdate(cameraState.thermoId, cameraState.slotType, photoObj);
    };

    useEffect(() => { if (data.thermogrammes.length === 0) handleAdd(); }, []);

    return (
        <div className="space-y-6">
            {data.thermogrammes.map((thermo, index) => (
                <Card key={thermo.id} title={`Fiche Thermogramme #${index + 1}`}>
                    <div className="flex justify-end -mt-10 mb-4">
                        <button onClick={() => handleRemove(thermo.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-full"><Trash2 size={16} /></button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <SelectField label="Zone / Pièce" value={thermo.piece} onChange={e => handleUpdate(thermo.id, 'piece', e.target.value)} options={PIECES_OPTIONS} />
                        <SelectField label="Élément de surface" value={thermo.surface} onChange={e => handleUpdate(thermo.id, 'surface', e.target.value)} options={SURFACES_OPTIONS} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-lg border">
                        {/* Photo Visible */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">Image Visible</label>
                            {thermo.photo_visible ? (
                                <div className="relative group aspect-video bg-black rounded-md overflow-hidden">
                                    <img src={thermo.photo_visible.src} alt="Visible" className="w-full h-full object-contain" />
                                    <button onClick={() => handleUpdate(thermo.id, 'photo_visible', null)} className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                                </div>
                            ) : (
                                <div className="flex gap-2 h-32">
                                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 text-gray-500 transition">
                                        <Upload size={20} /> <span className="text-xs mt-2">Importer Visible</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, thermo.id, 'photo_visible')} />
                                    </label>
                                    <button onClick={() => setCameraState({open: true, thermoId: thermo.id, slotType: 'photo_visible'})} className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md hover:bg-gray-100 text-gray-500 transition">
                                        <Camera size={20} /> <span className="text-xs mt-2">Prendre Photo</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Thermogramme */}
                        <div>
                            <label className="block text-sm font-semibold text-orange-700 mb-2 text-center">Thermogramme Infrarouge</label>
                            {thermo.photo_ir ? (
                                <div className="relative group aspect-video bg-black rounded-md overflow-hidden border-2 border-orange-200">
                                    <img src={thermo.photo_ir.src} alt="IR" className="w-full h-full object-contain" />
                                    <button onClick={() => handleUpdate(thermo.id, 'photo_ir', null)} className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                                </div>
                            ) : (
                                <div className="flex gap-2 h-32">
                                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-orange-300 bg-orange-50 rounded-md cursor-pointer hover:bg-orange-100 text-orange-600 transition">
                                        <Upload size={20} /> <span className="text-xs mt-2 text-center">Importer Infrarouge</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, thermo.id, 'photo_ir')} />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <SelectField label="Niv. de qualification" value={thermo.niveau_qualification} onChange={e => handleUpdate(thermo.id, 'niveau_qualification', e.target.value)} options={[
                            {value: '0', label: '0 - Aucune anomalie (Homogène)'},
                            {value: '1', label: '1 - Singularité mineure/explicable'},
                            {value: '2', label: '2 - Anomalie suspectée'},
                            {value: '3', label: '3 - Défaut probable à confirmer'},
                            {value: '4', label: '4 - Anomalie critique'},
                            {value: 'X', label: 'X - Non exploitable'}
                        ]} />
                        <SelectField label="Niveau de confiance" value={thermo.niveau_confiance} onChange={e => handleUpdate(thermo.id, 'niveau_confiance', e.target.value)} options={['Élevé', 'Moyen', 'Faible']} />
                        <InputField label="Émissivité locale" type="number" step="0.01" value={thermo.emissivite_locale} onChange={e => handleUpdate(thermo.id, 'emissivite_locale', e.target.value)} />
                    </div>

                    <div className="relative mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Constat visuel et analyse</label>
                        <textarea value={thermo.observations} onChange={e => handleUpdate(thermo.id, 'observations', e.target.value)} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md pr-12 focus:ring-blue-500" placeholder="Décrire l'image et l'anomalie..." />
                        <MicButton onFinalText={(txt) => handleAppend(thermo.id, 'observations', txt)} />
                    </div>

                    {(thermo.niveau_confiance === 'Faible' || thermo.niveau_confiance === 'Moyen' || thermo.limites_interpretation) && (
                        <div className="relative p-3 bg-orange-50 border border-orange-200 rounded-md">
                            <label className="block text-sm font-semibold text-orange-800 mb-1">Limites d'interprétation (Obligatoire si confiance Faible/Moyenne)</label>
                            <textarea value={thermo.limites_interpretation} onChange={e => handleUpdate(thermo.id, 'limites_interpretation', e.target.value)} rows="2" className="w-full px-3 py-2 border border-orange-300 rounded-md bg-white text-sm" placeholder="Ex: Reflets spéculaires importants, présence de vent..." />
                        </div>
                    )}
                </Card>
            ))}
            
            <button onClick={handleAdd} className="w-full py-3 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 font-semibold flex justify-center items-center gap-2">
                <PlusCircle size={18} /> Ajouter un thermogramme
            </button>

            <Card title="Analyse globale & Recommandations">
                <div className="relative mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Analyse globale de l'expert</label>
                    <textarea value={data.analyse_expert} onChange={e => setData({...data, analyse_expert: e.target.value})} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-md pr-12" />
                    <MicButton onFinalText={(txt) => setData(p => ({...p, analyse_expert: p.analyse_expert + txt}))} />
                </div>
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recommandations</label>
                    <textarea value={data.recommandations} onChange={e => setData({...data, recommandations: e.target.value})} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-md pr-12" />
                    <MicButton onFinalText={(txt) => setData(p => ({...p, recommandations: p.recommandations + txt}))} />
                </div>
            </Card>

            <CameraCaptureModal open={cameraState.open} onClose={() => setCameraState({open:false, thermoId:null, slotType:null})} onShot={handlePhotoShot} />
        </div>
    );
};

const validateReportData = (report) => {
    const errors = [];
    const warnings = [];
    
    // 1. Mots interdits
    const forbiddenWords = ['preuve', 'défaut certain', 'expertise judiciaire', 'diagnostic réglementaire', 'opposable', 'garantie absolue'];
    const textToCheck = [report.analyse_expert, report.recommandations, ...report.thermogrammes.map(t => t.observations)].join(' ').toLowerCase();
    
    forbiddenWords.forEach(word => {
        if (textToCheck.includes(word)) errors.push(`Mot interdit détecté : "${word}". Utilisez une formulation plus prudente.`);
    });

    // 2. Météo Bâtiment
    if (report.protocoles.is_thermo_batiment_enveloppe) {
        const tInt = parseFloat(report.conditions_mesure.temperature_interieure_c);
        const tExt = parseFloat(report.conditions_mesure.temperature_exterieure_c);
        if (!isNaN(tInt) && !isNaN(tExt) && Math.abs(tInt - tExt) < 10) {
            warnings.push("Le delta de température Int/Ext est < 10°C. L'analyse est potentiellement compromise.");
        }
        if (!report.conditions_mesure.batiment_chauffe_24h) {
            warnings.push("Le bâtiment n'est pas déclaré chauffé depuis 24h. Le régime thermique n'est peut-être pas stationnaire.");
        }
        if (report.conditions_mesure.ensoleillement_direct) {
            warnings.push("Ensoleillement direct coché : risque de masquage des défauts d'isolation par l'échauffement solaire.");
        }
    }

    // 3. Fiches thermogrammes
    report.thermogrammes.forEach((thermo, index) => {
        if (!thermo.photo_visible || !thermo.photo_ir) {
            errors.push(`Observation #${index + 1} : Image visible ET thermogramme infrarouge sont obligatoires.`);
        }
        if ((thermo.niveau_confiance === 'Faible' || thermo.niveau_confiance === 'Moyen') && !thermo.limites_interpretation.trim()) {
            errors.push(`Observation #${index + 1} : Une limite d'interprétation est obligatoire car la confiance est Faible ou Moyenne.`);
        }
        if (['2', '3', '4'].includes(thermo.niveau_qualification) && !report.recommandations.trim()) {
             warnings.push(`Observation #${index + 1} remonte une anomalie (Niveau ${thermo.niveau_qualification}), mais aucune recommandation globale n'a été formulée.`);
        }
    });

    if(!report.nom_signataire) errors.push("Le nom du signataire est requis.");

    return { isValid: errors.length === 0, errors, warnings };
};

const Step6_SignatureExport = ({ data, setData, onGenerateDocx, onPreview }) => {
    const [validation, setValidation] = useState({ isValid: true, errors: [], warnings: [] });
    const [showValidationModal, setShowValidationModal] = useState(false);

    const handlePreExport = () => {
        const res = validateReportData(data);
        setValidation(res);
        if (!res.isValid || res.warnings.length > 0) setShowValidationModal(true);
        else onGenerateDocx();
    };

    return (
        <Card title="Étape 6 : Validation, Signature & Export">
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-md mb-6">
                <p className="font-bold text-orange-800 uppercase text-sm mb-1">Rappel Légal</p>
                <p className="text-sm text-orange-700">Le rapport portera la mention automatique : <i>"DOCUMENT TECHNIQUE NON OPPOSABLE"</i>.</p>
            </div>

            <div className="mb-6">
                <InputField label="Nom du signataire (Expert)" value={data.nom_signataire} onChange={e => setData({...data, nom_signataire: e.target.value})} />
                <InputField label="Signature (Texte ou initiales valant signature num.)" value={data.signature} onChange={e => setData({...data, signature: e.target.value})} />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={onPreview} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300">
                    <Eye size={18} /> Visualiser
                </button>
                <button onClick={handlePreExport} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700">
                    <FileText size={18} /> Générer le Document Word
                </button>
            </div>

            {showValidationModal && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className={validation.isValid ? "text-yellow-500" : "text-red-600"} size={28} />
                            <h3 className="text-xl font-bold text-gray-800">{validation.isValid ? "Avertissements Métier" : "Rapport Non Conforme"}</h3>
                        </div>
                        
                        {!validation.isValid && (
                            <div className="mb-6">
                                <h4 className="font-semibold text-red-700 mb-2">Erreurs bloquantes :</h4>
                                <ul className="list-disc pl-5 text-sm text-red-600 space-y-1">
                                    {validation.errors.map((e,i) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                        )}

                        {validation.warnings.length > 0 && (
                            <div className="mb-6">
                                <h4 className="font-semibold text-yellow-700 mb-2">Avertissements (Non bloquants) :</h4>
                                <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
                                    {validation.warnings.map((w,i) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                            <button onClick={() => setShowValidationModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Corriger le rapport</button>
                            {validation.isValid && (
                                <button onClick={() => { setShowValidationModal(false); onGenerateDocx(); }} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">Ignorer et Générer</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};

// --- APP PRINCIPALE WIZARD ---
const ReportWizard = ({ initialData, onGoHome, onOpenReferentiel }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [reportData, setReportData] = useState(initialData);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => saveDraft(reportData), 1000);
        return () => clearTimeout(handler);
    }, [reportData]);

    const handleGenerateDocx = useCallback(() => {
        const html = buildWordDocumentHtml(reportData);
        const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
        saveAs(blob, `Rapport_Thermo_${reportData.reference_dossier || 'Nouveau'}.doc`);
    }, [reportData]);

    return (
        <div className="bg-gray-50 min-h-screen font-sans pb-28">
            <Header onGoHome={onGoHome} onOpenReferentiel={onOpenReferentiel} />

            <main className="max-w-4xl mx-auto p-4">
                <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-lg shadow-sm overflow-x-auto hide-scrollbar">
                    {["Type", "Catégorie", "Infos & Mesures", "Protocoles", "Thermogrammes", "Validation"].map((step, index) => (
                        <div key={index} className="flex flex-col items-center mx-2 shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${index + 1 <= currentStep ? 'bg-blue-600' : 'bg-gray-300'}`}>{index + 1}</div>
                            <p className="text-xs mt-1 text-gray-600">{step}</p>
                        </div>
                    ))}
                </div>

                {currentStep === 1 && <Step1_ReportType data={reportData} setData={setReportData} />}
                {currentStep === 2 && <Step2_SubCategory data={reportData} setData={setReportData} />}
                {currentStep === 3 && <Step3_ClientInfo data={reportData} setData={setReportData} />}
                {currentStep === 4 && <Step4_Protocols data={reportData} setData={setReportData} />}
                {currentStep === 5 && <Step5_Analysis data={reportData} setData={setReportData} />}
                {currentStep === 6 && <Step6_SignatureExport data={reportData} setData={setReportData} onGenerateDocx={handleGenerateDocx} onPreview={() => setIsPreviewVisible(true)} />}
            </main>

            <footer className="fixed bottom-0 left-0 w-full bg-white border-t p-4 shadow z-20">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <button onClick={() => {saveDraft(reportData); setToastMessage('Brouillon sauvé'); setTimeout(()=>setToastMessage(''),2000);}} className="px-4 py-2 text-sm bg-gray-200 rounded-md">Sauver</button>
                    <div className="flex gap-4">
                        {currentStep > 1 && <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-2 bg-white border rounded-md">Précédent</button>}
                        {currentStep < 6 && <button onClick={() => setCurrentStep(s => s + 1)} className="px-6 py-2 bg-blue-600 text-white rounded-md">Suivant</button>}
                    </div>
                </div>
            </footer>

            {isPreviewVisible && (
                <div className="fixed inset-0 bg-black/80 z-50 p-4 flex justify-center items-start overflow-auto">
                    <div className="relative w-full max-w-4xl bg-white min-h-[80vh] mt-10 rounded shadow-xl p-8">
                        <button onClick={() => setIsPreviewVisible(false)} className="absolute top-2 right-2 bg-gray-200 p-2 rounded-full hover:bg-red-500 hover:text-white"><X/></button>
                        <iframe srcDoc={buildWordDocumentHtml(reportData)} className="w-full h-[75vh] border-none" />
                    </div>
                </div>
            )}
            {toastMessage && <div className="fixed bottom-24 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg">{toastMessage}</div>}
        </div>
    );
};

// --- ETAT INITIAL ET POINT D'ENTREE ---
const initialReport = {
    categorie: 'Expertise Thermographique', sous_categorie: '', titre: "Rapport d'expertise Thermographique",
    proprietaire: '', email: '', adresse_logement: '', reference_dossier: '', date_visite: new Date().toISOString().split('T')[0], intervenant: '',
    conditions_mesure: { temperature_interieure_c: '', temperature_exterieure_c: '', ecart_temperature_c: '', humidite_interieure_pct: '', humidite_exterieure_pct: '', vent_kmh: '', ciel: '', pluie_recente: false, brouillard: false, ensoleillement_direct: false, batiment_chauffe_24h: true },
    materiel_thermique: { camera_utilisee: '', resolution_capteur: '', netd: '', plage_temperature: '', emissivite_moyenne: '0.95', temperature_reflechie_c: '' },
    donnees_specifiques: { autorisation_drone: false, production_photovoltaique: false, installation_sous_tension: false, charge_electrique_connue: '' },
    protocoles: { is_standard: true, is_thermo_batiment_enveloppe: false, is_thermo_humidite: false, is_thermo_reseaux: false, is_thermo_photovoltaique: false, is_thermo_electrique: false, is_thermo_drone: false },
    thermogrammes: [], analyse_expert: '', recommandations: '', nom_signataire: '', signature: ''
};

export default function App() {
    const [appState, setAppState] = useState('loading'); // 'loading', 'home', 'wizard', 'referentiel_fullscreen'
    const [initialWizardData, setInitialWizardData] = useState(initialReport);
    const [showReferentielOverlay, setShowReferentielOverlay] = useState(false);

    useEffect(() => {
        const checkDraft = async () => {
            const draft = await loadDraft();
            if(draft && draft.categorie) {
                // Ensure new fields exist if loading old draft
                draft.conditions_mesure = draft.conditions_mesure || initialReport.conditions_mesure;
                draft.materiel_thermique = draft.materiel_thermique || initialReport.materiel_thermique;
                draft.thermogrammes = draft.thermogrammes || [];
                setInitialWizardData(draft);
            }
            setAppState('home');
        };
        checkDraft();
    }, []);

    const startNew = async () => { await removeDraft(); setInitialWizardData(initialReport); setAppState('wizard'); };

    if (appState === 'loading') return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Chargement...</div>;
    
    if (appState === 'referentiel_fullscreen') {
        return <ThermoReferentiel onClose={() => setAppState('home')} />;
    }

    if (appState === 'home') {
        const draftExists = initialWizardData && initialWizardData.categorie && initialWizardData !== initialReport;
        
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
                <Header onOpenReferentiel={() => setAppState('referentiel_fullscreen')} />
                
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full text-center mt-12 border border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Bienvenue sur AVEREO</h2>
                    <p className="text-gray-600 mb-8">Créez vos rapports d'expertise professionnels simplement.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                        <button onClick={startNew} className="flex-1 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex justify-center items-center gap-2 transition shadow-sm">
                            <PlusCircle size={22}/> Nouveau Rapport
                        </button>
                        <button onClick={() => setAppState('wizard')} className="flex-1 py-4 bg-white border-2 border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 font-bold flex justify-center items-center gap-2 transition shadow-sm">
                            <Edit size={22}/> Reprendre le brouillon
                        </button>
                    </div>

                    <div className="border-t pt-8 mt-4">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Ressources & Documentation</h3>
                        <button onClick={() => setAppState('referentiel_fullscreen')} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-orange-50 border-2 border-orange-200 text-orange-700 rounded-lg font-semibold hover:bg-orange-100 transition shadow-sm text-lg">
                            <BookOpen size={22} /> Consulter le Référentiel Thermographique
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <ReportWizard 
                initialData={initialWizardData} 
                onGoHome={() => setAppState('home')} 
                onOpenReferentiel={() => setShowReferentielOverlay(true)} 
            />
            {showReferentielOverlay && (
                <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
                    <ThermoReferentiel onClose={() => setShowReferentielOverlay(false)} />
                </div>
            )}
        </>
    );
}
