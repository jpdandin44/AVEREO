import React, { useState, useEffect } from 'react';
import { 
  Plane, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Wind, 
  Map as MapIcon, 
  Shield, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Trash2, 
  Printer, 
  Plus, 
  X,
  Menu,
  ExternalLink,
  Battery,
  User
} from 'lucide-react';

// --- TYPES & DATA MODEL ---

type MissionStatus = 'DRAFT' | 'READY' | 'DONE' | 'ARCHIVED';

interface AirConstraints {
  ctr: boolean;
  zrt: boolean;
  p_r_d: boolean;
  rtba_voltac: boolean;
  natura2000: boolean;
  notam_checked: boolean;
  weather_checked: boolean;
  gnss_index: number; // 0-10
  comments: string;
}

interface GroundConstraints {
  agglomeration: boolean;
  private_land: boolean;
  public_space: boolean;
  people_presence: boolean;
  zet_secured: boolean; // Zone Exclusion Tiers
  obstacle_height: number;
  comments: string;
}

interface ScenarioData {
  category: 'OPEN' | 'SPECIFIC' | 'UNKNOWN';
  sub_category: 'A1' | 'A2' | 'A3' | 'STS-01' | 'STS-02' | '';
  drone_class: 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'LEGACY';
  max_height: number;
  max_distance: number;
  rth_height: number;
  comments: string;
}

interface OpsData {
  documents_ok: boolean;
  drone_inspection: boolean;
  authorizations_ok: boolean;
  insurance_ok: boolean;
  telemetry_check: boolean;
  controls_check: boolean; // Gaz, Roll, Pitch, Yaw
  flight_start?: string;
  flight_end?: string;
  incidents: string;
}

interface Mission {
  id: string;
  client: string;
  site_name: string;
  address: string;
  date: string;
  type: string; // Toiture, Thermographie, etc.
  status: MissionStatus;
  air: AirConstraints;
  ground: GroundConstraints;
  scenario: ScenarioData;
  ops: OpsData;
  createdAt: number;
}

// --- UTILS & INITIAL STATES ---

const initialMission: Mission = {
  id: '',
  client: '',
  site_name: '',
  address: '',
  date: new Date().toISOString().split('T')[0],
  type: 'Inspection Toiture',
  status: 'DRAFT',
  createdAt: Date.now(),
  air: {
    ctr: false, zrt: false, p_r_d: false, rtba_voltac: false, 
    natura2000: false, notam_checked: false, weather_checked: false, 
    gnss_index: 9, comments: ''
  },
  ground: {
    agglomeration: true, private_land: true, public_space: false,
    people_presence: false, zet_secured: false, obstacle_height: 10, comments: ''
  },
  scenario: {
    category: 'UNKNOWN', sub_category: '', drone_class: 'C5',
    max_height: 120, max_distance: 100, rth_height: 30, comments: ''
  },
  ops: {
    documents_ok: false, drone_inspection: false, authorizations_ok: false,
    insurance_ok: false, telemetry_check: false, controls_check: false, incidents: ''
  }
};

const EXTERNAL_LINKS = [
  { name: 'Géoportail', url: 'https://www.geoportail.gouv.fr/carte', icon: MapIcon },
  { name: 'Clearance', url: 'https://clearance.aero/', icon: Plane },
  { name: 'SIA', url: 'https://www.sia.aviation-civile.gouv.fr/', icon: FileText },
  { name: 'Météo (METAR)', url: 'https://metar-taf.com/', icon: Wind },
  { name: 'DroneKeeper', url: 'https://www.dronekeeper.com/', icon: Shield },
  { name: 'AlphaTango', url: 'https://alphatango.aviation-civile.gouv.fr/', icon: User },
];

// --- COMPONENTS ---

