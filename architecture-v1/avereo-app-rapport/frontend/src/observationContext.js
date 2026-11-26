const interiorZones = ['Salon', 'Cuisine', 'Chambre', 'Salle de bain', 'WC', 'Bureau', 'Garage', 'Combles', 'Facade', 'Toiture', 'Exterieur', 'Autre'];
const interiorElements = ['Murs', 'Sols', 'Plafond', 'Menuiseries', 'Toiture', 'Facade', 'Structure', 'Equipement', 'Autre'];
export const TERRAIN_ZONES = ['Terrasse', 'Jardin', 'Cour', 'Allée', 'Annexes', 'Route', 'Trottoir', 'Abords du bâti', 'Autre'];
export const TERRAIN_ELEMENTS = ['Pied de mur', 'Caniveau', 'Sol', 'Revêtement', 'Pente', 'Drainage', 'Évacuation des eaux', 'Clôture', 'Végétation', 'Autre'];
export const EXTERIOR_ZONES = ['Extérieur', 'Façade', 'Toiture', 'Terrasse', 'Balcon', 'Annexes', 'Cour', 'Autre'];
export const EXTERIOR_ELEMENTS = ['Façade', 'Pied de mur', 'Soubassement', 'Enduit extérieur', 'Menuiserie extérieure', 'Couverture', 'Gouttière', 'Descente d’eau', 'Balcon', 'Structure extérieure', 'Autre'];
const plain = value => String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

// Suggestions never rewrite the recorded zone/element, including imported values.
export function observationContextOptions(report, observation) {
  if (observation.phase_habitologie === 'terrain') return { zones: TERRAIN_ZONES, elements: TERRAIN_ELEMENTS, context: 'terrain' };
  const outside = report.environnement === 'Exterieur' || ['exterieur', 'facade', 'toiture', 'terrasse', 'balcon', 'annexe', 'annexes', 'cour'].includes(plain(observation.piece));
  return outside
    ? { zones: report.environnement === 'Exterieur' ? EXTERIOR_ZONES : [...new Set([...interiorZones, ...EXTERIOR_ZONES])], elements: EXTERIOR_ELEMENTS, context: 'exterieur' }
    : { zones: interiorZones, elements: interiorElements, context: 'interieur' };
}
