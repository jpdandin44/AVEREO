import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { calculateDevis, calculateDevisForPdf } from '../src/lib/chiffrage.js';

// Données de démonstration de la reprise ; leur identité est vérifiée par check-parity.mjs.
const source = readFileSync(resolve(process.cwd(), 'src/App.jsx'), 'utf8');
const definitions = source.slice(source.indexOf('const MOCK_BIENS'), source.indexOf('const useAppStore'));
const { biens, tarifs } = Function(`${definitions}; return { biens: MOCK_BIENS, tarifs: LATEST_INITIAL_TARIFS };`)();

describe('T01 : montants établis manuellement sur les deux biens source', () => {
  // Maison : Salon 35 m² + Chambre 15 m² = 50 m² de peinture.
  // 50 × 36 = 1800 ; 50 × 48 = 2400 ; 50 × 60 = 3000.
  for (const [tier, expected] of [['eco', '1800.00'], ['std', '2400.00'], ['premium', '3000.00']]) {
    it(`maison, gamme ${tier}`, () => expect(calculateDevis(biens[0], tarifs, tier).total).toBe(expected));
  }
  // Appartement : remplacement tableau au forfait, surface de 40 m² ignorée.
  // Un forfait = 1320 / 1980 / 2640, sans multiplication par surface ou quantité.
  for (const [tier, expected] of [['eco', '1320.00'], ['std', '1980.00'], ['premium', '2640.00']]) {
    it(`appartement, gamme ${tier}`, () => expect(calculateDevis(biens[1], tarifs, tier).total).toBe(expected));
  }
  it('les trois totaux PDF des deux biens correspondent aux calculs manuels', () => {
    expect(calculateDevisForPdf(biens[0], tarifs)).toMatchObject({ total_eco: '1800.00', total_std: '2400.00', total_premium: '3000.00' });
    expect(calculateDevisForPdf(biens[1], tarifs)).toMatchObject({ total_eco: '1320.00', total_std: '1980.00', total_premium: '2640.00' });
  });
});

describe('T02/T03 : unités et limites conservées', () => {
  const grille = Object.fromEntries(['m²', 'unité', 'forfait', 'h', 'ml'].map((unite, n) => [`t${n}`, { id: `t${n}`, nom: unite, unite, prix_eco: 10, prix_std: 20, prix_premium: 30 }]));
  const bien = { dossier: { pieces: [{ id: 7, nom: 'Pièce fictive', surface: 12, interventions: Object.keys(grille).map(tarifId => ({ tarifId, quantite: 3 })).concat({ tarifId: 'absent', quantite: 1 }) }] } };
  it('m² × surface + unité × quantité + forfait ; h/ml à zéro, tarif absent ignoré', () => {
    // 12 × 20 + 3 × 20 + 20 + 0 + 0 = 320.
    const devis = calculateDevis(bien, grille, 'std');
    expect(devis.total).toBe('320.00');
    expect(devis.lignes[0].interventions.map(l => l.cout)).toEqual(['240.00', '60.00', '20.00', '0.00', '0.00']);
    expect(calculateDevisForPdf(bien, grille)).toMatchObject({ total_eco: '160.00', total_std: '320.00', total_premium: '480.00' });
  });
  it('bien absent et pièce vide conservent leurs valeurs historiques', () => {
    expect(calculateDevis(null, grille, 'std')).toEqual({ lignes: [], total: 0, tierLabel: '' });
    expect(calculateDevisForPdf(null, grille)).toBeNull();
    expect(calculateDevis({ dossier: { pieces: [{ id: 1, nom: 'Vide', surface: 20 }] } }, grille, 'std').total).toBe('0.00');
  });
});