// 1. DASHBOARD COMPONENT
const Dashboard = ({ missions, onCreate, onEdit, onDelete }: any) => {
  const getStatusColor = (status: MissionStatus) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-600 border-gray-300';
      case 'READY': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'DONE': return 'bg-green-100 text-green-700 border-green-300';
      case 'ARCHIVED': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Missions AVEREO</h1>
          <p className="text-slate-500 mt-1">Gestion des opérations drone & conformité</p>
        </div>
        <button 
          onClick={onCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg shadow-lg transition-all"
        >
          <Plus size={20} /> Nouvelle Mission
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {missions.length === 0 && (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
            <Plane className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Aucune mission</h3>
            <p className="text-slate-500">Commencez par créer une nouvelle mission de vol.</p>
          </div>
        )}
        
        {missions.map((m: Mission) => (
          <div key={m.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden group">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(m.status)}`}>
                  {m.status === 'DRAFT' && 'BROUILLON'}
                  {m.status === 'READY' && 'PRÊT AU VOL'}
                  {m.status === 'DONE' && 'VOL RÉALISÉ'}
                  {m.status === 'ARCHIVED' && 'ARCHIVÉ'}
                </span>
                <span className="text-xs text-slate-400">{new Date(m.date).toLocaleDateString('fr-FR')}</span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                {m.client || 'Client Inconnu'}
              </h3>
              <p className="text-sm text-slate-600 flex items-center gap-1 mb-4">
                <MapPin size={14} /> {m.site_name || m.address || 'Lieu non défini'}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded">
                <div>Type: <span className="font-medium text-slate-700">{m.type}</span></div>
                <div>Scénario: <span className="font-medium text-slate-700">{m.scenario.sub_category || '-'}</span></div>
              </div>
            </div>
            
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center">
              <button onClick={() => onEdit(m)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                Ouvrir le dossier
              </button>
              <button onClick={() => onDelete(m.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. WIZARD / MISSION EDITOR
const MissionEditor = ({ mission: initialData, onSave, onCancel }: any) => {
  const [mission, setMission] = useState<Mission>(initialData);
  const [step, setStep] = useState(1);
  const [showLinks, setShowLinks] = useState(false);

  // Auto-calculate Scenario Status when constraints change
  useEffect(() => {
    let newCat: any = 'OPEN';
    let newSub: any = 'A3'; // Default safe

    // Simple Logic Logic (Simplified for Demo)
    if (mission.ground.agglomeration) {
      if (mission.scenario.drone_class === 'C5' || mission.scenario.drone_class === 'C6') {
         newCat = 'SPECIFIC';
         newSub = 'STS-01';
      } else if (parseInt(mission.scenario.drone_class?.replace('C', '') || '9') <= 1) {
         newCat = 'OPEN';
         newSub = 'A1';
      } else {
         newCat = 'SPECIFIC'; // Or Open A2 if C2 but kept simple here
         newSub = 'STS-XX';
      }
    }

    setMission(prev => ({
      ...prev,
      scenario: { ...prev.scenario, category: newCat, sub_category: newSub }
    }));
  }, [mission.ground.agglomeration, mission.scenario.drone_class, mission.air.ctr]);

  const handleChange = (section: keyof Mission, field: string, value: any) => {
    setMission(prev => ({
      ...prev,
      [section]: {
        ...prev[section] as any,
        [field]: value
      }
    }));
  };

  const updateRoot = (field: keyof Mission, value: any) => {
    setMission(prev => ({ ...prev, [field]: value }));
  };

  const calculateProgress = () => {
    let score = 0;
    if (mission.air.weather_checked && mission.air.notam_checked) score += 25;
    if (mission.ground.zet_secured) score += 25;
    if (mission.scenario.sub_category) score += 25;
    if (mission.ops.documents_ok && mission.ops.controls_check) score += 25;
    return score;
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* SIDEBAR TOOLS */}
      <div className={`${showLinks ? 'w-64' : 'w-16'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-2xl z-20`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
           {showLinks && <span className="font-bold tracking-wider text-sm">AVEREO TOOLS</span>}
           <button onClick={() => setShowLinks(!showLinks)} className="p-1 hover:bg-slate-800 rounded">
             <Menu size={20} />
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          {EXTERNAL_LINKS.map(link => (
            <a 
              key={link.name} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group"
              title={link.name}
            >
              <link.icon size={20} className="shrink-0" />
              {showLinks && <span className="text-sm font-medium">{link.name}</span>}
              {showLinks && <ExternalLink size={12} className="ml-auto opacity-0 group-hover:opacity-100" />}
            </a>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-700 bg-slate-900">
           <div className="flex flex-col items-center gap-2">
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${calculateProgress()}%` }}></div>
              </div>
              {showLinks && <span className="text-xs text-slate-400">Mission prête: {calculateProgress()}%</span>}
           </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm z-10">
          <div>
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               {mission.client ? mission.client : 'Nouvelle Mission'}
               <span className="text-slate-400 font-normal text-sm">| {mission.type}</span>
             </h2>
             <div className="text-xs text-slate-500 mt-0.5">{mission.date} - {mission.address}</div>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Fermer</button>
            <button onClick={() => onSave(mission)} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium">
              <Save size={18} /> Sauvegarder
            </button>
          </div>
        </header>

        {/* Wizard Tabs */}
        <div className="bg-white px-8 py-0 border-b border-slate-200 flex text-sm">
          {[
            { id: 1, label: '1. Informations & Air', icon: Plane },
            { id: 2, label: '2. Sol & Risques', icon: MapIcon },
            { id: 3, label: '3. Scénario', icon: Settings },
            { id: 4, label: '4. Opérations', icon: CheckCircle }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStep(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${step === tab.id ? 'border-indigo-600 text-indigo-600 font-medium' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 min-h-[500px]">
            
            {/* STEP 1: INFO & AIR */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 border-b pb-2 mb-4">Informations Mission</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Client / Dossier</label>
                      <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={mission.client} onChange={(e) => updateRoot('client', e.target.value)} placeholder="Ex: M. Dupont / Cabinet X" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Adresse intervention</label>
                      <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={mission.address} onChange={(e) => updateRoot('address', e.target.value)} placeholder="Adresse complète" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                        <input type="date" className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                          value={mission.date} onChange={(e) => updateRoot('date', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                           value={mission.type} onChange={(e) => updateRoot('type', e.target.value)}>
                           <option>Inspection Toiture</option>
                           <option>Thermographie</option>
                           <option>Photogrammétrie</option>
                           <option>Etat des lieux</option>
                           <option>Video Promotionnelle</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <h3 className="font-bold text-blue-900 border-b border-blue-200 pb-2 mb-4 flex items-center gap-2">
                      <Wind size={18} /> Contraintes Air
                    </h3>
                    
                    <div className="space-y-3">
                      {[
                        { key: 'ctr', label: 'Dans une CTR / TMA ?' },
                        { key: 'zrt', label: 'Dans une ZRT / ZIT / ZDT ?' },
                        { key: 'p_r_d', label: 'Zone P / R / D active ?' },
                        { key: 'natura2000', label: 'Zone Natura 2000 ?' },
                        { key: 'rtba_voltac', label: 'RTBA / VOLTAC actif ?' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-3 cursor-pointer hover:bg-blue-100 p-1 rounded">
                          <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" 
                            checked={(mission.air as any)[item.key]} 
                            onChange={(e) => handleChange('air', item.key, e.target.checked)} />
                          <span className="text-slate-700 text-sm font-medium">{item.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-blue-200">
                      <div className="flex gap-4">
                         <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                           <input type="checkbox" checked={mission.air.notam_checked} onChange={(e) => handleChange('air', 'notam_checked', e.target.checked)} /> NOTAM Vérifiés
                         </label>
                         <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                           <input type="checkbox" checked={mission.air.weather_checked} onChange={(e) => handleChange('air', 'weather_checked', e.target.checked)} /> Météo OK
                         </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Notes sur l'espace aérien (Contacts tour, horaires, etc.)</label>
                   <textarea className="w-full p-3 border rounded-lg h-24 text-sm" 
                     value={mission.air.comments} onChange={(e) => handleChange('air', 'comments', e.target.value)}
                     placeholder="Ex: Protocole signé avec la tour de Blagnac..." />
                </div>
              </div>
            )}

            {/* STEP 2: GROUND */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><MapIcon size={18}/> Environnement Sol</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                        <span className="text-sm font-medium">Zone Peuplée (Agglomération)</span>
                        <div className="flex bg-white rounded border p-1">
                          <button onClick={() => handleChange('ground', 'agglomeration', true)} className={`px-3 py-1 rounded text-sm ${mission.ground.agglomeration ? 'bg-orange-100 text-orange-700 font-bold' : 'text-slate-500'}`}>OUI</button>
                          <button onClick={() => handleChange('ground', 'agglomeration', false)} className={`px-3 py-1 rounded text-sm ${!mission.ground.agglomeration ? 'bg-green-100 text-green-700 font-bold' : 'text-slate-500'}`}>NON</button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                         <span className="text-sm font-medium">Survol Tiers prévu ?</span>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" className="sr-only peer" checked={mission.ground.people_presence} onChange={(e) => handleChange('ground', 'people_presence', e.target.checked)} />
                           <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                         </label>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                         <span className="text-sm font-medium">Domaine Privé (Accord proprio)</span>
                         <input type="checkbox" className="w-5 h-5 text-indigo-600" checked={mission.ground.private_land} onChange={(e) => handleChange('ground', 'private_land', e.target.checked)} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Shield size={18}/> Sécurité Tiers</h3>
                    
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                       <label className="block text-sm font-medium text-orange-800 mb-2">Zone d'Exclusion des Tiers (ZET)</label>
                       <div className="flex items-start gap-3">
                         <input type="checkbox" className="mt-1 w-5 h-5 text-indigo-600" checked={mission.ground.zet_secured} onChange={(e) => handleChange('ground', 'zet_secured', e.target.checked)} />
                         <p className="text-xs text-orange-700">Je certifie avoir mis en place un balisage ou avoir du personnel au sol pour empêcher l'intrusion de tiers dans la zone d'évolution (Règle du 1 pour 1 ou distance réglementaire).</p>
                       </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Hauteur Obstacle le plus haut (m)</label>
                      <input type="number" className="w-full p-2 border rounded" value={mission.ground.obstacle_height} onChange={(e) => handleChange('ground', 'obstacle_height', parseInt(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SCENARIO */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                 <div className="bg-slate-900 text-white p-6 rounded-xl flex justify-between items-center shadow-lg">
                    <div>
                      <h4 className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-1">Scénario Recommandé</h4>
                      <div className="text-3xl font-bold text-white flex items-center gap-3">
                        {mission.scenario.sub_category} 
                        <span className={`text-sm px-2 py-1 rounded text-black font-bold ${mission.scenario.category === 'OPEN' ? 'bg-green-400' : 'bg-blue-400'}`}>
                          Catégorie {mission.scenario.category}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-2 max-w-md">
                        Calculé automatiquement selon : {mission.ground.agglomeration ? 'Agglomération' : 'Hors Agglo'} + Drone {mission.scenario.drone_class}.
                      </p>
                    </div>
                    <div className="text-right">
                       <div className="text-sm text-slate-400 mb-1">Drone Sélectionné</div>
                       <select 
                         className="bg-slate-800 border border-slate-600 rounded p-2 text-white font-mono"
                         value={mission.scenario.drone_class}
                         onChange={(e) => handleChange('scenario', 'drone_class', e.target.value)}
                       >
                         <option value="C0">Classe C0 (&lt;250g)</option>
                         <option value="C1">Classe C1 (&lt;900g)</option>
                         <option value="C2">Classe C2 (&lt;4kg)</option>
                         <option value="C3">Classe C3 (&lt;25kg)</option>
                         <option value="C5">Classe C5 (STS-01)</option>
                         <option value="C6">Classe C6 (STS-02)</option>
                         <option value="LEGACY">Non Classé (Legacy)</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-6">
                    <div className="p-4 border rounded-lg bg-white">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hauteur de Vol Max</label>
                      <div className="flex items-end gap-1">
                        <input type="number" className="text-2xl font-bold text-slate-800 w-20 border-b border-slate-200 outline-none" 
                          value={mission.scenario.max_height} onChange={(e) => handleChange('scenario', 'max_height', parseInt(e.target.value))} />
                        <span className="text-sm font-medium mb-1">mètres</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Limite légale: 120m</p>
                    </div>

                    <div className="p-4 border rounded-lg bg-white">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Distance Max Pilote</label>
                      <div className="flex items-end gap-1">
                        <input type="number" className="text-2xl font-bold text-slate-800 w-20 border-b border-slate-200 outline-none" 
                          value={mission.scenario.max_distance} onChange={(e) => handleChange('scenario', 'max_distance', parseInt(e.target.value))} />
                        <span className="text-sm font-medium mb-1">mètres</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Vue directe (VLOS) requise</p>
                    </div>

                    <div className="p-4 border rounded-lg bg-white">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hauteur RTH</label>
                      <div className="flex items-end gap-1">
                        <input type="number" className="text-2xl font-bold text-slate-800 w-20 border-b border-slate-200 outline-none" 
                          value={mission.scenario.rth_height} onChange={(e) => handleChange('scenario', 'rth_height', parseInt(e.target.value))} />
                        <span className="text-sm font-medium mb-1">mètres</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Au dessus de l'obstacle le plus haut</p>
                    </div>
                 </div>

                 <div>
                    <h4 className="font-bold text-slate-800 mb-2">Description Plan de Vol & Zone de Repli</h4>
                    <textarea className="w-full p-3 border rounded-lg h-32 text-sm"
                      placeholder="Décrire la trajectoire, la zone de décollage (DZ) et la zone d'atterrissage d'urgence..."
                      value={mission.scenario.comments} onChange={(e) => handleChange('scenario', 'comments', e.target.value)}
                    ></textarea>
                 </div>
              </div>
            )}

            {/* STEP 4: OPERATIONS */}
            {step === 4 && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 border-b pb-2 mb-4">Pré-Vol (Bureau)</h3>
                        {[
                          {k: 'documents_ok', l: 'Documents Mission (MANEX, Assurance, Certif.)'},
                          {k: 'authorizations_ok', l: 'Autorisations Préfecture / Propriétaire OK'},
                          {k: 'insurance_ok', l: 'Assurance RC Drone Valide'},
                          {k: 'drone_inspection', l: 'Inspection visuelle Drone & Batteries'},
                        ].map((item: any) => (
                           <label key={item.k} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                              <div className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${(mission.ops as any)[item.k] ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300'}`}>
                                 {(mission.ops as any)[item.k] && <CheckCircle size={14} />}
                              </div>
                              <input type="checkbox" className="hidden" checked={(mission.ops as any)[item.k]} onChange={(e) => handleChange('ops', item.k, e.target.checked)} />
                              <span className="text-sm font-medium text-slate-700">{item.l}</span>
                           </label>
                        ))}
                     </div>

                     <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 border-b pb-2 mb-4">Sur Place (Terrain)</h3>
                        {[
                          {k: 'telemetry_check', l: 'Retour Vidéo & Télémétrie OK'},
                          {k: 'controls_check', l: 'Test Commandes (Gaz, Pitch, Roll, Yaw)'},
                        ].map((item: any) => (
                           <label key={item.k} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                              <div className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${(mission.ops as any)[item.k] ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-300'}`}>
                                 {(mission.ops as any)[item.k] && <CheckCircle size={14} />}
                              </div>
                              <input type="checkbox" className="hidden" checked={(mission.ops as any)[item.k]} onChange={(e) => handleChange('ops', item.k, e.target.checked)} />
                              <span className="text-sm font-medium text-slate-700">{item.l}</span>
                           </label>
                        ))}
                        
                        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
                           <h4 className="text-sm font-bold text-red-800 mb-2">Incidents / Remarques Vol</h4>
                           <textarea className="w-full p-2 text-sm border-red-200 rounded" rows={3}
                             placeholder="Rien à signaler..."
                             value={mission.ops.incidents} onChange={(e) => handleChange('ops', 'incidents', e.target.value)}
                           ></textarea>
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t">
                     <button onClick={() => updateRoot('status', 'DONE')} 
                       className={`px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all ${mission.status === 'DONE' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        <CheckCircle size={20} />
                        MARQUER COMME VOL TERMINÉ
                     </button>
                  </div>
               </div>
            )}

          </div>

          <div className="flex justify-between max-w-4xl mx-auto mt-6">
             <button disabled={step === 1} onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-slate-600 disabled:opacity-30 hover:bg-white rounded flex items-center gap-2">
                <ChevronLeft size={16} /> Précédent
             </button>
             <button disabled={step === 4} onClick={() => setStep(s => s + 1)} className="px-6 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg flex items-center gap-2 shadow-lg disabled:opacity-50">
                Suivant <ChevronRight size={16} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. PRINT VIEW
const PrintView = ({ mission, onClose }: any) => {
  useEffect(() => {
    // Auto-trigger print
    setTimeout(() => window.print(), 500);
  }, []);

  return (
    <div className="bg-white min-h-screen p-8 text-black print-container relative">
      <button onClick={onClose} className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow print:hidden">
         Fermer l'aperçu
      </button>

      <div className="max-w-[21cm] mx-auto border border-gray-200 p-8 print:border-0 print:p-0">
         <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-8">
            <div>
               <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-900">Ordre de Mission</h1>
               <p className="text-slate-500">AVEREO - Opérations Aériennes</p>
            </div>
            <div className="text-right">
               <div className="font-mono text-xl font-bold">{mission.date}</div>
               <div className="text-sm text-slate-500">REF: {mission.id.slice(0, 8)}</div>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="border p-4 rounded bg-slate-50 print:bg-white print:border-slate-300">
               <h3 className="font-bold border-b pb-2 mb-2">CLIENT & LIEU</h3>
               <p><span className="text-slate-500 text-sm">Client:</span> {mission.client}</p>
               <p><span className="text-slate-500 text-sm">Adresse:</span> {mission.address}</p>
               <p><span className="text-slate-500 text-sm">Type:</span> {mission.type}</p>
            </div>
            <div className="border p-4 rounded bg-slate-50 print:bg-white print:border-slate-300">
               <h3 className="font-bold border-b pb-2 mb-2">SCÉNARIO RETENU</h3>
               <p className="text-xl font-bold">{mission.scenario.sub_category} <span className="text-sm font-normal">({mission.scenario.category})</span></p>
               <p><span className="text-slate-500 text-sm">Drone:</span> {mission.scenario.drone_class}</p>
               <div className="flex gap-4 mt-2">
                  <div className="text-center bg-white p-1 border rounded w-16">
                     <div className="text-xs text-slate-500">H. Max</div>
                     <div className="font-bold">{mission.scenario.max_height}m</div>
                  </div>
                  <div className="text-center bg-white p-1 border rounded w-16">
                     <div className="text-xs text-slate-500">Dist. Max</div>
                     <div className="font-bold">{mission.scenario.max_distance}m</div>
                  </div>
               </div>
            </div>
         </div>

         <div className="mb-8">
            <h3 className="font-bold bg-slate-100 p-2 mb-4 print:bg-gray-100">ANALYSE DE RISQUE (SORA / STS)</h3>
            <table className="w-full text-sm border-collapse">
               <tbody>
                  <tr className="border-b">
                     <td className="py-2">Zone Peuplée</td>
                     <td className="font-bold">{mission.ground.agglomeration ? 'OUI' : 'NON'}</td>
                     <td className="py-2">Espace Aérien Contrôlé (CTR)</td>
                     <td className="font-bold">{mission.air.ctr ? 'OUI' : 'NON'}</td>
                  </tr>
                  <tr className="border-b">
                     <td className="py-2">Survol de Tiers</td>
                     <td className="font-bold">{mission.ground.people_presence ? 'OUI' : 'NON'}</td>
                     <td className="py-2">Zone Interdite / Restreinte</td>
                     <td className="font-bold">{mission.air.zrt || mission.air.p_r_d ? 'OUI' : 'NON'}</td>
                  </tr>
                  <tr className="border-b">
                     <td className="py-2">ZET Sécurisée</td>
                     <td className="font-bold">{mission.ground.zet_secured ? 'OK' : 'NON'}</td>
                     <td className="py-2">Météo / NOTAM</td>
                     <td className="font-bold">{mission.air.weather_checked && mission.air.notam_checked ? 'VERIFIÉS' : 'À FAIRE'}</td>
                  </tr>
               </tbody>
            </table>
         </div>

         <div className="mb-8 border p-4 border-dashed rounded h-32">
            <h3 className="font-bold text-xs text-slate-500 mb-2">NOTES & PLAN DE VOL</h3>
            <p className="text-sm">{mission.scenario.comments || 'Aucun commentaire spécifique.'}</p>
         </div>

         <div className="mt-12 pt-4 border-t-2 border-slate-900 flex justify-between">
            <div className="w-1/3">
               <p className="font-bold text-sm">Le Télépilote</p>
               <p className="text-xs text-slate-500 mt-8">Signature</p>
            </div>
            <div className="w-1/3">
               <p className="font-bold text-sm">Le Client (pour accord)</p>
               <p className="text-xs text-slate-500 mt-8">Signature</p>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- MAIN APP CONTAINER ---

export default function App() {
  const [view, setView] = useState<'dashboard' | 'editor' | 'print'>('dashboard');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('avereo_missions');
    if (saved) {
      try {
        setMissions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load missions", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('avereo_missions', JSON.stringify(missions));
  }, [missions]);

  const handleCreate = () => {
    const newMission = { ...initialMission, id: Date.now().toString() };
    setCurrentMission(newMission);
    setView('editor');
  };

  const handleEdit = (mission: Mission) => {
    setCurrentMission(mission);
    setView('editor');
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cette mission définitivement ?')) {
      setMissions(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleSave = (mission: Mission) => {
    setMissions(prev => {
      const exists = prev.find(m => m.id === mission.id);
      if (exists) {
        return prev.map(m => m.id === mission.id ? mission : m);
      }
      return [...prev, mission];
    });
    // Check if we want to print or just go back
    if (confirm('Mission sauvegardée. Voulez-vous imprimer la fiche mission PDF maintenant ?')) {
      setCurrentMission(mission);
      setView('print');
    } else {
      setView('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
       <style>{`
        @media print {
          .print:hidden { display: none !important; }
          body { background: white; }
          .print-container { padding: 0; }
        }
      `}</style>

      {view === 'dashboard' && (
        <Dashboard 
          missions={missions} 
          onCreate={handleCreate} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      )}

      {view === 'editor' && currentMission && (
        <MissionEditor 
          mission={currentMission} 
          onSave={handleSave} 
          onCancel={() => setView('dashboard')} 
        />
      )}

      {view === 'print' && currentMission && (
        <PrintView 
          mission={currentMission} 
          onClose={() => setView('dashboard')} 
        />
      )}
    </div>
  );
}
